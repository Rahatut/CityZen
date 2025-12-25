# ===============================
# CityZen Dev Launcher (Windows)
# ===============================

# Terminal 1: Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# ⏳ Wait 5 seconds
Start-Sleep -Seconds 5

# Terminal 2: LocalTunnel
Start-Process powershell -ArgumentList "-NoExit", "-Command", "lt --port 3000 --subdomain cityzen-api"

# Terminal 3: AI Service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ai-service; venv\Scripts\activate; python -m uvicorn ai_service:app --host 0.0.0.0 --port 8000"

# Terminal 4: Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npx expo start -c"
