# Projet Vélib - Application Structure

## Project Overview

Projet Vélib is a comprehensive bike-sharing analytics platform for Paris's Vélib system. It provides real-time station monitoring, historical data analysis, and actionable insights through an interactive dashboard.

---

## Root Directory Structure

```
Projet_velib/
├── apps/                           # Django applications
├── frontend/                       # React TypeScript frontend
├── projet_velib/                   # Django project configuration
├── build/                          # Compiled frontend build
├── manage.py                       # Django management script
├── package.json                    # Frontend dependencies
├── requirements.txt                # Backend dependencies
├── vite.config.ts                  # Vite build configuration
├── db.sqlite3                      # SQLite database
└── [Configuration & Documentation] # Setup scripts and docs
```

---

## Backend Architecture

### Django Project Configuration (`projet_velib/`)

| File | Purpose |
|------|---------|
| `settings.py` | Django configuration (database, apps, middleware) |
| `urls.py` | Main URL router |
| `wsgi.py` | WSGI server configuration |
| `asgi.py` | ASGI server configuration |

### Analytics App (`apps/analytics/`)

#### Core Files

| File | Purpose |
|------|---------|
| `models.py` | Database models (Commune, BikeStation, Trip, Analytics) |
| `serializers.py` | API data serializers |
| `views.py` | API view handlers |
| `urls.py` | App URL routing |
| `admin.py` | Django admin configuration |
| `apps.py` | App initialization |

#### Services (`apps/analytics/services/`)

| Module | Description |
|--------|-------------|
| `etl_pipeline.py` | Main ETL orchestrator |
| `extractor.py` | Vélib API data extraction |
| `transformer.py` | Data cleaning, validation, aggregation |
| `loader.py` | Database loading operations |
| `analytics_service.py` | Analytics calculations |
| `advanced_analytics_service.py` | Advanced metrics & insights |
| `arrondissement_service.py` | District-specific analysis |

#### Auth Components (`apps/analytics/`)

| File | Purpose |
|------|---------|
| `auth_serializers.py` | User authentication serializers |
| `auth_views.py` | Authentication endpoints |

#### Utils & Management (`apps/analytics/`)

| Directory | Purpose |
|-----------|---------|
| `utils/` | Helper utilities and functions |
| `management/` | Custom Django management commands |
| `migrations/` | Database migrations |

---

## Frontend Architecture

### Structure (`frontend/`)

```
frontend/
├── api/                   # API communication layer
│   ├── auth.ts           # Authentication API calls
│   └── config.ts         # API configuration
├── features/             # Feature modules
│   ├── auth/            # Authentication feature
│   ├── dashboard/       # Dashboard components
│   └── teams/           # Teams management
├── pages/               # Page components
│   ├── Dashboard.tsx
│   ├── LandingPage.tsx
│   ├── LoginPage_Farial.tsx
│   ├── RegisterPage_Farial.tsx
│   ├── TeamsPage.tsx
│   └── VelibRealtimePage.tsx
├── shared/              # Shared resources
│   ├── components/      # Reusable components
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript types
│   └── ui/             # UI components (Radix UI)
├── assets/             # Static assets
│   ├── fonts/
│   ├── images/
│   └── js/
├── App.tsx             # Root component
├── main.tsx            # Entry point
├── index.css           # Global styles
└── README.md
```

### Key Technologies

- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite
- **UI Components:** Radix UI
- **CSS:** Tailwind CSS
- **State Management:** React Hooks
- **API Client:** Axios/Fetch

---

## Data Flow

### ETL Pipeline Flow

```
Vélib API
    ↓
[EXTRACTOR] - Retrieve real-time & historical data
    ↓
[TRANSFORMER] - Clean, validate, aggregate data
    ↓
[LOADER] - Insert into database
    ↓
Django Models
    ↓
REST API Endpoints
    ↓
React Frontend
```

### API Response Flow

```
Django REST Framework
    ↓
Analytics Service (calculations & aggregations)
    ↓
Serializers (format for frontend)
    ↓
JSON Response
    ↓
React Components (display data)
```

---

## Database Models

### Core Models

| Model | Purpose |
|-------|---------|
| `Commune` | Paris districts/communes |
| `BikeStation` | Bike station locations & info |
| `Trip` | Individual bike trips |
| `StationStatus` | Real-time station snapshots |
| `DailyAnalytics` | Daily aggregated metrics |
| `WeeklyAnalytics` | Weekly aggregated metrics |

---

## API Endpoints

### Authentication

```
POST   /api/auth/login/           - User login
POST   /api/auth/register/        - User registration
POST   /api/auth/logout/          - User logout
GET    /api/auth/profile/         - Get current user
```

### Analytics

```
GET    /api/analytics/stations/   - List all stations
GET    /api/analytics/stations/{id}/ - Station details
GET    /api/analytics/communes/   - List communes
GET    /api/analytics/daily/      - Daily analytics
GET    /api/analytics/weekly/     - Weekly analytics
GET    /api/analytics/arrondissement/ - District analysis
```

---

## Build & Deployment

### Frontend Build

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |

### Backend Setup

| Command | Purpose |
|---------|---------|
| `pip install -r requirements.txt` | Install dependencies |
| `python manage.py migrate` | Run database migrations |
| `python manage.py runserver` | Start development server |

### ETL Execution

| Script | Purpose |
|--------|---------|
| `run_etl.py` | Execute ETL pipeline |
| `ETL_SCHEDULER_SETTINGS.py` | Configure scheduler |
| `generate_analytics.py` | Generate analytics |

---

## Key Features

### 1. Real-Time Monitoring
- Live bike station status
- Available bikes & docks
- Station occupancy rates

### 2. Historical Analytics
- Trip analysis
- Usage patterns
- Trend identification

### 3. District Analysis
- Arrondissement-level insights
- Geographic distribution
- Performance metrics

### 4. User Management
- Authentication system
- Team collaboration
- Role-based access

### 5. Dashboard
- Interactive visualizations
- Real-time updates
- Analytics charts
- Map view

---

## Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| **Frontend** | React + TypeScript, Vite, Radix UI, Tailwind CSS |
| **Backend** | Django, Django REST Framework, Python |
| **Database** | SQLite |
| **Data Processing** | Pandas, NumPy |
| **Scheduling** | APScheduler (optional) |
| **API Source** | Vélib Official API |

---

## Development Workflow

1. **Setup Phase:** Install dependencies, run migrations, configure environment
2. **Development Phase:** Frontend & backend run in development mode
3. **ETL Phase:** ETL pipeline extracts and processes Vélib data
4. **API Phase:** Django REST API serves processed data
5. **Frontend Phase:** React dashboard consumes and visualizes data
6. **Deployment Phase:** Build frontend, containerize, deploy

---

## Documentation Files

| Document | Content |
|----------|---------|
| `README.md` | Quick start guide |
| `QUICKSTART.md` | Fast setup instructions |
| `PROJECT_DOCUMENTATION.md` | Comprehensive documentation |
| `ETL_README.md` | ETL pipeline details |
| `MVC_STRUCTURE.md` | MVC architecture explanation |
| `SCHEDULER_QUICK_REF.md` | Scheduler configuration |
| `TESTING_READY.md` | Testing guidelines |

---

## Project Statistics

- **Backend Routes:** ~20+ API endpoints
- **Database Models:** 6+ core models
- **Frontend Pages:** 5+ main pages
- **Services:** 4+ analytical services
- **Frontend Components:** 50+ Radix UI components

---

## Notes

- SQLite used for development; consider PostgreSQL for production
- Environment variables required for API keys
- CORS configured for frontend-backend communication
- Real-time data updates via ETL scheduler
