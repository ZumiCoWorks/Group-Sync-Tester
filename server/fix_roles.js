const fs = require('fs');
const glob = require('glob'); // Not available by default, I'll use simple readdir

const path = require('path');
const dir = 'src/routes';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/requireRole\(\['staff', 'lecturer', 'admin', 'ops'\]\)/g, "requireRole(['tutor_junior', 'tutor_senior', 'lecturer', 'adhoc', 'admin', 'ops_venue_admin'])");
  content = content.replace(/requireRole\(\['staff', 'lecturer', 'admin'\]\)/g, "requireRole(['tutor_junior', 'tutor_senior', 'lecturer', 'adhoc', 'admin'])");
  content = content.replace(/requireRole\(\['ops', 'admin'\]\)/g, "requireRole(['ops_venue_admin', 'admin'])");
  
  fs.writeFileSync(filePath, content);
});
