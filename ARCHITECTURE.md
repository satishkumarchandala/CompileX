# System Architecture Diagram

## Complete System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │   Web Browser    │         │  Mobile Device   │             │
│  │  (localhost:5173)│         │   (Expo Go)      │             │
│  │                  │         │                  │             │
│  │  React + Vite    │         │  React Native    │             │
│  │  Material UI     │         │  + Expo          │             │
│  └────────┬─────────┘         └────────┬─────────┘             │
│           │                            │                        │
└───────────┼────────────────────────────┼────────────────────────┘
            │                            │
            │    HTTP Requests           │
            │    (JWT Token)             │
            │                            │
            └────────────┬───────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API SERVER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Flask Application (localhost:5000)                              │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  API Routes                                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ /api/auth    │  │ /api/modules │  │ /api/contests│  │   │
│  │  │ - register   │  │ - get all    │  │ - list       │  │   │
│  │  │ - login      │  │ - get one    │  │ - join       │  │   │
│  │  └──────────────┘  │ - questions  │  │ - submit     │  │   │
│  │                    │ - submit quiz│  │ - leaderboard│  │   │
│  │  ┌──────────────┐  └──────────────┘  └──────────────┘  │   │
│  │  │ /api/student │                                       │   │
│  │  │ - profile    │  ┌──────────────┐                    │   │
│  │  │ - progress   │  │ /api/admin   │                    │   │
│  │  └──────────────┘  │ - stats      │                    │   │
│  │                    │ - create     │                    │   │
│  │                    │ - update     │                    │   │
│  │                    │ - delete     │                    │   │
│  │                    └──────────────┘                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Middleware & Services                                   │   │
│  │  - JWT Authentication                                    │   │
│  │  - Password Hashing (bcrypt)                            │   │
│  │  - PDF Text Extraction                                  │   │
│  │  - Question Generation                                  │   │
│  │  - XP & Level Calculation                               │   │
│  │  - Badge Award System                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            │ MongoDB Driver
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  MongoDB (localhost:27017)                                       │
│  Database: compiler_gamified                                     │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   users      │  │   modules    │  │  questions   │          │
│  │              │  │              │  │              │          │
│  │ - _id        │  │ - _id        │  │ - _id        │          │
│  │ - name       │  │ - courseId   │  │ - moduleId   │          │
│  │ - email      │  │ - moduleNo   │  │ - question   │          │
│  │ - password   │  │ - title      │  │ - options[]  │          │
│  │ - role       │  │ - context    │  │ - correct    │          │
│  │ - xp         │  │ - videos[]   │  │ - difficulty │          │
│  │ - level      │  └──────────────┘  └──────────────┘          │
│  │ - badges[]   │                                               │
│  │ - completed[]│  ┌──────────────┐  ┌──────────────┐          │
│  └──────────────┘  │  contests    │  │ quizAttempts │          │
│                    │              │  │              │          │
│                    │ - _id        │  │ - _id        │          │
│                    │ - title      │  │ - studentId  │          │
│                    │ - moduleIds[]│  │ - moduleId   │          │
│                    │ - duration   │  │ - score      │          │
│                    │ - marking    │  │ - xpEarned   │          │
│                    └──────────────┘  │ - timeTaken  │          │
│                                      └──────────────┘          │
│                    ┌──────────────┐                             │
│                    │ leaderboard  │                             │
│                    │              │                             │
│                    │ - _id        │                             │
│                    │ - contestId  │                             │
│                    │ - studentId  │                             │
│                    │ - score      │                             │
│                    │ - rank       │                             │
│                    └──────────────┘                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Examples

### 1. User Registration Flow

```
Mobile/Web App                Backend                    Database
     │                          │                          │
     │  POST /api/auth/register │                          │
     ├─────────────────────────>│                          │
     │  {name, email, password} │                          │
     │                          │                          │
     │                          │  Hash password (bcrypt)  │
     │                          │                          │
     │                          │  Insert user             │
     │                          ├─────────────────────────>│
     │                          │                          │
     │                          │  User created            │
     │                          │<─────────────────────────┤
     │                          │                          │
     │                          │  Generate JWT token      │
     │                          │                          │
     │  {token, role}           │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
     │  Store token (SecureStore)                          │
     │                          │                          │
```

### 2. Quiz Submission Flow

```
Mobile/Web App                Backend                    Database
     │                          │                          │
     │  POST /api/modules/:id/submit                       │
     ├─────────────────────────>│                          │
     │  {studentId, answers[]}  │                          │
     │                          │                          │
     │                          │  Get questions           │
     │                          ├─────────────────────────>│
     │                          │<─────────────────────────┤
     │                          │                          │
     │                          │  Calculate score         │
     │                          │  Calculate XP            │
     │                          │  Check for badges        │
     │                          │                          │
     │                          │  Update user XP/level    │
     │                          ├─────────────────────────>│
     │                          │                          │
     │                          │  Save quiz attempt       │
     │                          ├─────────────────────────>│
     │                          │                          │
     │  {score, xpEarned, level}│                          │
     │<─────────────────────────┤                          │
     │                          │                          │
     │  Update UI with results  │                          │
     │                          │                          │
```

### 3. Module Completion Tracking

```
Mobile/Web App                Backend                    Database
     │                          │                          │
     │  Quiz score >= 70%       │                          │
     │                          │                          │
     │                          │  Add to completedModules │
     │                          ├─────────────────────────>│
     │                          │                          │
     │  GET /api/student/profile│                          │
     ├─────────────────────────>│                          │
     │                          │  Get user data           │
     │                          ├─────────────────────────>│
     │                          │<─────────────────────────┤
     │                          │                          │
     │  {completedModules: [...]}                          │
     │<─────────────────────────┤                          │
     │                          │                          │
     │  Show green badge ✓      │                          │
     │                          │                          │
```

## Technology Stack Details

### Frontend Web
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.0.0
- **UI Library**: Material UI 5.15.0
- **Routing**: React Router DOM 6.28.0
- **HTTP Client**: Axios 1.7.7
- **Auth**: JWT Decode 4.0.0

### Mobile App
- **Framework**: React Native (via Expo)
- **Navigation**: React Navigation 6.x
  - Native Stack Navigator
  - Bottom Tabs Navigator
- **HTTP Client**: Axios
- **Secure Storage**: Expo SecureStore
- **Auth**: JWT Decode

### Backend
- **Framework**: Flask 3.0.0
- **Database Driver**: PyMongo 4.7.2
- **Auth**: PyJWT 2.9.0
- **Password**: Passlib 1.7.4 + Bcrypt 4.1.2
- **PDF Processing**: pdfminer.six 20231228
- **CORS**: Flask-CORS 4.0.0

### Database
- **Type**: NoSQL Document Database
- **Engine**: MongoDB
- **Collections**: 6 (users, modules, questions, contests, quizAttempts, leaderboard)

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Layer 1: Transport Security                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  - HTTPS (in production)                               │    │
│  │  - CORS configuration                                  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Layer 2: Authentication                                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  - JWT tokens (60 min expiry)                          │    │
│  │  - Secure token storage (SecureStore on mobile)        │    │
│  │  - Token validation on each request                    │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Layer 3: Password Security                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  - Bcrypt hashing (cost factor 12)                     │    │
│  │  - No plain text storage                               │    │
│  │  - Password verification on login                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Layer 4: Input Validation                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  - Required field checks                               │    │
│  │  - ObjectId validation                                 │    │
│  │  - Type checking                                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Layer 5: Authorization                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  - Role-based access (student/admin)                   │    │
│  │  - Admin-only routes protected                         │    │
│  │  - User-specific data isolation                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture (Future)

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRODUCTION SETUP                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Frontend Web                                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Vercel / Netlify / GitHub Pages                       │    │
│  │  - Static build (npm run build)                        │    │
│  │  - CDN distribution                                    │    │
│  │  - HTTPS enabled                                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Backend API                                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Heroku / AWS / DigitalOcean                           │    │
│  │  - Gunicorn WSGI server                                │    │
│  │  - Environment variables                               │    │
│  │  - HTTPS/SSL certificate                               │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Database                                                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  MongoDB Atlas (Cloud)                                 │    │
│  │  - Managed service                                     │    │
│  │  - Automatic backups                                   │    │
│  │  - Scalable                                            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Mobile App                                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  App Store / Google Play                               │    │
│  │  - EAS Build (Expo)                                    │    │
│  │  - Production APK/IPA                                  │    │
│  │  - Code signing                                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

**This architecture provides:**
- ✅ Separation of concerns
- ✅ Scalability
- ✅ Security
- ✅ Cross-platform support
- ✅ Real-time data synchronization
- ✅ Offline token persistence
