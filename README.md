add your IP address to these files:
frontend\src\services\api.js -> API_BASE_URL
frontend\src\screens\SubmitComplaintScreen.js -> runAiDetection
frontend\.env -> EXPO_PUBLIC_GEMINI_API_URL

to get IP address:
write ipconfig in terminal
copy the  IPv4 Address under Wireless LAN adapter Wi-Fi

there are .env files in these folders:
frontend
backend
gemini-service

//

run each in a separate terminal:

1.
cd backend
npm install // first time or if new package added
npm run dev

2.
lt --port 3000 --subdomain cityzen-api
// get link, copy paste into frontend\.env -> EXPO_PUBLIC_API_URL
// go to link and add tunnel password

3.
cd ai-service
// if first time
python -m pip install python-multipart
pip install fastapi uvicorn
pip install ultralytics 
python -m venv venv
// 
venv\Scripts\activate
uvicorn ai_service:app --host 0.0.0.0 --port 8000 

4.
cd openrouter-service
// if first time
pip install -r requirements.txt
python -m venv venv
//
venv\Scripts\activate
uvicorn openrouter_service:app --host 0.0.0.0 --port 8001

5.
cd frontend
npm install // first time or if new package added
npm start OR npx expo start

// if there is a problem with lucid react
npm install lucide-react

after expo start
go to expo go mobile app
scan the generated QR code
first time 1-3 mins normal
then boot up and see the app
