const API_BASE = '/api/html-to-pdf';

// Elements

const urlInput = document.getElementById('url-input');
const optionsToggle = document.getElementById('options-toggle');
const optionsPanel = document.getElementById('options-panel');
const optionsCount = document.getElementById('options-count');
const urlPreview = document.getElementById('url-preview');
const submitBtn = document.getElementById('submit-btn');
const submitText = submitBtn.querySelector('.submit-btn-text');
const submitIcon = submitBtn.querySelector('.submit-btn-icon');
const output = document.getElementById('output');
const outputLabel = document.getElementById('output-label');
const outputBody = document.getElementById('output-body');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const scaleInput = document.getElementById('opt-scale');
const scaleDisplay = document.getElementById('scale-display');

// Options toggle

optionsToggle.addEventListener('click', () => {
    const open = optionsToggle.getAttribute('aria-expanded') === 'true';
    optionsToggle.setAttribute('aria-expanded', String(!open));
    optionsPanel.classList.toggle('open', !open);
});

// Scale slider

scaleInput.addEventListener('input', () => {
    scaleDisplay.textContent = `${parseFloat(scaleInput.value).toFixed(2)}×`;
    updatePreview();
});

// Build query params

function getParams() {
    const raw = urlInput.value.trim();
    const url = raw
        ? raw.startsWith('http')
            ? raw
            : `https://${raw}`
        : null;

    const format = document.getElementById('opt-format').value;
    const landscape = document.getElementById('opt-landscape').checked;
    const printBg = document.getElementById('opt-print-bg').checked;
    const headerFooter = document.getElementById('opt-header-footer').checked;
    const marginTop = document.getElementById('opt-margin-top').value.trim();
    const marginBottom = document.getElementById('opt-margin-bottom').value.trim();
    const marginLeft = document.getElementById('opt-margin-left').value.trim();
    const marginRight = document.getElementById('opt-margin-right').value.trim();
    const scale = parseFloat(scaleInput.value);
    const pageRanges = document.getElementById('opt-page-ranges').value.trim();
    const width = document.getElementById('opt-width').value.trim();
    const height = document.getElementById('opt-height').value.trim();
    const responseFormat = document.querySelector('input[name="responseFormat"]:checked').value;

    const params = new URLSearchParams();

    if (url) params.set('url', url);

    // Only add non-default values to keep the URL clean
    if (format) params.set('format', format);
    if (landscape) params.set('landscape', 'true');
    if (!printBg) params.set('printBackground', 'false');
    if (headerFooter) params.set('displayHeaderFooter', 'true');
    if (marginTop !== '20mm') params.set('marginTop', marginTop);
    if (marginBottom !== '20mm') params.set('marginBottom', marginBottom);
    if (marginLeft !== '15mm') params.set('marginLeft', marginLeft);
    if (marginRight !== '15mm') params.set('marginRight', marginRight);
    if (scale !== 1) params.set('scale', scale.toFixed(2));
    if (pageRanges) params.set('pageRanges', pageRanges);
    if (width && height) {
        params.set('width', width);
        params.set('height', height);
    }
    if (responseFormat) params.set('responseFormat', responseFormat);

    return { params, url, responseFormat };
}

// Count non-default options

function countChangedOptions() {
    let count = 0;

    if (document.getElementById('opt-format').value) count++;
    if (document.getElementById('opt-landscape').checked) count++;
    if (!document.getElementById('opt-print-bg').checked) count++;
    if (document.getElementById('opt-header-footer').checked) count++;
    if (document.getElementById('opt-margin-top').value.trim() !== '20mm') count++;
    if (document.getElementById('opt-margin-bottom').value.trim() !== '20mm') count++;
    if (document.getElementById('opt-margin-left').value.trim() !== '15mm') count++;
    if (document.getElementById('opt-margin-right').value.trim() !== '15mm') count++;
    if (parseFloat(scaleInput.value) !== 1) count++;
    if (document.getElementById('opt-page-ranges').value.trim()) count++;
    if (document.getElementById('opt-width').value.trim() && document.getElementById('opt-height').value.trim()) count++;
    if (document.querySelector('input[name="responseFormat"]:checked').value) count++;

    return count;
}

// Live preview

function updatePreview() {
    const { params } = getParams();

    const count = countChangedOptions();
    optionsCount.textContent = count;
    optionsCount.classList.toggle('visible', count > 0);

    if (!params.has('url')) {
        urlPreview.textContent = '—';
        return;
    }

    urlPreview.textContent = `${window.location.origin}${API_BASE}?${params.toString()}`;
}

// Watch all option inputs
document.querySelectorAll(
    '#opt-format, #opt-landscape, #opt-print-bg, #opt-header-footer, ' +
    '#opt-margin-top, #opt-margin-bottom, #opt-margin-left, #opt-margin-right, ' +
    '#opt-page-ranges, #opt-width, #opt-height, input[name="responseFormat"]'
).forEach(el => el.addEventListener('change', updatePreview));

document.querySelectorAll(
    '#opt-margin-top, #opt-margin-bottom, #opt-margin-left, #opt-margin-right, ' +
    '#opt-page-ranges, #opt-width, #opt-height'
).forEach(el => el.addEventListener('input', updatePreview));

urlInput.addEventListener('input', updatePreview);

// State

let lastPdfBlob = null;
let lastBase64  = null;

function setLoading(on) {
    submitBtn.disabled = on;
    submitBtn.classList.toggle('loading', on);
    submitText.textContent = on ? 'Generating…' : 'Generate PDF';
}

function showOutput({ label, labelClass, body, bodyClass, showCopy, showDownload }) {
    output.hidden = false;
    outputLabel.textContent = label;
    outputLabel.className = `output-label ${labelClass || ''}`;
    outputBody.textContent = body;
    outputBody.className = `output-body ${bodyClass || ''}`;
    copyBtn.hidden   = !showCopy;
    downloadBtn.hidden = !showDownload;
}

// Submit

submitBtn.addEventListener('click', async () => {
    const { params, url, responseFormat } = getParams();
    lastPdfBlob = null;
    lastBase64  = null;

    if (!url) {
        urlInput.focus();
        urlInput.style.outline = '2px solid var(--error)';
        setTimeout(() => { urlInput.style.outline = ''; }, 1200);
        return;
    }

    setLoading(true);

    try {
        const res = await fetch(`${API_BASE}?${params.toString()}`);

        if (responseFormat === 'base64') {
            const json = await res.json();

            if (!res.ok) {
                showOutput({
                    label: `Error ${res.status}`,
                    labelClass: 'error',
                    body: json.error || JSON.stringify(json, null, 2),
                    bodyClass: 'error-text',
                    showCopy: true,
                });
                return;
            }

            lastBase64 = json.pdf;
            showOutput({
                label: `200 OK — base64`,
                labelClass: 'success',
                body: json.pdf.slice(0, 120) + '…',
                showCopy: true,
                showDownload: true,
            });

        } else {
            if (!res.ok) {
                const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
                showOutput({
                    label: `Error ${res.status}`,
                    labelClass: 'error',
                    body: json.error || JSON.stringify(json, null, 2),
                    bodyClass: 'error-text',
                    showCopy: true,
                });
                return;
            }

            const blob = await res.blob();
            lastPdfBlob = blob;

            showOutput({
                label: `200 OK — ${formatBytes(blob.size)}`,
                labelClass: 'success',
                body: `PDF received (${formatBytes(blob.size)})\nContent-Type: ${res.headers.get('content-type')}\n\nClick "Download PDF" to save.`,
                bodyClass: 'success-text',
                showDownload: true,
            });
        }

    } catch (err) {
        showOutput({
            label: 'Network error',
            labelClass: 'error',
            body: err.message,
            bodyClass: 'error-text',
            showCopy: true,
        });
    } finally {
        setLoading(false);
    }
});

// Download

downloadBtn.addEventListener('click', () => {
    const filename = filenameFromUrl(urlInput.value.trim()) + '.pdf';

    if (lastPdfBlob) {
        triggerDownload(URL.createObjectURL(lastPdfBlob), filename);
    } else if (lastBase64) {
        triggerDownload(lastBase64, filename);
    }
});

function triggerDownload(href, filename) {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.click();
}

// Copy

copyBtn.addEventListener('click', () => {
    const text = lastBase64 || outputBody.textContent;
    navigator.clipboard.writeText(text).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1800);
    });
});

// Helpers

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function filenameFromUrl(raw) {
    try {
        const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
        const slug = (u.hostname + u.pathname)
            .replace(/[^a-z0-9]/gi, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 60);
        return slug || 'document';
    } catch {
        return 'document';
    }
}

// Init

updatePreview();