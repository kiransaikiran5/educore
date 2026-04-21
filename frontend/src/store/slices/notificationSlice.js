import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { notifications: [], unreadCount: 0, loading: false },
  reducers: {
    setNotifications: (state, action) => { state.notifications = action.payload; state.unreadCount = action.payload.filter(n => !n.is_read).length; },
    addNotification: (state, action) => { state.notifications.unshift(action.payload); if (!action.payload.is_read) state.unreadCount += 1; },
    markAsRead: (state, action) => { const n = state.notifications.find(x => x.id === action.payload); if (n && !n.is_read) { n.is_read = true; state.unreadCount -= 1; } },
    markAllAsRead: (state) => { state.notifications.forEach(n => n.is_read = true); state.unreadCount = 0; },
    setLoading: (state, action) => { state.loading = action.payload; },
  },
});

export const { setNotifications, addNotification, markAsRead, markAllAsRead, setLoading } = notificationSlice.actions;
export default notificationSlice.reducer;