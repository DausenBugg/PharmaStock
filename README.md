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
# steps need to be implemented 

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
