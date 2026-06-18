export const ALLOWED_ORIGINS = [
    process.env.ALLOWED_ORIGIN,
    'http://localhost:3000',
    'http://localhost:3001',
].filter(Boolean) as string[];