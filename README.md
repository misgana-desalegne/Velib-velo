
  # projet_velib

  Velo station analysis

  ## Running the code
        Run `npm i` to install the dependencies.
        Run `npm run dev` to start the development server
        pip install requirements.txt
        python manage.py runserver
# Architecture 
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
