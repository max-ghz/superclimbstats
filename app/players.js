import { loadAllPlayers, initServerFilterPlayers } from '../components/allPlayers.js';

document.addEventListener("DOMContentLoaded", () => {
    loadAllPlayers(1);
    initServerFilterPlayers();

    document.querySelector('.topnav form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = document.getElementById('searchbox')?.value.trim() ?? '';
        loadAllPlayers(1, null, q);
    });
});
