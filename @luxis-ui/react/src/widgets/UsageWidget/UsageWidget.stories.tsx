import React from 'react';
import { UsageWidget } from './UsageWidget';
import { ServerIcon, InboxIcon, UserIcon } from '../../icons/IconComponents';

export default {
  title: 'Widgets/UsageWidget',
  component: UsageWidget,
};

export const Basic = () => (
  <div style={{ maxWidth: 400 }}>
    <UsageWidget
      title="Cloud Storage"
      description="Your personal drive"
      value={45}
      limit={100}
      unit="GB"
      icon={<ServerIcon />}
    />
  </div>
);

export const WarningState = () => (
  <div style={{ maxWidth: 400 }}>
    <UsageWidget
      title="API Requests"
      description="Monthly quota"
      value={9200}
      limit={10000}
      unit="calls"
      actionLabel="Upgrade"
      onActionClick={() => alert('Upgrade clicked')}
      icon={<InboxIcon />}
    />
  </div>
);

export const ErrorState = () => (
  <div style={{ maxWidth: 400 }}>
    <UsageWidget
      title="Team Members"
      value={5}
      limit={5}
      unit="seats"
      actionLabel="Add Seats"
      onActionClick={() => alert('Add seats clicked')}
      icon={<UserIcon />}
    />
  </div>
);

export const MinimalTheme = () => (
  <div style={{ maxWidth: 400 }}>
    <UsageWidget
      theme="minimal"
      title="Bandwidth"
      value={2.4}
      limit={5}
      unit="TB"
      variant="success"
    />
  </div>
);
