# MVC Architecture - Quick Reference

## 📁 New Project Structure

```
backend/analytics/
├── 📊 MODEL LAYER
│   └── models.py (with custom managers)
│
├── 🎮 CONTROLLER LAYER  
│   └── views/
│       ├── arrondissement_views.py
│       ├── station_views.py
│       ├── trip_views.py
│       ├── analytics_views.py
│       └── dashboard_views.py
│
├── 💼 BUSINESS LOGIC LAYER
│   └── services/
│       ├── arrondissement_service.py
│       ├── station_service.py
│       └── analytics_service.py
│
├── 🔧 UTILITY LAYER
│   └── utils/
│       ├── date_utils.py
│       ├── validators.py
│       └── formatters.py
│
├── 📦 SERIALIZATION LAYER
│   ├── serializers.py
│   └── auth_serializers.py
│
└── 🔐 AUTHENTICATION
    └── auth_views.py
```

## 🔄 MVC Pattern in Django

| Traditional MVC | Django MTV | In This Project |
|-----------------|------------|-----------------|
| **Model** | Model | `models.py` with managers |
| **View** | Template | JSON (REST API) |
| **Controller** | View | `views/` + `services/` |

## 📋 Key Changes Made

### ✅ Before → After

| Before | After |
|--------|-------|
| ❌ Single `views.py` with all logic | ✅ Separate view files by resource |
| ❌ Business logic in views | ✅ Business logic in `services/` |
| ❌ No custom managers | ✅ Custom managers in models |
| ❌ Utilities scattered | ✅ Organized `utils/` directory |
| ❌ Fat controllers | ✅ Thin controllers |

## 🎯 Usage Examples

### Using Custom Managers
```python
# Old way
stations = BikeStation.objects.filter(is_active=True)

# New way
stations = BikeStation.objects.active_stations()
```

### Using Services
```python
# In views - delegate to services
class ArrondissementViewSet(viewsets.ModelViewSet):
    def analytics(self, request, pk=None):
        arr = self.get_object()
        # Call service instead of doing logic here
        data = ArrondissementService.get_arrondissement_analytics(arr)
        return Response(ArrondissementAnalyticsSerializer(data).data)
```

### Using Utils
```python
# Import and use utilities
from analytics.utils import calculate_date_range, validate_station_id

start, end = calculate_date_range(days=30)
is_valid = validate_station_id('STATION_001')
```

## 🚀 Benefits

1. **Separation of Concerns** - Each layer has one job
2. **Testability** - Test each layer independently
3. **Reusability** - Share services across views
4. **Maintainability** - Find code easily
5. **Scalability** - Add features cleanly

## 📖 Documentation Files

- **MVC_ARCHITECTURE.md** - Complete architecture guide
- **MVC_STRUCTURE.md** - Detailed directory structure
- **QUICK_REFERENCE.md** - This file

## 🔍 Where to Add New Code

| Task | Location |
|------|----------|
| New database table | `models.py` |
| New API endpoint | `views/` |
| Complex calculation | `services/` |
| Helper function | `utils/` |
| JSON transformation | `serializers.py` |
| URL route | `urls.py` |

## ⚡ Quick Start

1. **Models** define your data
2. **Services** process your data  
3. **Views** handle requests/responses
4. **Serializers** format the JSON
5. **Utils** help everywhere

Keep it simple: **Models → Services → Views → Serializers → Response**
