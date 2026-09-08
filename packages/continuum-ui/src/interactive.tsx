'use client';

import { useRef, type ReactNode } from 'react';

export function Dialog({ triggerLabel, title, children }: { triggerLabel: string; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  return <><button className="continuum-button continuum-button--secondary" onClick={() => ref.current?.showModal()}>{triggerLabel}</button><dialog className="continuum-dialog" ref={ref} aria-labelledby="continuum-dialog-title"><form method="dialog"><button className="continuum-dialog__close" aria-label="Close dialog">×</button></form><h2 id="continuum-dialog-title">{title}</h2>{children}<form method="dialog"><button className="continuum-button">Done</button></form></dialog></>;
}
