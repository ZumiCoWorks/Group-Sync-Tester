import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';

const fromMock = jest.fn();

jest.mock('../index', () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}));

jest.mock('../middleware', () => ({
  verifyToken: (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
    const userId = req.header('x-test-user-id');
    if (!userId) return res.status(401).json({ success: false, error: { code: 'MISSING_TOKEN' } });
    req.user = { id: userId, role: req.header('x-test-role') || 'lecturer' };
    return next();
  },
  requireRole: (roles: string[]) => (
    req: Request & { user?: { id: string; role: string } },
    res: Response,
    next: NextFunction
  ) => req.user && roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ success: false, error: { code: 'FORBIDDEN' } }),
}));

jest.mock('../db', () => ({
  logAuditEvent: jest.fn(),
  ApiError: class ApiError extends Error {
    constructor(public statusCode: number, public code: string, message: string) {
      super(message);
    }
  },
}));

jest.mock('../services/xlsx-parser', () => ({ parseRosterExcel: jest.fn() }));
jest.mock('../services/grouping-algo', () => ({ generateGroups: jest.fn() }));

import groupSyncRouter from './group-sync';

function queryReturning(value: unknown) {
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn(() => chain);
  chain.eq = jest.fn(() => chain);
  chain.order = jest.fn(() => chain);
  chain.maybeSingle = jest.fn(async () => ({ data: value, error: null }));
  return chain;
}

describe('Group Sync route authorization', () => {
  const app = express();

  beforeAll(() => {
    app.use(express.json());
    app.use('/api/group-sync', groupSyncRouter);
    app.use((error: { statusCode?: number; code?: string; message?: string }, _req: Request, res: Response, _next: NextFunction) => {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { code: error.code || 'INTERNAL_ERROR', message: error.message || 'Unexpected error' },
      });
    });
  });

  beforeEach(() => {
    fromMock.mockReset();
  });

  it('rejects anonymous host mutations before querying the database', async () => {
    const response = await request(app)
      .post('/api/group-sync/session/ABC123/group')
      .send({ groupCount: 2 });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('MISSING_TOKEN');
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('rejects an authenticated non-owner with a valid session code', async () => {
    fromMock.mockReturnValue(queryReturning({
      id: 'session-1',
      code: 'ABC123',
      name: 'Venture Lab',
      host_id: 'host-1',
      status: 'lobby',
      groups: [],
      roster: [],
    }));

    const response = await request(app)
      .post('/api/group-sync/session/ABC123/group')
      .set('x-test-user-id', 'other-user')
      .send({ groupCount: 2 });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('HOST_REQUIRED');
  });

  it('returns only discovery-safe fields to an anonymous reader', async () => {
    fromMock.mockReturnValue(queryReturning({
      id: 'session-1',
      code: 'ABC123',
      name: 'Venture Lab',
      host_id: 'host-1',
      status: 'grouped',
      groups: [{ id: 'group-1', members: [{ name: 'Ada', avatar: 'A' }] }],
      roster: [{ name: 'Ada', studentNumber: 'S1' }],
    }));

    const response = await request(app).get('/api/group-sync/session/ABC123');

    expect(response.status).toBe(200);
    expect(response.body.data.session).toEqual(expect.objectContaining({
      code: 'ABC123',
      name: 'Venture Lab',
      status: 'grouped',
      groups: [],
    }));
    expect(response.body.data.session).not.toHaveProperty('id');
    expect(response.body.data.session).not.toHaveProperty('host_id');
    expect(response.body.data.session).not.toHaveProperty('roster');
    expect(response.body.data.session).not.toHaveProperty('created_at');
    expect(response.body.data.session).not.toHaveProperty('updated_at');
    expect(response.body.data.session).not.toHaveProperty('ended_at');
    expect(response.body.data.participants).toEqual([]);
  });

  it('keeps demo population unavailable in production before database access', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const response = await request(app)
        .post('/api/group-sync/session/ABC123/populate')
        .set('x-test-user-id', 'host-1');

      expect(response.status).toBe(404);
      expect(fromMock).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
    }
  });
});
