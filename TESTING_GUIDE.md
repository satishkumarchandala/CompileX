# Testing Guide - Real-Time Updates

## Setup Instructions

### 1. Start the Backend
```bash
cd E:\Mini_Project\backend
E:\Mini_Project\.venv\Scripts\python.exe app.py
```
Backend will run on: http://localhost:5000

### 2. Start the Frontend
```bash
cd E:\Mini_Project\frontend
npm run dev
```
Frontend will run on: http://localhost:5173

## Test Scenarios

### Test 1: Module Completion Tracking

**Objective**: Verify module completion is tracked and displayed correctly

**Steps**:
1. Login as a student
2. Navigate to **Explore** page
3. Note the current appearance of a module (should have blue/purple gradient)
4. Click **"Start Learning"** on any module
5. Take the quiz and score **≥70%** (at least 7 out of 10 correct answers)
6. Submit the quiz

**Expected Results**:
- ✅ Success message appears after submission
- ✅ Navigate back to Explore page
- ✅ The completed module now has:
  - Green gradient background
  - CheckCircle icon (instead of PlayCircle)
  - Button text says "Review" (instead of "Start Learning")
- ✅ Navigate to Home page
- ✅ "Modules Completed" card shows count of 1 (or increases by 1)
- ✅ Level and XP values increase

### Test 2: Low Score (No Completion)

**Objective**: Verify module is NOT marked as completed for scores <70%

**Steps**:
1. Login as a student
2. Take a quiz on a new module
3. Score **<70%** (less than 7 out of 10 correct)
4. Submit the quiz

**Expected Results**:
- ✅ Quiz submitted successfully
- ✅ XP is still earned (based on correct answers)
- ✅ Module does NOT show green badge on Explore page
- ✅ "Modules Completed" count does NOT increase

### Test 3: Auto-Refresh on Tab Switch (HomePage)

**Objective**: Verify HomePage refreshes when switching browser tabs

**Steps**:
1. Open HomePage in browser tab
2. Note current Level, XP, and Badges count
3. In another tab, complete a quiz (or open MongoDB Compass and manually change XP)
4. Switch back to the HomePage tab

**Expected Results**:
- ✅ Stats automatically refresh without manual reload
- ✅ Updated Level, XP, and badge counts appear
- ✅ No page reload or flash, just data updates

### Test 4: Auto-Refresh on Tab Switch (ExplorePage)

**Objective**: Verify ExplorePage refreshes module list on tab switch

**Steps**:
1. Open ExplorePage in one browser tab
2. Open AdminDashboard in another tab (login as admin if needed)
3. In AdminDashboard, create a new module
4. Switch back to the ExplorePage tab

**Expected Results**:
- ✅ Page automatically refreshes
- ✅ New module appears in the list
- ✅ No manual refresh needed

### Test 5: Admin Stats Real-Time Update

**Objective**: Verify admin stats update immediately after CRUD operations

**Steps**:
1. Login as admin
2. Go to AdminDashboard
3. Note the current counts (Users, Modules, Questions, Contests)
4. Click **"Create Module"**
5. Fill form and create a module
6. Dialog closes

**Expected Results**:
- ✅ "Modules" count increases by 1 immediately
- ✅ No manual refresh needed
- ✅ Stats cards show updated numbers

### Test 6: Module Deletion Reflects Everywhere

**Objective**: Verify deleted modules disappear from student view

**Steps**:
1. Have ExplorePage open in one tab (as student)
2. Have AdminDashboard open in another tab (as admin)
3. In AdminDashboard, delete a module
4. Switch to student ExplorePage tab

**Expected Results**:
- ✅ Module list automatically refreshes
- ✅ Deleted module no longer appears
- ✅ Student sees updated module list

### Test 7: Contest Auto-Refresh

**Objective**: Verify ContestsPage updates when contests are modified

**Steps**:
1. Open ContestsPage in one tab (as student)
2. Open AdminDashboard in another tab (as admin)
3. Create a new contest in AdminDashboard
4. Switch back to ContestsPage tab

**Expected Results**:
- ✅ Contest list automatically refreshes
- ✅ New contest appears
- ✅ Join button is available

### Test 8: Profile Manual Refresh

**Objective**: Verify ProfilePage has working manual refresh button

**Steps**:
1. Login and go to Profile page
2. Note current stats
3. Complete a quiz in another tab
4. Return to Profile page
5. Click the circular refresh button (top-right corner)

**Expected Results**:
- ✅ Refresh icon spins during reload
- ✅ Stats update after refresh completes
- ✅ Button works multiple times

### Test 9: Cross-User Real-Time Updates

**Objective**: Verify changes by admin reflect for students

**Steps**:
1. Login as student in Browser 1
2. Login as admin in Browser 2
3. Keep both on respective pages (Student: Explore, Admin: Dashboard)
4. Admin creates/edits a contest
5. Student switches to ContestsPage tab (or switches away and back)

**Expected Results**:
- ✅ Student sees admin's changes after tab switch
- ✅ Updates happen without manual page reload

### Test 10: Completion Persistence

**Objective**: Verify completed modules stay completed after logout/login

**Steps**:
1. Login and complete a module (≥70%)
2. Verify green badge appears on Explore page
3. Logout
4. Login again
5. Go to Explore page

**Expected Results**:
- ✅ Previously completed module still shows green badge
- ✅ CheckCircle icon still present
- ✅ Button still says "Review"
- ✅ Completion persists across sessions

## Troubleshooting

### Module Not Showing as Completed

**Check**:
1. Did you score ≥70%? (Need at least 7/10 correct)
2. Open MongoDB Compass and check the user document
3. Look for `completedModules` array
4. Verify the module ObjectId is in the array

### Auto-Refresh Not Working

**Check**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Switch tabs and check for API calls
4. Should see GET requests when switching back
5. Verify no JavaScript errors

### Stats Not Updating in Admin

**Check**:
1. Verify backend is running (localhost:5000)
2. Check backend console for errors
3. Test the `/admin/stats` endpoint directly in browser
4. Verify MongoDB is running and accessible

### Page Still Shows Old Data

**Solution**:
1. Hard refresh the page (Ctrl + Shift + R)
2. Clear browser cache
3. Check if backend restarted recently
4. Verify MongoDB has latest data

## Success Criteria

All tests passing means:
✅ Module completion tracking works (≥70% threshold)
✅ Visual indicators display correctly (green badges)
✅ Auto-refresh works on all pages (visibilitychange)
✅ Admin CRUD operations reflect immediately
✅ Cross-user updates work (admin → student visibility)
✅ Data persists across sessions
✅ Manual refresh available where needed

## Performance Notes

- Auto-refresh only happens when switching TO the tab (not away)
- No continuous polling or background processes
- API calls only made when needed
- Battery and network efficient
- Instant feel for users
