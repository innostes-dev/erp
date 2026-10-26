'use client';

import { NotificationBell, NotificationItem } from '@innostes/ui';
import { MessageSquare, Calendar, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export default function NotificationBellDemo() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'New message from Sarah',
      description: 'Can we review the latest designs?',
      time: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
      icon: <MessageSquare />,
      tone: 'primary',
      read: false,
    },
    {
      id: '2',
      title: 'Meeting starting soon',
      description: 'Weekly sync with the team',
      time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      icon: <Calendar />,
      tone: 'chart-2',
      read: false,
    },
    {
      id: '3',
      title: 'Server downtime alert',
      description: 'Production DB experienced a blip',
      time: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      icon: <AlertTriangle />,
      tone: 'destructive',
      read: true,
    },
  ]);

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleItemClick = (item: NotificationItem) => {
    setNotifications(notifications.map(n => n.id === item.id ? { ...n, read: true } : n));
  };

  return (
    <div className="flex items-center justify-center p-12">
      <NotificationBell
        items={notifications}
        onMarkAllRead={handleMarkAllRead}
        onItemClick={handleItemClick}
        viewAll={{
          onClick: () => alert('Navigating to all notifications...'),
        }}
      />
    </div>
  );
}
