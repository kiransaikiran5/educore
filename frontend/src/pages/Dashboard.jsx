import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { enrollmentService, quizService } from '../services/api';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Loading Skeleton Component
const DashboardSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="rounded-lg bg-gray-200 h-12 w-12"></div>
            <div className="ml-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-12"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6 h-64"></div>
      <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 h-64"></div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    averageProgress: 0,
  });
  const [quizStats, setQuizStats] = useState({
    average_score: 0,
    total_quizzes: 0,
    recent_results: [],
  });
  const [loading, setLoading] = useState(true);

  // 🚨 Redirect instructors away from student dashboard
  if (user?.role === 'INSTRUCTOR') {
    return <Navigate to="/instructor" replace />;
  }

  useEffect(() => {
    fetchDashboardData();
    fetchQuizStats();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await enrollmentService.getMyEnrollments();
      const courses = res.data;
      setEnrolledCourses(courses);
      const total = courses.length;
      const completed = courses.filter((c) => c.progress === 100).length;
      const inProgress = total - completed;
      const avgProgress = total
        ? courses.reduce((acc, c) => acc + (c.progress || 0), 0) / total
        : 0;
      setStats({
        totalCourses: total,
        completedCourses: completed,
        inProgressCourses: inProgress,
        averageProgress: avgProgress,
      });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const fetchQuizStats = async () => {
    try {
      const res = await quizService.getPerformanceSummary();
      setQuizStats(res.data);
    } catch (error) {
      console.error('Error fetching quiz stats:', error);
      setQuizStats({ average_score: 0, total_quizzes: 0, recent_results: [] });
    } finally {
      setLoading(false);
    }
  };

  const progressChartData = {
    labels: ['Completed', 'In Progress'],
    datasets: [
      {
        data: [stats.completedCourses, stats.inProgressCourses],
        backgroundColor: ['#10B981', '#6366F1'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const courseProgressData = {
    labels: enrolledCourses.slice(0, 5).map((c) => c.title),
    datasets: [
      {
        label: 'Progress (%)',
        data: enrolledCourses.slice(0, 5).map((c) => c.progress || 0),
        backgroundColor: '#6366F1',
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
  };

  const barOptions = {
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, max: 100, grid: { color: '#E5E7EB' } },
      x: { grid: { display: false } },
    },
    plugins: {
      legend: { display: false },
    },
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, <span className="text-indigo-600">{user?.username}</span>!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's an overview of your learning progress.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Courses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Courses</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalCourses}</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-3">
              <BookOpenIcon className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Completed Courses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.completedCourses}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.inProgressCourses}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Average Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Progress</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.averageProgress.toFixed(1)}%
              </p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Doughnut Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Course Completion</h2>
          </div>
          <div className="h-48">
            {stats.totalCourses > 0 ? (
              <Doughnut data={progressChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No courses enrolled</p>
              </div>
            )}
          </div>
          {stats.totalCourses > 0 && (
            <div className="mt-4 flex justify-center space-x-6 text-sm">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <span className="text-gray-600">Completed ({stats.completedCourses})</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
                <span className="text-gray-600">In Progress ({stats.inProgressCourses})</span>
              </div>
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Courses Progress</h2>
          <div className="h-48">
            {enrolledCourses.length > 0 ? (
              <Bar data={courseProgressData} options={barOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Enroll in courses to see progress</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quiz Performance & Continue Learning */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quiz Performance Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <div className="bg-blue-50 rounded-xl p-2 mr-3">
              <AcademicCapIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Quiz Performance</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Average Score</span>
              <span className="text-2xl font-bold text-indigo-600">
                {quizStats.average_score}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Quizzes Taken</span>
              <span className="text-xl font-semibold text-gray-900">{quizStats.total_quizzes}</span>
            </div>
            {quizStats.recent_results.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">Recent Results</p>
                <div className="space-y-3">
                  {quizStats.recent_results.slice(0, 3).map((result, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 truncate flex-1 mr-2">
                        {result.quiz_title}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          result.score >= 70
                            ? 'text-green-600'
                            : result.score >= 50
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {result.score}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Continue Learning List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Continue Learning</h2>
            <Link
              to="/my-courses"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              View all
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {enrolledCourses.slice(0, 5).map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="block p-4 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-gray-900 group-hover:text-indigo-600 truncate">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">{course.category}</p>
                  </div>
                  <div className="ml-4 flex items-center space-x-3">
                    <div className="w-28">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${course.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 ml-3 w-12">
                          {course.progress?.toFixed(0) || 0}%
                        </span>
                      </div>
                    </div>
                    <PlayIcon className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
                  </div>
                </div>
              </Link>
            ))}
            {enrolledCourses.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-3">You haven't enrolled in any courses yet.</p>
                <Link
                  to="/courses"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                >
                  Browse Courses
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;