# Deployment Architecture Guide

## Overview
- **Frontend**: GitHub Pages (Static hosting)
- **Backend**: Local Server or Cloud (Django API)
- **Communication**: REST API over CORS

---

## Frontend Deployment (GitHub Pages)

### Prerequisites
1. GitHub account
2. Repository with this code

### Step 1: Create .env file for production

Create `.env.production.local` in the root:

```
VITE_API_URL=https://your-backend-domain.com/api
```

### Step 2: Build the frontend

```bash
npm run build
```

This creates a `build/` folder with static files.

### Step 3: Deploy to GitHub Pages

**Option A: Using GitHub CLI**

```bash
npm install -g gh-pages
gh-pages -d build
```

**Option B: Manual Push**

1. Push the `build/` folder to a `gh-pages` branch
2. In GitHub repo settings → Pages → set source to `gh-pages` branch
3. Your site will be available at: `https://<username>.github.io/Data-Analysis-Dashboard/`

### Step 4: Update Vite Config

The `vite.config.ts` already has:
```typescript
base: '/Data-Analysis-Dashboard/',
```

This ensures correct routing for GitHub Pages subdirectory.

---

## Backend Deployment (Local or Cloud)

### Option 1: Local Server (Development)

**Start Django locally:**

```bash
python manage.py runserver 0.0.0.0:8000
```

**Frontend .env for local:**
```
VITE_API_URL=http://localhost:8000/api
```

### Option 2: Cloud Deployment

#### A. Heroku

**Step 1: Install Heroku CLI**

```bash
npm install -g heroku
heroku login
```

**Step 2: Create Procfile**

Create `Procfile` in project root:
```
web: gunicorn projet_velib.wsgi --log-file -
```

**Step 3: Create requirements.txt**

```bash
pip freeze > requirements.txt
```

Add these if missing:
```
gunicorn
whitenoise
django-cors-headers
```

**Step 4: Deploy**

```bash
heroku create your-app-name
git push heroku main
```

**Step 5: Update Frontend .env**

```
VITE_API_URL=https://your-app-name.herokuapp.com/api
```

#### B. DigitalOcean (Recommended - $5/month)

1. Create a droplet (Ubuntu 22.04)
2. SSH into droplet
3. Install Python, Django, Gunicorn, Nginx
4. Clone your repo
5. Run Django with Gunicorn + Nginx reverse proxy

#### C. AWS

1. Use EC2 instance or Elastic Beanstalk
2. Configure security groups to allow CORS from GitHub Pages URL
3. Use RDS for database (if needed)

---

## CORS Configuration (Critical!)

Django backend MUST allow requests from GitHub Pages frontend.

### In `projet_velib/settings.py`:

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    # ... other apps ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ... other middleware ...
]

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "https://<your-username>.github.io",
    "http://localhost:3000",
    "http://localhost:5173",  # Vite dev server
]

# For production, be specific!
if not DEBUG:
    CORS_ALLOWED_ORIGINS = [
        "https://<your-username>.github.io",
    ]
```

### Install CORS package:

```bash
pip install django-cors-headers
```

---

## Environment Variables by Stage

### Local Development
```
# Frontend (.env.local)
VITE_API_URL=http://localhost:8000/api

# Backend (.env)
DEBUG=True
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Production (GitHub Pages + Cloud)
```
# Frontend (.env.production.local)
VITE_API_URL=https://your-backend.com/api

# Backend
DEBUG=False
CORS_ALLOWED_ORIGINS=https://your-username.github.io
```

---

## Deployment Checklist

### Frontend
- [ ] Build: `npm run build`
- [ ] Test build locally: `npm run preview`
- [ ] Push to `gh-pages` branch
- [ ] Update `VITE_API_URL` for production
- [ ] Verify GitHub Pages URL works

### Backend
- [ ] Configure CORS in Django settings
- [ ] Set `DEBUG=False` in production
- [ ] Configure allowed origins
- [ ] Deploy to Heroku/Cloud
- [ ] Test API endpoints
- [ ] Verify CORS headers in responses

---

## Troubleshooting

### "CORS policy blocked request"
- Check `CORS_ALLOWED_ORIGINS` in Django settings
- Verify it includes exact GitHub Pages URL
- Check response headers: `Access-Control-Allow-Origin`

### "Frontend 404 - Cannot find resource"
- Ensure `base` in `vite.config.ts` matches subdirectory
- Check GitHub Pages URL structure

### "Backend 500 error"
- Check Django logs: `heroku logs --tail` (Heroku)
- Verify database migrations: `python manage.py migrate`
- Check environment variables deployed correctly

---

## Monitoring & Updates

### GitHub Pages
- Automatic deployments when pushing to `gh-pages`
- No server to manage

### Backend (Heroku Example)
```bash
# View logs
heroku logs --tail

# Scale dynos
heroku ps:scale web=2

# Deploy updates
git push heroku main
```

---

## Summary

| Component | Hosting | Cost | Effort |
|-----------|---------|------|--------|
| Frontend | GitHub Pages | Free | Easy |
| Backend (Local) | Your machine | Free | Medium |
| Backend (Heroku) | Heroku | $7/month | Easy |
| Backend (DigitalOcean) | DigitalOcean | $5/month | Medium |
| Backend (AWS) | AWS | Variable | Hard |

**Recommended Setup:**
- Frontend: GitHub Pages (free)
- Backend: DigitalOcean $5/month Droplet (reliable, affordable)

---

## Next Steps

1. Update Django CORS settings
2. Create `.env.production.local` with backend URL
3. Test locally with `npm run preview`
4. Set up GitHub Pages deployment
5. Deploy backend to chosen platform
6. Update frontend .env with backend URL
7. Deploy frontend to GitHub Pages
8. Test end-to-end

