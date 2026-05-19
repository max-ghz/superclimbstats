import { loadLatestCaps } from '../components/latestCaps.js';
import { loadTopPlayers, initServerFilter } from '../components/topPlayers.js';

document.addEventListener("DOMContentLoaded", () => {
    loadLatestCaps();
    loadTopPlayers();
    initServerFilter();

    document.querySelector('.topnav form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = document.getElementById('searchbox')?.value.trim() ?? '';
        loadTopPlayers('all', q);
    });
});
