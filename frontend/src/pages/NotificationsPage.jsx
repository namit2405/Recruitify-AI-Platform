import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  useGetNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useBulkDeleteNotifications,
} from "../hooks/useQueries";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Bell, CheckCheck, Trash2, Briefcase, FileText,
  UserPlus, MessageSquare, AlertCircle, Info, Heart,
} from "lucide-react";

import { toast } from "sonner";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";

const getNotificationIcon = (type) => {
  const cls = "h-4 w-4";
  switch (type) {
    case "application_status":    return <FileText className={cls} />;
    case "new_application":       return <FileText className={cls} />;
    case "new_vacancy":           return <Briefcase className={cls} />;
    case "vacancy_closed":        return <AlertCircle className={cls} />;
    case "application_submitted": return <CheckCheck className={cls} />;
    case "new_follower":          return <UserPlus className={cls} />;
    case "message":               return <MessageSquare className={cls} />;
    case "post_like":             return <Heart className={cls} />;
    case "post_comment":          return <MessageSquare className={cls} />;
    case "job_offer":             return <Briefcase className={cls} />;
    case "offer_response":        return <CheckCheck className={cls} />;
    default:                      return <Info className={cls} />;
  }
};

const getIconBg = (type, isRead) => {
  if (isRead) return "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300";
  const map = {
    new_follower:          "bg-green-500 text-white",
    new_application:       "bg-blue-500 text-white",
    application_status:    "bg-cyan-500 text-white",
    vacancy_closed:        "bg-red-500 text-white",
    application_submitted: "bg-orange-500 text-white",
    message:               "bg-purple-500 text-white",
    new_vacancy:           "bg-indigo-500 text-white",
    post_like:             "bg-pink-500 text-white",
    post_comment:          "bg-violet-500 text-white",
    job_offer:             "bg-emerald-500 text-white",
    offer_response:        "bg-teal-500 text-white",
  };
  return map[type] || "bg-gray-500 text-white";
};

const groupByDate = (list) => {
  const g = { today: [], yesterday: [], thisWeek: [], older: [] };
  list.forEach(n => {
    const d = new Date(n.created_at);
    if (isToday(d))          g.today.push(n);
    else if (isYesterday(d)) g.yesterday.push(n);
    else if (isThisWeek(d))  g.thisWeek.push(n);
    else                     g.older.push(n);
  });
  return g;
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  usePageTitle('Notifications');

  const { data: notifications = [], isLoading } = useGetNotifications();
  const markRead      = useMarkNotificationRead();
  const markAllRead   = useMarkAllNotificationsRead();
  const deleteOne     = useDeleteNotification();
  const bulkDelete    = useBulkDeleteNotifications();

  const [selected, setSelected] = useState(new Set());

  const unreadCount   = notifications.filter(n => !n.is_read).length;
  const allIds        = notifications.map(n => n.id);
  const allSelected   = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someSelected  = selected.size > 0;

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    try {
      await deleteOne.mutateAsync(id);
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
      toast.success("Notification deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const handleBulkDelete = async () => {
    const ids = selected.size === allIds.length ? 'all' : [...selected];
    try {
      await bulkDelete.mutateAsync(ids);
      setSelected(new Set());
      toast.success(`${selected.size} notification${selected.size !== 1 ? 's' : ''} deleted`);
    } catch { toast.error("Failed to delete"); }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
      toast.success("All notifications marked as read");
    } catch { toast.error("Failed to mark all as read"); }
  };

  const handleClick = (n) => {
    if (!n.is_read) markRead.mutateAsync(n.id).catch(() => {});
    if (n.application_id) navigate({ to: "/candidate/applications" });
    else if (n.vacancy_id) navigate({ to: "/candidate/jobs" });
  };

  const grouped = groupByDate(notifications);

  const renderGroup = (label, list) => {
    if (!list.length) return null;
    return (
      <div className="mb-6" key={label}>
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
          {label}
        </h2>
        <div className="space-y-1.5">
          {list.map(n => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              className={`flex items-start gap-3 px-3 py-3 rounded-xl border cursor-pointer transition-all group ${
                selected.has(n.id)
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                  : !n.is_read
                  ? "bg-blue-50/60 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 hover:border-blue-300"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
              }`}
            >
              {/* Checkbox */}
              <div onClick={e => { e.stopPropagation(); toggle(n.id); }} className="mt-0.5 flex-shrink-0">
                <Checkbox
                  checked={selected.has(n.id)}
                  className="border-2 border-gray-400 dark:border-gray-300 bg-white dark:bg-gray-800 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                />
              </div>

              {/* Icon */}
              <div className={`p-2 rounded-full flex-shrink-0 ${getIconBg(n.notification_type, n.is_read)}`}>
                {getNotificationIcon(n.notification_type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">{n.title}</span>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{n.message}</p>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 block">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </span>
              </div>

              {/* Delete single */}
              <button
                onClick={e => handleDelete(n.id, e)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 flex-shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-3xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="bg-blue-500 text-white px-2 py-0.5 text-xs">{unreadCount} unread</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markAllRead.isPending}
                className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white h-8">
                <CheckCheck className="mr-1.5 h-3.5 w-3.5" /> Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="outline" size="sm"
                onClick={() => bulkDelete.mutateAsync('all').then(() => { setSelected(new Set()); toast.success("All notifications deleted"); }).catch(() => toast.error("Failed to delete"))}
                disabled={bulkDelete.isPending}
                className="text-xs border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 h-8">
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete all
              </Button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">All caught up!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet.</p>
          </div>
        ) : (
          <>
            {/* Selection toolbar */}
            <div className="flex items-center gap-3 mb-4 px-1">
              <div onClick={toggleAll} className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  checked={allSelected}
                  className="border-2 border-gray-400 dark:border-gray-300 bg-white dark:bg-gray-800 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {allSelected ? "Deselect all" : "Select all"}
                </span>
              </div>

              {someSelected && (
                <>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {selected.size} selected
                  </span>
                </>
              )}
            </div>

            {renderGroup("TODAY", grouped.today)}
            {renderGroup("YESTERDAY", grouped.yesterday)}
            {renderGroup("EARLIER THIS WEEK", grouped.thisWeek)}
            {renderGroup("OLDER", grouped.older)}
          </>
        )}

      </main>

      <Footer />
    </div>
  );
}
