import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { courseService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  BookOpenIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

// Loading Skeleton
const InstructorDashboardSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="rounded-lg bg-gray-200 h-12 w-12"></div>
            <div className="ml-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
      </div>
      <div className="divide-y divide-gray-200">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-6">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const InstructorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchInstructorCourses();
  }, []);

  const fetchInstructorCourses = async () => {
    try {
      const res = await courseService.getInstructorCourses();
      const coursesData = res.data;
      setCourses(coursesData);

      // Calculate aggregate stats
      const totalCourses = coursesData.length;
      const totalStudents = coursesData.reduce(
        (sum, course) => sum + (course.total_enrollments || 0),
        0
      );
      const totalRevenue = coursesData.reduce(
        (sum, course) => sum + (course.price || 0) * (course.total_enrollments || 0),
        0
      );

      setStats({
        totalCourses,
        totalStudents,
        totalRevenue,
      });
    } catch (error) {
      console.error('Error fetching instructor courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await courseService.delete(courseId);
      fetchInstructorCourses(); // Refresh list
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course. Please try again.');
    }
  };

  if (loading) return <InstructorDashboardSkeleton />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage your courses and track student engagement.
          </p>
        </div>
        <Link
          to="/instructor/courses/create"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors shadow-sm"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create New Course
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

        {/* Total Students */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3">
              <UsersIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                ${stats.totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3">
              <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">My Courses</h2>
        </div>

        {courses.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first course.</p>
            <Link
              to="/instructor/courses/create"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First Course
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {courses.map((course) => (
              <div key={course.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  {/* Course Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {course.title}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {course.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      <span className="font-medium text-gray-900">
                        ${course.price === 0 ? 'Free' : course.price.toFixed(2)}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">
                        <UsersIcon className="inline h-4 w-4 mr-1 text-gray-400" />
                        {course.total_enrollments || 0} student{course.total_enrollments !== 1 ? 's' : ''}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">
                        ⭐ {course.average_rating?.toFixed(1) || 'No ratings'}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500 text-xs">
                        Created {new Date(course.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1 mt-4 lg:mt-0 lg:ml-6">
                    <Link
                      to={`/instructor/courses/${course.id}/lessons`}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Manage Lessons"
                    >
                      <BookOpenIcon className="h-5 w-5" />
                    </Link>
                    <Link
                      to={`/instructor/courses/${course.id}/quizzes`}
                      className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Manage Quizzes"
                    >
                      <AcademicCapIcon className="h-5 w-5" />
                    </Link>
                    <Link
                      to={`/instructor/courses/${course.id}/edit`}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit Course"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => handleDeleteCourse(course.id, course.title)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Course"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                    <Link
                      to={`/courses/${course.id}`}
                      className="ml-2 inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      View
                      <ArrowRightIcon className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;