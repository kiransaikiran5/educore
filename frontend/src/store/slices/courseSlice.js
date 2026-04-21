import { createSlice } from '@reduxjs/toolkit';

const courseSlice = createSlice({
  name: 'courses',
  initialState: { courses: [], currentCourse: null, loading: false, error: null, filters: { category: '', search: '', sortBy: 'created_at', sortOrder: 'desc' }, pagination: { page: 1, limit: 12, total: 0 } },
  reducers: {
    setCourses: (state, action) => { state.courses = action.payload; },
    setCurrentCourse: (state, action) => { state.currentCourse = action.payload; },
    setLoading: (state, action) => { state.loading = action.payload; },
    setError: (state, action) => { state.error = action.payload; },
    setFilters: (state, action) => { state.filters = { ...state.filters, ...action.payload }; },
    setPagination: (state, action) => { state.pagination = { ...state.pagination, ...action.payload }; },
  },
});

export const { setCourses, setCurrentCourse, setLoading, setError, setFilters, setPagination } = courseSlice.actions;
export default courseSlice.reducer;