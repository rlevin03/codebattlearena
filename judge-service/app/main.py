import logging
import os
import uuid
from datetime import datetime, timezone

import httpx
import json
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .battle_manager import (
    BattleRoom,
    PlayerState,
    create_battle,
    get_battle,
    get_player,
    join_battle,
    record_submission_result,
    room_problem,
)
from .models import (
    CreateBattleRequest,
    CreateBattleResponse,
    EndBattleRequest,
    FunctionSignature,
    HealthResponse,
    JoinBattleRequest,
    JoinBattleResponse,
    ProblemResponse,
    SubmitRequest,
    SubmitResponse,
    VisibleTestCase,
)
from .problems import PROBLEMS_BY_ID
from .ws_manager import manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ORCHESTRATOR_URL = os.getenv("ORCHESTRATOR_URL", "http://orchestrator:8080")

app = FastAPI(title="CodeBattleArena Judge Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _player_snapshot(p: PlayerState) -> dict:
    return {
        "player_id": p.player_id,
        "name": p.name,
        "submitted": p.submitted,
        "passed_cases": p.passed_cases,
    }


def _battle_state_message(room: BattleRoom, your_player_id: str) -> dict:
    return {
        "type": "battle_state",
        "status": room.status,
        "players": [_player_snapshot(p) for p in room.players],
        "your_player_id": your_player_id,
        "started_at": _iso(room.started_at),
    }


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok")


@app.post("/battles", response_model=CreateBattleResponse, status_code=201)
async def create_battle_endpoint(body: CreateBattleRequest):
    room, player = create_battle(body.player_name)
    return CreateBattleResponse(
        battle_id=room.battle_id,
        join_code=room.join_code,
        player_id=player.player_id,
        status=room.status,
    )


@app.post("/battles/join", response_model=JoinBattleResponse)
async def join_battle_endpoint(body: JoinBattleRequest):
    try:
        room, player2 = join_battle(body.join_code, body.player_name)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    await manager.broadcast(
        room.battle_id,
        {
            "type": "opponent_joined",
            "player": _player_snapshot(player2),
        },
    )

    await manager.broadcast(
        room.battle_id,
        {
            "type": "battle_start",
            "problem_id": room.problem_id,
            "started_at": _iso(room.started_at),
        },
    )

    return JoinBattleResponse(
        battle_id=room.battle_id,
        player_id=player2.player_id,
        status=room.status,
    )


@app.get("/battles/{battle_id}/problem", response_model=ProblemResponse)
async def get_problem(battle_id: str):
    room = get_battle(battle_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Battle not found.")

    problem = PROBLEMS_BY_ID[room.problem_id]

    return ProblemResponse(
        problem_id=problem["problem_id"],
        title=problem["title"],
        description=problem["description"],
        difficulty=problem["difficulty"],
        function_signature=FunctionSignature(**problem["function_signature"]),
        visible_test_cases=[
            VisibleTestCase(**tc) for tc in problem["visible_test_cases"]
        ],
        time_limit_ms=problem["time_limit_ms"],
        memory_limit_mb=problem["memory_limit_mb"],
    )


@app.post("/battles/{battle_id}/submit", response_model=SubmitResponse, status_code=202)
async def submit_solution(battle_id: str, body: SubmitRequest):
    room = get_battle(battle_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Battle not found.")

    if room.status != "active":
        raise HTTPException(
            status_code=400,
            detail=f"Battle is not active (status: {room.status}).",
        )

    player = get_player(room, body.player_id)
    if player is None:
        raise HTTPException(status_code=403, detail="Player is not part of this battle.")

    if player.submitted:
        raise HTTPException(status_code=400, detail="Player has already submitted.")

    submission_id = str(uuid.uuid4())
    submitted_at = _iso(datetime.now(timezone.utc))

    await manager.broadcast(
        battle_id,
        {
            "type": "submission_queued",
            "player_id": body.player_id,
            "submitted_at": submitted_at,
        },
    )

    problem = room_problem(room)
    orchestrator_payload = {
        "code": body.code,
        "language": body.language,
        "function_name": problem["test_cases"][0]["function_name"],
        "test_cases": [
            {
                "id": tc["id"],
                "input_args": tc["input_args"],
                "expected_output": tc["expected_output"],
            }
            for tc in problem["test_cases"]
        ],
        "time_limit_seconds": problem["time_limit_ms"] / 1000,
        "memory_limit_mb": problem["memory_limit_mb"],
    }

    time_limit_s = problem["time_limit_ms"] / 1000
    num_cases = len(problem["test_cases"])
    exec_timeout = (time_limit_s + 3) * num_cases + 15

    visible_ids = {tc["id"] for tc in problem["visible_test_cases"]}

    orchestrator_data = None
    exec_error: str | None = None
    try:
        async with httpx.AsyncClient(timeout=exec_timeout) as client:
            resp = await client.post(
                f"{ORCHESTRATOR_URL}/execute",
                json=orchestrator_payload,
            )
            resp.raise_for_status()
            orchestrator_data = resp.json()
    except httpx.TimeoutException:
        exec_error = "Time Limit Exceeded"
        logger.error("Orchestrator timed out for battle=%s player=%s", battle_id, body.player_id)
    except Exception as exc:
        exec_error = "Execution service error"
        logger.error("Orchestrator error for battle=%s: %s", battle_id, exc)

    if exec_error is not None:
        error_results = [
            {
                "case_id": tc["id"],
                "passed": False,
                "actual_output": None,
                "expected_output": tc["expected_output"],
                "execution_time_ms": 0,
                "error": exec_error,
                "visible": tc["id"] in visible_ids,
            }
            for tc in problem["test_cases"]
        ]
        result_message = {
            "type": "submission_result",
            "player_id": body.player_id,
            "total_cases": num_cases,
            "passed_cases": 0,
            "test_results": error_results,
        }
        await manager.broadcast(battle_id, result_message)
        winner_id = record_submission_result(room, player, 0, result_message)
        if winner_id is not None:
            winner_player = get_player(room, winner_id)
            await manager.broadcast(battle_id, {
                "type": "battle_end",
                "winner_player_id": winner_id,
                "winner_name": winner_player.name if winner_player else "",
                "reason": "most_cases",
            })
        return SubmitResponse(submission_id=submission_id, status="queued")

    raw_results = orchestrator_data.get("results", [])

    enriched_results = [
        {
            "case_id": r["case_id"],
            "passed": r["passed"],
            "actual_output": r.get("actual_output"),
            "expected_output": r.get("expected_output"),
            "execution_time_ms": r.get("execution_time_ms"),
            "error": r.get("error"),
            "visible": r["case_id"] in visible_ids,
        }
        for r in raw_results
    ]

    passed_cases = sum(1 for r in raw_results if r.get("passed"))
    total_cases = len(problem["test_cases"])

    result_message = {
        "type": "submission_result",
        "player_id": body.player_id,
        "total_cases": total_cases,
        "passed_cases": passed_cases,
        "test_results": enriched_results,
    }

    await manager.broadcast(battle_id, result_message)

    winner_id = record_submission_result(room, player, passed_cases, result_message)

    if winner_id is not None:
        winner_player = get_player(room, winner_id)
        reason = "all_passed" if passed_cases == total_cases else "most_cases"

        await manager.broadcast(
            battle_id,
            {
                "type": "battle_end",
                "winner_player_id": winner_id,
                "winner_name": winner_player.name if winner_player else "",
                "reason": reason,
            },
        )

    return SubmitResponse(submission_id=submission_id, status="queued")


@app.get("/battles/{battle_id}/results/{player_id}")
async def get_full_results(battle_id: str, player_id: str):
    room = get_battle(battle_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Battle not found.")
    if room.status != "finished":
        raise HTTPException(status_code=400, detail="Battle not finished yet.")

    player = get_player(room, player_id)
    if player is None:
        raise HTTPException(status_code=403, detail="Player not in this battle.")

    problem = room_problem(room)
    visible_ids = {tc["id"] for tc in problem["visible_test_cases"]}

    sub_by_id: dict = {}
    if player.submission_result:
        for r in player.submission_result.get("test_results", []):
            sub_by_id[r["case_id"]] = r

    def _fmt_args(input_args: list) -> str:
        return ", ".join(json.dumps(a, ensure_ascii=False) for a in input_args)

    test_cases = []
    for tc in problem["test_cases"]:
        sub = sub_by_id.get(tc["id"], {})
        test_cases.append({
            "id": tc["id"],
            "input_display": _fmt_args(tc["input_args"]),
            "expected_output": tc["expected_output"],
            "visible": tc["id"] in visible_ids,
            "passed": sub.get("passed"),
            "actual_output": sub.get("actual_output"),
            "execution_time_ms": sub.get("execution_time_ms"),
            "error": sub.get("error"),
        })

    return {
        "problem_title": problem["title"],
        "submitted": player.submitted,
        "test_cases": test_cases,
    }


@app.post("/battles/{battle_id}/run")
async def run_code(battle_id: str, body: SubmitRequest):
    room = get_battle(battle_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Battle not found.")
    if room.status != "active":
        raise HTTPException(status_code=400, detail="Battle is not active.")

    player = get_player(room, body.player_id)
    if player is None:
        raise HTTPException(status_code=403, detail="Player not in this battle.")

    problem = room_problem(room)
    visible_ids = {tc["id"] for tc in problem["visible_test_cases"]}
    visible_cases = [tc for tc in problem["test_cases"] if tc["id"] in visible_ids]

    orchestrator_payload = {
        "code": body.code,
        "language": body.language,
        "function_name": problem["test_cases"][0]["function_name"],
        "test_cases": [
            {"id": tc["id"], "input_args": tc["input_args"], "expected_output": tc["expected_output"]}
            for tc in visible_cases
        ],
        "time_limit_seconds": problem["time_limit_ms"] / 1000,
        "memory_limit_mb": problem["memory_limit_mb"],
    }

    time_limit_s = problem["time_limit_ms"] / 1000
    exec_timeout = (time_limit_s + 3) * len(visible_cases) + 15

    try:
        async with httpx.AsyncClient(timeout=exec_timeout) as client:
            resp = await client.post(f"{ORCHESTRATOR_URL}/execute", json=orchestrator_payload)
            resp.raise_for_status()
            data = resp.json()
    except httpx.TimeoutException:
        error_results = [
            {"case_id": tc["id"], "passed": False, "actual_output": None,
             "expected_output": tc["expected_output"], "execution_time_ms": 0,
             "error": "Time Limit Exceeded", "visible": True}
            for tc in visible_cases
        ]
        return {"results": error_results, "passed": 0, "total": len(visible_cases)}
    except Exception as exc:
        logger.error("Run orchestrator error: %s", exc)
        error_results = [
            {"case_id": tc["id"], "passed": False, "actual_output": None,
             "expected_output": tc["expected_output"], "execution_time_ms": 0,
             "error": "Execution service error", "visible": True}
            for tc in visible_cases
        ]
        return {"results": error_results, "passed": 0, "total": len(visible_cases)}

    results = [
        {
            "case_id": r["case_id"],
            "passed": r["passed"],
            "actual_output": r.get("actual_output"),
            "expected_output": r.get("expected_output"),
            "execution_time_ms": r.get("execution_time_ms", 0),
            "error": r.get("error"),
            "visible": True,
        }
        for r in data.get("results", [])
    ]
    return {"results": results, "passed": sum(1 for r in results if r["passed"]), "total": len(results)}


@app.post("/battles/{battle_id}/end")
async def end_battle(battle_id: str, body: EndBattleRequest):
    room = get_battle(battle_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Battle not found.")

    if room.status == "finished":
        return {"status": "already_finished"}

    if not room.players:
        return {"status": "no_players"}

    # Ties go to whoever passed the most cases; if nobody submitted, no winner.
    best = max(room.players, key=lambda p: p.passed_cases)
    room.status = "finished"
    room.winner_id = best.player_id if best.passed_cases > 0 else None

    await manager.broadcast(battle_id, {
        "type": "battle_end",
        "winner_player_id": room.winner_id or "",
        "winner_name": best.name if room.winner_id else "",
        "reason": "timeout",
    })

    return {"status": "ended"}


@app.websocket("/ws/{battle_id}/{player_id}")
async def websocket_endpoint(ws: WebSocket, battle_id: str, player_id: str):
    room = get_battle(battle_id)
    if room is None:
        await ws.close(code=4004)
        return

    player = get_player(room, player_id)
    if player is None:
        await ws.close(code=4003)
        return

    await manager.connect(battle_id, player_id, ws)

    await manager.send_to(
        battle_id,
        player_id,
        _battle_state_message(room, player_id),
    )

    try:
        # Read and discard any frames the client sends so the connection
        # doesn't stall on certain proxies.
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        logger.info("WS disconnected gracefully: battle=%s player=%s", battle_id, player_id)
    except Exception as exc:
        logger.warning(
            "WS error for battle=%s player=%s: %s", battle_id, player_id, exc
        )
    finally:
        manager.disconnect(battle_id, player_id)
