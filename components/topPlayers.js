import { formatDate } from '../utils/formatters.js';
import { renderServer } from '../utils/renderers.js';
import { fetchTopPlayers, fetchServers } from '../api/core/apiClient.js';
import { sanitize, sanitizeAttr } from '../utils/sanitize.js';

let currentServerFilter = 'all';
let currentSearch = '';
let currentSort = 'unique_caps';
let serversList = [];

export async function loadTopPlayers(serverId = 'all', search = null, sort = null) {
    try {
        currentServerFilter = serverId;
        if (search !== null) currentSearch = search;
        if (sort !== null) currentSort = sort;

        const data = await fetchTopPlayers(currentServerFilter, currentSearch, currentSort);

        const container = document.getElementById("topPlayers");

        const arrow = (col) => currentSort === col ? ' ▼' : '';

        let html = `
        <div class="row header">
            <div class="cell">#</div>
            <div class="cell">Player</div>
            <div class="cell sortable" data-sort="unique_caps">Unique Caps${arrow('unique_caps')}</div>
            <div class="cell sortable" data-sort="total_caps">Total Caps${arrow('total_caps')}</div>
            <div class="cell sortable" data-sort="gold">Gold${arrow('gold')}</div>
            <div class="cell">Silver</div>
            <div class="cell">Bronze</div>
            <div class="cell">Server</div>
            <div class="cell">Last Cap</div>
        </div>
        `;

        data.forEach((r, i) => {
            html += `
            <div class="row ${i % 2 ? "alt" : ""}">
                <div class="cell">${i + 1}</div>
                <div class="cell">
                    <a href="profile.html?username=${encodeURIComponent(r.username ?? "")}">${sanitize(r.username ?? "-")}</a>
                </div>
                <div class="cell">${sanitize(r.unique_caps ?? "-")}</div>
                <div class="cell">${sanitize(r.total_caps ?? "-")}</div>
                <div class="cell"><img src="images/tables/medal-gold.png" alt="gold"> ${sanitize(r.gold ?? 0)}</div>
                <div class="cell"><img src="images/tables/medal-silver.png" alt="silver"> ${sanitize(r.silver ?? 0)}</div>
                <div class="cell"><img src="images/tables/medal-bronze.png" alt="bronze"> ${sanitize(r.bronze ?? 0)}</div>
                <div class="cell">${renderServer(r.server_id, r.server)}</div>
                <div class="cell">${formatDate(r.last_active_at)}</div>
            </div>
            `;
        });

        container.innerHTML = html;

        container.querySelectorAll('.sortable[data-sort]').forEach(el => {
            el.addEventListener('click', () => loadTopPlayers(currentServerFilter, null, el.dataset.sort));
        });

    } catch (err) {
        console.error("Top players error:", err);
    }
}

export async function initServerFilter() {
    const btn = document.getElementById("serverFilterBtn");
    const dropdown = document.getElementById("serverDropdown");

    if (!btn || !dropdown) return;

    try {
        serversList = await fetchServers();

        let html = '<div class="active" data-server="all">All Servers</div>';
        serversList.forEach(server => {
            html += `<div data-server="${Number(server.id)}" data-name="${sanitizeAttr(server.name)}">${renderServer(Number(server.id), server.name)}</div>`;
        });
        dropdown.innerHTML = html;
    } catch (err) {
        console.error("Failed to load servers:", err);
    }

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
    });

    document.addEventListener('click', () => {
        dropdown.classList.remove('open');
    });

    dropdown.addEventListener('click', (e) => {
        const item = e.target.closest('div[data-server]');
        if (!item) return;

        e.stopPropagation();

        const serverId = item.dataset.server;
        const serverName = item.dataset.name;
        loadTopPlayers(serverId);
        dropdown.classList.remove('open');

        dropdown.querySelectorAll('div[data-server]').forEach(d => d.classList.remove('active'));
        item.classList.add('active');

        btn.innerHTML = serverId === 'all' ? 'All Servers' : renderServer(Number(serverId), serverName);
    });
}
