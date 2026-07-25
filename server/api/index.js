console.log('[API Wrapper] Starting...', {
	env: process.env.NODE_ENV,
	supabase_url: process.env.SUPABASE_URL ? '***present***' : 'missing',
	supabase_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? '***present***' : 'missing',
});

const app = require('../dist/index').default;

console.log('[API Wrapper] App imported:', typeof app);

module.exports = app;

