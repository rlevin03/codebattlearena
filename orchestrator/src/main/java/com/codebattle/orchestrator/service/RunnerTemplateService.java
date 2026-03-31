package com.codebattle.orchestrator.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class RunnerTemplateService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String buildSource(String language, String userCode, String functionName) {
        return switch (language.toLowerCase()) {
            case "python"     -> buildPythonSource(userCode, functionName);
            case "javascript" -> buildJavaScriptSource(userCode, functionName);
            case "java"       -> buildJavaSource(userCode, functionName);
            default -> throw new IllegalArgumentException("Unsupported language: " + language);
        };
    }

    private String buildPythonSource(String userCode, String functionName) {
        return userCode
            + "\n\nimport sys\nimport json\n\n"
            + "def _serialize(v):\n"
            + "    if isinstance(v, bool):\n"
            + "        return \"true\" if v else \"false\"\n"
            + "    if isinstance(v, list):\n"
            + "        return \"[\" + \", \".join(_serialize(x) for x in v) + \"]\"\n"
            + "    return str(v)\n\n"
            + "if __name__ == \"__main__\":\n"
            + "    raw = sys.stdin.read().strip()\n"
            + "    args = json.loads(raw)\n"
            + "    result = " + functionName + "(*args)\n"
            + "    print(_serialize(result))\n";
    }

    private String buildJavaScriptSource(String userCode, String functionName) {
        return userCode
            + "\n\nlet input = '';\n"
            + "process.stdin.on('data', d => input += d);\n"
            + "process.stdin.on('end', () => {\n"
            + "    const args = JSON.parse(input.trim());\n"
            + "    const result = " + functionName + "(...args);\n"
            + "    let out;\n"
            + "    if (typeof result === 'boolean') out = result.toString();\n"
            + "    else if (Array.isArray(result)) out = '[' + result.join(', ') + ']';\n"
            + "    else out = String(result);\n"
            + "    process.stdout.write(out + '\\n');\n"
            + "});\n";
    }

    private String buildJavaSource(String userCode, String functionName) {
        String dispatcher = JAVA_DISPATCHERS.getOrDefault(
                functionName,
                buildDefaultJavaDispatcher(functionName)
        );

        return """
import java.util.*;
import java.io.*;

public class Solution {

""" + userCode + """

    private static int[] parseIntArray(String line) {
        line = line.trim();
        if (line.isEmpty()) return new int[0];
        String[] parts = line.split("\\\\s+");
        int[] arr = new int[parts.length];
        for (int i = 0; i < parts.length; i++) arr[i] = Integer.parseInt(parts[i].trim());
        return arr;
    }

    private static String[] parseStringArray(String line) {
        line = line.trim();
        if (line.isEmpty()) return new String[0];
        return line.split("\\\\s+");
    }

    @SuppressWarnings("unchecked")
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        Solution sol = new Solution();
""" + dispatcher + """
    }
}
""";
    }

    private static final Map<String, String> JAVA_DISPATCHERS = Map.of(

        "twoSum", """
        String numsLine = br.readLine().trim();
        String targetLine = br.readLine().trim();
        int[] nums = parseIntArray(numsLine);
        int target = Integer.parseInt(targetLine);
        int[] result = sol.twoSum(nums, target);
        System.out.println("[" + result[0] + ", " + result[1] + "]");
""",

        "isValid", """
        String s = br.readLine().trim();
        boolean result = sol.isValid(s);
        System.out.println(result);
""",

        "fib", """
        int n = Integer.parseInt(br.readLine().trim());
        int result = sol.fib(n);
        System.out.println(result);
""",

        "maxProfit", """
        String pricesLine = br.readLine().trim();
        int[] prices = parseIntArray(pricesLine);
        int result = sol.maxProfit(prices);
        System.out.println(result);
""",

        "longestCommonPrefix", """
        String line = br.readLine().trim();
        String[] strs = parseStringArray(line);
        String result = sol.longestCommonPrefix(strs);
        System.out.println(result);
"""
    );

    private String buildDefaultJavaDispatcher(String functionName) {
        return "        System.err.println(\"No dispatcher registered for function: "
            + functionName + "\");\n"
            + "        System.exit(1);\n";
    }

    public String serializeArgs(String language, List<Object> inputArgs) {
        return switch (language.toLowerCase()) {
            case "python", "javascript" -> serializeArgsJson(inputArgs);
            case "java"                 -> serializeArgsJavaLines(inputArgs);
            default -> throw new IllegalArgumentException("Unsupported language: " + language);
        };
    }

    private String serializeArgsJson(List<Object> inputArgs) {
        try {
            return objectMapper.writeValueAsString(inputArgs);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize args to JSON", e);
        }
    }

    @SuppressWarnings("unchecked")
    private String serializeArgsJavaLines(List<Object> inputArgs) {
        StringBuilder sb = new StringBuilder();
        for (Object arg : inputArgs) {
            if (sb.length() > 0) sb.append('\n');
            if (arg instanceof List<?> list) {
                if (!list.isEmpty() && list.get(0) instanceof String) {
                    StringBuilder items = new StringBuilder();
                    for (Object item : list) {
                        if (items.length() > 0) items.append(' ');
                        items.append(item.toString());
                    }
                    sb.append(items);
                } else {
                    StringBuilder items = new StringBuilder();
                    for (Object item : list) {
                        if (items.length() > 0) items.append(' ');
                        if (item instanceof Double d && d == Math.floor(d)) {
                            items.append(d.longValue());
                        } else {
                            items.append(item.toString());
                        }
                    }
                    sb.append(items);
                }
            } else if (arg instanceof Double d && d == Math.floor(d)) {
                sb.append(d.longValue());
            } else {
                sb.append(arg.toString());
            }
        }
        return sb.toString();
    }

    public String[] buildContainerCommand(String language) {
        String cmd = switch (language.toLowerCase()) {
            case "python" ->
                "printf \"%s\" \"$CODE\" | base64 -d > /tmp/solution.py " +
                "&& printf \"%s\" \"$ARGS\" | python3 /tmp/solution.py";
            case "javascript" ->
                "printf \"%s\" \"$CODE\" | base64 -d > /tmp/solution.js " +
                "&& printf \"%s\" \"$ARGS\" | node /tmp/solution.js";
            case "java" ->
                "printf \"%s\" \"$CODE\" | base64 -d > /tmp/Solution.java " +
                "&& javac -d /tmp /tmp/Solution.java " +
                "&& printf \"%s\" \"$ARGS\" | java -cp /tmp Solution";
            default -> throw new IllegalArgumentException("Unsupported language: " + language);
        };
        return new String[]{"sh", "-c", cmd};
    }

    public String getImage(String language) {
        return switch (language.toLowerCase()) {
            case "python"     -> "python:3.11-slim";
            case "javascript" -> "node:20-slim";
            case "java"       -> "eclipse-temurin:21-jdk-alpine";
            default -> throw new IllegalArgumentException("Unsupported language: " + language);
        };
    }
}
