package com.codebattle.orchestrator.model;

public class TestCaseResult {

    private int caseId;
    private boolean passed;
    private String actualOutput;
    private String expectedOutput;
    private long executionTimeMs;
    private String error;

    public TestCaseResult() {}

    public TestCaseResult(int caseId, boolean passed, String actualOutput,
                          String expectedOutput, long executionTimeMs, String error) {
        this.caseId = caseId;
        this.passed = passed;
        this.actualOutput = actualOutput;
        this.expectedOutput = expectedOutput;
        this.executionTimeMs = executionTimeMs;
        this.error = error;
    }

    public int getCaseId() { return caseId; }
    public void setCaseId(int caseId) { this.caseId = caseId; }

    public boolean isPassed() { return passed; }
    public void setPassed(boolean passed) { this.passed = passed; }

    public String getActualOutput() { return actualOutput; }
    public void setActualOutput(String actualOutput) { this.actualOutput = actualOutput; }

    public String getExpectedOutput() { return expectedOutput; }
    public void setExpectedOutput(String expectedOutput) { this.expectedOutput = expectedOutput; }

    public long getExecutionTimeMs() { return executionTimeMs; }
    public void setExecutionTimeMs(long executionTimeMs) { this.executionTimeMs = executionTimeMs; }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}
