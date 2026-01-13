# Frontend Architecture

Modern, organized frontend structure for ParisCycle Data Analysis Dashboard.

## 📁 Directory Structure

```
frontend/
├── api/                    # API configuration and services
│   ├── auth.ts            # Authentication API calls
│   └── config.ts          # API configuration
├── assets/                 # Static assets
│   ├── fonts/             # Font files
│   ├── images/            # Images and icons
│   │   ├── about/
│   │   ├── clients/
│   │   ├── hero/
│   │   └── logo/
│   └── js/                # External JavaScript libraries
│       ├── bootstrap-5.0.0-beta1.min.js
│       ├── main.js
│       └── wow.min.js
├── features/              # Feature-based modules
│   ├── auth/             # Authentication features
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   └── index.ts
│   └── dashboard/        # Dashboard features
│       ├── ArrondissementAnalysis.tsx
│       ├── DataUpload.tsx
│       ├── LiveDashboard.tsx
│       ├── MapAnalysis.tsx
│       ├── StationBehavior.tsx
│       └── index.ts
├── pages/                 # Page-level components
│   ├── Dashboard.tsx
│   └── LandingPage.tsx
├── shared/               # Shared/reusable code
│   ├── components/       # Shared components
│   │   ├── Header.tsx
│   │   ├── Preloader.tsx
│   │   └── index.ts
│   ├── hooks/           # Custom React hooks
│   │   └── useLandingStyles.ts
│   └── ui/              # UI component library
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── progress.tsx
│       ├── select.tsx
│       └── index.ts
├── App.tsx               # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles (Tailwind)
```
