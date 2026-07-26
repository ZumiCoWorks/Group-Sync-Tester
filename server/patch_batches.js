const fs = require('fs');
const file = 'src/routes/batches.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace the generic 500 error for ensureStaffIdentity with the exact error details
code = code.replace(
  /return res\.status\(500\)\.json\(\{\s*success: false,\s*error: \{\s*code: 'USER_BOOTSTRAP_FAILED',\s*message: 'Unable to prepare staff account for batch creation',\s*\},\s*\}\);/g,
  `return res.status(500).json({
        success: false,
        error: {
          code: 'USER_BOOTSTRAP_FAILED',
          message: 'Unable to prepare staff account for batch creation',
          details: profileErr,
        },
      });`
);

// Replace the generic 500 error in createBatch catch block
code = code.replace(
  /return res\.status\(500\)\.json\(\{\s*success: false,\s*error: \{\s*code: 'INTERNAL_ERROR',\s*message: 'An unexpected error occurred',\s*\},\s*\}\);/g,
  `return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred: ' + (error instanceof Error ? error.message : JSON.stringify(error)),
        details: error,
      },
    });`
);

fs.writeFileSync(file, code);
