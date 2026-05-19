import { formatTime, formatDate } from '../utils/formatters.js';
import { renderStatus, renderPosition, renderTeam, renderServer } from '../utils/renderers.js';
import { renderPagination } from '../utils/pagination.js';
import { fetchServers } from '../api/core/apiClient.js';
import { sanitize, sanitizeAttr } from '../utils/sanitize.js';

let currentPage = 1;
let currentServerFilter = 'all';
let currentSearch = '';
let serversList = [];

export async function loadCapsStats(serverId = 'all') {
    const container = document.getElementById('capsStats');
    if (!container) return;
    try {
        const param = serverId !== 'all' ? `?server=${serverId}` : '';
        const res = await fetch(`/api/core/stats.php${param}`);
        const s = await res.json();
        container.innerHTML = `
            <div class="stat-item">Total Recorded Caps: <span class="stat-value">${s.total_caps.toLocaleString()}</span></div>
            <div class="stat-item">Total Recorded Maps: <span class="stat-value">${s.total_maps.toLocaleString()}</span></div>
            <div class="stat-item">Total Recorded Players: <span class="stat-value">${s.total_players.toLocaleString()}</span></div>
        `;
    } catch (err) {
        console.error('Stats error:', err);
    }
}

export async function loadAllCaps(page = 1, serverId = null, search = null) {
    try {
        currentPage = page;
        if (serverId !== null) currentServerFilter = serverId;
        if (search !== null) currentSearch = search;

        const serverParam = currentServerFilter === 'all' ? '' : `&server=${currentServerFilter}`;
        const searchParam = currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : '';
        const res = await fetch(`/api/caps/allCaps.php?page=${page}${serverParam}${searchParam}`);

        const json = await res.json();
        const data = json.data || [];
        const pagination = json.pagination || {};

        if (!Array.isArray(data)) {
            console.error("All caps: invalid response", json);
            return;
        }

        const container = document.getElementById("allCaps");

        let html = `
        <div class="row header">
            <div class="cell">Map</div>
            <div class="cell">Player</div>
            <div class="cell">Cap Time</div>
            <div class="cell">Status</div>
            <div class="cell"></div>
            <div class="cell">Team</div>
            <div class="cell">Server</div>
            <div class="cell">Time and Date</div>
        </div>
        `;

        data.forEach((r, i) => {
            html += `
            <div class="row ${i % 2 ? "alt" : ""}">
                <div class="cell">
                    <a href="map.html?map=${encodeURIComponent(r.map_name ?? "")}">${sanitize(r.map_name ?? "-")}</a>
                </div>
                <div class="cell">
                    <a href="profile.html?username=${encodeURIComponent(r.username ?? "")}${currentServerFilter !== 'all' ? `&server=${encodeURIComponent(currentServerFilter)}` : ''}">${sanitize(r.username ?? "-")}</a>
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
            onPageChange: (page) => loadAllCaps(page)
        });

    } catch (err) {
        console.error("All caps error:", err);
    }
}

export async function initServerFilterCaps() {
    const btn = document.getElementById("serverFilterBtnCaps");
    const dropdown = document.getElementById("serverDropdownCaps");

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
        loadAllCaps(1, serverId);
        dropdown.classList.remove('open');

        dropdown.querySelectorAll('div[data-server]').forEach(d => d.classList.remove('active'));
        item.classList.add('active');

        btn.innerHTML = serverId === 'all' ? 'All Servers' : renderServer(Number(serverId), serverName);
    });
}
