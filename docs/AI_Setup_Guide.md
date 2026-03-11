# PharmaStock AI Setup Guide

This guide explains how to set up the AI pipeline locally after cloning the repo.

## 1. Install prerequisites

Make sure you have:

1. .NET 8 SDK
2. Node.js 20+ and npm
3. Python 3.11+
4. Docker Desktop
5. Git

## 2. Clone the repo

```bash
git clone <your-repo-url>
cd PharmaStock
```

## 3. Start MySQL with Docker

From the repo root:

```bash
docker compose up -d mysql
```

Check it is running:

```bash
docker ps
```

You should see `pharmastock-mysql`.

## 4. Set up and run the .NET backend

```bash
cd PharmaStock
dotnet restore
dotnet run
```

This will:

1. Connect to MySQL
2. Apply EF migrations
3. Seed base `Medications` and `InventoryStocks` if empty
4. Start API at `http://localhost:5177`

## 5. Set up and run the AI Python service (local)

From repo root:

```bash
cd ai-service
python -m venv .venv
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies and run service:

```bash
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

Expected: status ok and models loaded.

## 6. Import synthetic usage history (recommended)

From the backend folder:

```bash
cd ..\PharmaStock
dotnet run -- import-synthetic-usage --csv="..\ai-service\data\synthetic_usage_history.csv" --replace
```

This populates `UsageHistories` so the AI cards have real data to display.

## 7. Verify import count

```bash
docker exec pharmastock-mysql mysql -u dev -padim -e "USE pharmastockdb; SELECT COUNT(*) AS UsageHistoryCount FROM UsageHistories;"
```

Expected count is around `6162`.

## 8. Run frontend

```bash
cd ..\frontend
npm install
npm start
```

Open:

```text
http://localhost:4200
```

## 9. Verify AI endpoints

Check backend endpoints:

1. `GET http://localhost:5177/api/predictions/reorder-alerts`
2. `GET http://localhost:5177/api/predictions/expiration-risks`

Both should return `200`.

Dashboard behavior:

1. Reorder card shows alerts or empty-state text
2. Expiration card shows risk results or empty-state text
3. Cards should not get stuck on loading

## Optional: Run AI service with Docker

From repo root:

```bash
docker compose up -d ai-service
```

Then check:

```bash
curl http://localhost:8000/health
```

## Troubleshooting

1. `422` from AI service
- Usually payload mismatch.
- Current code includes the expiration payload fix (`num_lots_same_med >= 1`).

2. Cards stuck loading
- Confirm backend and AI service are both running.
- Hard refresh browser (`Ctrl+F5`).

3. `npm start` fails
- Run `npm install` in `frontend` first.
- Confirm Node version.

4. Backend fails to start
- Confirm MySQL container is running.
- Check `PharmaStock/appsettings.Development.json` connection string.
