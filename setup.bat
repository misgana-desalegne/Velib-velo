@echo off
echo Setting up Data Analysis Dashboard...
echo.

REM Create Python virtual environment
echo Creating Python virtual environment...
cd backend
python -m venv venv

REM Activate virtual environment (Windows)
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install Python dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

REM Run Django migrations
echo Running database migrations...
python manage.py makemigrations
python manage.py migrate

REM Populate database with sample data
echo Populating database with sample data...
python manage.py populate_data

echo.
echo Backend setup complete!
echo.

REM Return to root directory
cd ..

REM Install frontend dependencies
echo Installing frontend dependencies...
call npm install

echo.
echo Setup complete! You can now run the application.
echo.
echo To start the application:
echo 1. Start Django backend: cd backend ^&^& python manage.py runserver
echo 2. Start React frontend: npm run dev
echo.
echo Or use: npm run start:all
pause
