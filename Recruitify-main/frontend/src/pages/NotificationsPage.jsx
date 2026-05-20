import { useNavigate } from "@tanstack/react-router";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  useGetNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "../hooks/useQueries";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Bell,
  CheckCheck,
  Trash2,
  Briefcase,
  FileText,
  UserPlus,
  MessageSquare,
  AlertCircle,
  Info,
} from "lucide-react";

import { toast } from "sonner";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";

export default function NotificationsPage() {
  const navigate = useNavigate();
  
  usePageTitle('Notifications');
  
  const { data: notifications = [], isLoading } = useGetNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (notificationId) => {
    try {
      await markRead.mutateAsync(notificationId);
      toast.success("Notification marked as read");
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification.mutateAsync(notificationId);
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkRead(notification.id);
    }

    if (notification.application_id) {
      navigate({ to: "/candidate/applications" });
    } else if (notification.vacancy_id) {
      navigate({ to: "/candidate/jobs" });
    }
  };

  const getNotificationIcon = (type) => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case "application_status":
        return <FileText className={iconClass} />;
      case "new_application":
        return <FileText className={iconClass} />;
      case "new_vacancy":
        return <Briefcase className={iconClass} />;
      case "vacancy_closed":
        return <AlertCircle className={iconClass} />;
      case "application_submitted":
        return <CheckCheck className={iconClass} />;
      case "new_follower":
        return <UserPlus className={iconClass} />;
      case "message":
        return <MessageSquare className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  const getIconBgColor = (type, isRead) => {
    if (isRead) return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
    
    switch (type) {
      case "new_follower":
        return "bg-gradient-to-br from-green-500 to-emerald-600 text-white";
      case "new_application":
        return "bg-gradient-to-br from-blue-500 to-blue-600 text-white";
      case "application_status":
        return "bg-gradient-to-br from-cyan-500 to-blue-600 text-white";
      case "vacancy_closed":
        return "bg-gradient-to-br from-red-500 to-red-600 text-white";
      case "application_submitted":
        return "bg-gradient-to-br from-orange-500 to-amber-600 text-white";
      case "message":
        return "bg-gradient-to-br from-purple-500 to-purple-600 text-white";
      case "new_vacancy":
        return "bg-gradient-to-br from-indigo-500 to-purple-600 text-white";
      default:
        return "bg-gradient-to-br from-gray-500 to-gray-600 text-white";
    }
  };

  const groupNotificationsByDate = (notifications) => {
    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    notifications.forEach(notification => {
      const date = new Date(notification.created_at);
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

  const groupedNotifications = groupNotificationsByDate(notifications);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-12 w-64 mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const renderNotificationGroup = (title, notificationsList) => {
    if (notificationsList.length === 0) return null;

    return (
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 sm:mb-4">
          {title}
        </h2>
        <div className="space-y-2 sm:space-y-3">
          {notificationsList.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-3 sm:p-4 rounded-xl border cursor-pointer transition-all hover-lift animate-fade-in ${
                !notification.is_read
                  ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`p-2 sm:p-3 rounded-full shadow-md flex-shrink-0 ${getIconBgColor(notification.notification_type, notification.is_read)}`}>
                  {getNotificationIcon(notification.notification_type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs px-2 py-0 shadow-sm">
                          New
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                      {new Date(notification.created_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {notification.message}
                  </p>

                  {notification.related_user && (
                    <div className="flex items-center gap-2 mt-2 sm:mt-3">
                      <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                        <AvatarImage src={notification.related_user.profile_picture} />
                        <AvatarFallback className="text-xs">
                          {notification.related_user.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {notification.related_user.name}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notification.id);
                  }}
                  disabled={deleteNotification.isPending}
                  className="shrink-0 h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Trash2 className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8 overflow-x-hidden">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                {unreadCount > 0 && (
                  <Badge className="bg-green-500 text-white px-3 py-1">
                    {unreadCount} Unread
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    onClick={handleMarkAllRead}
                    variant="outline"
                    size="sm"
                    disabled={markAllRead.isPending}
                    className="gap-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs sm:text-sm"
                  >
                    <CheckCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Mark all as read</span>
                    <span className="sm:hidden">Mark all</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Stay updated with your latest activities, applications, and system alerts.
            </p>
          </div>

          {/* Notifications */}
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Bell className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-light text-gray-900 dark:text-white mb-2">
                That's all for now
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                You've caught up with all your notifications from the last 7 days.
              </p>
              <Button variant="link" className="text-blue-600 dark:text-blue-400">
                View Notification Settings
              </Button>
            </div>
          ) : (
            <>
              {renderNotificationGroup("TODAY", groupedNotifications.today)}
              {renderNotificationGroup("YESTERDAY", groupedNotifications.yesterday)}
              {renderNotificationGroup("EARLIER THIS WEEK", groupedNotifications.thisWeek)}
              {renderNotificationGroup("OLDER", groupedNotifications.older)}

              {/* End Message */}
              <div className="text-center py-12 border-t border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-light text-gray-900 dark:text-white mb-2">
                  That's all for now
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  You've caught up with all your notifications from the last 7 days.
                </p>
                <Button variant="link" className="text-blue-600 dark:text-blue-400">
                  View Notification Settings
                </Button>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
