import { type VercelRequest } from "@vercel/node";
import { type PaperFormat, type PDFOptions } from "puppeteer-core";

const VALID_FORMATS: PaperFormat[] = [
    'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6',
    'Letter', 'Legal', 'Tabloid', 'Ledger',
];

export function parsePdfOptions(query: VercelRequest['query']): PDFOptions {
    const {
        format,
        landscape,
        printBackground,
        displayHeaderFooter,
        marginTop,
        marginBottom,
        marginLeft,
        marginRight,
        scale,
        pageRanges,
        width,
        height,
    } = query;

    const paperFormat = typeof format === 'string' && VALID_FORMATS.includes(format as PaperFormat)
        ? (format as PaperFormat)
        : 'A4';

    return {
        format: paperFormat,
        landscape: landscape === 'true',
        printBackground: printBackground !== 'false', // default true
        displayHeaderFooter: displayHeaderFooter === 'true', // default false
        margin: {
            top:    typeof marginTop    === 'string' ? marginTop    : '20mm',
            bottom: typeof marginBottom === 'string' ? marginBottom : '20mm',
            left:   typeof marginLeft   === 'string' ? marginLeft   : '15mm',
            right:  typeof marginRight  === 'string' ? marginRight  : '15mm',
        },
        scale: typeof scale === 'string' ? Math.min(2, Math.max(0.1, parseFloat(scale) || 1)) : 1,
        pageRanges: typeof pageRanges === 'string' ? pageRanges : undefined,
        // width/height override format if both provided
        ...(typeof width === 'string' && typeof height === 'string' && {
            format: undefined,
            width,
            height,
        }),
    };
}
