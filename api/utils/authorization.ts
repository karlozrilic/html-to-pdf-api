import { VercelRequest } from '@vercel/node';
import { ALLOWED_ORIGINS } from './constants.js';

export function isAuthorized(req: VercelRequest): boolean {
    const token = req.headers['x-proxy-secret'];

    if (token === process.env.PROXY_SECRET) {
        return true;
    }

    const origin = req.headers.origin || '';
    const referer = req.headers.referer || '';
    const host = `https://${req.headers.host}`;

    const allowed = [
        ...ALLOWED_ORIGINS,
        host,
    ];

    return allowed.some(o =>
        origin.startsWith(o) || referer.startsWith(o)
    );
}