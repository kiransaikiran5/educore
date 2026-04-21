import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService, courseService } from '../services/api';
import {
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ManageQuizzes = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedQuiz, setExpandedQuiz] = useState(null);

  // New quiz form state
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [questions, setQuestions] = useState([
    { question_text: '', options: ['', '', '', ''], correct_answer: 0 },
  ]);

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      const [courseRes, quizzesRes] = await Promise.all([
        courseService.getById(courseId),
        quizService.getByCourse(courseId),
      ]);
      setCourse(courseRes.data);
      setQuizzes(quizzesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  // Question management
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { question_text: '', options: ['', '', '', ''], correct_answer: 0 },
    ]);
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleCorrectAnswerChange = (qIndex, optionIndex) => {
    const updated = [...questions];
    updated[qIndex].correct_answer = optionIndex;
    setQuestions(updated);
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // Create quiz
  const handleCreateQuiz = async (e) => {
    e.preventDefault();

    // Validation
    if (!newQuizTitle.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        toast.error(`Question ${i + 1}: Please enter question text`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          toast.error(`Question ${i + 1}, Option ${j + 1}: Please enter option text`);
          return;
        }
      }
    }

    const payload = {
      course_id: Number(courseId),
      title: newQuizTitle.trim(),
      questions: questions.map((q) => ({
        question_text: q.question_text.trim(),
        options: q.options.map((opt) => opt.trim()),
        correct_answer: q.correct_answer,
      })),
    };

    try {
      await quizService.create(payload);
      toast.success('Quiz created successfully!');
      // Reset form
      setNewQuizTitle('');
      setQuestions([{ question_text: '', options: ['', '', '', ''], correct_answer: 0 }]);
      setShowCreateForm(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create quiz:', error);
      toast.error(error.response?.data?.detail || 'Failed to create quiz');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Delete this quiz? All results will be lost.')) return;
    try {
      await quizService.delete(quizId);
      toast.success('Quiz deleted');
      fetchData();
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      toast.error('Failed to delete quiz');
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/instructor')}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Manage Quizzes</h1>
          <p className="text-gray-600">{course?.title}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Quizzes ({quizzes.length})
          </h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Create Quiz
          </button>
        </div>

        {/* Create Quiz Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateQuiz} className="p-6 bg-gray-50 border-b">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quiz Title *
              </label>
              <input
                type="text"
                value={newQuizTitle}
                onChange={(e) => setNewQuizTitle(e.target.value)}
                className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Python & FastAPI Mastery Assessment"
                required
              />
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Questions</h3>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  + Add Question
                </button>
              </div>

              {questions.map((q, qIndex) => (
                <div key={qIndex} className="border border-gray-200 rounded-lg p-5 bg-white">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-gray-900">Question {qIndex + 1}</h4>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIndex)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Enter your question"
                    value={q.question_text}
                    onChange={(e) =>
                      handleQuestionChange(qIndex, 'question_text', e.target.value)
                    }
                    className="w-full rounded-lg border-gray-300 mb-4"
                    required
                  />

                  <div className="space-y-3 mb-4">
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          id={`q${qIndex}-opt${oIndex}`}
                          checked={q.correct_answer === oIndex}
                          onChange={() => handleCorrectAnswerChange(qIndex, oIndex)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          placeholder={`Option ${oIndex + 1}`}
                          value={opt}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                          className="flex-1 rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-gray-500 italic">
                    ⓘ Select the radio button next to the correct answer.
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
              >
                Create Quiz
              </button>
            </div>
          </form>
        )}

        {/* Quizzes List */}
        <div className="divide-y divide-gray-100">
          {quizzes.length === 0 ? (
            <p className="p-6 text-gray-500 text-center">
              No quizzes yet. Create your first quiz.
            </p>
          ) : (
            quizzes.map((quiz) => (
              <div key={quiz.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <button
                      onClick={() => setExpandedQuiz(expandedQuiz === quiz.id ? null : quiz.id)}
                      className="mr-3 text-gray-500 hover:text-gray-700"
                    >
                      {expandedQuiz === quiz.id ? (
                        <ChevronUpIcon className="h-5 w-5" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5" />
                      )}
                    </button>
                    <h3 className="font-medium text-gray-900">{quiz.title}</h3>
                    <span className="ml-3 text-sm text-gray-500">
                      {quiz.questions?.length || 0} question
                      {(quiz.questions?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>

                {expandedQuiz === quiz.id && (
                  <div className="mt-4 ml-8 space-y-4">
                    {quiz.questions?.map((q, idx) => (
                      <div key={q.id} className="border-l-4 border-indigo-300 pl-4">
                        <p className="font-medium text-gray-900">
                          {idx + 1}. {q.question_text}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {q.options.map((opt, oIdx) => (
                            <li
                              key={oIdx}
                              className={`text-sm ${
                                oIdx === q.correct_answer
                                  ? 'text-green-600 font-medium'
                                  : 'text-gray-600'
                              }`}
                            >
                              {opt} {oIdx === q.correct_answer && ' ✓ (Correct)'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageQuizzes;