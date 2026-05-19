import { loadAllCaps, initServerFilterCaps, loadCapsStats } from '../components/allCaps.js';

document.addEventListener("DOMContentLoaded", () => {
    loadCapsStats();
    loadAllCaps(1);
    initServerFilterCaps();

    document.querySelector('.topnav form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = document.getElementById('searchbox')?.value.trim() ?? '';
        loadAllCaps(1, null, q);
    });
});
