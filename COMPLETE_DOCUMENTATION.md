# Complete Project Documentation

## 📋 Project Overview

**Compiler Learning Platform** - A full-stack gamified learning platform for compiler design education.

### Components

1. **Backend** (Flask + MongoDB)
2. **Frontend Web** (React + Vite + Material UI)
3. **Mobile App** (React Native + Expo) ✨ NEW

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      MongoDB Database                    │
│  (Users, Modules, Questions, Contests, Leaderboard)     │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Flask Backend API                     │
│  Port 5000 - REST API with JWT Authentication          │
│  Routes: /api/auth, /api/modules, /api/contests, etc.  │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
    ┌───────────────────┐   ┌───────────────────┐
    │   Web Frontend    │   │   Mobile App      │
    │   React + Vite    │   │  React Native     │
    │   Port 5173       │   │  Expo             │
    └───────────────────┘   └───────────────────┘
```

---

## 🚀 Complete Setup Guide

### Prerequisites

- **Python 3.8+** with pip
- **Node.js 14+** with npm
- **MongoDB** (local or cloud)
- **Git**
- **Android Studio** or **Xcode** (for mobile development)

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd Mini_Project
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "MONGODB_URI=mongodb://localhost:27017" > .env
echo "MONGODB_DB=compiler_gamified" >> .env
echo "JWT_SECRET=your-secret-key-here" >> .env
echo "PORT=5000" >> .env

# Start server
python app.py
```

Backend will run at: `http://localhost:5000`

### 3. Web Frontend Setup

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Web app will run at: `http://localhost:5173`

### 4. Mobile App Setup

```bash
# Open new terminal
cd mobile

# Install dependencies
npm install

# Configure backend URL in src/api/client.js
# See QUICKSTART.md for details

# Start Expo
npm start
```

---

## 📱 Running All Components

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
python app.py
```

**Terminal 2 - Web Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Mobile App:**
```bash
cd mobile
npm start
```

### Access Points

- **Backend API**: http://localhost:5000/api
- **Web App**: http://localhost:5173
- **Mobile App**: Expo Dev Tools (scan QR code)

---

## 🔑 Key Features

### Backend Features

✅ JWT Authentication
✅ User Management (Students & Admins)
✅ Module CRUD Operations
✅ Question Generation from PDF
✅ Quiz Submission & Scoring
✅ XP & Level System
✅ Badge Awards
✅ Contest Management
✅ Leaderboard System
✅ Real-time Stats

### Web Frontend Features

✅ Responsive Design
✅ Material UI Components
✅ Student Dashboard
✅ Admin Dashboard
✅ Module Explorer
✅ Interactive Quizzes
✅ Profile Management
✅ Contest Participation
✅ Leaderboard Display
✅ Auto-refresh on visibility change

### Mobile App Features

✅ Native Mobile Experience
✅ Bottom Tab Navigation
✅ Secure Token Storage
✅ Pull-to-Refresh
✅ Offline Token Persistence
✅ Quiz Interface
✅ Profile Stats
✅ Contest Listing
✅ Module Learning
✅ Cross-platform (iOS & Android)

---

## 🗄️ Database Schema

### Collections

**users**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  passwordHash: String,
  role: String, // 'student' or 'admin'
  xp: Number,
  level: Number,
  badges: [String],
  completedModules: [String], // Module IDs
  createdAt: Date
}
```

**modules**
```javascript
{
  _id: ObjectId,
  courseId: ObjectId,
  moduleNo: Number,
  title: String,
  context: String,
  videoLinks: [String]
}
```

**questions**
```javascript
{
  _id: ObjectId,
  moduleId: ObjectId,
  question: String,
  options: [String],
  correctAnswer: Number,
  difficulty: String,
  source: String
}
```

**contests**
```javascript
{
  _id: ObjectId,
  title: String,
  moduleIds: [ObjectId],
  startTime: String,
  endTime: String,
  durationMinutes: Number,
  marksPerQuestion: Number,
  negativeMarking: Number,
  tieBreak: String
}
```

**quizAttempts**
```javascript
{
  _id: ObjectId,
  studentId: ObjectId,
  moduleId: ObjectId,
  score: Number,
  total: Number,
  xpEarned: Number,
  timeTaken: Number,
  attemptedAt: Date
}
```

**leaderboard**
```javascript
{
  _id: ObjectId,
  contestId: ObjectId,
  studentId: ObjectId,
  score: Number,
  timeTaken: Number,
  rank: Number
}
```

---

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Modules
- `GET /api/modules` - Get all modules
- `GET /api/modules/:id` - Get module by ID
- `GET /api/modules/:id/questions` - Get module questions

### Quizzes
- `POST /api/modules/:id/submit` - Submit quiz answers

### Student
- `GET /api/student/profile?studentId=:id` - Get student profile
- `GET /api/student/progress?studentId=:id` - Get student progress

### Contests
- `GET /api/contests` - Get all contests
- `GET /api/contests/:id/questions` - Get contest questions
- `POST /api/contests/join/:id` - Join contest
- `POST /api/contests/submit/:id` - Submit contest
- `GET /api/contests/leaderboard/:id` - Get leaderboard

### Admin
- `GET /api/admin/stats` - Get dashboard stats
- `POST /api/admin/module/create` - Create module
- `PUT /api/admin/module/update/:id` - Update module
- `DELETE /api/admin/module/delete/:id` - Delete module
- `POST /api/admin/question/create` - Create question
- `POST /api/admin/contest/create` - Create contest
- `PUT /api/admin/contest/update/:id` - Update contest
- `DELETE /api/admin/contest/delete/:id` - Delete contest

---

## 🎮 Gamification System

### XP Points
- **Quiz Completion**: 5 XP per correct answer
- **Perfect Score**: Bonus badge
- **Quick Completion**: Time-based badge

### Levels
```javascript
Level 1: 0-99 XP
Level 2: 100-249 XP
Level 3: 250-499 XP
Level 4: 500-999 XP
Level 5: 1000+ XP
```

### Badges
- 🏆 **Perfect Score**: 100% on any quiz
- ⚡ **Quick Learner**: Complete quiz in <10s per question
- 🎓 **Module Master**: 80%+ on all modules
- 👑 **Contest Winner**: Rank #1 in any contest

### Module Completion
- **Threshold**: 70% score required
- **Tracking**: Stored in user's `completedModules` array
- **Visual**: Green badge on module cards

---

## 🧪 Testing Guide

### Backend Testing

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123"}'
```

### Web Frontend Testing

1. Register new student account
2. Login with credentials
3. Navigate to Explore page
4. Select a module
5. Take quiz
6. Check profile for updated stats
7. View contests
8. Test admin features (if admin account)

### Mobile App Testing

1. Configure BASE_URL
2. Start app on emulator/device
3. Register/Login
4. Test all bottom tabs
5. Take a quiz
6. Pull to refresh on each screen
7. Test navigation flow

---

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Failed**
```bash
# Check if MongoDB is running
mongosh
# Or start MongoDB service
sudo systemctl start mongod
```

**Port 5000 Already in Use**
```bash
# Find process using port 5000
# Windows:
netstat -ano | findstr :5000
# Mac/Linux:
lsof -i :5000

# Kill the process or change PORT in .env
```

### Frontend Issues

**Module Not Found**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Proxy Not Working**
- Check `vite.config.js` has correct proxy settings
- Ensure backend is running first

### Mobile App Issues

**Network Error**
- Verify BASE_URL in `src/api/client.js`
- Check backend is accessible from device
- Test with: `http://YOUR_IP:5000/api/health`

**Expo Won't Start**
```bash
npx expo start --clear
```

---

## 📦 Deployment

### Backend (Production)

```bash
# Use gunicorn instead of Flask dev server
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Frontend (Production)

```bash
npm run build
# Serve dist folder with nginx or similar
```

### Mobile (Production)

```bash
# Build APK
eas build --platform android

# Build IPA
eas build --platform ios
```

---

## 📊 Project Statistics

- **Backend**: 6 routes, 30+ endpoints
- **Frontend**: 10 pages, 1 component
- **Mobile**: 8 screens, bottom tabs navigation
- **Database**: 6 collections
- **Features**: Authentication, Quizzes, Contests, Gamification
- **Lines of Code**: ~5000+ (across all components)

---

## 🎯 Future Enhancements

### High Priority
- [ ] Real-time contest updates (WebSockets)
- [ ] Certificate generation on course completion
- [ ] Social features (friend system, sharing)
- [ ] Advanced analytics dashboard

### Medium Priority
- [ ] Code editor integration (Monaco)
- [ ] AI-powered hints and explanations
- [ ] Video player in mobile app
- [ ] Dark mode for all platforms

### Low Priority
- [ ] Multilingual support
- [ ] Voice-activated navigation
- [ ] AR/VR learning modules
- [ ] Blockchain-based certificates

---

## 👥 User Roles

### Student
- Take quizzes
- View modules
- Participate in contests
- Track progress
- Earn badges and XP

### Admin
- Create/Edit/Delete modules
- Create questions
- Upload PDF for auto-generation
- Manage contests
- View platform statistics

---

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Secure token storage (SecureStore on mobile)
- Input validation on backend
- CORS configuration
- Environment variables for secrets

---

## 📝 License

[Your License Here]

## 🤝 Contributing

Contributions welcome! Please follow standard Git workflow.

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review QUICKSTART.md
3. Check individual README files
4. Open an issue on GitHub

---

**Built with ❤️ for Compiler Design Education**
