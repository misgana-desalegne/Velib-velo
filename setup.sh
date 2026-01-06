#!/bin/bash

# Setup script for Data Analysis Dashboard with Django backend

echo "Setting up Data Analysis Dashboard..."

# Create Python virtual environment
echo "Creating Python virtual environment..."
cd backend
python -m venv venv

# Activate virtual environment (Windows)
echo "Activating virtual environment..."
source venv/Scripts/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Run Django migrations
echo "Running database migrations..."
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional - commented out for automation)
# echo "Creating Django superuser..."
# python manage.py createsuperuser

# Populate database with sample data
echo "Populating database with sample data..."
python manage.py populate_data

echo ""
echo "Backend setup complete!"
echo ""

# Return to root directory
cd ..

# Install frontend dependencies (if not already done)
echo "Installing frontend dependencies..."
npm install

echo ""
echo "Setup complete! You can now run the application."
echo ""
echo "To start the application:"
echo "1. Start Django backend: cd backend && python manage.py runserver"
echo "2. Start React frontend: npm run dev"
echo ""
echo "Or use the run scripts provided."
