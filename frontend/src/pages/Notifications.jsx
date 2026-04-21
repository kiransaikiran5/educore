import React, { useEffect, useState } from 'react';
import { notificationService } from '../services/api';
import {
  CheckCircleIcon,
  BellIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { format, isToday, isYesterday, isThisWeek, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

// -----------------------------------------------------------------------------
// Loading Skeleton
// -----------------------------------------------------------------------------
const NotificationSkeleton = () => (
  <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <div className="h-7 bg-gray-200 rounded w-32"></div>
        <div className="h-5 bg-gray-200 rounded w-24"></div>
      </div>
      <div className="divide-y divide-gray-100">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6">
            <div className="flex justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="ml-4 h-5 w-5 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// -----------------------------------------------------------------------------
// Empty State
// -----------------------------------------------------------------------------
const EmptyState = () => (
  <div className="text-center py-16">
    <BellIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
    <p className="text-gray-500">We'll notify you when something important happens.</p>
  </div>
);

// -----------------------------------------------------------------------------
// Error State
// -----------------------------------------------------------------------------
const ErrorState = ({ onRetry }) => (
  <div className="text-center py-16">
    <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load notifications</h3>
    <p className="text-gray-500 mb-4">Please check your connection and try again.</p>
    <button
      onClick={onRetry}
      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
    >
      Try again
    </button>
  </div>
);

// -----------------------------------------------------------------------------
// Group Notifications by Date
// -----------------------------------------------------------------------------
const groupNotificationsByDate = (notifications) => {
  const groups = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  notifications.forEach((notification) => {
    const date = parseISO(notification.created_at);
    if (isToday(date)) {
      groups.today.push(notification);
    } else if (isYesterday(date)) {
      groups.yesterday.push(notification);
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(notification);
    } else {
      groups.older.push(notification);
    }
  });

  return groups;
};

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------
const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationService.getAll();
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    if (unreadCount === 0) return;

    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success(`${unreadCount} notification${unreadCount > 1 ? 's' : ''} marked as read`);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to update notifications');
    }
  };

  // Render
  if (loading) return <NotificationSkeleton />;
  if (error) return <ErrorState onRetry={fetchNotifications} />;

  const grouped = groupNotificationsByDate(notifications);
  const hasUnread = notifications.some((n) => !n.is_read);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600 mt-1">
          Stay updated with your courses, quizzes, and more.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header with actions */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900">All notifications</h2>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {unreadCount} unread
              </span>
            )}
          </div>
          {hasUnread && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition flex items-center"
            >
              <CheckCircleIcon className="h-4 w-4 mr-1.5" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Today */}
            {grouped.today.length > 0 && (
              <div>
                <div className="px-6 py-2 bg-gray-50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Today
                  </span>
                </div>
                {grouped.today.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            )}

            {/* Yesterday */}
            {grouped.yesterday.length > 0 && (
              <div>
                <div className="px-6 py-2 bg-gray-50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Yesterday
                  </span>
                </div>
                {grouped.yesterday.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            )}

            {/* This Week */}
            {grouped.thisWeek.length > 0 && (
              <div>
                <div className="px-6 py-2 bg-gray-50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    This Week
                  </span>
                </div>
                {grouped.thisWeek.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            )}

            {/* Older */}
            {grouped.older.length > 0 && (
              <div>
                <div className="px-6 py-2 bg-gray-50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Older
                  </span>
                </div>
                {grouped.older.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Individual Notification Item
// -----------------------------------------------------------------------------
const NotificationItem = ({ notification, onMarkAsRead }) => {
  const formattedTime = format(parseISO(notification.created_at), 'h:mm a');

  return (
    <div
      className={`p-6 hover:bg-gray-50 transition-colors ${
        !notification.is_read ? 'bg-indigo-50/50 border-l-4 border-indigo-500' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-base font-semibold text-gray-900">
              {notification.title}
            </h3>
            {!notification.is_read && (
              <span className="inline-block w-2 h-2 bg-indigo-600 rounded-full"></span>
            )}
          </div>
          <p className="text-gray-600 text-sm sm:text-base mb-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-400">{formattedTime}</p>
        </div>
        {!notification.is_read && (
          <button
            onClick={() => onMarkAsRead(notification.id)}
            className="ml-4 p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition flex-shrink-0"
            title="Mark as read"
          >
            <CheckCircleIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Notifications;