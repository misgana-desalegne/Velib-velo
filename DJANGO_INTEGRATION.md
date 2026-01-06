# Data Analysis Dashboard - Django Backend Integration

This project is now integrated with Django for data analysis and backend API management.

## Project Structure

```
Data Analysis Dashboard/
├── backend/                 # Django backend
│   ├── config/             # Django project settings
│   ├── analytics/          # Main analytics app
│   │   ├── models.py       # Database models
│   │   ├── views.py        # API views
│   │   ├── serializers.py  # DRF serializers
│   │   └── urls.py         # API routes
│   ├── manage.py           # Django management script
│   └── requirements.txt    # Python dependencies
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── api/               # API configuration
│   └── ...
├── setup.bat              # Windows setup script
├── setup.ps1              # PowerShell setup script
└── package.json           # Node.js dependencies
```

## Features

### Backend (Django)
- **Django REST Framework** for API endpoints
- **CORS enabled** for frontend integration
- **Models:**
  - Arrondissement (Paris districts)
  - BikeStation (Bike sharing stations)
  - StationStatus (Real-time station data)
  - Trip (Bike trip records)
  - DailyAnalytics (Aggregated analytics)

### API Endpoints
- `GET /api/dashboard/live/` - Live dashboard statistics
- `GET /api/dashboard/arrondissements/` - Arrondissement summary
- `GET /api/arrondissements/` - List all arrondissements
- `GET /api/stations/` - List all bike stations
- `GET /api/status/` - Station status updates
- `GET /api/trips/` - Trip records
- `GET /api/analytics/` - Daily analytics data

## Setup Instructions

### Automated Setup (Windows)

Run one of these setup scripts:

```bash
# Using Batch file
setup.bat

# Using PowerShell
.\setup.ps1
```

### Manual Setup

#### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Populate sample data
python manage.py populate_data

# Start Django server
python manage.py runserver
```

#### 2. Frontend Setup

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

## Running the Application

### Option 1: Run Both Servers Simultaneously

```bash
npm run start:all
```

This will start both the Django backend (port 8000) and React frontend (port 3000).

### Option 2: Run Servers Separately

**Terminal 1 - Backend:**
```bash
cd backend
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api/
- **Django Admin:** http://localhost:8000/admin/

## Development

### Adding New Data

Use Django admin panel to add/modify data:
1. Create a superuser: `python manage.py createsuperuser`
2. Access admin at http://localhost:8000/admin/
3. Add/edit Arrondissements, Stations, Trips, etc.

### API Integration

The frontend uses the API configuration in `src/api/config.ts`. All API calls are proxied through Vite to avoid CORS issues during development.

Example API usage:
```typescript
import { API_ENDPOINTS, api } from '@/api/config';

// Fetch live dashboard data
const data = await api.get(API_ENDPOINTS.liveDashboard);

// Fetch arrondissement analytics
const analytics = await api.get(API_ENDPOINTS.arrondissementAnalytics(1));
```

## Database

The project uses SQLite by default for development. The database file is located at `backend/db.sqlite3`.

To switch to PostgreSQL for production, update `backend/config/settings.py`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'your_db_name',
        'USER': 'your_db_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

## Management Commands

- `python manage.py populate_data` - Populate database with sample data
- `python manage.py migrate` - Run database migrations
- `python manage.py createsuperuser` - Create admin user
- `python manage.py runserver` - Start development server

## Technology Stack

**Backend:**
- Django 5.0.1
- Django REST Framework 3.14.0
- django-cors-headers 4.3.1
- SQLite (development)

**Frontend:**
- React 18.3.1
- Vite 6.3.5
- TypeScript
- Tailwind CSS
- Recharts (data visualization)
- Radix UI (components)

## Notes

- The Vite dev server (port 3000) proxies API requests to Django (port 8000)
- CORS is configured for localhost development
- Sample data is automatically generated for testing
- All API endpoints return JSON responses
