import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { courseService, lessonService } from '../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';

// Validation schemas
const CourseDetailsSchema = Yup.object().shape({
  title: Yup.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title too long')
    .required('Course title is required'),
  description: Yup.string()
    .min(20, 'Description must be at least 20 characters')
    .required('Description is required'),
  category: Yup.string().required('Category is required'),
  price: Yup.number()
    .min(0, 'Price cannot be negative')
    .max(9999, 'Price too high')
    .required('Price is required'),
});

const LessonSchema = Yup.object().shape({
  title: Yup.string().required('Lesson title is required'),
  content_url: Yup.string()
    .url('Must be a valid URL')
    .required('Video URL is required'),
  duration: Yup.number()
    .min(1, 'Duration must be at least 1 minute')
    .required('Duration is required'),
});

const LessonsValidationSchema = Yup.object().shape({
  lessons: Yup.array().of(LessonSchema).min(1, 'Add at least one lesson'),
});

const categories = [
  'Programming',
  'Design',
  'Business',
  'Marketing',
  'Personal Development',
  'Photography',
  'Music',
  'Health & Fitness',
  'Data Science',
  'Language',
];

const CreateCourse = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [courseId, setCourseId] = useState(null);

  const handleCourseSubmit = async (values, { setSubmitting }) => {
    try {
      const response = await courseService.create(values); // ✅ Correct method
      setCourseId(response.data.id);
      toast.success('Course created! Now add your lessons.');
      setCurrentStep(2);
    } catch (error) {
      console.error('Course creation error:', error);
      const msg = error.response?.data?.detail || 'Failed to create course';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLessonsSubmit = async (values, { setSubmitting }) => {
    if (!courseId) {
      toast.error('Course ID missing. Please go back and recreate the course.');
      return;
    }
    try {
      // Create each lesson sequentially
      for (let i = 0; i < values.lessons.length; i++) {
        const lesson = values.lessons[i];
        await lessonService.create({
          ...lesson,
          course_id: courseId,
          order: i + 1, // Add order field
        });
      }
      toast.success(`Successfully created course with ${values.lessons.length} lesson(s)!`);
      navigate('/instructor'); // ✅ Correct route
    } catch (error) {
      console.error('Lesson creation error:', error);
      toast.error(error.response?.data?.detail || 'Failed to add lessons');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/instructor')}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Step indicator */}
          <div className="px-6 pt-6 border-b border-gray-200">
            <div className="flex items-center justify-center mb-4">
              {[1, 2].map((step) => (
                <React.Fragment key={step}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep >= step
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step ? <CheckIcon className="h-5 w-5" /> : step}
                  </div>
                  {step < 2 && (
                    <div
                      className={`w-20 h-1 mx-2 rounded ${
                        currentStep > step ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-center pb-3 text-sm font-medium text-gray-500">
              <div className="mx-8">Course Details</div>
              <div className="mx-8">Lessons</div>
            </div>
          </div>

          {/* Step 1: Course Details */}
          {currentStep === 1 && (
            <div className="p-6">
              <Formik
                initialValues={{
                  title: '',
                  description: '',
                  category: categories[0],
                  price: 0,
                }}
                validationSchema={CourseDetailsSchema}
                onSubmit={handleCourseSubmit}
              >
                {({ isSubmitting, errors, touched }) => (
                  <Form className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course Title *
                      </label>
                      <Field
                        name="title"
                        type="text"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
                          errors.title && touched.title
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                        placeholder="e.g., Advanced React Patterns"
                      />
                      <ErrorMessage
                        name="title"
                        component="div"
                        className="mt-1 text-xs text-red-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <Field
                        as="textarea"
                        name="description"
                        rows="5"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
                          errors.description && touched.description
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                        placeholder="Describe what students will learn, prerequisites, etc."
                      />
                      <ErrorMessage
                        name="description"
                        component="div"
                        className="mt-1 text-xs text-red-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category *
                        </label>
                        <Field
                          as="select"
                          name="category"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage
                          name="category"
                          component="div"
                          className="mt-1 text-xs text-red-600"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price ($) *
                        </label>
                        <Field
                          name="price"
                          type="number"
                          step="0.01"
                          min="0"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
                            errors.price && touched.price
                              ? 'border-red-500'
                              : 'border-gray-300'
                          }`}
                        />
                        <ErrorMessage
                          name="price"
                          component="div"
                          className="mt-1 text-xs text-red-600"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
                      >
                        {isSubmitting ? 'Creating...' : 'Next: Add Lessons'}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          )}

          {/* Step 2: Lessons */}
          {currentStep === 2 && (
            <div className="p-6">
              <Formik
                initialValues={{ lessons: [] }}
                validationSchema={LessonsValidationSchema}
                onSubmit={handleLessonsSubmit}
              >
                {({ values, isSubmitting, setFieldValue, errors, touched }) => (
                  <Form>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Course Lessons
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          const newLessons = [
                            ...values.lessons,
                            { title: '', content_url: '', duration: '' },
                          ];
                          setFieldValue('lessons', newLessons);
                        }}
                        className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Lesson
                      </button>
                    </div>

                    {typeof errors.lessons === 'string' && (
                      <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                        {errors.lessons}
                      </div>
                    )}

                    <FieldArray name="lessons">
                      {({ push, remove }) => (
                        <div className="space-y-4">
                          {values.lessons.length === 0 && (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                              No lessons added yet. Click "Add Lesson" to start.
                            </div>
                          )}

                          {values.lessons.map((lesson, index) => (
                            <div
                              key={index}
                              className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <h3 className="font-medium text-gray-900">
                                  Lesson #{index + 1}
                                </h3>
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Title *
                                  </label>
                                  <Field
                                    name={`lessons.${index}.title`}
                                    type="text"
                                    className={`w-full px-3 py-1.5 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                                      touched.lessons?.[index]?.title && errors.lessons?.[index]?.title
                                        ? 'border-red-500'
                                        : 'border-gray-300'
                                    }`}
                                    placeholder="Lesson title"
                                  />
                                  <ErrorMessage
                                    name={`lessons.${index}.title`}
                                    component="div"
                                    className="mt-1 text-xs text-red-600"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Video URL *
                                  </label>
                                  <Field
                                    name={`lessons.${index}.content_url`}
                                    type="text"
                                    className={`w-full px-3 py-1.5 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                                      touched.lessons?.[index]?.content_url && errors.lessons?.[index]?.content_url
                                        ? 'border-red-500'
                                        : 'border-gray-300'
                                    }`}
                                    placeholder="https://..."
                                  />
                                  <ErrorMessage
                                    name={`lessons.${index}.content_url`}
                                    component="div"
                                    className="mt-1 text-xs text-red-600"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Duration (minutes) *
                                  </label>
                                  <Field
                                    name={`lessons.${index}.duration`}
                                    type="number"
                                    min="1"
                                    className={`w-full px-3 py-1.5 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                                      touched.lessons?.[index]?.duration && errors.lessons?.[index]?.duration
                                        ? 'border-red-500'
                                        : 'border-gray-300'
                                    }`}
                                    placeholder="e.g., 15"
                                  />
                                  <ErrorMessage
                                    name={`lessons.${index}.duration`}
                                    component="div"
                                    className="mt-1 text-xs text-red-600"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </FieldArray>

                    <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Creating Lessons...' : 'Finish & Publish'}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateCourse;