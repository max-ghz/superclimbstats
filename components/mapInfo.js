import { renderPagination } from '../utils/pagination.js';
import { formatTime, formatDate } from '../utils/formatters.js';
import { renderServer, renderStatus, renderPosition, renderTeam } from '../utils/renderers.js';
import { sanitize, sanitizeAttr } from '../utils/sanitize.js';
import { fetchServers } from '../api/core/apiClient.js';

let currentMapName = '';
let currentServerFilter = 'all';

export async function loadMapInfo(mapName, page = 1, serverId = null) {
    if (serverId !== null) currentServerFilter = serverId;
    currentMapName = mapName;

    const container = document.getElementById("mapInfo");
    container.innerHTML = "Loading...";

    try {
        const params = new URLSearchParams({ map: mapName, page });
        if (currentServerFilter !== 'all') params.set('server', currentServerFilter);

        const res = await fetch(`/api/details/mapInfo.php?${params}`);
        const json = await res.json();

        const rows = json.data || [];
        const pagination = json.pagination || {};

        let html = `
            <div class="row header">
                <div class="cell">Rank</div>
                <div class="cell">Player</div>
                <div class="cell">Cap Time</div>
                <div class="cell">Status</div>
                <div class="cell"></div>
                <div class="cell">Team</div>
                <div class="cell">Server</div>
                <div class="cell">Time and Date</div>
            </div>
        `;

        rows.forEach((r, index) => {
            const rank = ((pagination.currentPage - 1) * 25) + index + 1;

            html += `
                <div class="row ${index % 2 ? "alt" : ""}">
                    <div class="cell">#${rank}</div>
                    <div class="cell">
                        <a href="profile.html?username=${encodeURIComponent(r.username ?? "")}">${sanitize(r.username ?? "-")}</a>
                    </div>
                    <div class="cell">${formatTime(r.record_time)}</div>
                    <div class="cell">${renderStatus(r.status)}</div>
                    <div class="cell">${renderPosition(r.position)}</div>
                    <div class="cell">${renderTeam(r.team)}</div>
                    <div class="cell">${renderServer(r.server_id, r.server)}</div>
                    <div class="cell">${formatDate(r.record_date)}</div>
                </div>
            `;
        });

        container.innerHTML = html;

        renderPagination({
            pagination,
            onPageChange: (p) => loadMapInfo(mapName, p)
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = "Failed to load map stats.";
    }
}

export async function initMapServerFilter() {
    const btn = document.getElementById("mapServerFilterBtn");
    const dropdown = document.getElementById("mapServerDropdown");

    if (!btn || !dropdown) return;

    try {
        const servers = await fetchServers();

        let html = '<div class="active" data-server="all">All Servers</div>';
        servers.forEach(server => {
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
        loadMapInfo(currentMapName, 1, serverId);
        dropdown.classList.remove('open');

        dropdown.querySelectorAll('div[data-server]').forEach(d => d.classList.remove('active'));
        item.classList.add('active');

        btn.innerHTML = serverId === 'all' ? 'All Servers' : renderServer(Number(serverId), serverName);
    });
}
