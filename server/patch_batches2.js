const fs = require('fs');
const file = 'src/routes/batches.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace the ApiError handler to include details
code = code.replace(
  /code: error\.code,\s*message: error\.message,\s*\},\s*\}\);/g,
  `code: error.code,
          message: error.message,
          details: error.details,
        },
      });`
);

fs.writeFileSync(file, code);
