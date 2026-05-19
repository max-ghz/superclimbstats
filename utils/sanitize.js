// DOMPurify is loaded as a global via <script> in HTML, not imported as a module
// The DOM-based fallback handles cases where it's missing (e.g. unit tests, SSR)
function encodeHtml(str) {
    const node = document.createTextNode(str);
    const div = document.createElement('div');
    div.appendChild(node);
    return div.innerHTML;
}

export function sanitize(value) {
    if (value == null) return '';
    const str = String(value);
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    }
    return encodeHtml(str);
}

export function sanitizeAttr(value) {
    if (value == null) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
