console.log('[API Wrapper] Starting...', {
	env: process.env.NODE_ENV,
	supabase_url: process.env.SUPABASE_URL ? '***present***' : 'missing',
	supabase_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? '***present***' : 'missing',
});

const serverless = require('serverless-http');
const app = require('../index').default;

console.log('[API Wrapper] App imported:', typeof app);

const handler = serverless(app, {
	request: (request, event, context) => {
		console.log('[API Wrapper] Request:', {
			path: request.url,
			method: request.method,
			headers: request.headers,
		});
	},
});

console.log('[API Wrapper] Handler ready');

module.exports = handler;
