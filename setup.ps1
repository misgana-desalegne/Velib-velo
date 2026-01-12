# Setup script for Data Analysis Dashboard with Django backend (Windows)

Write-Host "Setting up Data Analysis Dashboard..." -ForegroundColor Green

# Create Python virtual environment
Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
python -m venv venv

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
.\venv\Scripts\python.exe -m pip install -r requirements.txt

# Run Django migrations
Write-Host "Running database migrations..." -ForegroundColor Yellow
.\venv\Scripts\python.exe manage.py makemigrations
.\venv\Scripts\python.exe manage.py migrate

# Populate database with sample data
Write-Host "Populating database with sample data..." -ForegroundColor Yellow
.\venv\Scripts\python.exe manage.py populate_data

Write-Host ""
Write-Host "Backend setup complete!" -ForegroundColor Green
Write-Host ""

# Install frontend dependencies (if not already done)
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Setup complete! You can now run the application." -ForegroundColor Green
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Cyan
Write-Host "1. Start Django backend: cd backend && python manage.py runserver" -ForegroundColor White
Write-Host "2. Start React frontend: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Or use: npm run start:allolor Cyan
