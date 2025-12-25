#!/bin/bash
# ===============================
# CityZen Dev Launcher (Linux)
# ===============================

# === Terminal 1: Backend (starts immediately) ===
gnome-terminal \
  --tab --title="CityZen Backend" -- bash -c "
    cd backend &&
    npm run dev;
    exec bash"

# ⏳ Wait 15 seconds before starting the rest
sleep 15

# === Terminal 2: LocalTunnel ===
gnome-terminal \
  --tab --title="LocalTunnel" -- bash -c "
    lt --port 3000 --subdomain cityzen-api;
    exec bash"

# === Terminal 3: AI Service ===
gnome-terminal \
  --tab --title="AI Service" -- bash -c "
    cd ai-service &&
    source venv/bin/activate &&
    python -m uvicorn ai_service:app --host 0.0.0.0 --port 8000;
    exec bash"

# === Terminal 4: Frontend ===
gnome-terminal \
  --tab --title="CityZen Frontend" -- bash -c "
    cd frontend &&
    npx expo start -c;
    exec bash"
pkill -f node