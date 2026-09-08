import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

export const continuumNav = [
  { href: '/', label: 'Home', index: '00' },
  { href: '/ventures', label: 'Ventures', index: '01' },
  { href: '/schedule', label: 'Schedule', index: '02' },
  { href: '/groups', label: 'Groups', index: '03' },
  { href: '/spaces', label: 'Spaces & Resources', index: '04' },
  { href: '/learning', label: 'Learning & Assessment', index: '05' },
  { href: '/content', label: 'Content Library', index: '06' },
  { href: '/registry', label: 'Registry & Reporting', index: '07' },
  { href: '/integrations', label: 'Data & Integrations', index: '08' },
  { href: '/admin', label: 'Administration', index: '09' },
] as const;

export type Tone = 'neutral' | 'positive' | 'warning' | 'critical' | 'accent';

export function ProductMark() {
  return (
    <div className="continuum-mark" aria-label="AFDA Continuum">
      <span className="continuum-mark__afda">AFDA</span>
      <span className="continuum-mark__divider" aria-hidden="true" />
      <span className="continuum-mark__name">Continuum</span>
      <span className="continuum-mark__poc">Proof of Concept</span>
    </div>
  );
}

export function AppFrame({ activePath, children, headerTools }: { activePath: string; children: ReactNode; headerTools?: ReactNode }) {
  return (
    <div className="continuum-frame">
      <aside className="continuum-sidebar">
        <ProductMark />
        <nav aria-label="Continuum sections" className="continuum-nav">
          {continuumNav.map((item) => {
            const active = item.href === '/' ? activePath === '/' : activePath.startsWith(item.href);
            return (
              <a key={item.href} href={item.href} className="continuum-nav__item" aria-current={active ? 'page' : undefined}>
                <span>{item.index}</span>
                {item.label}
              </a>
            );
          })}
        </nav>
        <div className="continuum-sidebar__foot">
          <span className="continuum-live-dot" aria-hidden="true" />
          Demo environment
          <small>Fictional data only</small>
        </div>
      </aside>
      <div className="continuum-workspace">
        <header className="continuum-topbar">
          <span>AFDA production-venture platform</span>
          {headerTools || <div><strong>Continuum</strong><span aria-hidden="true">C</span></div>}
        </header>
        <main className="continuum-main">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, summary, actions }: { eyebrow?: string; title: string; summary: string; actions?: ReactNode }) {
  return (
    <header className="continuum-page-header">
      <div>
        {eyebrow ? <p className="continuum-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        <p>{summary}</p>
      </div>
      {actions ? <div className="continuum-actions">{actions}</div> : null}
    </header>
  );
}

export function DemoBanner({ children }: { children: ReactNode }) {
  return <div className="continuum-demo-banner"><strong>POC · DEMO MODE</strong><span>{children}</span></div>;
}

export function Alert({ title, children, tone = 'neutral' }: { title: string; children: ReactNode; tone?: Tone }) {
  return <div className={`continuum-alert continuum-alert--${tone}`} role={tone === 'critical' ? 'alert' : 'status'}><strong>{title}</strong><div>{children}</div></div>;
}

export function TextInput({ label, id, hint, ...props }: { label: string; id: string; hint?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>) {
  return <div className="continuum-field"><label htmlFor={id}>{label}</label><input id={id} aria-describedby={hint ? `${id}-hint` : undefined} {...props}/>{hint ? <small id={`${id}-hint`}>{hint}</small> : null}</div>;
}

export function SelectInput({ label, id, children, ...props }: { label: string; id: string; children: ReactNode } & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'>) {
  return <div className="continuum-field"><label htmlFor={id}>{label}</label><select id={id} {...props}>{children}</select></div>;
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return <div className="continuum-loading" role="status"><span aria-hidden="true" />{label}</div>;
}

export function SourceBadge({ source }: { source: string }) {
  return <span className="continuum-source"><span aria-hidden="true" />{source}</span>;
}

export function IntegrationStatus({ provider, status, currentMode, futureMode }: { provider: string; status: 'connected' | 'not_connected' | 'demo'; currentMode: string; futureMode: string }) {
  return <div className="continuum-integration-status"><div><strong>{provider}</strong><StatusBadge tone={status === 'connected' ? 'positive' : status === 'demo' ? 'accent' : 'warning'}>{status.replace('_', ' ')}</StatusBadge></div><dl><div><dt>Current</dt><dd>{currentMode}</dd></div><div><dt>Future</dt><dd>{futureMode}</dd></div></dl></div>;
}

export function ModuleDeepLink({ href, moduleName, source, status = 'configured', requiresAuthentication = true }: { href?: string; moduleName: string; source: string; status?: 'configured' | 'disconnected'; requiresAuthentication?: boolean }) {
  return <div className="continuum-module-deep-link"><div><SourceBadge source={source}/><strong>{moduleName}</strong><small>{requiresAuthentication ? 'Authentication may be requested by the module.' : 'Public module entry point.'}</small></div>{href && status === 'configured' ? <a className="continuum-button continuum-button--secondary" href={href} target="_blank" rel="noreferrer">Open separate module ↗</a> : <StatusBadge tone="warning">Not configured</StatusBadge>}</div>;
}

export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`continuum-status continuum-status--${tone}`}>{children}</span>;
}

export function Metric({ label, value, note, tone = 'neutral' }: { label: string; value: ReactNode; note?: string; tone?: Tone }) {
  return (
    <div className={`continuum-metric continuum-metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

export function Section({ id, title, kicker, action, children }: { id?: string; title: string; kicker?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="continuum-section" id={id}>
      <div className="continuum-section__head">
        <div>{kicker ? <p className="continuum-eyebrow">{kicker}</p> : null}<h2>{title}</h2></div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ActionLink({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) {
  return <a className={secondary ? 'continuum-button continuum-button--secondary' : 'continuum-button'} href={href}>{children}</a>;
}

export function DataTable({ caption, columns, rows }: { caption?: string; columns: string[]; rows: ReactNode[][] }) {
  const accessibleCaption = caption || `${columns.join(', ')} records`;
  return (
    <div className="continuum-table-wrap" role="region" aria-label={`${accessibleCaption}. Scroll horizontally when needed.`} tabIndex={0}>
      <table className="continuum-table">
        <caption className="continuum-sr-only">{accessibleCaption}</caption>
        <thead><tr>{columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>
        <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} data-label={columns[cellIndex]}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="continuum-empty"><span aria-hidden="true">—</span><h3>{title}</h3><p>{children}</p>{action ? <div className="continuum-empty__action">{action}</div> : null}</div>;
}

export function Progress({ value, label }: { value: number; label: string }) {
  const normalized = Math.max(0, Math.min(100, value));
  return <div className="continuum-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={normalized}><div style={{ width: `${normalized}%` }} /><span>{label}</span></div>;
}
