import { createSlice } from '@reduxjs/toolkit';

const loadNotifications = () => {
  try {
    const serialized = localStorage.getItem('notifications');
    if (serialized === null) {
      return [];
    }
    return JSON.parse(serialized);
  } catch (err) {
    return [];
  }
};

const initialState = {
  notifications: loadNotifications(),
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      // Prevent duplicates by ID
      const exists = state.notifications.find(n => n.id === action.payload.id);
      if (!exists) {
        state.notifications.unshift(action.payload);
        // Keep only last 50 notifications
        if (state.notifications.length > 50) {
          state.notifications.pop();
        }
        localStorage.setItem('notifications', JSON.stringify(state.notifications));
      }
    },
    markAsRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.unread = false;
        localStorage.setItem('notifications', JSON.stringify(state.notifications));
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(n => {
        n.unread = false;
      });
      localStorage.setItem('notifications', JSON.stringify(state.notifications));
    },
    clearNotifications: (state) => {
      state.notifications = [];
      localStorage.setItem('notifications', JSON.stringify(state.notifications));
    }
  },
});

export const { addNotification, markAsRead, markAllAsRead, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
