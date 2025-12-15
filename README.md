1.
cd backend
npm install //first time or if new package added

2.
cd frontend
npm install //first time or if new package added

cd ai-service
python -m venv venv //if not there
ls venv\Scripts //check
.\venv\Scripts\Activate.ps1
pip install fastapi uvicorn
pip install ultralytics //might need other pkg, u will be informed
uvicorn ai_service:app --host 0.0.0.0 --port 8000 ///1st time

//terminal 4
cd ai-service
venv\Scripts\Activate.ps1
uvicorn ai_service:app --host 0.0.0.0 --port 8000

3.
terminal 1
cd backend
npm run dev

4.
terminal 2
lt --port 3000 --subdomain cityzen-api

5.
terminal 3
cd frontend
npx expo start

//if there is a problem with lucid react
npm install lucide-react

after expo start-
go to expo go mobile app
scan the generated QR code
first time 1-3 mins normal
then boot up and see the app
