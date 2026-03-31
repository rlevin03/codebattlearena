import type { Language } from '../types/battle';

export const api = {
  createBattle: (playerName: string) =>
    fetch('/api/battles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_name: playerName }),
    }).then((r) => r.json()),
  // returns { battle_id, join_code, player_id, status }

  joinBattle: (joinCode: string, playerName: string) =>
    fetch('/api/battles/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ join_code: joinCode, player_name: playerName }),
    }).then((r) => r.json()),
  // returns { battle_id, player_id, status }

  getProblem: (battleId: string) =>
    fetch(`/api/battles/${battleId}/problem`).then((r) => r.json()),

  submit: (battleId: string, playerId: string, code: string, language: Language) =>
    fetch(`/api/battles/${battleId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId, code, language }),
    }).then((r) => r.json()),

  runCode: (battleId: string, playerId: string, code: string, language: Language) =>
    fetch(`/api/battles/${battleId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId, code, language }),
    }).then((r) => r.json()),

  endBattle: (battleId: string, playerId: string) =>
    fetch(`/api/battles/${battleId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId }),
    }).then((r) => r.json()),

  getFullResults: (battleId: string, playerId: string) =>
    fetch(`/api/battles/${battleId}/results/${playerId}`).then((r) => r.json()),
};
