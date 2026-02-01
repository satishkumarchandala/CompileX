# Gamified Learning Platform for Compiler Design Course

Full-stack web application implementing a gamified learning experience with XP points, badges, levels, contests, and leaderboards.

## Tech Stack

- **Frontend**: React (Vite), React Router, Axios
- **Backend**: Flask (REST API), JWT Auth
- **Database**: MongoDB

## Project Structure

```
Mini_Project/
├─ backend/
│  ├─ src/
│  │  ├─ routes/          # API route blueprints
│  │  ├─ services/        # PDF parsing, question generation, seeding
│  │  ├─ auth.py
│  │  ├─ db.py
│  │  └─ models.py
│  ├─ app.py              # Flask app entry
│  ├─ requirements.txt
│  └─ .env
└─ frontend/
   ├─ src/
   │  ├─ components/
   │  ├─ context/
   │  ├─ pages/
   │  ├─ api.js
   │  ├─ App.jsx
   │  └─ main.jsx
   ├─ package.json
   └─ vite.config.js
```

## Prerequisites

1. **Python 3.9+** (with pip)
2. **Node.js 18+** (with npm)
3. **MongoDB** running on `localhost:27017` (or update `.env`)

## Backend Setup (Windows PowerShell)

```powershell
cd e:\Mini_Project\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Update `.env` if needed:

```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=compiler_gamified
JWT_SECRET=devsecret
ALLOW_ADMIN_REG=true
PORT=5000
```

Start backend server:

```powershell
python app.py
```

Backend runs at `http://localhost:5000`.

## Frontend Setup (Windows PowerShell)

Open new terminal:

```powershell
cd e:\Mini_Project\frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` (proxies `/api` to backend).

## Usage

### Student Flow

1. Register as `student` role at `/register`
2. Login and explore modules
3. Watch videos, read context
4. Take quizzes to earn XP and badges
5. View profile for level, badges, and progress
6. Join contests and compete on leaderboard

### Admin Flow

1. Register as `admin` role (if `ALLOW_ADMIN_REG=true`)
2. Access admin dashboard at `/admin`
3. Create modules, add questions manually
4. Upload PDF to auto-generate MCQs
5. Create contests with rules (time, negative marking, etc.)

## Features Implemented

✅ JWT-based authentication  
✅ Role-based access (student/admin)  
✅ 5 pre-seeded modules (Compiler Design course)  
✅ Quiz system with score & XP calculation  
✅ XP and level progression  
✅ Badge awarding (Perfect Score, Quick Learner, Module Master, Contest Winner)  
✅ Contest participation and leaderboard ranking  
✅ PDF upload → text extraction → naive MCQ generation  
✅ Admin CRUD for modules, questions, contests  

## API Endpoints

| Method | Endpoint                             | Description                   |
|--------|--------------------------------------|-------------------------------|
| POST   | `/api/auth/register`                 | User registration             |
| POST   | `/api/auth/login`                    | User login (returns JWT)      |
| GET    | `/api/courses`                       | List all courses              |
| GET    | `/api/modules/:id`                   | Get module details            |
| GET    | `/api/modules/:id/questions`         | Get quiz questions            |
| POST   | `/api/modules/:id/submit`            | Submit quiz answers           |
| GET    | `/api/student/profile`               | Get student profile           |
| GET    | `/api/student/progress`              | Get quiz attempts & XP        |
| GET    | `/api/contests`                      | List contests                 |
| POST   | `/api/contests/join/:id`             | Join contest                  |
| POST   | `/api/contests/submit/:id`           | Submit contest answers        |
| GET    | `/api/contests/leaderboard/:id`      | Contest leaderboard           |
| POST   | `/api/admin/module/create`           | Create module (admin)         |
| POST   | `/api/admin/question/create`         | Create question (admin)       |
| POST   | `/api/admin/pdf/upload`              | Upload PDF & generate MCQs    |
| POST   | `/api/admin/contest/create`          | Create contest (admin)        |

## Database Collections

- `users` – name, email, passwordHash, role, xp, level, badges
- `courses` – title, description, modules
- `modules` – courseId, moduleNo, title, context, videoLinks
- `questions` – moduleId, question, options, correctAnswer, difficulty, source
- `quizAttempts` – studentId, moduleId, score, total, xpEarned, timeTaken
- `contests` – title, moduleIds, startTime, endTime, durationMinutes, negativeMarking
- `leaderboard` – contestId, studentId, score, timeTaken, rank

## XP & Level System

| Level | XP Range |
|-------|----------|
| 1     | 0–99     |
| 2     | 100–199  |
| 3     | 200–349  |
| 4     | 350–499  |
| 5     | 500–699  |
| 6+    | 700+     |

**Badges**:
- **Perfect Score**: 100% on a quiz
- **Quick Learner**: ≤10s per question
- **Module Master**: All modules ≥80%
- **Contest Winner**: Rank #1 in a contest

## Next Steps / Enhancements

- Improve PDF MCQ generation with NLP (spaCy, GPT)
- Real-time contest timer & live leaderboard
- Email notifications for contest announcements
- Dark mode UI
- Detailed analytics dashboard for admin
- Pagination for large question banks
- Unit & integration tests

## License

MIT
