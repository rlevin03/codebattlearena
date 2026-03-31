package com.codebattle.orchestrator.model;

import java.util.List;

public class TestCase {

    private int id;
    private List<Object> inputArgs;
    private String expectedOutput;

    public TestCase() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public List<Object> getInputArgs() { return inputArgs; }
    public void setInputArgs(List<Object> inputArgs) { this.inputArgs = inputArgs; }

    public String getExpectedOutput() { return expectedOutput; }
    public void setExpectedOutput(String expectedOutput) { this.expectedOutput = expectedOutput; }
}
