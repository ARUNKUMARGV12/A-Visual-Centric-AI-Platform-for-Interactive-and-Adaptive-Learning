# Phase 1 Testing Guide - User Profiles & Activity Tracking

## 🚀 Quick Start Testing

### Prerequisites
1. ✅ Frontend development server running (`npm start`)
2. ✅ Backend server running (`python run.py` from backend folder)
3. ⚠️ Supabase setup (optional for initial testing - Guest mode available)

---

## 🧪 Test Scenarios

### 1. **Guest Mode Testing** (No Database Required)
**Purpose**: Test all UI components and local state management

#### Steps:
1. **Access the App**: Open `http://localhost:3000`
2. **Guest Authentication**: 
   - Click "Sign In" button in sidebar
   - Click "Continue as Guest" 
   - Should trigger onboarding flow

3. **Onboarding Flow Test**:
   - **Step 1**: Fill basic info (Name, Age, Education Level)
   - **Step 2**: Select learning preferences (Visual, Auditory, etc.)
   - **Step 3**: Set confidence levels for different topics
   - **Step 4**: Define learning goals and deadlines
   - **Step 5**: Configure accessibility settings
   - Click "Complete Setup"

4. **User Profile Dashboard**:
   - Click "My Profile" in sidebar
   - Verify user data is displayed
   - Test preference updates
   - Add new learning goals

5. **Activity Tracking**:
   - Navigate between different pages
   - Play knowledge games
   - Use voice assistant
   - Check "Learning Insights" dashboard for tracked activities

#### Expected Results:
- ✅ Smooth onboarding experience
- ✅ Profile data persists during session
- ✅ Activity tracking shows real-time updates
- ✅ Theme switching works across all components

---

### 2. **Authentication Flow Testing** (With Supabase)
**Purpose**: Test real user registration and data persistence

#### Prerequisites:
- Set up Supabase project
- Update `.env` with your Supabase credentials

#### Steps:
1. **Sign Up New User**:
   - Click "Sign In" → Switch to "Sign Up"
   - Enter email, password, name
   - Complete onboarding flow
   - Verify data saves to database

2. **Sign Out and Sign In**:
   - Sign out from profile
   - Sign back in with same credentials
   - Verify profile data persists

3. **Profile Updates**:
   - Modify learning preferences
   - Add new goals
   - Update confidence levels
   - Verify changes save to database

---

### 3. **Learning Analytics Testing**
**Purpose**: Verify activity tracking and insights generation

#### Steps:
1. **Generate Activity Data**:
   - Visit different pages (5+ times each)
   - Play knowledge games (complete 2-3 quizzes)
   - Use voice assistant (ask 3+ questions)
   - Use visualizer feature

2. **Check Learning Insights**:
   - Go to "Learning Insights" dashboard
   - Verify activity data appears
   - Check topic extraction works
   - Confirm engagement scoring

3. **Profile Analytics**:
   - View "My Profile" dashboard
   - Check interaction type counts
   - Verify learning level progression
   - Test goal progress tracking

---

### 4. **Personalization Features Testing**
**Purpose**: Test personalization engine foundations

#### Steps:
1. **Learning Style Detection**:
   - Use multiple learning modes (visual, text, games)
   - Check if primary style is detected in profile

2. **Topic Progress Tracking**:
   - Focus on specific topics during games/quizzes
   - Verify topic progress updates in profile

3. **Weak Area Identification**:
   - Perform poorly on specific topics
   - Check if topics appear in "Areas for Improvement"

---

### 5. **UI/UX Testing**
**Purpose**: Ensure responsive design and theme consistency

#### Steps:
1. **Theme Testing**:
   - Switch between all 5 themes (Dark, Light, Forest, Sunset, Purple)
   - Verify all components adapt correctly
   - Test in different screen sizes

2. **Responsive Design**:
   - Test on mobile/tablet viewport sizes
   - Verify sidebar collapses appropriately
   - Check form layouts remain usable

3. **Navigation Testing**:
   - Test all sidebar navigation items
   - Verify page transitions work smoothly
   - Check breadcrumb/back navigation

---

## 🔍 Key Features to Verify

### ✅ **Authentication System**
- [ ] Guest mode works without database
- [ ] User registration with onboarding
- [ ] Sign in/out functionality
- [ ] Profile persistence across sessions

### ✅ **User Profiling**
- [ ] 5-step onboarding completion
- [ ] Learning preference capture
- [ ] Goal setting and tracking
- [ ] Confidence level mapping
- [ ] Profile editing and updates

### ✅ **Activity Tracking**
- [ ] Page visit logging
- [ ] Game/quiz interaction tracking
- [ ] Voice assistant usage monitoring
- [ ] Real-time dashboard updates

### ✅ **Learning Analytics**
- [ ] Topic extraction from activities
- [ ] Engagement score calculation
- [ ] Learning style inference preparation
- [ ] Progress visualization

### ✅ **Personalization Foundation**
- [ ] User preference storage
- [ ] Activity pattern recognition
- [ ] Goal-based tracking
- [ ] Weak area identification

---

## 🐛 Common Issues & Solutions

### Issue: "Supabase client error"
**Solution**: For testing, use Guest mode or set up Supabase credentials

### Issue: "Activity tracking not working"
**Solution**: Check browser console for context provider errors

### Issue: "Onboarding not saving"
**Solution**: Verify UserProfileContext is properly wrapped in App.js

### Issue: "Theme not persisting"
**Solution**: Check localStorage in browser dev tools

---

## 📊 Success Metrics

After testing, you should see:

1. **User Profile Data Structure**:
```json
{
  "name": "Test User",
  "learningPreferences": {
    "style": "visual",
    "pace": "normal"
  },
  "goals": [
    {
      "text": "Learn React",
      "progress": 0,
      "deadline": "2025-08-01"
    }
  ],
  "topicsOfInterest": ["javascript", "react"],
  "confidence": {
    "JavaScript": "high",
    "Python": "medium"
  }
}
```

2. **Activity Log Entries**:
```json
{
  "activity_type": "page_visit",
  "topic": "javascript",
  "engagement_score": 0.7,
  "duration": 2,
  "page": "/knowledge-games"
}
```

3. **Learning Insights Data**:
- Total activities logged
- Primary learning style detected
- Topics explored list
- Engagement patterns

---

## 🎯 Next Steps After Testing

Once Phase 1 testing is complete:

1. **Document any bugs found**
2. **Note user experience improvements**
3. **Verify data structure matches schema**
4. **Confirm personalization data is collected**
5. **Ready for Phase 2 development**

---

## 📞 Testing Checklist

- [ ] Frontend server running (`http://localhost:3000`)
- [ ] Backend server running (`http://localhost:8000`)
- [ ] Guest mode authentication works
- [ ] Onboarding flow completes successfully
- [ ] Profile dashboard displays data
- [ ] Activity tracking shows in Learning Insights
- [ ] Theme switching works across all pages
- [ ] Knowledge games track interactions
- [ ] Voice assistant logs activities
- [ ] All navigation items functional

**Status**: ⚠️ Ready for testing - Backend server may be needed for full functionality
