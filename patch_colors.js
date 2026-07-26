const fs = require('fs');

const file = 'app/src/app/staff/page.tsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace cyan colors with red/rose
  content = content.replace(/cyan-400/g, 'red-600');
  content = content.replace(/cyan-200/g, 'red-200');
  content = content.replace(/cyan-300/g, 'red-500');
  content = content.replace(/cyan-950/g, 'red-950');
  
  // Also fix the radial gradient to match the other pages if needed
  content = content.replace(/rgba\(56,189,248,0\.18\)/g, 'rgba(239,68,68,0.15)'); // cyan to red
  content = content.replace(/rgba\(251,191,36,0\.10\)/g, 'rgba(239,68,68,0.08)'); // yellow to red
  
  fs.writeFileSync(file, content);
}
