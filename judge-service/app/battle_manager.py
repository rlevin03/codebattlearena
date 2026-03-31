from dataclasses import dataclass, field
from typing import Optional
import uuid
import random
import string
from datetime import datetime, timezone

from .problems import PROBLEMS


@dataclass
class PlayerState:
    player_id: str
    name: str
    submitted: bool = False
    passed_cases: int = 0
    submission_result: Optional[dict] = None


@dataclass
class BattleRoom:
    battle_id: str
    join_code: str
    problem_id: int
    status: str  # waiting | active | finished
    players: list = field(default_factory=list)  # list[PlayerState]
    started_at: Optional[datetime] = None
    winner_id: Optional[str] = None


# Module-level state (in-memory, no database)
battles: dict[str, BattleRoom] = {}
join_code_index: dict[str, str] = {}  # join_code -> battle_id


def _generate_join_code(length: int = 6) -> str:
    """Generate a unique 6-character alphanumeric join code."""
    chars = string.ascii_uppercase + string.digits
    while True:
        code = "".join(random.choices(chars, k=length))
        if code not in join_code_index:
            return code


def create_battle(player_name: str) -> tuple[BattleRoom, PlayerState]:
    """
    Create a new battle room.
    Returns (room, player1_state).
    """
    battle_id = str(uuid.uuid4())
    join_code = _generate_join_code()
    problem = random.choice(PROBLEMS)

    player = PlayerState(
        player_id=str(uuid.uuid4()),
        name=player_name,
    )

    room = BattleRoom(
        battle_id=battle_id,
        join_code=join_code,
        problem_id=problem["problem_id"],
        status="waiting",
        players=[player],
    )

    battles[battle_id] = room
    join_code_index[join_code] = battle_id

    return room, player


def join_battle(join_code: str, player_name: str) -> tuple[BattleRoom, PlayerState]:
    """
    Add a second player to an existing battle room.
    Returns (room, player2_state).
    Raises KeyError if join_code unknown.
    Raises ValueError if the room is already full or not in 'waiting' status.
    """
    join_code_upper = join_code.upper()

    if join_code_upper not in join_code_index:
        raise KeyError(f"Join code '{join_code}' not found.")

    battle_id = join_code_index[join_code_upper]
    room = battles[battle_id]

    if room.status != "waiting":
        raise ValueError("Battle is already full or has ended.")

    if len(room.players) >= 2:
        raise ValueError("Battle room already has two players.")

    player = PlayerState(
        player_id=str(uuid.uuid4()),
        name=player_name,
    )

    room.players.append(player)
    room.status = "active"
    room.started_at = datetime.now(timezone.utc)

    return room, player


def get_battle(battle_id: str) -> Optional[BattleRoom]:
    """Return the BattleRoom for the given id, or None."""
    return battles.get(battle_id)


def get_player(room: BattleRoom, player_id: str) -> Optional[PlayerState]:
    """Return the PlayerState for the given player_id within a room, or None."""
    for p in room.players:
        if p.player_id == player_id:
            return p
    return None


def record_submission_result(
    room: BattleRoom,
    player: PlayerState,
    passed_cases: int,
    result_payload: dict,
) -> Optional[str]:
    """
    Update player submission state.
    Returns the winner_player_id if the battle should end, otherwise None.
    Battle ends immediately if:
      - The submitting player passed all 10 test cases, OR
      - The other player has already submitted (both have submitted — pick whoever passed more)
    """
    player.submitted = True
    player.passed_cases = passed_cases
    player.submission_result = result_payload

    total_cases = len(room_problem(room)["test_cases"])

    # Case 1: current player passed all test cases → instant win
    if passed_cases == total_cases:
        room.status = "finished"
        room.winner_id = player.player_id
        return player.player_id

    # Case 2: opponent has already submitted → both done, pick the winner by most cases
    opponent = _get_opponent(room, player.player_id)
    if opponent and opponent.submitted:
        room.status = "finished"
        if opponent.passed_cases >= passed_cases:
            winner = opponent
        else:
            winner = player
        room.winner_id = winner.player_id
        return winner.player_id

    return None


def room_problem(room: BattleRoom) -> dict:
    """Return the full problem dict for a room."""
    from .problems import PROBLEMS_BY_ID
    return PROBLEMS_BY_ID[room.problem_id]


def _get_opponent(room: BattleRoom, player_id: str) -> Optional[PlayerState]:
    for p in room.players:
        if p.player_id != player_id:
            return p
    return None
