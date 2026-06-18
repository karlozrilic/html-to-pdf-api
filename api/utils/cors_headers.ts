import { VercelRequest, VercelResponse } from '@vercel/node';
import { ALLOWED_ORIGINS } from './constants.js';

export function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
    const origin = req.headers.origin || '';

    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'x-proxy-secret');
}