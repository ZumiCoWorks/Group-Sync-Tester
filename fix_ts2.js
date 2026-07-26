const fs = require('fs');
const file = '/Users/zumiww/Documents/AFDAWS Rebuild/apps/slot-booking/src/components/batch-editor-screen.tsx';
let code = fs.readFileSync(file, 'utf8');

// Find the useEffect that sets the form state
code = code.replace(
  /setFormState\(\{([\s\S]*?)lunchBreakEnd: batchSummary.lunch_break_end \|\| '',\n\s*\}\);/,
  (match, p1) => {
     return `setFormState({${p1}lunchBreakEnd: batchSummary.lunch_break_end || '',\n        totalSlotsWanted: '',\n      });`;
  }
);

fs.writeFileSync(file, code);
