# How to Run HeartAI

## Quick start

Double-click **`start.cmd`** in the project folder, or run:

```cmd
cd "c:\Users\hp\OneDrive\Desktop\Heart Attack Prediction"
start.cmd
```

Opens backend + frontend in two windows. Then open **http://localhost:3000**

**Admin login:** `admin@heartai.com` / `admin123`

---

## First-time setup (once)

```cmd
setup.cmd
.venv\Scripts\python.exe train_nn.py
.venv\Scripts\python.exe scripts\create_admin.py --name "Admin" --email admin@heartai.com --password admin123
```

---

## Run separately (optional)

**Backend:**
```cmd
start-backend.cmd
```

**Frontend:**
```cmd
start-frontend.cmd
```

---

## Verify

- Backend: http://localhost:5000/api/health → `"mongodb": "connected"`
- Frontend: http://localhost:3000

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `ECONNREFUSED` on login | Run `start-backend.cmd` |
| `ModuleNotFoundError: flask` | Run `setup.cmd` first |
| `mongodb: disconnected` | Start MongoDB Windows service |
| Port 3000 in use | Use the URL shown in the frontend window (e.g. 3001) |
| Prediction fails | Run `.venv\Scripts\python.exe train_nn.py` |
