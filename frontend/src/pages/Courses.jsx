import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { courseService } from '../services/api';
import { StarIcon, UsersIcon } from '@heroicons/react/24/solid';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', search: '', sortBy: 'created_at', sortOrder: 'desc' });
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0 });

  useEffect(() => { fetchCourses(); fetchCategories(); }, [filters, pagination.page]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const skip = (pagination.page - 1) * pagination.limit;
      const res = await courseService.getAll({ skip, limit: pagination.limit, ...filters });
      setCourses(res.data.courses);
      setPagination(prev => ({ ...prev, total: res.data.total }));
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try { const res = await courseService.getCategories(); setCategories(res.data); } catch (error) { console.error(error); }
  };

  const handleSearch = (e) => { e.preventDefault(); setPagination(prev => ({ ...prev, page: 1 })); fetchCourses(); };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Explore Courses</h1>
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <input type="text" placeholder="Search courses..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"><option value="">All Categories</option>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Search</button>
          </div>
          <div className="flex gap-4">
            <select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })} className="rounded-md border-gray-300"><option value="created_at">Latest</option><option value="price">Price</option><option value="rating">Rating</option></select>
            <select value={filters.sortOrder} onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })} className="rounded-md border-gray-300"><option value="desc">Descending</option><option value="asc">Ascending</option></select>
          </div>
        </form>
      </div>
      {loading ? <div className="flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div> : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <Link key={course.id} to={`/courses/${course.id}`} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-indigo-600">{course.category}</span><span className="text-lg font-bold text-gray-900">${course.price === 0 ? 'Free' : course.price}</span></div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center"><StarIcon className="h-5 w-5 text-yellow-400 mr-1" /><span>{course.average_rating?.toFixed(1) || 'No ratings'}</span></div>
                    <div className="flex items-center"><UsersIcon className="h-5 w-5 text-gray-400 mr-1" /><span>{course.total_enrollments || 0} students</span></div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200"><p className="text-sm text-gray-500">Instructor: {course.instructor_name}</p></div>
                </div>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Previous</button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i+1} onClick={() => setPagination(prev => ({ ...prev, page: i+1 }))} className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pagination.page === i+1 ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}>{i+1}</button>
                ))}
                <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Next</button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Courses;