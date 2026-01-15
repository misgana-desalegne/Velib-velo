# Setup script for Data Analysis Dashboard with Django backend (Windows)

$ErrorActionPreference = 'Stop'

Write-Host 'Setting up Data Analysis Dashboard...' -ForegroundColor Green

Write-Host 'Creating Python virtual environment...' -ForegroundColor Yellow
python -m venv venv

Write-Host 'Installing Python dependencies...' -ForegroundColor Yellow
.\venv\Scripts\python.exe -m pip install -r requirements.txt

Write-Host 'Running database migrations...' -ForegroundColor Yellow
.\venv\Scripts\python.exe manage.py makemigrations
.\venv\Scripts\python.exe manage.py migrate

Write-Host 'Populating database with sample data...' -ForegroundColor Yellow
.\venv\Scripts\python.exe manage.py populate_data

Write-Host
Write-Host 'Backend setup complete!' -ForegroundColor Green

Write-Host 'Installing frontend dependencies...' -ForegroundColor Yellow
$npmCmd = Join-Path $env:ProgramFiles 'nodejs\npm.cmd'
if (Test-Path $npmCmd) {
  & $npmCmd install
} else {
  npm install
}

Write-Host
Write-Host 'Setup complete! You can now run the application.' -ForegroundColor Green
Write-Host
Write-Host 'To start the application:' -ForegroundColor Cyan
Write-Host '1) Django backend: .\venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000' -ForegroundColor White
Write-Host '2) React/Vite frontend: npm run dev' -ForegroundColor White
Write-Host
Write-Host 'Or run both together: npm run start:all' -ForegroundColor Cyan
Write-Host 'If PowerShell blocks npm.ps1: use npm.cmd (C:\Program Files\nodejs\npm.cmd run start:all)' -ForegroundColor DarkGray
