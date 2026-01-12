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

## 🎯 Architecture Principles

### 1. **Feature-Based Organization**
- Code organized by feature/domain rather than technical type
- Each feature is self-contained with its own components
- Easy to locate and maintain related code

### 2. **Separation of Concerns**
- **`features/`**: Business logic and feature-specific components
- **`shared/`**: Reusable utilities, components, and hooks
- **`pages/`**: Top-level route components
- **`api/`**: External service integration

### 3. **Performance Optimizations**
- **Lazy Loading**: Dashboard components loaded on-demand
- **Dynamic CSS**: Landing page styles only loaded when needed
- **Code Splitting**: Automatic via React.lazy and Vite
- **Tree Shaking**: Unused code automatically removed

### 4. **Clean Imports**
- Barrel exports (`index.ts`) for cleaner import statements
- Consistent import paths using relative references
- Type-safe imports throughout

## 🚀 Performance Features

### Lazy Loading Strategy
```typescript
// Components loaded only when needed
const LiveDashboard = lazy(() => import('./features/dashboard/LiveDashboard'));
const MapAnalysis = lazy(() => import('./features/dashboard/MapAnalysis'));
```

### Dynamic Style Loading
Landing page Bootstrap CSS and animations loaded dynamically:
```typescript
// Only loaded for landing/auth pages
useLandingStyles(); // In LandingPage, Login, Signup
```

### Benefits:
- **Faster Initial Load**: Dashboard users don't load Bootstrap CSS
- **Reduced Bundle Size**: Separate chunks for different features
- **Better Caching**: Unchanged features stay cached

## 📦 Import Examples

### Using Barrel Exports
```typescript
// ✅ Clean - using barrel exports
import { Button, Card, Badge } from '@/shared/ui';
import { Header } from '@/shared/components';
import { LiveDashboard } from '@/features/dashboard';

// ❌ Verbose - direct imports
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
```

### Feature Organization
```typescript
// Auth features
import { VeloLogin, VeloSignup } from '@/features/auth';

// Dashboard features
import { LiveDashboard, MapAnalysis } from '@/features/dashboard';
```

## 🎨 Styling Strategy

### Tailwind CSS (Dashboard)
- Modern, utility-first CSS
- Used for dashboard components
- Optimized and tree-shaken by Vite

### Bootstrap (Landing Pages)
- Traditional landing page styling
- Loaded dynamically only when needed
- Includes animations (WOW.js) for marketing pages

## 🔧 Development Guidelines

### Adding New Features
1. Create feature directory in `features/`
2. Add components specific to that feature
3. Export via `index.ts` barrel file
4. Import in `App.tsx` or parent component

### Adding Shared Components
1. Place in `shared/components/` or `shared/ui/`
2. Export via `index.ts`
3. Use throughout the app

### Adding New Pages
1. Create page component in `pages/`
2. Connect to routing in `App.tsx`
3. Use feature components as needed

## 📊 Bundle Analysis

Optimized chunks:
- **Main**: Core app shell (~50KB gzipped)
- **Dashboard**: Lazy-loaded dashboard features
- **Charts**: Recharts library (loaded on-demand)
- **Landing**: Bootstrap + animations (loaded on-demand)

## 🔄 Migration Notes

### Old Structure → New Structure
```
components/VeloLandingPage.tsx → pages/LandingPage.tsx
components/VeloLogin.tsx → features/auth/Login.tsx
components/LiveDashboard.tsx → features/dashboard/LiveDashboard.tsx
components/ui/ → shared/ui/
components/Header.tsx → shared/components/Header.tsx
```

### Removed Files
- ❌ `Analytics.tsx` (unused)
- ❌ `Reports.tsx` (unused)
- ❌ `Sidebar.tsx` (unused)
- ❌ `figma/` folder (unused)
- ❌ Unused JS libraries (glightbox, tiny-slider, etc.)

## 🎯 Best Practices

1. **Keep features isolated**: Each feature should be independent
2. **Use barrel exports**: Simplify imports with `index.ts` files
3. **Lazy load when possible**: Use React.lazy for route-level components
4. **Share wisely**: Only move to `shared/` when used in 2+ features
5. **Type everything**: Maintain TypeScript types for all components

## 🚦 Performance Checklist

- ✅ Lazy loading for dashboard components
- ✅ Dynamic CSS loading for landing pages
- ✅ Code splitting by feature
- ✅ Tree shaking enabled
- ✅ Optimized asset loading
- ✅ Memoized components where beneficial
- ✅ Removed unused dependencies

---

**Built with**: React 18, TypeScript, Vite, Tailwind CSS
