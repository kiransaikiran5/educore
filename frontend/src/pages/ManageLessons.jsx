import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { lessonService, courseService } from '../services/api';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Sortable Lesson Item Component (same as before)
const SortableLessonItem = ({ lesson, index, onEdit, onDelete, editingId, onUpdate, onCancelEdit }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditing = editingId === lesson.id;

  return (
    <div ref={setNodeRef} style={style} className={`p-4 transition-colors ${isDragging ? 'bg-indigo-50 shadow-lg rounded-lg' : 'hover:bg-gray-50'}`}>
      {isEditing ? (
        <div className="space-y-3">
          <input type="text" defaultValue={lesson.title} onBlur={(e) => onUpdate(lesson.id, { title: e.target.value })} className="w-full rounded-lg border-gray-300" autoFocus />
          <input type="text" defaultValue={lesson.content_url} onBlur={(e) => onUpdate(lesson.id, { content_url: e.target.value })} className="w-full rounded-lg border-gray-300" />
          <input type="number" defaultValue={lesson.duration} onBlur={(e) => onUpdate(lesson.id, { duration: parseInt(e.target.value) })} className="w-full rounded-lg border-gray-300" />
          <div className="flex space-x-2">
            <button onClick={onCancelEdit} className="px-3 py-1 bg-green-600 text-white rounded-lg"><CheckIcon className="h-4 w-4" /></button>
            <button onClick={onCancelEdit} className="px-3 py-1 bg-gray-300 rounded-lg"><XMarkIcon className="h-4 w-4" /></button>
          </div>
        </div>
      ) : (
        <div className="flex items-center">
          <div {...attributes} {...listeners} className="mr-3 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 10-4 0 2 2 0 004 0zm0 8a2 2 0 10-4 0 2 2 0 004 0zm0 8a2 2 0 10-4 0 2 2 0 004 0zm10-8a2 2 0 10-4 0 2 2 0 004 0zm0 8a2 2 0 10-4 0 2 2 0 004 0zm0-16a2 2 0 10-4 0 2 2 0 004 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{index + 1}. {lesson.title}</h3>
            <p className="text-sm text-gray-500">Duration: {lesson.duration} min • {lesson.content_url}</p>
          </div>
          <div className="flex items-center space-x-1">
            <button onClick={() => onEdit(lesson.id)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><PencilIcon className="h-5 w-5" /></button>
            <button onClick={() => onDelete(lesson.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><TrashIcon className="h-5 w-5" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

const ManageLessons = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingLesson, setEditingLesson] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLesson, setNewLesson] = useState({ title: '', content_url: '', duration: '' });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      const [courseRes, lessonsRes] = await Promise.all([
        courseService.getById(courseId),
        lessonService.getByCourse(courseId),
      ]);
      setCourse(courseRes.data);
      const sorted = [...lessonsRes.data].sort((a, b) => a.order - b.order);
      setLessons(sorted);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = lessons.findIndex((l) => l.id === active.id);
    const newIndex = lessons.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(lessons, oldIndex, newIndex);

    const updatedLessons = reordered.map((lesson, idx) => ({
      ...lesson,
      order: idx + 1,
    }));
    setLessons(updatedLessons);

    const payload = {
      course_id: Number(courseId),
      lessons: updatedLessons.map((l) => ({
        id: Number(l.id),
        order: Number(l.order),
      })),
    };
    console.log('Sending payload:', JSON.stringify(payload, null, 2));

    try {
      await lessonService.updateOrder(payload);
      toast.success('Lesson order updated');
    } catch (error) {
      console.error('Failed to update order:', error);
      const errorDetail = error.response?.data?.detail;
      if (Array.isArray(errorDetail)) {
        errorDetail.forEach((err) => toast.error(`${err.loc.join('.')}: ${err.msg}`));
      } else {
        toast.error(errorDetail || 'Failed to save new order');
      }
      fetchData(); // revert
    }
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (!newLesson.title || !newLesson.content_url || !newLesson.duration) {
      toast.error('All fields are required');
      return;
    }
    try {
      await lessonService.create({
        ...newLesson,
        course_id: Number(courseId),
        order: lessons.length + 1,
        duration: Number(newLesson.duration),
      });
      setNewLesson({ title: '', content_url: '', duration: '' });
      setShowAddForm(false);
      toast.success('Lesson added');
      fetchData();
    } catch (error) {
      console.error('Failed to add lesson:', error);
      toast.error('Failed to add lesson');
    }
  };

  const handleUpdateLesson = async (lessonId, data) => {
    try {
      await lessonService.update(lessonId, data);
      setEditingLesson(null);
      toast.success('Lesson updated');
      fetchData();
    } catch (error) {
      console.error('Failed to update lesson:', error);
      toast.error('Failed to update lesson');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await lessonService.delete(lessonId);
      toast.success('Lesson deleted');
      fetchData();
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      toast.error('Failed to delete lesson');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/instructor')} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Manage Lessons</h1>
          <p className="text-gray-600">{course?.title}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Lessons ({lessons.length})</h2>
          <button onClick={() => setShowAddForm(!showAddForm)} className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm">
            <PlusIcon className="h-4 w-4 mr-1" /> Add Lesson
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddLesson} className="p-6 bg-gray-50 border-b">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" placeholder="Lesson Title" value={newLesson.title} onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })} className="rounded-lg border-gray-300" required />
              <input type="text" placeholder="Video URL" value={newLesson.content_url} onChange={(e) => setNewLesson({ ...newLesson, content_url: e.target.value })} className="rounded-lg border-gray-300" required />
              <input type="number" placeholder="Duration (min)" value={newLesson.duration} onChange={(e) => setNewLesson({ ...newLesson, duration: e.target.value })} className="rounded-lg border-gray-300" min="1" required />
            </div>
            <div className="mt-3 flex justify-end space-x-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-1.5 border rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg">Add Lesson</button>
            </div>
          </form>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <div className="divide-y divide-gray-100">
              {lessons.length === 0 ? (
                <p className="p-6 text-gray-500 text-center">No lessons yet.</p>
              ) : (
                lessons.map((lesson, index) => (
                  <SortableLessonItem
                    key={lesson.id}
                    lesson={lesson}
                    index={index}
                    editingId={editingLesson}
                    onEdit={setEditingLesson}
                    onDelete={handleDeleteLesson}
                    onUpdate={handleUpdateLesson}
                    onCancelEdit={() => setEditingLesson(null)}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

export default ManageLessons;