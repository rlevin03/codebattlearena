package com.codebattle.orchestrator.model;

import java.util.List;

public class ExecutionResponse {

    private String executionId;
    private List<TestCaseResult> results;
    private long totalExecutionTimeMs;

    public ExecutionResponse() {}

    public ExecutionResponse(String executionId, List<TestCaseResult> results, long totalExecutionTimeMs) {
        this.executionId = executionId;
        this.results = results;
        this.totalExecutionTimeMs = totalExecutionTimeMs;
    }

    public String getExecutionId() { return executionId; }
    public void setExecutionId(String executionId) { this.executionId = executionId; }

    public List<TestCaseResult> getResults() { return results; }
    public void setResults(List<TestCaseResult> results) { this.results = results; }

    public long getTotalExecutionTimeMs() { return totalExecutionTimeMs; }
    public void setTotalExecutionTimeMs(long totalExecutionTimeMs) { this.totalExecutionTimeMs = totalExecutionTimeMs; }
}
