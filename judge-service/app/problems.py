"""
Problem bank for CodeBattleArena.
Each problem has:
  - problem_id, title, description, difficulty
  - function_signature: dict with python / javascript / java keys
  - visible_test_cases: 3 items shown in the UI
  - test_cases: 10 items sent to the orchestrator (includes visible ones)
  - time_limit_ms, memory_limit_mb
"""

from typing import List, Dict, Any

PROBLEMS: List[Dict[str, Any]] = [
    # ------------------------------------------------------------------ #
    # Problem 1 – Two Sum (easy)                                          #
    # ------------------------------------------------------------------ #
    {
        "problem_id": 1,
        "title": "Two Sum",
        "description": (
            "## Two Sum\n\n"
            "Given an array of integers `nums` and an integer `target`, return the **indices** "
            "of the two numbers that add up to `target`.\n\n"
            "You may assume that each input has **exactly one solution**, and you may not use "
            "the same element twice.  Return the answer in ascending index order.\n\n"
            "### Examples\n\n"
            "```\n"
            "Input:  nums = [2, 7, 11, 15], target = 9\n"
            "Output: [0, 1]   # nums[0] + nums[1] == 9\n\n"
            "Input:  nums = [3, 2, 4], target = 6\n"
            "Output: [1, 2]   # nums[1] + nums[2] == 6\n"
            "```\n\n"
            "### Constraints\n"
            "- 2 ≤ nums.length ≤ 10⁴\n"
            "- -10⁹ ≤ nums[i] ≤ 10⁹\n"
            "- Only one valid answer exists."
        ),
        "difficulty": "easy",
        "function_signature": {
            "python": "def twoSum(nums: list, target: int) -> list:",
            "javascript": "function twoSum(nums, target) {",
            "java": "public int[] twoSum(int[] nums, int target) {",
        },
        "visible_test_cases": [
            {"id": 1, "input_display": "nums = [2, 7, 11, 15], target = 9",  "expected_output": "[0, 1]"},
            {"id": 2, "input_display": "nums = [3, 2, 4], target = 6",        "expected_output": "[1, 2]"},
            {"id": 3, "input_display": "nums = [3, 3], target = 6",           "expected_output": "[0, 1]"},
        ],
        "test_cases": [
            {"id": 1,  "input_args": [[2, 7, 11, 15], 9],          "expected_output": "[0, 1]",  "function_name": "twoSum"},
            {"id": 2,  "input_args": [[3, 2, 4], 6],               "expected_output": "[1, 2]",  "function_name": "twoSum"},
            {"id": 3,  "input_args": [[3, 3], 6],                  "expected_output": "[0, 1]",  "function_name": "twoSum"},
            {"id": 4,  "input_args": [[1, 5, 3, 7], 10],           "expected_output": "[2, 3]",  "function_name": "twoSum"},
            {"id": 5,  "input_args": [[0, 4, 3, 0], 0],            "expected_output": "[0, 3]",  "function_name": "twoSum"},
            {"id": 6,  "input_args": [[-1, -2, -3, -4, -5], -8],   "expected_output": "[2, 4]",  "function_name": "twoSum"},
            {"id": 7,  "input_args": [[1, 2, 3, 4, 5], 9],         "expected_output": "[3, 4]",  "function_name": "twoSum"},
            {"id": 8,  "input_args": [[10, 20, 30, 40], 60],       "expected_output": "[1, 3]",  "function_name": "twoSum"},
            {"id": 9,  "input_args": [[5, 75, 25], 100],           "expected_output": "[1, 2]",  "function_name": "twoSum"},
            {"id": 10, "input_args": [[2, 5, 5, 11], 10],          "expected_output": "[1, 2]",  "function_name": "twoSum"},
        ],
        "time_limit_ms": 2000,
        "memory_limit_mb": 128,
    },

    # ------------------------------------------------------------------ #
    # Problem 2 – Valid Parentheses (easy)                                #
    # ------------------------------------------------------------------ #
    {
        "problem_id": 2,
        "title": "Valid Parentheses",
        "description": (
            "## Valid Parentheses\n\n"
            "Given a string `s` containing only the characters `(`, `)`, `{`, `}`, `[` and `]`, "
            "determine if the input string is **valid**.\n\n"
            "A string is valid if:\n"
            "1. Open brackets are closed by the **same type** of bracket.\n"
            "2. Open brackets are closed in the **correct order**.\n"
            "3. Every close bracket has a corresponding open bracket.\n\n"
            "### Examples\n\n"
            "```\n"
            'Input:  s = "()"\n'
            "Output: true\n\n"
            'Input:  s = "()[]{}"\n'
            "Output: true\n\n"
            'Input:  s = "(]"\n'
            "Output: false\n"
            "```\n\n"
            "### Constraints\n"
            "- 1 ≤ s.length ≤ 10⁴\n"
            "- s consists of parentheses characters only."
        ),
        "difficulty": "easy",
        "function_signature": {
            "python": "def isValid(s: str) -> bool:",
            "javascript": "function isValid(s) {",
            "java": "public boolean isValid(String s) {",
        },
        "visible_test_cases": [
            {"id": 1, "input_display": 's = "()"',      "expected_output": "true"},
            {"id": 2, "input_display": 's = "()[]{}"',  "expected_output": "true"},
            {"id": 3, "input_display": 's = "(]"',      "expected_output": "false"},
        ],
        "test_cases": [
            {"id": 1,  "input_args": ["()"],        "expected_output": "true",  "function_name": "isValid"},
            {"id": 2,  "input_args": ["()[]{}"],    "expected_output": "true",  "function_name": "isValid"},
            {"id": 3,  "input_args": ["(]"],        "expected_output": "false", "function_name": "isValid"},
            {"id": 4,  "input_args": ["([)]"],      "expected_output": "false", "function_name": "isValid"},
            {"id": 5,  "input_args": ["{[]}"],      "expected_output": "true",  "function_name": "isValid"},
            {"id": 6,  "input_args": [""],          "expected_output": "true",  "function_name": "isValid"},
            {"id": 7,  "input_args": ["{"],         "expected_output": "false", "function_name": "isValid"},
            {"id": 8,  "input_args": ["}}"],        "expected_output": "false", "function_name": "isValid"},
            {"id": 9,  "input_args": ["((()))"],    "expected_output": "true",  "function_name": "isValid"},
            {"id": 10, "input_args": ["({[]})"],    "expected_output": "true",  "function_name": "isValid"},
        ],
        "time_limit_ms": 2000,
        "memory_limit_mb": 128,
    },

    # ------------------------------------------------------------------ #
    # Problem 3 – Nth Fibonacci (easy)                                    #
    # ------------------------------------------------------------------ #
    {
        "problem_id": 3,
        "title": "Nth Fibonacci Number",
        "description": (
            "## Nth Fibonacci Number\n\n"
            "Return the **Nth Fibonacci number** using 0-based indexing:\n\n"
            "```\n"
            "fib(0) = 0\n"
            "fib(1) = 1\n"
            "fib(2) = 1\n"
            "fib(3) = 2\n"
            "fib(4) = 3\n"
            "...\n"
            "```\n\n"
            "### Examples\n\n"
            "```\n"
            "Input:  n = 6\n"
            "Output: 8\n\n"
            "Input:  n = 10\n"
            "Output: 55\n"
            "```\n\n"
            "### Constraints\n"
            "- 0 ≤ n ≤ 30"
        ),
        "difficulty": "easy",
        "function_signature": {
            "python": "def fib(n: int) -> int:",
            "javascript": "function fib(n) {",
            "java": "public int fib(int n) {",
        },
        "visible_test_cases": [
            {"id": 1, "input_display": "n = 0",  "expected_output": "0"},
            {"id": 2, "input_display": "n = 1",  "expected_output": "1"},
            {"id": 3, "input_display": "n = 6",  "expected_output": "8"},
        ],
        "test_cases": [
            {"id": 1,  "input_args": [0],  "expected_output": "0",   "function_name": "fib"},
            {"id": 2,  "input_args": [1],  "expected_output": "1",   "function_name": "fib"},
            {"id": 3,  "input_args": [2],  "expected_output": "1",   "function_name": "fib"},
            {"id": 4,  "input_args": [3],  "expected_output": "2",   "function_name": "fib"},
            {"id": 5,  "input_args": [4],  "expected_output": "3",   "function_name": "fib"},
            {"id": 6,  "input_args": [6],  "expected_output": "8",   "function_name": "fib"},
            {"id": 7,  "input_args": [8],  "expected_output": "21",  "function_name": "fib"},
            {"id": 8,  "input_args": [10], "expected_output": "55",  "function_name": "fib"},
            {"id": 9,  "input_args": [12], "expected_output": "144", "function_name": "fib"},
            {"id": 10, "input_args": [15], "expected_output": "610", "function_name": "fib"},
        ],
        "time_limit_ms": 2000,
        "memory_limit_mb": 128,
    },

    # ------------------------------------------------------------------ #
    # Problem 4 – Best Time to Buy and Sell Stock (medium)                #
    # ------------------------------------------------------------------ #
    {
        "problem_id": 4,
        "title": "Best Time to Buy and Sell Stock",
        "description": (
            "## Best Time to Buy and Sell Stock\n\n"
            "You are given an array `prices` where `prices[i]` is the price of a stock on day `i`.\n\n"
            "You want to maximize your profit by choosing a **single day to buy** and a "
            "**different day in the future to sell**.\n\n"
            "Return the **maximum profit** you can achieve. If no profit is possible, return `0`.\n\n"
            "### Examples\n\n"
            "```\n"
            "Input:  prices = [7, 1, 5, 3, 6, 4]\n"
            "Output: 5   # Buy on day 1 (price=1), sell on day 4 (price=6)\n\n"
            "Input:  prices = [7, 6, 4, 3, 1]\n"
            "Output: 0   # Prices only decrease — no profit possible\n"
            "```\n\n"
            "### Constraints\n"
            "- 1 ≤ prices.length ≤ 10⁵\n"
            "- 0 ≤ prices[i] ≤ 10⁴"
        ),
        "difficulty": "medium",
        "function_signature": {
            "python": "def maxProfit(prices: list) -> int:",
            "javascript": "function maxProfit(prices) {",
            "java": "public int maxProfit(int[] prices) {",
        },
        "visible_test_cases": [
            {"id": 1, "input_display": "prices = [7, 1, 5, 3, 6, 4]", "expected_output": "5"},
            {"id": 2, "input_display": "prices = [7, 6, 4, 3, 1]",    "expected_output": "0"},
            {"id": 3, "input_display": "prices = [1, 2]",              "expected_output": "1"},
        ],
        "test_cases": [
            {"id": 1,  "input_args": [[7, 1, 5, 3, 6, 4]],       "expected_output": "5",  "function_name": "maxProfit"},
            {"id": 2,  "input_args": [[7, 6, 4, 3, 1]],          "expected_output": "0",  "function_name": "maxProfit"},
            {"id": 3,  "input_args": [[1, 2]],                   "expected_output": "1",  "function_name": "maxProfit"},
            {"id": 4,  "input_args": [[2, 4, 1]],                "expected_output": "2",  "function_name": "maxProfit"},
            {"id": 5,  "input_args": [[3, 3, 5, 0, 0, 3, 1, 4]], "expected_output": "4",  "function_name": "maxProfit"},
            {"id": 6,  "input_args": [[1, 4, 2]],                "expected_output": "3",  "function_name": "maxProfit"},
            {"id": 7,  "input_args": [[1]],                      "expected_output": "0",  "function_name": "maxProfit"},
            {"id": 8,  "input_args": [[5, 5, 5, 5]],             "expected_output": "0",  "function_name": "maxProfit"},
            {"id": 9,  "input_args": [[1, 2, 3, 4, 5]],          "expected_output": "4",  "function_name": "maxProfit"},
            {"id": 10, "input_args": [[10, 1, 10]],              "expected_output": "9",  "function_name": "maxProfit"},
        ],
        "time_limit_ms": 2000,
        "memory_limit_mb": 128,
    },

    # ------------------------------------------------------------------ #
    # Problem 5 – Longest Common Prefix (easy)                            #
    # ------------------------------------------------------------------ #
    {
        "problem_id": 5,
        "title": "Longest Common Prefix",
        "description": (
            "## Longest Common Prefix\n\n"
            "Write a function to find the **longest common prefix** string among an array of strings.\n\n"
            "If there is no common prefix, return an **empty string** `\"\"`.\n\n"
            "### Examples\n\n"
            "```\n"
            'Input:  strs = ["flower", "flow", "flight"]\n'
            'Output: "fl"\n\n'
            'Input:  strs = ["dog", "racecar", "car"]\n'
            'Output: ""\n'
            "```\n\n"
            "### Constraints\n"
            "- 1 ≤ strs.length ≤ 200\n"
            "- 0 ≤ strs[i].length ≤ 200\n"
            "- strs[i] consists of lowercase English letters only."
        ),
        "difficulty": "easy",
        "function_signature": {
            "python": "def longestCommonPrefix(strs: list) -> str:",
            "javascript": "function longestCommonPrefix(strs) {",
            "java": "public String longestCommonPrefix(String[] strs) {",
        },
        "visible_test_cases": [
            {"id": 1, "input_display": 'strs = ["flower", "flow", "flight"]', "expected_output": "fl"},
            {"id": 2, "input_display": 'strs = ["dog", "racecar", "car"]',    "expected_output": ""},
            {"id": 3, "input_display": 'strs = ["interview", "interact", "interface"]', "expected_output": "inter"},
        ],
        "test_cases": [
            {"id": 1,  "input_args": [["flower", "flow", "flight"]],          "expected_output": "fl",      "function_name": "longestCommonPrefix"},
            {"id": 2,  "input_args": [["dog", "racecar", "car"]],             "expected_output": "",        "function_name": "longestCommonPrefix"},
            {"id": 3,  "input_args": [["interview", "interact", "interface"]],"expected_output": "inter",   "function_name": "longestCommonPrefix"},
            {"id": 4,  "input_args": [["ab", "a"]],                           "expected_output": "a",       "function_name": "longestCommonPrefix"},
            {"id": 5,  "input_args": [["prefix"]],                            "expected_output": "prefix",  "function_name": "longestCommonPrefix"},
            {"id": 6,  "input_args": [["", "b"]],                             "expected_output": "",        "function_name": "longestCommonPrefix"},
            {"id": 7,  "input_args": [["abc", "abc", "abc"]],                 "expected_output": "abc",     "function_name": "longestCommonPrefix"},
            {"id": 8,  "input_args": [["throne", "thunder", "thought"]],      "expected_output": "th",      "function_name": "longestCommonPrefix"},
            {"id": 9,  "input_args": [["reflect", "reflection", "reflective"]],"expected_output": "reflect","function_name": "longestCommonPrefix"},
            {"id": 10, "input_args": [["aa", "ab"]],                          "expected_output": "a",       "function_name": "longestCommonPrefix"},
        ],
        "time_limit_ms": 2000,
        "memory_limit_mb": 128,
    },
]

# Convenience lookup by problem_id
PROBLEMS_BY_ID: dict = {p["problem_id"]: p for p in PROBLEMS}
