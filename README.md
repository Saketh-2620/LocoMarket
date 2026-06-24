# LocoMarket

Neighborhood marketplace with map-based discovery.

## Prerequisites

- Docker Desktop (recommended)
- Node.js 18+

## Quick start

### 1. Database and Redis

```bash
docker compose up -d
```

### 2. Backend

**Option A — Docker** (after fixing Docker disk space; see below):

```bash
docker compose --profile full up --build
```

**Option B — Local Python** (if Docker build fails; requires [OSGeo4W](https://trac.osgeo.org/osgeo4j/) on Windows):

```bash
docker compose up -d
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

Backend runs at http://localhost:8000

### 3. Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open http://localhost:5173

### 4. Google OAuth

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Configure OAuth consent screen
3. Create **Web** OAuth client with authorized origin `http://localhost:5173`
4. Set `GOOGLE_CLIENT_ID` in `docker-compose.yml` / `backend/.env` and `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`

## Docker build failed with "read-only file system"?

This is a **Docker Desktop disk/state issue**, not an application bug. Docker ran out of space or its internal database locked.

1. Check free space on `C:` (need several GB free).
2. **Restart Docker Desktop** (or run `wsl --shutdown` in PowerShell, then reopen Docker).
3. Prune build cache:
   ```bash
   docker builder prune -af
   docker system prune -f
   ```
4. Docker Desktop → **Settings → Resources → Disk image size** — increase if near the limit.
5. If it persists: Docker Desktop → **Troubleshoot → Clean / Purge data** (removes unused images).

The backend Dockerfile was slimmed down (runtime GDAL libs only, no `libgdal-dev`) so the next build installs far fewer packages.

## API overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/google/` | Exchange Google ID token for JWT |
| `GET /api/auth/user/` | Current user |
| `GET /api/items/?bbox=w,s,e,n` | Items in map viewport |
| `POST /api/items/` | Create listing (multipart) |
| `POST /api/items/{id}/mark-sold/` | Seller marks item sold |
| `GET /api/chat/rooms/` | User's chat rooms |
| `WS /ws/chat/{room_id}/?token=` | Real-time chat |

## Product note

Buyers discover items on the map and chat with sellers. There is **no in-app purchase** — sellers mark items as sold after agreeing via chat.
