import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { courseService, enrollmentService } from '../services/api';
import {
  PlayIcon,
  CheckCircleIcon,
  BookOpenIcon,
  StarIcon,
  UserGroupIcon,
  CalendarIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

const MyCourses = () => {
  const { user } = useAuth();
  const isInstructor = user?.role === 'INSTRUCTOR';
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let response;
      if (isInstructor) {
        response = await courseService.getInstructorCourses();
        const enriched = response.data.map(course => ({
          ...course,
          isInstructorCourse: true,
          progress: null,
          enrolled_at: null,
        }));
        setCourses(enriched);
      } else {
        response = await enrollmentService.getMyEnrollments();
        const enriched = response.data.map(enrollment => ({
          ...enrollment,
          isInstructorCourse: false,
        }));
        setCourses(enriched);
      }
    } catch (err) {
      console.error('Fetch courses error:', err);
      const msg = err.response?.data?.detail || 'Failed to load courses. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [isInstructor]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
          <button onClick={fetchCourses} className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Create New Course button (only for instructors) */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isInstructor ? 'My Courses (Instructor)' : 'My Learning'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isInstructor
              ? 'Courses you have created and published'
              : 'Continue where you left off'}
          </p>
        </div>
        {isInstructor && (
          <Link
            to="/instructor/courses/create"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Create New Course
          </Link>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          {isInstructor ? (
            <>
              <BookOpenIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No courses yet</h3>
              <p className="text-gray-500 mb-4">
                You haven't created any courses. Click the "Create New Course" button to get started.
              </p>
              <Link
                to="/instructor/courses/create"
                className="inline-flex items-center px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <PlusCircleIcon className="h-5 w-5 mr-2" />
                Create Your First Course
              </Link>
            </>
          ) : (
            <>
              <BookOpenIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Start learning today</h3>
              <p className="text-gray-500 mb-4">
                You are not enrolled in any courses. Browse our catalog and enroll now.
              </p>
              <Link
                to="/courses"
                className="inline-flex items-center px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Browse Courses
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600" />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                    {course.category || 'General'}
                  </span>
                  {isInstructor && course.created_at && (
                    <div className="flex items-center text-xs text-gray-400">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {new Date(course.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <Link
                  to={isInstructor ? `/instructor/courses/${course.id}/edit` : `/courses/${course.id}`}
                  className="block group"
                >
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {course.title}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">{course.description}</p>
                </Link>

                {isInstructor && (
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-1 text-gray-400" />
                      <span>{course.total_enrollments || 0} students</span>
                    </div>
                    {course.average_rating && (
                      <div className="flex items-center">
                        <StarIcon className="h-4 w-4 mr-1 text-yellow-400" />
                        <span>{course.average_rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                )}

                {!isInstructor && typeof course.progress === 'number' && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span className="font-medium text-indigo-600">
                        {Math.round(course.progress)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center text-sm">
                    {!isInstructor ? (
                      course.progress === 100 ? (
                        <>
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-1" />
                          <span className="text-green-700 font-medium">Completed</span>
                        </>
                      ) : (
                        <>
                          <PlayIcon className="h-5 w-5 text-indigo-500 mr-1" />
                          <span className="text-gray-600">In progress</span>
                        </>
                      )
                    ) : (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        Instructor
                      </span>
                    )}
                  </div>

                  <Link
                    to={isInstructor ? `/instructor/courses/${course.id}/edit` : `/courses/${course.id}`}
                    className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                  >
                    {isInstructor ? 'Manage Course' : 'Continue'}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;