package com.codebattle.orchestrator.controller;

import com.codebattle.orchestrator.model.ExecutionRequest;
import com.codebattle.orchestrator.model.ExecutionResponse;
import com.codebattle.orchestrator.service.DockerExecutionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class ExecutionController {

    private static final Logger log = LoggerFactory.getLogger(ExecutionController.class);

    private final DockerExecutionService executionService;

    public ExecutionController(DockerExecutionService executionService) {
        this.executionService = executionService;
    }

    @PostMapping("/execute")
    public ResponseEntity<ExecutionResponse> execute(@RequestBody ExecutionRequest request) {
        log.info("Received execution request: language={}, function={}, testCases={}",
                request.getLanguage(), request.getFunctionName(),
                request.getTestCases() == null ? 0 : request.getTestCases().size());

        try {
            ExecutionResponse response = executionService.execute(request);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            // Docker daemon unavailable
            log.error("Docker service unavailable: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        } catch (IllegalArgumentException e) {
            // Bad language / unsupported configuration
            log.warn("Bad request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Unhandled error during execution", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
