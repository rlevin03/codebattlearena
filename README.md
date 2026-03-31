# CodeBattleArena

A head-to-head competitive coding platform where two players race to solve the same problem. Each submission runs in an isolated Docker container with CPU, memory, and network limits.

## Architecture

```
Browser
  └─ Port 3000 ──► nginx (frontend)
                     ├─ /api/ ──► judge-service:8000  (Python / FastAPI)
                     │              └─ /execute ──► orchestrator:8080  (Java / Spring Boot)
                     └─ /ws/  ──►  judge-service:8000  (WebSocket)
```

| Service | Language | Role |
|---|---|---|
| **frontend** | TypeScript · React · Vite · Tailwind | UI, Monaco editor, live WebSocket updates |
| **judge-service** | Python · FastAPI | Battle rooms, problem bank, WebSocket broadcast, result judging |
| **orchestrator** | Java · Spring Boot | Spins up sandboxed Docker containers per submission |

## Running

### Prerequisites
- Docker Desktop with the Docker socket accessible at `/var/run/docker.sock`
- Docker Compose v2

### Start

```bash
docker compose up --build
```

Open **http://localhost:3000** in two browser tabs.

> On first run, Docker pulls `python:3.11-slim`, `node:20-slim`, and `eclipse-temurin:21-jdk-alpine` for the sandboxed runners. Subsequent starts use cached layers.

## How It Works

1. **Player A** enters a name and clicks **Create Battle** → receives a 6-character join code
2. **Player B** enters the same join code → battle starts immediately
3. Both players see the same randomly selected coding problem and a 5-minute countdown
4. Code is written in the Monaco editor (Python, JavaScript, or Java)
5. On **Submit**, the code is sent to the judge service, which calls the orchestrator
6. The orchestrator spins up a Docker container per test case with:
   - `--memory` and `--cpus` limits
   - `--network=none` (no outbound access)
   - `--read-only` filesystem + `--tmpfs /tmp`
   - Code delivered via a base64-encoded environment variable (no bind mounts — Windows compatible)
7. Results stream back via WebSocket in real time
8. First player to pass all 10 test cases wins

## Problems

Five built-in problems of varying difficulty:

| # | Title | Difficulty |
|---|---|---|
| 1 | Two Sum | Easy |
| 2 | Valid Parentheses | Easy |
| 3 | Nth Fibonacci | Easy |
| 4 | Best Time to Buy and Sell Stock | Medium |
| 5 | Longest Common Prefix | Easy |

Each problem has 3 visible example test cases and 7 hidden cases used for judging.

## Project Structure

```
codebattlearena/
├── docker-compose.yml
├── frontend/               # TypeScript · React · Vite · Tailwind
│   ├── src/
│   │   ├── pages/          # LobbyPage, BattlePage, ResultsPage
│   │   ├── components/     # BattleHeader, ProblemPanel, EditorPanel, ResultsPanel
│   │   ├── hooks/          # useBattleSocket
│   │   ├── lib/            # api.ts
│   │   └── types/          # battle.ts
│   ├── nginx.conf
│   └── Dockerfile
├── judge-service/          # Python · FastAPI
│   ├── app/
│   │   ├── main.py         # Routes + WebSocket endpoint
│   │   ├── battle_manager.py
│   │   ├── ws_manager.py
│   │   ├── problems.py
│   │   └── models.py
│   └── Dockerfile
└── orchestrator/           # Java · Spring Boot
    ├── src/main/java/com/codebattle/orchestrator/
    │   ├── controller/     # ExecutionController
    │   └── service/        # DockerExecutionService, RunnerTemplateService
    └── Dockerfile
```
