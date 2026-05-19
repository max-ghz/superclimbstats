import { formatTime, formatDate } from '../utils/formatters.js';
import { renderStatus, renderPosition, renderTeam, renderServer } from '../utils/renderers.js';
import { sanitize, sanitizeAttr } from '../utils/sanitize.js';

let currentUsername = '';
let currentServerFilter = 'all';
let docClickHandlerSet = false;

export async function loadPlayerProfile(username, page = 1, serverId = null) {
    try {
        currentUsername = username;
        if (serverId !== null) currentServerFilter = serverId;

        const params = new URLSearchParams({ page });
        if (currentServerFilter !== 'all') params.set('server', currentServerFilter);

        const res = await fetch(`/api/details/playerProfile.php?username=${encodeURIComponent(username)}&${params}`);

        if (!res.ok) {
            const error = await res.json();
            document.getElementById("playerInfo").innerHTML = `<p class="text-error">Error: ${sanitize(error.error || 'Player not found')}</p>`;
            return;
        }

        const json = await res.json();

        const player = json.player || {};
        const caps = json.caps || [];
        const pagination = json.pagination || {};
        const servers = json.servers || [];

        renderPlayerInfo(player, servers);
        renderPlayerCaps(caps);
        renderPagination(pagination);

    } catch (err) {
        console.error("Player profile error:", err);
        document.getElementById("playerInfo").innerHTML = `<p class="text-error">Error loading player profile</p>`;
    }
}

function renderPlayerInfo(player, servers) {
    const container = document.getElementById("playerInfo");

    // Servers display line
    let serversHtml;
    if (currentServerFilter === 'all') {
        const parts = servers.map(s => renderServer(s.server_id, s.server)).join('&nbsp;&nbsp;');
        serversHtml = `Servers: ${parts || '-'}`;
    } else {
        const srv = servers.find(s => String(s.server_id) === String(currentServerFilter));
        serversHtml = `Server: ${srv ? renderServer(srv.server_id, srv.server) : '-'}`;
    }

    // Dropdown button label
    const activeServer = servers.find(s => String(s.server_id) === String(currentServerFilter));
    const btnLabel = currentServerFilter === 'all' ? 'Combined' : (activeServer?.server ?? `Server ${currentServerFilter}`);

    // Dropdown items
    let dropdownHtml = `<div class="${currentServerFilter === 'all' ? 'active' : ''}" data-server="all">Combined</div>`;
    servers.forEach(s => {
        const active = String(s.server_id) === String(currentServerFilter) ? 'active' : '';
        dropdownHtml += `<div class="${active}" data-server="${sanitizeAttr(String(s.server_id))}">${renderServer(s.server_id, s.server)}</div>`;
    });

    container.innerHTML = `
        <div class="profile-header">
            <div class="profile-info">
                <div class="profile-username">${sanitize(player.username ?? "-")}</div>
                <div class="profile-stat-line">
                    Total Caps: <strong>${sanitize(player.total_caps ?? "-")}</strong>
                    &nbsp;&mdash;&nbsp;
                    Unique Caps: <strong>${sanitize(player.unique_caps ?? "-")}</strong>
                    &nbsp;&mdash;&nbsp;
                    Gold Rank: <strong>#${sanitize(player.rank ?? "-")}</strong>
                </div>
                <div class="profile-detail-line">${serversHtml}</div>
                <div class="profile-detail-line">Member since: ${formatDate(player.created_at)}</div>
                <div class="profile-stat-line">Last Active: ${formatDate(player.last_active_at)}</div>
                <div>
                    <img src="images/tables/medal-gold.png" alt="gold" class="medal-img">
                    <strong>${sanitize(player.gold ?? 0)}</strong>
                    &nbsp;&nbsp;
                    <img src="images/tables/medal-silver.png" alt="silver" class="medal-img">
                    <strong>${sanitize(player.silver ?? 0)}</strong>
                    &nbsp;&nbsp;
                    <img src="images/tables/medal-bronze.png" alt="bronze" class="medal-img">
                    <strong>${sanitize(player.bronze ?? 0)}</strong>
                </div>
            </div>
            <div class="sort-wrapper">
                <span>Sort by:</span>
                <div class="sort-select">
                    <button class="sort-trigger" id="profileServerBtn" type="button">${sanitize(btnLabel)}</button>
                    <div class="sort-options" id="profileServerDropdown">${dropdownHtml}</div>
                </div>
            </div>
        </div>
    `;

    const btn = container.querySelector('#profileServerBtn');
    const dropdown = container.querySelector('#profileServerDropdown');

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
    });

    if (!docClickHandlerSet) {
        docClickHandlerSet = true;
        document.addEventListener('click', () => {
            const d = document.getElementById('profileServerDropdown');
            if (d) d.classList.remove('open');
        });
    }

    dropdown.addEventListener('click', (e) => {
        const item = e.target.closest('div[data-server]');
        if (!item) return;
        e.stopPropagation();
        loadPlayerProfile(currentUsername, 1, item.dataset.server);
        dropdown.classList.remove('open');
    });
}

function renderPlayerCaps(caps) {
    const container = document.getElementById("playerCaps");

    if (!Array.isArray(caps) || caps.length === 0) {
        container.innerHTML = '<p>No caps found for this player.</p>';
        return;
    }

    let html = `
        <div class="row header">
            <div class="cell">Map</div>
            <div class="cell">Total Scores</div>
            <div class="cell">Cap Time</div>
            <div class="cell">Status</div>
            <div class="cell"></div>
            <div class="cell">Team</div>
            <div class="cell">Server</div>
            <div class="cell">Time and Date</div>
        </div>
    `;

    caps.forEach((r, i) => {
        html += `
            <div class="row ${i % 2 ? "alt" : ""}">
                <div class="cell">
                    <a href="map.html?map=${encodeURIComponent(r.map_name ?? "")}">${sanitize(r.map_name ?? "-")}</a>
                </div>
                <div class="cell">${sanitize(r.map_caps_count ?? 1)}</div>
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
}

function renderPagination(pagination) {
    const container = document.getElementById("pagination");

    if (!pagination || !pagination.totalPages || pagination.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    const { currentPage, totalPages } = pagination;

    let html = '<div class="pagination">';

    if (currentPage > 1) {
        html += `<a href="#" class="page-link" data-page="${currentPage - 1}">&laquo; Prev</a>`;
    }

    const maxVisible = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
        html += `<a href="#" class="page-link" data-page="1">1</a>`;
        if (startPage > 2) {
            html += `<span class="page-ellipsis">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            html += `<span class="page-link active">${i}</span>`;
        } else {
            html += `<a href="#" class="page-link" data-page="${i}">${i}</a>`;
        }
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span class="page-ellipsis">...</span>`;
        }
        html += `<a href="#" class="page-link" data-page="${totalPages}">${totalPages}</a>`;
    }

    if (currentPage < totalPages) {
        html += `<a href="#" class="page-link" data-page="${currentPage + 1}">Next &raquo;</a>`;
    }

    html += '</div>';

    container.innerHTML = html;

    container.querySelectorAll('.page-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(link.getAttribute('data-page'));
            loadPlayerProfile(currentUsername, page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}
