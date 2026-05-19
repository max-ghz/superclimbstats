import { formatDate } from '../utils/formatters.js';
import { renderServer } from '../utils/renderers.js';
import { renderPagination } from '../utils/pagination.js';
import { fetchServers } from '../api/core/apiClient.js';
import { sanitize, sanitizeAttr } from '../utils/sanitize.js';

let currentPage = 1;
let currentServerFilter = 'all';
let currentSearch = '';
let currentSort = 'unique_caps';
let serversList = [];

export async function loadAllPlayers(page = 1, serverId = null, search = null, sort = null) {
    try {
        currentPage = page;
        if (serverId !== null) currentServerFilter = serverId;
        if (search !== null) currentSearch = search;
        if (sort !== null) currentSort = sort;

        const serverParam = currentServerFilter === 'all' ? '' : `&server=${currentServerFilter}`;
        const searchParam = currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : '';
        const sortParam = `&sort=${currentSort}`;
        const res = await fetch(`/api/players/allPlayers.php?page=${page}${serverParam}${searchParam}${sortParam}`);

        const json = await res.json();
        const data = json.data || [];
        const pagination = json.pagination || {};

        if (!Array.isArray(data)) {
            console.error("All players: invalid response", json);
            return;
        }

        const container = document.getElementById("allPlayers");

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

        const startRank = (currentPage - 1) * pagination.perPage + 1;

        data.forEach((r, i) => {
            html += `
            <div class="row ${i % 2 ? "alt" : ""}">
                <div class="cell">${startRank + i}</div>
                <div class="cell">
                    <a href="profile.html?username=${encodeURIComponent(r.username ?? "")}${currentServerFilter !== 'all' ? `&server=${encodeURIComponent(currentServerFilter)}` : ''}">${sanitize(r.username ?? "-")}</a>
                </div>
                <div class="cell">${sanitize(r.unique_caps ?? "-")}</div>
                <div class="cell">${sanitize(r.total_caps ?? "-")}</div>
                <div class="cell">
                    <img src="images/tables/medal-gold.png" alt="gold">
                    ${sanitize(r.gold ?? 0)}
                </div>
                <div class="cell">
                    <img src="images/tables/medal-silver.png" alt="silver">
                    ${sanitize(r.silver ?? 0)}
                </div>
                <div class="cell">
                    <img src="images/tables/medal-bronze.png" alt="bronze">
                    ${sanitize(r.bronze ?? 0)}
                </div>
                <div class="cell">${renderServer(r.server_id, r.server)}</div>
                <div class="cell">${formatDate(r.last_active_at)}</div>
            </div>
            `;
        });

        container.innerHTML = html;

        container.querySelectorAll('.sortable[data-sort]').forEach(el => {
            el.addEventListener('click', () => loadAllPlayers(1, null, null, el.dataset.sort));
        });

        renderPagination({
            pagination,
            onPageChange: (page) => loadAllPlayers(page)
        });

    } catch (err) {
        console.error("All players error:", err);
    }
}

export async function initServerFilterPlayers() {
    const btn = document.getElementById("serverFilterBtnPlayers");
    const dropdown = document.getElementById("serverDropdownPlayers");

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
        loadAllPlayers(1, serverId);
        dropdown.classList.remove('open');

        dropdown.querySelectorAll('div[data-server]').forEach(d => d.classList.remove('active'));
        item.classList.add('active');

        btn.innerHTML = serverId === 'all' ? 'All Servers' : renderServer(Number(serverId), serverName);
    });
}
