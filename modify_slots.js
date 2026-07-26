const fs = require('fs');
const file = '/Users/zumiww/Documents/AFDAWS Rebuild/apps/slot-booking/src/components/batch-editor-screen.tsx';
let code = fs.readFileSync(file, 'utf8');

// We will bring back the preview, but change it to be a real input.
// Find the initial state:
code = code.replace(
  /dateRangeStart: '',\n\s*dateRangeEnd: '',/,
  "dateRangeStart: '',\n    dateRangeEnd: '',\n    totalSlotsWanted: '',"
);

code = code.replace(
  /export interface BatchFormState \{[\s\S]*?\}/,
  (match) => match.replace("dateRangeEnd: string;", "dateRangeEnd: string;\n  totalSlotsWanted: string;")
);

// We need to modify generateSlotsPayload to handle totalSlotsWanted
code = code.replace(
  /function generateSlotsPayload\([\s\S]*?dayStart = '09:00',[\s\S]*?dayEnd = '17:00',[\s\S]*?lunchStart = '13:00',[\s\S]*?lunchEnd = '14:00'[\s\S]*?\) \{/,
  `function generateSlotsPayload(
    startDateStr: string,
    endDateStr: string,
    slotDurationMinutes: number,
    capacity: number,
    dayStart = '09:00',
    dayEnd = '17:00',
    lunchStart = '13:00',
    lunchEnd = '14:00',
    totalSlotsWantedStr = ''
  ) {`
);

// Modify the logic inside generateSlotsPayload
const logicToReplace = `    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const days: string[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d).toISOString().slice(0, 10));
    }

    const parseMinutes = (time: string, fallback: number) => {
      const [hRaw, mRaw] = time.split(':');
      const h = Number(hRaw);
      const m = Number(mRaw);
      if (!Number.isFinite(h) || !Number.isFinite(m)) return fallback;
      return h * 60 + m;
    };

    const dayStartMinutes = parseMinutes(dayStart, 9 * 60);
    const dayEndMinutes = parseMinutes(dayEnd, 17 * 60);
    const lunchStartMinutes = lunchStart ? parseMinutes(lunchStart, 13 * 60) : 0;
    const lunchEndMinutes = lunchEnd ? parseMinutes(lunchEnd, 14 * 60) : 0;

    const toUtcDate = (dateStr: string, minutesSinceMidnight: number) => {
      const hh = Math.floor(minutesSinceMidnight / 60).toString().padStart(2, '0');
      const mm = (minutesSinceMidnight % 60).toString().padStart(2, '0');
      return new Date(\`\${dateStr}T\${hh}:\${mm}:00.000Z\`);
    };

    const windows: Array<{ start: Date; end: Date }> = [];
    for (const day of days) {
      const morningStart = toUtcDate(day, dayStartMinutes);
      const morningEnd = toUtcDate(day, Math.min(Math.max(lunchStartMinutes, dayStartMinutes), dayEndMinutes));
      if (morningEnd.getTime() > morningStart.getTime()) {
        windows.push({ start: morningStart, end: morningEnd });
      }

      const afternoonStart = toUtcDate(day, Math.min(Math.max(lunchEndMinutes, dayStartMinutes), dayEndMinutes));
      const afternoonEnd = toUtcDate(day, dayEndMinutes);
      if (afternoonEnd.getTime() > afternoonStart.getTime()) {
        windows.push({ start: afternoonStart, end: afternoonEnd });
      }
    }

    const generated: Array<{ start_time: string; end_time: string; capacity: number }> = [];
    const slotDurationMs = slotDurationMinutes * 60 * 1000;

    for (const window of windows) {
      let cursor = new Date(window.start);

      while (cursor.getTime() + slotDurationMs <= window.end.getTime()) {
        const slotEnd = new Date(cursor.getTime() + slotDurationMs);
        generated.push({
          start_time: cursor.toISOString(),
          end_time: slotEnd.toISOString(),
          capacity,
        });
        cursor = slotEnd;
      }
    }`;

const newLogic = `    const startDate = new Date(startDateStr);
    let endDate = new Date(endDateStr);
    const totalWanted = parseInt(totalSlotsWantedStr, 10);
    const hasTotalWanted = !isNaN(totalWanted) && totalWanted > 0;
    
    // If they specified how many slots they want, we generate up to 365 days max to prevent infinite loops
    if (hasTotalWanted) {
       endDate = new Date(startDate);
       endDate.setDate(endDate.getDate() + 365);
    }

    const parseMinutes = (time: string, fallback: number) => {
      const [hRaw, mRaw] = time.split(':');
      const h = Number(hRaw);
      const m = Number(mRaw);
      if (!Number.isFinite(h) || !Number.isFinite(m)) return fallback;
      return h * 60 + m;
    };

    const dayStartMinutes = parseMinutes(dayStart, 9 * 60);
    const dayEndMinutes = parseMinutes(dayEnd, 17 * 60);
    const lunchStartMinutes = lunchStart ? parseMinutes(lunchStart, 13 * 60) : 0;
    const lunchEndMinutes = lunchEnd ? parseMinutes(lunchEnd, 14 * 60) : 0;

    const toUtcDate = (dateStr: string, minutesSinceMidnight: number) => {
      const hh = Math.floor(minutesSinceMidnight / 60).toString().padStart(2, '0');
      const mm = (minutesSinceMidnight % 60).toString().padStart(2, '0');
      return new Date(\`\${dateStr}T\${hh}:\${mm}:00.000Z\`);
    };

    const generated: Array<{ start_time: string; end_time: string; capacity: number }> = [];
    const slotDurationMs = slotDurationMinutes * 60 * 1000;

    let currentDay = new Date(startDate);
    while (currentDay <= endDate) {
      const dayStr = currentDay.toISOString().slice(0, 10);
      
      const windows: Array<{ start: Date; end: Date }> = [];
      const morningStart = toUtcDate(dayStr, dayStartMinutes);
      const morningEnd = toUtcDate(dayStr, Math.min(Math.max(lunchStartMinutes, dayStartMinutes), dayEndMinutes));
      if (morningEnd.getTime() > morningStart.getTime()) {
        windows.push({ start: morningStart, end: morningEnd });
      }

      const afternoonStart = toUtcDate(dayStr, Math.min(Math.max(lunchEndMinutes, dayStartMinutes), dayEndMinutes));
      const afternoonEnd = toUtcDate(dayStr, dayEndMinutes);
      if (afternoonEnd.getTime() > afternoonStart.getTime()) {
        windows.push({ start: afternoonStart, end: afternoonEnd });
      }
      
      for (const window of windows) {
        let cursor = new Date(window.start);
        while (cursor.getTime() + slotDurationMs <= window.end.getTime()) {
          if (hasTotalWanted && generated.length >= totalWanted) {
             return generated;
          }
          const slotEnd = new Date(cursor.getTime() + slotDurationMs);
          generated.push({
            start_time: cursor.toISOString(),
            end_time: slotEnd.toISOString(),
            capacity,
          });
          cursor = slotEnd;
        }
      }
      
      if (hasTotalWanted && generated.length >= totalWanted) {
         break;
      }
      currentDay.setDate(currentDay.getDate() + 1);
    }
`;

code = code.replace(logicToReplace, newLogic);

// Add calculated slots back
const calcMaxToReplace = `  // Real-time slot count calculator so you can verify before publishing
  const calculatedMaxSlots = useMemo(() => {
    if (!formState.dateRangeStart || !formState.dateRangeEnd) return null;
    const slotDuration = Number(formState.slotDurationMinutes) || 0;
    if (slotDuration <= 0) return null;
    
    // Calculate without any totalSlotsWanted limit to find the maximum possible
    const slots = generateSlotsPayload(
      formState.dateRangeStart,
      formState.dateRangeEnd,
      slotDuration,
      1,
      formState.dayStartTime,
      formState.dayEndTime,
      formState.lunchBreakStart,
      formState.lunchBreakEnd
    );
    return slots.length;
  }, [formState.dateRangeStart, formState.dateRangeEnd, formState.slotDurationMinutes, formState.dayStartTime, formState.dayEndTime, formState.lunchBreakStart, formState.lunchBreakEnd]);`;

const newCalcMax = `  const generatedSlotsPreview = useMemo(() => {
    if (!formState.dateRangeStart) return [];
    if (!formState.dateRangeEnd && !formState.totalSlotsWanted) return [];
    
    const slotDuration = Number(formState.slotDurationMinutes) || 0;
    if (slotDuration <= 0) return [];
    
    return generateSlotsPayload(
      formState.dateRangeStart,
      formState.dateRangeEnd || formState.dateRangeStart,
      slotDuration,
      1,
      formState.dayStartTime,
      formState.dayEndTime,
      formState.lunchBreakStart,
      formState.lunchBreakEnd,
      formState.totalSlotsWanted
    );
  }, [formState.dateRangeStart, formState.dateRangeEnd, formState.totalSlotsWanted, formState.slotDurationMinutes, formState.dayStartTime, formState.dayEndTime, formState.lunchBreakStart, formState.lunchBreakEnd]);`;

code = code.replace(calcMaxToReplace, newCalcMax);

// Fix the call inside handleSubmit
code = code.replace(
  /const generatedSlots = generateSlotsPayload\([\s\S]*?formState\.lunchBreakEnd\n\s*\);/,
  `const generatedSlots = generateSlotsPayload(
        formState.dateRangeStart,
        formState.dateRangeEnd || formState.dateRangeStart,
        slotDuration,
        perSlotCap,
        formState.dayStartTime,
        formState.dayEndTime,
        formState.lunchBreakStart,
        formState.lunchBreakEnd,
        formState.totalSlotsWanted
      );`
);

// Re-add the totalSlotsWanted input and the preview box
const renderToReplace = `                  <label className="mb-1 block text-sm font-medium text-heading">End Date</label>
                  <input
                    type="date"
                    required
                    value={formState.dateRangeEnd}
                    onChange={handleChange('dateRangeEnd')}
                    className="w-full rounded-lg border border-muted bg-white p-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>`;
              
const newRender = `                  <label className="mb-1 block text-sm font-medium text-heading">
                    End Date <span className="text-body font-normal">(Optional if total slots given)</span>
                  </label>
                  <input
                    type="date"
                    required={!formState.totalSlotsWanted}
                    value={formState.dateRangeEnd}
                    onChange={handleChange('dateRangeEnd')}
                    className="w-full rounded-lg border border-muted bg-white p-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-heading">
                  Total Slots Needed <span className="text-body font-normal">(Auto-calculates days)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 30"
                  value={formState.totalSlotsWanted}
                  onChange={handleChange('totalSlotsWanted')}
                  className="w-full rounded-lg border border-muted bg-white p-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              {generatedSlotsPreview.length > 0 && (
                <div className="mt-8 rounded-2xl border border-blue-500/30 bg-blue-50 p-4">
                  <h3 className="text-sm font-semibold text-blue-900">Slot Generation Preview</h3>
                  <p className="mt-1 text-sm text-blue-800">
                    This batch will automatically generate <span className="font-bold">{generatedSlotsPreview.length} slots</span>.
                    {formState.totalSlotsWanted ? (
                      <span> It will stop exactly when it reaches your requested amount.</span>
                    ) : (
                      <span> To stop playing the guessing game, type a number in <b>Total Slots Needed</b> and it will calculate the end date for you!</span>
                    )}
                  </p>
                </div>
              )}`;

code = code.replace(renderToReplace, newRender);

fs.writeFileSync(file, code);
