
# projet_velib
Projet_velib est une plateforme d'analyse complète du système de vélos en libre-service Vélib' à Paris. Voici son fonctionnement :
## But
Analyse les données en temps réel et historiques des stations de vélos en libre-service afin de fournir des informations sur les habitudes d'utilisation, les tendances de disponibilité et les performances des stations dans les arrondissements parisiens.

## Tech Stack
    Backend : Django (Python) avec API REST
    Frontend : React + TypeScript (Vite)
    Base de données : SQLite
    Framework d’interface utilisateur : Composants Radix UI avec Tailwind CSS
## Core Features
    Pipeline ETL : Extraction automatique des données de l’API Vélib, nettoyage/transformation et chargement dans la base de données.
    Tableau de bord en direct : Visualisation en temps réel de l’état des stations de vélos.
    Analyses : Analyse statistique de la demande, de la disponibilité et des habitudes d’utilisation des vélos par arrondissement.
    Planificateur : Automatisation des tâches en arrière-plan pour la collecte de données.
    Authentification : Gestion des comptes utilisateurs et des équipes.
    Cartes et visualisations : Représentation géographique des stations et des tendances des données.
## Key Components
    Application d'analyse : logique métier principale pour le traitement et l'analyse des données
    Tableau de bord frontal : interface utilisateur interactive pour la visualisation des analyses et des données en temps réel
    Services : analyses avancées, pipeline ETL, analyse de quartier
    Système de développement : Vite pour un développement frontend rapide, Django pour l'API backend
## Architecture 
    Projet_velib/
    ├── .git/
    ├── .gitignore
    ├── node_modules/
    ├── build/
    │   ├── index.html
    │   └── assets/
    │       ├── *.js (compiled JS files)
    │       └── *.css (compiled CSS files)
    ├── apps/
    │   └── analytics/
    │       ├── migrations/
    │       ├── management/
    │       ├── services/
    │       │   ├── etl_pipeline.py
    │       │   ├── analytics_service.py
    │       │   ├── advanced_analytics_service.py
    │       │   └── arrondissement_service.py
    │       ├── utils/
    │       ├── views/
    │       ├── __init__.py
    │       ├── admin.py
    │       ├── apps.py
    │       ├── auth_serializers.py
    │       ├── auth_views.py
    │       ├── models.py
    │       ├── serializers.py
    │       ├── urls.py
    │       └── __pycache__/
    ├── frontend/
    │   ├── api/
    │   │   ├── auth.ts
    │   │   └── config.ts
    │   ├── assets/
    │   │   ├── fonts/
    │   │   ├── images/
    │   │   └── js/
    │   ├── features/
    │   │   ├── auth/
    │   │   ├── dashboard/
    │   │   └── teams/
    │   ├── pages/
    │   │   ├── Dashboard.tsx
    │   │   ├── LandingPage.tsx
    │   │   ├── LoginPage_Farial.tsx
    │   │   ├── RegisterPage_Farial.tsx
    │   │   ├── TeamsPage.tsx
    │   │   └── VelibRealtimePage.tsx
    │   ├── shared/
    │   │   ├── components/
    │   │   ├── hooks/
    │   │   ├── types/
    │   │   └── ui/
    │   ├── App.tsx
    │   ├── index.css
    │   ├── main.tsx
    │   └── README.md
    ├── projet_velib/ (Django config)
    │   ├── __init__.py
    │   ├── asgi.py
    │   ├── settings.py
    │   ├── urls.py
    │   ├── wsgi.py
    │   └── __pycache__/
    ├── manage.py
    ├── package.json
    ├── package-lock.json
    ├── requirements.txt
    ├── db.sqlite3
    ├── vite.config.ts
    ├── ETL_SCHEDULER_SETTINGS.py
    ├── run_etl.py
    ├── generate_analytics.py
    ├── verify_data.py
    ├── setup.sh / setup.bat / setup.ps1
    └── Documentation files (*.md, *.html)
## Pour essayer

        Copy `.env.example` to `.env`
        Add your API keys to `.env`
        
        Run `npm i` to install the dependencies.
        Run `npm run dev` to start the React dev server
        
        pip install requirements.txt to install required libraries for the backend
        python manage.py runserver to start the backend server
