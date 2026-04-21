import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../services/api';
import toast from 'react-hot-toast';

const Quiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const res = await quizService.getById(quizId);
      setQuiz(res.data);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const answersArray = Object.entries(answers).map(([qId, opt]) => ({
      question_id: parseInt(qId),
      selected_option: opt,
    }));

    try {
      const res = await quizService.submit(quizId, { answers: answersArray });
      setResult(res.data);
      toast.success('Quiz submitted!');
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Results</h1>
          <div className="text-6xl font-bold text-indigo-600 mb-2">
            {result.score.toFixed(1)}%
          </div>
          <p className="text-gray-600 mb-6">
            You got {result.correct_answers} out of {result.total_questions} correct
          </p>
          <button
            onClick={() => navigate(`/courses/${quiz.course_id}`)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{quiz.title}</h1>

        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            {quiz.questions.map((q, idx) => (
              <div key={q.id} className="border-b pb-6 last:border-b-0">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {idx + 1}. {q.question_text}
                </h3>
                <div className="space-y-3">
                  {q.options.map((opt, oIdx) => (
                    <label
                      key={oIdx}
                      className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={oIdx}
                        checked={answers[q.id] === oIdx}
                        onChange={() => handleAnswerSelect(q.id, oIdx)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                        required
                      />
                      <span className="ml-3 text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
                {/* No correct answer displayed here – data from backend has correct_answer: null */}
              </div>
            ))}
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={submitting || Object.keys(answers).length !== quiz.questions.length}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
            {Object.keys(answers).length !== quiz.questions.length && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Please answer all questions before submitting.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Quiz;