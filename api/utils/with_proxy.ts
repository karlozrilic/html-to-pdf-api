import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from './cors_headers.js';
import { isAuthorized } from './authorization.js';

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<VercelResponse | void>;

export function withProxy(handler: Handler) {
    return async (req: VercelRequest, res: VercelResponse) => {
        setCorsHeaders(req, res);

        // Handle preflight
        if (req.method === 'OPTIONS') {
            return res.status(204).end();
        }

        if (!isAuthorized(req)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        return handler(req, res);
    }
}