import { createSlice } from '@reduxjs/toolkit';

const initialState = { user: null, token: localStorage.getItem('access_token'), loading: false, error: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => { state.user = action.payload; },
    setToken: (state, action) => { state.token = action.payload; if (action.payload) localStorage.setItem('access_token', action.payload); else localStorage.removeItem('access_token'); },
    setLoading: (state, action) => { state.loading = action.payload; },
    setError: (state, action) => { state.error = action.payload; },
    logout: (state) => { state.user = null; state.token = null; localStorage.removeItem('access_token'); localStorage.removeItem('user'); },
  },
});

export const { setUser, setToken, setLoading, setError, logout } = authSlice.actions;
export default authSlice.reducer;