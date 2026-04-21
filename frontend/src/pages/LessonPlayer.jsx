import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lessonService, progressService } from '../services/api';
import ReactPlayer from 'react-player';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const LessonPlayer = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false); // ✅ Fixed typo

  useEffect(() => {
    fetchLessonsAndProgress();
  }, [courseId]);

  useEffect(() => {
    if (lessons.length > 0) {
      const lesson = lessons.find(l => l.id === parseInt(lessonId));
      setCurrentLesson(lesson || lessons[0]);
    }
  }, [lessonId, lessons]);

  const fetchLessonsAndProgress = async () => {
    try {
      const [lessonsRes, progressRes] = await Promise.all([
        lessonService.getByCourse(courseId),
        progressService.getCourseProgress(courseId),
      ]);
      setLessons(lessonsRes.data);
      const progressMap = {};
      progressRes.data.lessons.forEach(p => {
        progressMap[p.lesson_id] = p.completed;
      });
      setProgress(progressMap);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonChange = (lesson) => {
    navigate(`/learn/${courseId}/lesson/${lesson.id}`);
  };

  const handleMarkComplete = async () => {
    if (!currentLesson || progress[currentLesson.id]) return;
    setCompleting(true);
    try {
      await progressService.markComplete(currentLesson.id);
      setProgress({ ...progress, [currentLesson.id]: true });
      const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
      if (currentIndex < lessons.length - 1) {
        navigate(`/learn/${courseId}/lesson/${lessons[currentIndex + 1].id}`);
      }
    } catch (error) {
      console.error('Error marking complete:', error);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Course Content</h2>
        </div>
        <div className="p-2">
          {lessons.map((lesson, index) => (
            <button
              key={lesson.id}
              onClick={() => handleLessonChange(lesson)}
              className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                currentLesson?.id === lesson.id
                  ? 'bg-indigo-50 border-l-4 border-indigo-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  {progress[lesson.id] ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {index + 1}. {lesson.title}
                  </p>
                  <p className="text-xs text-gray-500">{lesson.duration} min</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {currentLesson ? (
          <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="bg-black rounded-lg overflow-hidden mb-6">
              <ReactPlayer
                url={currentLesson.content_url}
                width="100%"
                height="500px"
                controls
                playing
              />
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">{currentLesson.title}</h1>
                <button
                  onClick={handleMarkComplete}
                  disabled={progress[currentLesson.id] || completing} // ✅ Fixed
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    progress[currentLesson.id]
                      ? 'bg-green-100 text-green-800 cursor-default'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                  }`}
                >
                  {progress[currentLesson.id] ? (
                    <>
                      <CheckCircleIcon className="inline h-5 w-5 mr-1" />
                      Completed
                    </>
                  ) : completing ? ( // ✅ Fixed
                    'Marking...'
                  ) : (
                    'Mark as Complete'
                  )}
                </button>
              </div>
              <div className="prose max-w-none">
                <p>Lesson content and description would go here.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">No lessons available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonPlayer;