const fs = require('fs');
const file = '/Users/zumiww/Documents/AFDAWS Rebuild/server/src/middleware.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/logger.error\(err, 'Token verification failed'\);/, `logger.error({ err, token: token ? "present" : "missing", secret: secret ? "present" : "missing" }, 'Token verification failed detailed');`);

fs.writeFileSync(file, code);
