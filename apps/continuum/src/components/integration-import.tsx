'use client';

import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { DataTable, StatusBadge } from '@afda/continuum-ui';
import { demoImportRows } from '@/lib/demo-data';

type ImportState = 'matched' | 'duplicate' | 'unmatched';
type ImportRow = { studentNumber: string; studentName: string; assignment: string; result: number; state: ImportState };

const steps = ['Upload', 'Map columns', 'Preview', 'Validate', 'Resolve', 'Confirm'];

function normaliseRows(records: Record<string, unknown>[]): ImportRow[] {
  const seen = new Set<string>();
  return records.map<ImportRow>((record) => {
    const studentNumber = String(record['Student Number'] || record.studentNumber || record['Student ID'] || '').trim();
    const assignment = String(record.Assignment || record.assignment || 'Imported assignment').trim();
    const key = `${studentNumber.toLowerCase()}::${assignment.toLowerCase()}`;
    const duplicate = seen.has(key);
    seen.add(key);
    return {
      studentNumber,
      studentName: String(record['Student Name'] || record.studentName || record.Name || 'Unresolved student').trim(),
      assignment,
      result: Number(record.Result || record.result || record.Mark || 0),
      state: duplicate ? 'duplicate' : studentNumber.startsWith('DEMO-') ? 'matched' : 'unmatched',
    };
  }).filter((row) => row.studentNumber && Number.isFinite(row.result));
}

export function IntegrationImport() {
  const [step, setStep] = useState(0);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [message, setMessage] = useState('');
  const counts = useMemo(() => ({ matched: rows.filter((row) => row.state === 'matched').length, duplicate: rows.filter((row) => row.state === 'duplicate').length, unmatched: rows.filter((row) => row.state === 'unmatched').length }), [rows]);

  const loadDemo = () => { setRows(demoImportRows.map((row) => ({ ...row }))); setStep(1); setMessage('Fictional Teams-style grade file staged locally. Review the proposed column mapping.'); };
  const loadFile = async (file?: File) => {
    if (!file) return;
    const workbook = XLSX.read(await file.arrayBuffer());
    const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
    setRows(normaliseRows(records)); setStep(1); setMessage(`${records.length} source rows staged in browser memory; review the proposed column mapping.`);
  };
  const validate = () => { setStep(3); setMessage(`${counts.duplicate} duplicate and ${counts.unmatched} unmatched record detected.`); };
  const resolve = () => { setRows((current) => current.map((row) => row.state === 'unmatched' ? { ...row, studentNumber: 'DEMO-26028', state: 'matched' } : row)); setStep(4); setMessage('Unmatched fictional student mapped to DEMO-26028. Duplicate remains excluded.'); };
  const confirm = () => { setStep(5); setMessage(`Confirmation preview complete: ${counts.matched} records would be staged and ${counts.duplicate} duplicate would be excluded. Nothing was persisted.`); };

  return <>
    <div className="continuum-stepper" aria-label="Import progress">{steps.map((label, index) => <span key={label} data-active={index === step}>{index + 1}. {label}</span>)}</div>
    <div className="continuum-panel" style={{ marginTop: '1rem' }}>
      <div className="continuum-actions"><button className="continuum-button" onClick={loadDemo}>Load fictional demo file</button><label className="continuum-button continuum-button--secondary">Choose CSV/XLSX<input type="file" accept=".csv,.xlsx,.xls" hidden onChange={(event) => void loadFile(event.target.files?.[0])}/></label>{rows.length > 0 && step === 1 ? <button className="continuum-button continuum-button--secondary" onClick={() => { setStep(2); setMessage('Column mapping accepted for preview only.'); }}>Accept mapping and preview</button> : null}{rows.length > 0 && step === 2 ? <button className="continuum-button continuum-button--secondary" onClick={validate}>Validate staged rows</button> : null}{counts.unmatched > 0 && step >= 3 ? <button className="continuum-button" onClick={resolve}>Resolve demo student</button> : null}{rows.length > 0 && counts.unmatched === 0 && step >= 4 && step < 5 ? <button className="continuum-button" onClick={confirm}>Confirm preview</button> : null}</div>
      {message ? <p role="status" style={{ marginTop: '1rem' }}>{message}</p> : null}
    </div>
    {rows.length && step === 1 ? <DataTable columns={['Source column', 'Continuum field', 'Example']} rows={[[<strong key="m1">Student Number</strong>,'studentNumber',rows[0].studentNumber],[<strong key="m2">Student Name</strong>,'displayName',rows[0].studentName],[<strong key="m3">Assignment</strong>,'externalAssignment.title',rows[0].assignment],[<strong key="m4">Result</strong>,'externalSubmission.numericResult',rows[0].result]]}/> : null}
    {rows.length && step >= 2 ? <DataTable columns={['Student number', 'Student', 'Assignment', 'Result', 'Validation']} rows={rows.map((row, index) => [<span className="continuum-code" key={`${row.studentNumber}-${index}`}>{row.studentNumber}</span>,row.studentName,row.assignment,row.result,<StatusBadge key={`state-${index}`} tone={row.state === 'matched' ? 'positive' : row.state === 'duplicate' ? 'critical' : 'warning'}>{row.state}</StatusBadge>])} /> : null}
  </>;
}
