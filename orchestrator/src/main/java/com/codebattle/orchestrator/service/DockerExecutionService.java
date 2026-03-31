package com.codebattle.orchestrator.service;

import com.codebattle.orchestrator.model.ExecutionRequest;
import com.codebattle.orchestrator.model.ExecutionResponse;
import com.codebattle.orchestrator.model.TestCase;
import com.codebattle.orchestrator.model.TestCaseResult;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.command.PullImageResultCallback;
import com.github.dockerjava.api.command.WaitContainerResultCallback;
import com.github.dockerjava.api.exception.NotFoundException;
import com.github.dockerjava.api.model.Frame;
import com.github.dockerjava.api.model.HostConfig;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import com.github.dockerjava.transport.DockerHttpClient;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Service
public class DockerExecutionService {

    private static final Logger log = LoggerFactory.getLogger(DockerExecutionService.class);

    @Value("${docker.host:unix:///var/run/docker.sock}")
    private String dockerHost;

    private DockerClient dockerClient;
    private final RunnerTemplateService templateService;

    public DockerExecutionService(RunnerTemplateService templateService) {
        this.templateService = templateService;
    }

    @PostConstruct
    public void init() {
        log.info("Initializing Docker client with host: {}", dockerHost);
        try {
            DockerClientConfig config = DefaultDockerClientConfig.createDefaultConfigBuilder()
                    .withDockerHost(dockerHost)
                    .build();

            DockerHttpClient httpClient = new ApacheDockerHttpClient.Builder()
                    .dockerHost(URI.create(dockerHost))
                    .maxConnections(50)
                    .connectionTimeout(Duration.ofSeconds(10))
                    .responseTimeout(Duration.ofSeconds(30))
                    .build();

            dockerClient = DockerClientImpl.getInstance(config, httpClient);

            // Verify connectivity
            dockerClient.pingCmd().exec();
            log.info("Docker client connected successfully");

            // Pre-pull runner images so first execution doesn't time out
            List<String> images = List.of("python:3.11-slim", "node:20-slim", "eclipse-temurin:21-jdk-alpine");
            for (String image : images) {
                ensureImagePresent(image);
            }
        } catch (Exception e) {
            log.error("Failed to connect to Docker daemon at {}: {}", dockerHost, e.getMessage());
            // Don't throw — let health check surface the issue
        }
    }

    private void ensureImagePresent(String image) {
        try {
            dockerClient.inspectImageCmd(image).exec();
            log.info("Image already present: {}", image);
        } catch (NotFoundException e) {
            log.info("Pulling image: {} ...", image);
            try {
                dockerClient.pullImageCmd(image)
                        .exec(new PullImageResultCallback())
                        .awaitCompletion(10, TimeUnit.MINUTES);
                log.info("Successfully pulled image: {}", image);
            } catch (Exception pullEx) {
                log.error("Failed to pull image {}: {}", image, pullEx.getMessage());
            }
        }
    }

    @PreDestroy
    public void destroy() {
        if (dockerClient != null) {
            try {
                dockerClient.close();
            } catch (IOException e) {
                log.warn("Error closing Docker client", e);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    public ExecutionResponse execute(ExecutionRequest request) {
        if (dockerClient == null) {
            throw new IllegalStateException("Docker client is not available");
        }

        String executionId = UUID.randomUUID().toString();
        long totalStart = System.currentTimeMillis();

        List<TestCaseResult> results = new ArrayList<>();
        for (TestCase tc : request.getTestCases()) {
            results.add(executeTestCase(request, tc));
        }

        long totalMs = System.currentTimeMillis() - totalStart;
        return new ExecutionResponse(executionId, results, totalMs);
    }

    // -------------------------------------------------------------------------
    // Per-test-case execution
    // -------------------------------------------------------------------------

    private TestCaseResult executeTestCase(ExecutionRequest request, TestCase testCase) {
        long start = System.currentTimeMillis();
        String containerId = null;

        try {
            // 1. Build the full source file
            String source = templateService.buildSource(
                    request.getLanguage(),
                    request.getCode(),
                    request.getFunctionName()
            );

            // 2. Base64-encode the source
            String encodedCode = Base64.getEncoder().encodeToString(
                    source.getBytes(StandardCharsets.UTF_8)
            );

            // 3. Serialize args
            String serializedArgs = templateService.serializeArgs(
                    request.getLanguage(),
                    testCase.getInputArgs()
            );

            // 4. Build container command
            String[] cmd = templateService.buildContainerCommand(request.getLanguage());
            String image = templateService.getImage(request.getLanguage());

            // 5. Configure resource limits
            long memoryBytes = (long) request.getMemoryLimitMb() * 1024 * 1024;
            HostConfig hostConfig = HostConfig.newHostConfig()
                    .withMemory(memoryBytes)
                    .withMemorySwap(memoryBytes)          // disable swap
                    .withNanoCPUs(500_000_000L)           // 0.5 CPU
                    .withNetworkMode("none")
                    .withReadonlyRootfs(true)
                    .withTmpFs(Map.of("/tmp", "size=64m,mode=1777"))
                    .withAutoRemove(false);               // we remove manually after log capture

            // 6. Create the container
            CreateContainerResponse container = dockerClient.createContainerCmd(image)
                    .withCmd(cmd)
                    .withEnv(
                            "CODE=" + encodedCode,
                            "ARGS=" + serializedArgs
                    )
                    .withHostConfig(hostConfig)
                    .withNetworkDisabled(true)
                    .exec();

            containerId = container.getId();
            log.info("Created container {} for test case {}", containerId.substring(0, 12), testCase.getId());

            // 7. Start the container
            dockerClient.startContainerCmd(containerId).exec();

            // 8. Wait for exit with timeout
            int timeoutSeconds = request.getTimeLimitSeconds() + 2;
            int exitCode;
            try {
                exitCode = dockerClient.waitContainerCmd(containerId)
                        .exec(new WaitContainerResultCallback())
                        .awaitStatusCode(timeoutSeconds, TimeUnit.SECONDS);
            } catch (Exception e) {
                // Timeout or interrupted — kill the container
                log.warn("Container {} timed out for test case {}", containerId.substring(0, 12), testCase.getId());
                forceRemoveContainer(containerId);
                long elapsed = System.currentTimeMillis() - start;
                return new TestCaseResult(
                        testCase.getId(), false, null,
                        testCase.getExpectedOutput(), elapsed,
                        "Time Limit Exceeded"
                );
            }

            // 9. Capture stdout and stderr
            String stdout = captureStream(containerId, true,  timeoutSeconds);
            String stderr = captureStream(containerId, false, timeoutSeconds);

            // 10. Remove container
            safeRemoveContainer(containerId);
            containerId = null;

            long elapsed = System.currentTimeMillis() - start;

            // 11. Evaluate result
            if (exitCode != 0) {
                String errorMsg = stderr.isBlank() ? "Process exited with code " + exitCode : stderr.trim();
                return new TestCaseResult(
                        testCase.getId(), false, stdout.trim(),
                        testCase.getExpectedOutput(), elapsed,
                        errorMsg
                );
            }

            String actual = stdout.trim();
            String expected = testCase.getExpectedOutput().trim();
            boolean passed = actual.equals(expected);

            log.info("Test case {} — passed={}, actual='{}', expected='{}'",
                    testCase.getId(), passed, actual, expected);

            return new TestCaseResult(testCase.getId(), passed, actual, expected, elapsed, null);

        } catch (Exception e) {
            log.error("Unexpected error executing test case {}", testCase.getId(), e);
            if (containerId != null) {
                forceRemoveContainer(containerId);
            }
            long elapsed = System.currentTimeMillis() - start;
            return new TestCaseResult(
                    testCase.getId(), false, null,
                    testCase.getExpectedOutput(), elapsed,
                    "Internal error: " + e.getMessage()
            );
        }
    }

    // -------------------------------------------------------------------------
    // Log capture
    // -------------------------------------------------------------------------

    /**
     * Captures stdout or stderr from a stopped container.
     */
    private String captureStream(String containerId, boolean stdout, int timeoutSeconds) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try {
            dockerClient.logContainerCmd(containerId)
                    .withStdOut(stdout)
                    .withStdErr(!stdout)
                    .withFollowStream(false)
                    .exec(new ResultCallback.Adapter<Frame>() {
                        @Override
                        public void onNext(Frame frame) {
                            try {
                                baos.write(frame.getPayload());
                            } catch (IOException e) {
                                log.warn("Error writing log frame", e);
                            }
                        }
                    })
                    .awaitCompletion(timeoutSeconds, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Interrupted while reading container logs");
        }

        return baos.toString(StandardCharsets.UTF_8);
    }

    // -------------------------------------------------------------------------
    // Container cleanup helpers
    // -------------------------------------------------------------------------

    private void safeRemoveContainer(String containerId) {
        try {
            dockerClient.removeContainerCmd(containerId)
                    .withForce(true)
                    .exec();
        } catch (Exception e) {
            log.warn("Could not remove container {}: {}", containerId.substring(0, 12), e.getMessage());
        }
    }

    private void forceRemoveContainer(String containerId) {
        try {
            dockerClient.killContainerCmd(containerId).exec();
        } catch (Exception ignored) {}
        safeRemoveContainer(containerId);
    }
}
