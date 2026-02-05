# Setup script for Data Analysis Dashboard with Django backend (Windows)

Write-Host "Setting up Data Analysis Dashboard..." -ForegroundColor Green

# Create Python virtual environment
Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
Set-Location backend
python -m venv venv

# Activate virtual environment (Windows)
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Run Django migrations
Write-Host "Running database migrations..." -ForegroundColor Yellow
python manage.py makemigrations
python manage.py migrate

# Populate database with sample data
Write-Host "Populating database with sample data..." -ForegroundColor Yellow
python manage.py populate_data

Write-Host ""
Write-Host "Backend setup complete!" -ForegroundColor Green
Write-Host ""

# Return to root directory
Set-Location ..

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
Write-Host "Or use: npm run start:all" -ForegroundColor Cyan
