import { loadPlayerProfile } from '../components/playerProfile.js';

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
    const server = urlParams.get('server');

    if (!username) {
        document.getElementById("playerInfo").innerHTML = '<p class="text-error">No player specified</p>';
        return;
    }

    loadPlayerProfile(username, 1, server);
});
