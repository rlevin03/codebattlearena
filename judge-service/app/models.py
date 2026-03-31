from pydantic import BaseModel
from typing import List


class CreateBattleRequest(BaseModel):
    player_name: str


class JoinBattleRequest(BaseModel):
    join_code: str
    player_name: str


class SubmitRequest(BaseModel):
    player_id: str
    code: str
    language: str


class CreateBattleResponse(BaseModel):
    battle_id: str
    join_code: str
    player_id: str
    status: str


class JoinBattleResponse(BaseModel):
    battle_id: str
    player_id: str
    status: str


class SubmitResponse(BaseModel):
    submission_id: str
    status: str


class EndBattleRequest(BaseModel):
    player_id: str


class HealthResponse(BaseModel):
    status: str


class VisibleTestCase(BaseModel):
    id: int
    input_display: str
    expected_output: str


class FunctionSignature(BaseModel):
    python: str
    javascript: str
    java: str


class ProblemResponse(BaseModel):
    problem_id: int
    title: str
    description: str
    difficulty: str
    function_signature: FunctionSignature
    visible_test_cases: List[VisibleTestCase]
    time_limit_ms: int
    memory_limit_mb: int
