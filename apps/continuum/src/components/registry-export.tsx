'use client';

import { useMemo, useState } from 'react';
import { DataTable, StatusBadge } from '@afda/continuum-ui';
import { registryRows } from '@/lib/demo-data';

type ExportRecord = (typeof registryRows)[number];

function saveCsv(rows: ExportRecord[]) {
  const header = ['student_number', 'assessment_code', 'result', 'source_system', 'certification_status'];
  const body = rows.map((row) => [row.studentNumber, row.assessmentCode, row.result, row.source, row.status]);
  const csv = [header, ...body].map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'DEMO-continuum-cars-preview.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

export function RegistryExport() {
  const [history, setHistory] = useState([{ id: 'DEMO-EXP-0001', created: '06 Sep 2026 · 16:12', rows: 22, state: 'Outdated' }]);
  const ready = useMemo(() => registryRows.filter((row) => row.status === 'Certified'), []);

  const recordExport = () => {
    saveCsv(ready);
    setHistory((current) => [{ id: `DEMO-EXP-${String(current.length + 2).padStart(4, '0')}`, created: new Date().toLocaleString('en-ZA'), rows: ready.length, state: 'Generated · fictional CSV' }, ...current]);
  };

  return <>
    <div className="continuum-actions" style={{ marginBottom: '1rem' }}><button className="continuum-button" onClick={recordExport}>Generate fictional demo CSV</button></div>
    <DataTable columns={['Student number', 'Assessment / result', 'Source', 'Assessor / finaliser', 'CARS mapping', 'Export']} rows={registryRows.map((row) => [<span className="continuum-code" key={row.studentNumber}>{row.studentNumber}</span>,<span key={`${row.studentNumber}-result`}>{row.assessmentCode} · {row.result}<br/><StatusBadge tone={row.status === 'Certified' ? 'positive' : 'warning'}>{row.status}</StatusBadge></span>,row.source,<span key={`${row.studentNumber}-authority`}>{row.assessor}<br/><small>Finaliser: {row.finaliser}</small></span>,<StatusBadge key={`${row.studentNumber}-mapping`} tone={row.carsMapping === 'Mapped' ? 'positive' : 'critical'}>{row.carsMapping}</StatusBadge>,<StatusBadge key={`${row.studentNumber}-export`} tone={row.exportReady === 'Ready' ? 'positive' : 'warning'}>{row.exportReady}</StatusBadge>])} />
    <h3 style={{ marginTop: '2rem' }}>Export history</h3>
    <DataTable columns={['Export batch', 'Created', 'Rows', 'State']} rows={history.map((item) => [<span className="continuum-code" key={item.id}>{item.id}</span>,item.created,item.rows,<StatusBadge key={`${item.id}-state`} tone={item.state === 'Outdated' ? 'critical' : 'accent'}>{item.state}</StatusBadge>])} />
  </>;
}
