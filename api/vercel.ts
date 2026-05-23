import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Dynamically import the backend app
    const { app } = await import('../server/dist/index.js');
    
    if (typeof app === 'function') {
      // For serverless-http wrapped Express apps
      return app(req, res);
    } else if (app && typeof app === 'object') {
      // For direct Express app
      return app(req, res);
    } else {
      throw new Error('Backend app export not found');
    }
  } catch (error: any) {
    console.error('[Vercel API] Backend initialization error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    res.status(500).json({
      error: 'Backend initialization failed',
      message: error.message,
      hint: 'Check server configuration and environment variables',
    });
  }
}
