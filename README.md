# HeartAI — Production-Grade Heart Attack Prediction Platform

A full-stack AI healthcare platform for heart attack risk prediction with RBAC, analytics, multilingual support, voice input, data export, and AI report summarization.

## Features

### Core
- PyTorch neural network heart attack risk prediction (unchanged ML logic)
- JWT authentication with role-based access control
- MongoDB persistence with indexes

### Roles
| Role | Capabilities |
|------|-------------|
| **Patient** | Predict, view records, download reports, edit profile |
| **Doctor** | View assigned patients, patient reports, analytics, export |
| **Admin** | Manage users/doctors, system analytics, population insights, export |

### Platform Features
- Advanced analytics dashboard (Recharts): daily/weekly/monthly charts, risk pie, age/gender distribution, heatmap
- Population analytics (anonymized, admin-only)
- Data export: CSV, Excel (.xlsx), PDF
- AI medical report summarization (EN, HI, UR, AR)
- Multilingual UI (react-i18next) with RTL for Arabic/Urdu
- Voice-to-text form filling (Web Speech API)
- Modern UI: glassmorphism, Framer Motion, dark/light theme, responsive layout

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Framer Motion, react-i18next |
| Backend | Flask, Flask-JWT-Extended, Flask-CORS |
| Database | MongoDB |
| ML | PyTorch, scikit-learn, joblib |
| Export | pandas, openpyxl, reportlab |

## Project Structure

```
Heart Attack Prediction/
├── app.py                      # Flask entry point
├── config.py                   # Environment configuration
├── extensions.py               # JWT, MongoDB, indexes
├── models.py                   # User & PredictionRecord models
├── nn_model.py                 # Neural network definition
├── middleware/rbac.py          # Role-based access decorators
├── routes/                     # API blueprints
│   ├── auth.py
│   ├── predictions.py
│   ├── analytics.py
│   ├── admin.py
│   ├── doctor.py
│   ├── export.py
│   ├── reports.py
│   └── health.py
├── services/
│   ├── prediction_service.py   # ML prediction (unchanged logic)
│   ├── analytics_service.py    # MongoDB aggregation pipelines
│   ├── export_service.py       # CSV/Excel/PDF export
│   └── summarization_service.py
├── scripts/
│   ├── create_admin.py
│   └── migrate_roles.py
├── models/                     # Saved ML artifacts
│   ├── nn_model.pth
│   └── scaler.pkl
├── client/                     # React frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── hooks/
│       └── i18n/
└── requirements.txt
```

## Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (local or Atlas)
- Trained model files in `models/`

### Quick setup (Windows)

```cmd
cd "Heart Attack Prediction"
setup.cmd
```

### Run the app

```cmd
start.cmd
```

Or run backend and frontend separately:

```cmd
start-backend.cmd
start-frontend.cmd
```

### 1. Backend

```cmd
start-backend.cmd
```

Backend: **http://localhost:5000** | Health: **http://localhost:5000/api/health**

### 2. Frontend

```cmd
start-frontend.cmd
```

Frontend: **http://localhost:3000**

### 3. Train ML models (first time)

```powershell
.\.venv\Scripts\python.exe train_nn.py
```

Requires `processed_heart.csv` in the project root. Outputs to `models/`.

### 4. Create admin user

```powershell
.\.venv\Scripts\python.exe scripts/create_admin.py --name "Admin" --email admin@heartai.com --password yourpassword
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET_KEY` | (dev default) | JWT signing secret |
| `MONGO_URI` | `mongodb://localhost:27017/heart_prediction` | MongoDB connection |
| `DEFAULT_PAGE_SIZE` | `10` | API pagination default |
| `MAX_PAGE_SIZE` | `100` | API pagination max |

## API Endpoints

### Health
- `GET /api/health` — Server & MongoDB status

### Auth
- `POST /api/auth/register` — Register (patient only)
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user

### Predictions
- `POST /api/predict` — Make prediction
- `GET /api/records` — List records (pagination, filtering, sorting)
- `DELETE /api/records/:id` — Delete record
- `PUT /api/profile` — Update profile

### Analytics
- `GET /api/analytics/dashboard` — Dashboard stats
- `GET /api/analytics/full` — All chart data
- `GET /api/analytics/population` — Anonymized population stats (admin)

### Admin
- `GET/POST /api/admin/users` — List/create users
- `PUT/DELETE /api/admin/users/:id` — Update/delete user
- `GET /api/admin/doctors` — List doctors
- `POST /api/admin/assign-patient` — Assign patient to doctor
- `GET /api/admin/analytics` — System-wide analytics

### Doctor
- `GET /api/doctor/patients` — Assigned patients
- `GET /api/doctor/patients/:id/records` — Patient records
- `GET /api/doctor/analytics` — Doctor analytics

### Export
- `GET /api/export/predictions?format=csv|xlsx|pdf` — Export predictions
- `GET /api/export/analytics?format=csv|xlsx|pdf` — Export analytics
- `GET /api/export/population?format=csv|xlsx|pdf` — Export population data (admin)
- `GET /api/export/reports/:id?format=csv|xlsx|pdf` — Export single report

### Reports
- `POST /api/reports/summarize` — AI summary (EN/HI/UR/AR)

## ML Model

11 input features: Age, Sex, ChestPainType, RestingBP, Cholesterol, FastingBS, RestingECG, MaxHR, ExerciseAngina, Oldpeak, ST_Slope.

Training scripts (`train_nn.py`, `train_rf.py`) remain unchanged.

## Production Build

```powershell
cd client
npm run build
```

Serve `client/dist` via Flask or a reverse proxy (Nginx).

## License

Educational purposes.
