'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ExternalLink, Link2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { readActivities, type ActivityRecord } from '@/lib/activity-store';

const serviceLinks: Record<string, string> = {
  Schedule: 'http://localhost:3001',
  'Group Sync': 'http://localhost:3002',
  Spaces: 'http://localhost:3004',
};

export default function ActivityPage() {
  const params = useParams<{ activityId: string }>();
  const [activity, setActivity] = useState<ActivityRecord | null>(null);

  useEffect(() => {
    setActivity(readActivities().find((item) => item.id === params.activityId) || null);
  }, [params.activityId]);

  if (!activity) return <PlatformFrame><div className="content"><a className="text-link" href="/">← Back to workspace</a><div className="empty route-empty"><strong>Activity not found</strong><span>Create the activity from the BCom workspace first.</span></div></div></PlatformFrame>;

  return <PlatformFrame><div className="content"><a className="text-link back-link" href="/">← Back to workspace</a><div className="detail-header"><div><p className="eyebrow">BCom workspace / Activity</p><h1>{activity.title}</h1><p>{activity.course} · {activity.date} · Owned by {activity.owner}</p></div><span className="status green">Preparing</span></div><div className="detail-grid"><section className="panel"><div className="panel-head"><div><h2>Connected services</h2><p>Open the service that owns each part of this work.</p></div></div>{activity.services.map((service) => <a className="service-item" href={serviceLinks[service]} key={service} target="_blank" rel="noreferrer"><span className="queue-icon"><Link2 size={15}/></span><span className="service-copy"><strong>{service}</strong><small>{service === 'Schedule' ? 'Create slots, publish availability, and review attendance.' : service === 'Group Sync' ? 'Create a session and manage learning groups.' : 'Request or approve a room and resources.'}</small></span><span className="text-link">Open app <ExternalLink size={12} style={{ display: 'inline', verticalAlign: '-2px' }}/></span></a>)}</section><section className="panel detail-summary"><div className="panel-head"><div><h2>Activity details</h2><p>Context shared across the handoffs.</p></div></div><dl><div><dt>Course</dt><dd>{activity.course}</dd></div><div><dt>Owner</dt><dd>{activity.owner}</dd></div><div><dt>Date</dt><dd>{activity.date}</dd></div><div><dt>Workspace</dt><dd>BCom · Term 3, 2026</dd></div></dl></section></div></div></PlatformFrame>;
}

function PlatformFrame({ children }: { children: ReactNode }) {
  const links = [['Home', '/'], ['My workspace', '/'], ['Activities', '/#activities'], ['Courses', '/#courses'], ['Assessments', '/#assessments'], ['Services', '/#services'], ['People', '/#people'], ['Settings', '/#settings']];
  return <div className="shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">A</div><span className="brand-name">Continuum</span><span className="brand-label">AFDA</span></div><nav className="nav"><div className="nav-label">Workspace</div>{links.map(([label, href]) => <a href={href} key={label} className={label === 'Activities' ? 'active' : ''}><span>{label}</span></a>)}</nav><div className="sidebar-bottom"><div className="workspace-mini"><span className="workspace-mini-badge">BC</span><div><strong>BCom</strong><small>Term 3 · 2026</small></div></div><div className="profile"><span className="avatar">DA</span><div><strong>Demo Admin</strong><small>Workspace administrator</small></div></div></div></aside><main className="main"><header className="topbar"><div className="breadcrumb"><strong>BCom</strong><span>/</span><span>Term 3, 2026</span></div><div className="top-actions"><span className="status">Workspace administrator</span><span className="avatar">DA</span></div></header>{children}</main></div>;
}
