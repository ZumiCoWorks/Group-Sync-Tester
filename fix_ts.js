const fs = require('fs');
const file = '/Users/zumiww/Documents/AFDAWS Rebuild/apps/slot-booking/src/components/batch-editor-screen.tsx';
let code = fs.readFileSync(file, 'utf8');

// Find the interface
code = code.replace(
  /export interface BatchFormState \{([\s\S]*?)\}/,
  (match, p1) => {
     if (!p1.includes('totalSlotsWanted')) {
        return `export interface BatchFormState {${p1}  totalSlotsWanted: string;\n}`;
     }
     return match;
  }
);

fs.writeFileSync(file, code);
