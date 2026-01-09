# Analytics App - MVC Structure

## Directory Structure

```
backend/analytics/
│
├── models.py                          # MODEL LAYER
│   ├── Arrondissement                 # Data model for Paris districts
│   │   └── ArrondissementManager      # Custom query methods
│   ├── BikeStation                    # Data model for bike stations
│   │   └── BikeStationManager         # Custom query methods
│   ├── StationStatus                  # Data model for station status
│   │   └── StationStatusManager       # Custom query methods
│   ├── Trip                           # Data model for bike trips
│   │   └── TripManager                # Custom query methods
│   └── DailyAnalytics                 # Data model for daily analytics
│       └── DailyAnalyticsManager      # Custom query methods
│
├── views/                             # VIEW/CONTROLLER LAYER
│   ├── __init__.py                    # Export all views
│   ├── arrondissement_views.py        # Arrondissement controllers
│   │   └── ArrondissementViewSet      # CRUD + analytics endpoint
│   ├── station_views.py               # Station controllers
│   │   ├── BikeStationViewSet         # Station CRUD + status history
│   │   └── StationStatusViewSet       # Status CRUD operations
│   ├── trip_views.py                  # Trip controllers
│   │   └── TripViewSet                # Trip CRUD with filtering
│   ├── analytics_views.py             # Analytics controllers
│   │   └── DailyAnalyticsViewSet      # Analytics read-only access
│   └── dashboard_views.py             # Dashboard controllers
│       ├── live_dashboard()           # Live statistics endpoint
│       └── arrondissement_summary()   # Arrondissement summary endpoint
│
├── services/                          # BUSINESS LOGIC LAYER
│   ├── __init__.py                    # Export all services
│   ├── arrondissement_service.py      # Arrondissement business logic
│   │   └── ArrondissementService
│   │       ├── get_arrondissement_analytics()
│   │       └── get_all_arrondissements_summary()
│   ├── station_service.py             # Station business logic
│   │   └── StationService
│   │       ├── get_station_status_history()
│   │       ├── get_stations_by_arrondissement()
│   │       ├── get_latest_station_status()
│   │       └── get_active_stations_with_status()
│   └── analytics_service.py           # Analytics business logic
│       └── AnalyticsService
│           ├── get_live_dashboard_stats()
│           └── get_trips_in_date_range()
│
├── utils/                             # UTILITY LAYER
│   ├── __init__.py                    # Export all utilities
│   ├── date_utils.py                  # Date/time utilities
│   │   ├── calculate_date_range()
│   │   ├── get_time_ago()
│   │   └── get_date_range_from_params()
│   ├── validators.py                  # Validation utilities
│   │   ├── validate_station_id()
│   │   ├── validate_arrondissement_code()
│   │   └── validate_date_format()
│   └── formatters.py                  # Data formatting utilities
│       ├── format_analytics_data()
│       ├── format_station_data()
│       └── format_dashboard_stats()
│
├── serializers.py                     # SERIALIZATION LAYER
│   ├── ArrondissementSerializer       # Arrondissement JSON serialization
│   ├── BikeStationSerializer          # Station JSON serialization
│   ├── StationStatusSerializer        # Status JSON serialization
│   ├── TripSerializer                 # Trip JSON serialization
│   ├── DailyAnalyticsSerializer       # Analytics JSON serialization
│   ├── ArrondissementAnalyticsSerializer  # Analytics summary serialization
│   └── LiveDashboardSerializer        # Dashboard JSON serialization
│
├── auth_views.py                      # AUTHENTICATION CONTROLLERS
│   ├── RegisterView                   # User registration
│   ├── LoginView                      # User login
│   ├── LogoutView                     # User logout
│   └── CurrentUserView                # Current user info
│
├── auth_serializers.py                # AUTHENTICATION SERIALIZATION
│   ├── RegisterSerializer             # Registration data serialization
│   └── UserSerializer                 # User data serialization
│
├── urls.py                            # URL ROUTING
│   ├── Router configurations          # REST endpoints
│   ├── Dashboard endpoints            # Custom dashboard routes
│   └── Authentication endpoints       # Auth routes
│
└── admin.py                           # Django admin configuration
```

## Request Flow

```
HTTP Request
    ↓
urls.py (URL Routing)
    ↓
views/ (Controller Layer)
    ├── Validate input
    ├── Call Service Layer ──→ services/ (Business Logic)
    │                              ├── Use Models with custom managers
    │                              ├── Complex calculations
    │                              └── Multi-model operations
    ↓                              ↓
    ├── Get data ←─────────────────┘
    └── Serialize response
        ↓
serializers.py (Data Transformation)
    ↓
JSON Response
```

## Layer Responsibilities

### 1. Model Layer (`models.py`)
- **Purpose**: Define data structure and database schema
- **Contains**: 
  - Django ORM models
  - Model relationships (ForeignKey, etc.)
  - Model properties and methods
  - Custom managers for reusable queries

### 2. View Layer (`views/`)
- **Purpose**: Handle HTTP requests and responses (Controllers)
- **Contains**:
  - ViewSets for REST endpoints
  - Function-based views for custom endpoints
  - Request validation
  - Response serialization
- **Rule**: Keep thin - delegate to services

### 3. Service Layer (`services/`)
- **Purpose**: Encapsulate business logic
- **Contains**:
  - Complex calculations
  - Multi-model operations
  - Reusable business logic
  - Analytics computations
- **Rule**: No HTTP knowledge - pure Python logic

### 4. Serializer Layer (`serializers.py`)
- **Purpose**: Transform between models and JSON
- **Contains**:
  - Model serializers
  - Custom serializers for complex data
  - Field validation
  - Nested relationships

### 5. Utils Layer (`utils/`)
- **Purpose**: Provide reusable helper functions
- **Contains**:
  - Date/time utilities
  - Validators
  - Formatters
  - Common operations

## Example Flow

### Request: Get Arrondissement Analytics

1. **Client** sends: `GET /api/arrondissements/1/analytics/`

2. **urls.py** routes to → `ArrondissementViewSet.analytics()`

3. **View** (`arrondissement_views.py`):
   ```python
   def analytics(self, request, pk=None):
       arrondissement = self.get_object()
       data = ArrondissementService.get_arrondissement_analytics(arrondissement)
       serializer = ArrondissementAnalyticsSerializer(data)
       return Response(serializer.data)
   ```

4. **Service** (`arrondissement_service.py`):
   ```python
   @staticmethod
   def get_arrondissement_analytics(arrondissement):
       # Complex business logic
       stations = BikeStation.objects.filter(arrondissement=arrondissement)
       # ... calculations ...
       return analytics_data
   ```

5. **Model** with custom manager:
   ```python
   stations = BikeStation.objects.filter(arrondissement=arrondissement)
   ```

6. **Serializer** formats the response

7. **Client** receives JSON response

## Benefits of This Structure

✅ **Separation of Concerns**: Each layer has a single responsibility

✅ **Testability**: Each layer can be tested independently

✅ **Reusability**: Services can be used across multiple views

✅ **Maintainability**: Easy to locate and modify code

✅ **Scalability**: Adding features doesn't bloat existing code

✅ **Clean Code**: Thin controllers, encapsulated business logic
