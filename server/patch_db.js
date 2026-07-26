const fs = require('fs');
const file = 'src/db.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace the throw to include the error
code = code.replace(
  /throw new ApiError\(500, 'DB_ERROR', 'Failed to create batch', batchError\);/g,
  `throw new ApiError(500, 'DB_ERROR', 'Failed to create batch', batchError || undefined);`
);

fs.writeFileSync(file, code);
