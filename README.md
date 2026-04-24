### PharmaStock

PharamaStock is a web based pharmacy inventory management system designed to help mom and pop pharmacies 
manage medication stock efficiently and reduce monatriay loss caused by expired or understocked drugs.

The system provides real-time inventory visibility, expiration tracking, and intelligent reorder alerts powered by machine learning.

## Usefullness

Small pharmacy teams often rely on outdated spreadsheets or generic inventory systems that do not account for medication expiration, demand patterns, or reorder timing.

PharmaStock solves this by:
- Preventing waste from expired medications
- Preventing waste from expired medications
- Providing centralized, role-based access to inventory data
- Laying the foundation for AI-driven reorder forecasting

## Features

# MVP
Inventory Management
- Track quantity on hand
- Store medication details 
- Monitor stock levels per medication

Expiration Monitoring
- Track expiration dates
- Support beyond-use dating
- Future alert functionality for expiring inventory

### Inventory Status Rules (Current Backend)
- Low stock: medication is considered low stock when `QuantityInStock < 10`
- Expired: medication is considered expired when `ExpirationDate < current UTC date/time`
- Expiring soon: medication is considered expiring soon when `ExpirationDate` is within the next 7 days (`>= now` and `<= now + 7 days`)
- Expired medications are excluded from expiring-soon results

# Beta
Role-Based Access 
- Secure login system
- Staff and administrator roles

AI-Powered Reorder Alerts 
- Analyze sales patterns
- Predict demand trends
- Send early reorder alerts for high-turnover medications
- Delay reorder alerts for slow-moving inventory

## The Tech Stack

# Frontend
- Angular
- TypeScript
- Html/CSS
- (Update as needed)

# Backend
- C#
- ASP.NET Core
- RESTful API architecture
- Swagger 
- (Update as needed)

# Database
- MySQL 8.4
- Entity Framework Core (Pomelo MySQL Provider)
- Docker containerized development environment

# DevOps
- Docker Desktop
- Git & GitHub
- Structured Git workflow (see docs/GIT_WORKFLOW.md)

## Installation (End User)

This application is intended to be deployed to a web server.
End users will access the system via a browser.

Deployment instructions will be provided in a future release.

# -----------------------------------------------------------------
### Development Setup 
# -----------------------------------------------------------------

# Requirements
- .Net 8 SDK
- Node.js 
- Docker Desktop
- Git
- (Update as needed)

# PharmaStock Frontend Start Up
PharmaStock PWA — Start Guide
Run the App
1. Start Backend
cd pharmastock
dotnet run

Runs at:

http://localhost:5177
2. Build Frontend
cd frontend
ng build --configuration production
3. Serve PWA
npx serve -s dist/frontend/browser

Runs at:

http://localhost:3000
4. Open App
http://localhost:3000

5. Install Desktop App (Edge)
⋯ → Apps → Install this site as an app
Troubleshooting
Login Issues
Ensure backend is running
Check CORS allows http://localhost:3000
Icons / Images Not Updating
F12 → Application → Service Workers → Unregister
F12 → Application → Storage → Clear site data
Ctrl + Shift + R
Desktop Icon Not Updating
edge://apps → remove app
delete desktop shortcut
reinstall
Notes
Backend must be running before login
PWA uses service worker caching
Desktop icon may be cached by Windows

# PharmaStock Backend API Start Up (Current Update as Needed)

1. Start MySql Docker
     From the repo root file (..//PharmaStock) in bash or Powershell:
        docker compose up -d
        docker ps

Should see ✔ Container pharmastock-mysql Running 

2. Apply the EF_Core entities to the database
    From the backend project folder (..//PharmaStock/PharmaStock) in bash or Powershell:
        cd PharmaStock
        dotnet ef database update

To confirm use docker exec -it pharmastock-mysql mysql -u dev -padim -e "USE pharmastockdb; SHOW TABLES;"

3. Run the API
    From the backend project folder in bash or Powershell:   
        dotnet run

Swagger will be available at:
    https://localhost:7098/swagger
    http://localhost:5177/swagger

4. Stop Services
    Stop API:
        Ctrl + C
    Stop MySql:
        From the backend project folder (..//PharmaStock/PharmaStock) in bash or Powershell:
            docker compose down


## Contributors
    James Carter
    Eric Sutton
    Dausen Bugg

## Project Status
    Current Status: Alpha
    Infrastructure complete
    Database connectivity established
    Core schema design in progress
    Frontend integration in development
    AI forecasting model in research phase

## Know Issues 
    Authentication not yet implemented
    AI reorder engine not integrated
    No production cloud deployment yet

## Roadmap
    Finalize medication and inventory schema
    Implement full CRUD endpoints
    Add authentication and authorization
    Integrate machine learning reorder prediction
    Implement audit logging

## Repository Structure
    PharmaStock/
        ├── PharmaStock/        (ASP.NET Core Backend)
        ├── frontend/           (Angular Frontend to be added)
        ├── docker-compose.yml
        ├── docs/
        └── README.md


## FDA NDC Data Import

The PharmaStock.Importer project imports FDA Product and Package datasets.

Full datasets are excluded from source control.
Sample datasets are included in /data/sample for testing.

To run:
dotnet run --project PharmaStock.Importer
