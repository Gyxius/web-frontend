# Social App Workspace

This workspace contains three main projects:

- **web-frontend**: React web frontend
- **backend**: FastAPI backend (Python)
- **frontend**: Expo React Native mobile frontend

## How to Launch Each Project

### 1. Web Frontend (React)

```
cd web-frontend
npm install
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Backend (FastAPI)

```
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
The backend will run at [http://localhost:8000](http://localhost:8000).

### 3. Mobile Frontend (Expo React Native)

```
cd frontend
npm install
npx expo start
```
Follow the Expo CLI instructions to open the app in an emulator, simulator, or Expo Go.

---

## Troubleshooting

- If you see `net::ERR_CONNECTION_TIMED_OUT` in the web frontend, make sure the backend is running and accessible at `localhost:8000`.
- For mobile, ensure your device/emulator is on the same network as your backend if you want to connect to the API.

---

## Project Structure

- `web-frontend/` - React web app
- `backend/` - FastAPI backend
- `frontend/` - Expo React Native app

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
