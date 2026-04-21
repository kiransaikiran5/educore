import axios from 'axios';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// -----------------------------------------------------------------------------
// Request Interceptor – Attach JWT Token
// -----------------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// -----------------------------------------------------------------------------
// Response Interceptor – Handle Errors & Token Expiry
// -----------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Optional: Attempt token refresh (if you implement it)
      // For now, simply log out
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Log server errors
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// -----------------------------------------------------------------------------
// Authentication Service
// -----------------------------------------------------------------------------
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login/json', data), // JSON endpoint for frontend
  getMe: () => api.get('/auth/me'),
};

// -----------------------------------------------------------------------------
// Course Service
// -----------------------------------------------------------------------------
export const courseService = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  getInstructorCourses: () => api.get('/courses/instructor/courses'),
  getCategories: () => api.get('/courses/categories/all'),
};

// -----------------------------------------------------------------------------
// Lesson Service
// -----------------------------------------------------------------------------
export const lessonService = {
  getByCourse: (courseId) => api.get(`/lessons/course/${courseId}`),
  create: (data) => api.post('/lessons', data),
  update: (id, data) => api.put(`/lessons/${id}`, data),
  delete: (id) => api.delete(`/lessons/${id}`),
  // Correctly sends numbers to avoid 422
  updateOrder: (data) => {
    const payload = {
      course_id: Number(data.course_id),
      lessons: data.lessons.map((l) => ({
        id: Number(l.id),
        order: Number(l.order),
      })),
    };
    return api.put('/lessons/order', payload);
  },
};

// -----------------------------------------------------------------------------
// Enrollment Service
// -----------------------------------------------------------------------------
export const enrollmentService = {
  enroll: (courseId) => api.post(`/enrollments/${courseId}`),
  getMyEnrollments: () => api.get('/enrollments/my-courses'),
  checkEnrollment: (courseId) => api.get(`/enrollments/check/${courseId}`),
};

// -----------------------------------------------------------------------------
// Progress Service
// -----------------------------------------------------------------------------
export const progressService = {
  markComplete: (lessonId) => api.post(`/progress/${lessonId}/complete`),
  getCourseProgress: (courseId) => api.get(`/progress/course/${courseId}`),
};

// -----------------------------------------------------------------------------
// Quiz Service
// -----------------------------------------------------------------------------
export const quizService = {
  // Student endpoints
  getByCourse: (courseId) => api.get(`/quizzes/course/${courseId}`),
  getById: (id) => api.get(`/quizzes/${id}`),
  submit: (quizId, answers) => api.post(`/quizzes/${quizId}/submit`, answers),

  // Instructor endpoints
  create: (data) => api.post('/quizzes', data),
  update: (id, data) => api.put(`/quizzes/${id}`, data),
  delete: (id) => api.delete(`/quizzes/${id}`),

  // Performance summary (dashboard)
  getPerformanceSummary: () => api.get('/quizzes/performance/summary'),
};

// -----------------------------------------------------------------------------
// Review Service
// -----------------------------------------------------------------------------
export const reviewService = {
  getByCourse: (courseId) => api.get(`/reviews/course/${courseId}`),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// -----------------------------------------------------------------------------
// Notification Service
// -----------------------------------------------------------------------------
export const notificationService = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread/count'),
};

// -----------------------------------------------------------------------------
// Default Export – Axios Instance (for custom calls)
// -----------------------------------------------------------------------------
export default api;