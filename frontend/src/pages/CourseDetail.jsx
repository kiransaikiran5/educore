import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseService, enrollmentService, reviewService, lessonService, quizService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  StarIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  PencilIcon,
  BookOpenIcon,
  AcademicCapIcon,
  PlayIcon,
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

// Skeleton loader component
const CourseDetailSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6 sm:p-8">
      <div className="flex justify-between mb-4">
        <div className="h-6 bg-gray-200 rounded w-24"></div>
        <div className="h-8 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-20 bg-gray-200 rounded w-full mb-6"></div>
      <div className="flex space-x-6">
        <div className="h-5 bg-gray-200 rounded w-32"></div>
        <div className="h-5 bg-gray-200 rounded w-32"></div>
        <div className="h-5 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  </div>
);

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, review_text: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  const isInstructor = user?.role === 'INSTRUCTOR';
  const isOwner = isInstructor && course?.instructor_id === user?.id;

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const fetchCourseData = async () => {
    try {
      const [courseRes, enrollmentRes, reviewsRes, lessonsRes, quizzesRes] = await Promise.all([
        courseService.getById(id),
        enrollmentService.checkEnrollment(id).catch(() => ({ data: { enrolled: false } })),
        reviewService.getByCourse(id),
        lessonService.getByCourse(id).catch(() => ({ data: [] })),
        quizService.getByCourse(id).catch(() => ({ data: [] })),
      ]);
      setCourse(courseRes.data);
      setIsEnrolled(enrollmentRes.data.enrolled);
      setReviews(reviewsRes.data);
      setLessons(lessonsRes.data);
      setQuizzes(quizzesRes.data);
      const avg = reviewsRes.data.length
        ? reviewsRes.data.reduce((acc, r) => acc + r.rating, 0) / reviewsRes.data.length
        : 0;
      setAverageRating(avg);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setEnrolling(true);
    try {
      await enrollmentService.enroll(id);
      setIsEnrolled(true);
      toast.success('Successfully enrolled!');
      fetchCourseData(); // Refresh enrollment count
    } catch (error) {
      console.error(error);
      toast.error('Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReview.review_text.trim()) {
      toast.error('Please write a review');
      return;
    }
    setSubmittingReview(true);
    try {
      await reviewService.create({ course_id: parseInt(id), ...newReview });
      setNewReview({ rating: 5, review_text: '' });
      toast.success('Review submitted!');
      fetchCourseData();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleContinueLearning = () => {
    if (lessons.length === 0) {
      toast('No lessons available yet', { icon: '📚' });
      return;
    }
    // Find first incomplete lesson (if progress tracking is implemented) or just first lesson
    const firstIncomplete = lessons.find((l) => !l.completed);
    const targetLesson = firstIncomplete || lessons[0];
    navigate(`/learn/${course.id}/lesson/${targetLesson.id}`);
  };

  if (loading) return <CourseDetailSkeleton />;
  if (!course) return <div className="max-w-7xl mx-auto px-4 py-8 text-center">Course not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Course Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8">
          {/* Category & Price */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700">
              {course.category}
            </span>
            <span className="text-3xl font-bold text-gray-900">
              {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{course.title}</h1>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-6">{course.description}</p>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 mb-6">
            <div className="flex items-center">
              <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
              <span>
                {averageRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
              </span>
            </div>
            <div className="flex items-center">
              <UsersIcon className="h-5 w-5 text-gray-400 mr-1" />
              <span>{course.total_enrollments || 0} student{course.total_enrollments !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-gray-400 mr-1" />
              <span>Updated {new Date(course.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Instructor */}
          <div className="flex items-center text-gray-700">
            <span className="font-medium">Instructor:</span>
            <span className="ml-2">{course.instructor_name}</span>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {isOwner ? (
              // Instructor who owns this course sees management buttons
              <>
                <Link
                  to={`/instructor/courses/${course.id}/edit`}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Edit Course
                </Link>
                <Link
                  to={`/instructor/courses/${course.id}/lessons`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  <BookOpenIcon className="h-5 w-5 mr-2" />
                  Manage Lessons
                </Link>
                <Link
                  to={`/instructor/courses/${course.id}/quizzes`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  <AcademicCapIcon className="h-5 w-5 mr-2" />
                  Manage Quizzes
                </Link>
              </>
            ) : user?.role === 'STUDENT' ? (
              // Student sees enroll / continue learning
              !isEnrolled ? (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center text-green-600">
                    <CheckCircleIcon className="h-6 w-6 mr-2" />
                    <span className="font-medium">You are enrolled</span>
                  </div>
                  <button
                    onClick={handleContinueLearning}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
                  >
                    Continue Learning
                  </button>
                </div>
              )
            ) : null}
          </div>
        </div>
      </div>

      {/* Curriculum Section (Lessons) - visible to enrolled students or owners */}
      {(isEnrolled || isOwner) && lessons.length > 0 && (
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Curriculum</h2>
          <div className="space-y-3">
            {lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                    {lesson.duration && (
                      <p className="text-xs text-gray-500">{lesson.duration} min</p>
                    )}
                  </div>
                </div>
                {isEnrolled && (
                  <button
                    onClick={() => navigate(`/learn/${course.id}/lesson/${lesson.id}`)}
                    className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition text-sm"
                  >
                    <PlayIcon className="h-4 w-4 mr-1" />
                    Watch
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quizzes Section - only for enrolled students */}
      {isEnrolled && quizzes.length > 0 && (
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Quizzes</h2>
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center">
                  <AcademicCapIcon className="h-6 w-6 text-indigo-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">{quiz.title}</h3>
                    <p className="text-sm text-gray-500">
                      {quiz.questions?.length || 0} question{quiz.questions?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/quiz/${quiz.id}`)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                >
                  Take Quiz
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Student Reviews</h2>

        {/* Write Review Form (only for enrolled students) */}
        {isEnrolled && user?.role === 'STUDENT' && (
          <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-gray-50 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <select
                value={newReview.rating}
                onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                className="w-full sm:w-auto rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} Star{r !== 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
              <textarea
                value={newReview.review_text}
                onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
                rows="4"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Share your experience with this course..."
                required
              />
            </div>
            <button
              type="submit"
              disabled={submittingReview}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">{review.username}</span>
                    <div className="flex items-center ml-4">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700">{review.review_text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;