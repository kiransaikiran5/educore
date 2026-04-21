import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Student Pages
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import MyCourses from './pages/MyCourses';
import LessonPlayer from './pages/LessonPlayer';
import Quiz from './pages/Quiz';
import Notifications from './pages/Notifications';

// Instructor Pages
import InstructorDashboard from './pages/InstructorDashboard';
import CreateCourse from './pages/CreateCourse';
import EditCourse from './pages/EditCourse';
import ManageLessons from './pages/ManageLessons';
import ManageQuizzes from './pages/ManageQuizzes';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AuthProvider>
          <ErrorBoundary>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                },
              }}
            />

            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes with Layout */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />

                {/* Student & Shared Routes */}
                <Route path="dashboard" element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } />
                <Route path="courses" element={
                  <PrivateRoute>
                    <Courses />
                  </PrivateRoute>
                } />
                <Route path="courses/:id" element={
                  <PrivateRoute>
                    <CourseDetail />
                  </PrivateRoute>
                } />
                <Route path="my-courses" element={
                  <PrivateRoute>
                    <MyCourses />
                  </PrivateRoute>
                } />
                <Route path="learn/:courseId/lesson/:lessonId" element={
                  <PrivateRoute>
                    <LessonPlayer />
                  </PrivateRoute>
                } />
                <Route path="quiz/:quizId" element={
                  <PrivateRoute>
                    <Quiz />
                  </PrivateRoute>
                } />
                <Route path="notifications" element={
                  <PrivateRoute>
                    <Notifications />
                  </PrivateRoute>
                } />

                {/* Instructor Only Routes */}
                <Route path="instructor" element={
                  <PrivateRoute role="INSTRUCTOR">
                    <InstructorDashboard />
                  </PrivateRoute>
                } />
                <Route path="instructor/courses/create" element={
                  <PrivateRoute role="INSTRUCTOR">
                    <CreateCourse />
                  </PrivateRoute>
                } />
                <Route path="instructor/courses/:id/edit" element={
                  <PrivateRoute role="INSTRUCTOR">
                    <EditCourse />
                  </PrivateRoute>
                } />
                <Route path="instructor/courses/:courseId/lessons" element={
                  <PrivateRoute role="INSTRUCTOR">
                    <ManageLessons />
                  </PrivateRoute>
                } />
                <Route path="instructor/courses/:courseId/quizzes" element={
                  <PrivateRoute role="INSTRUCTOR">
                    <ManageQuizzes />
                  </PrivateRoute>
                } />
              </Route>

              {/* Catch-all: redirect to dashboard if logged in, else login */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </Router>
    </Provider>
  );
}

export default App;