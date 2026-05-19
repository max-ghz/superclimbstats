import { formatTime, formatDate } from '../utils/formatters.js';
import { renderStatus, renderPosition, renderTeam, renderServer } from '../utils/renderers.js';
import { fetchInitialCaps } from '../api/core/apiClient.js';
import { sanitize } from '../utils/sanitize.js';

const SERVER_INFO = {
    1: { ip: 'unknown',        port: null, since: '2007-11-09 02:00:00',  shutdown: '2008-04-16 11:22:58',   fullyRestored: 'True',  owner: 'BombSki',  admins: ['Admin1', 'Admin2'] },
    2: { ip: 'unknown',        port: null,  since: 'unknown',             shutdown: '2015-05-26 07:45:22',   fullyRestored: 'False', owner: 'KaLaF .dC',        admins: [] },
    3: { ip: '51.68.213.93',   port: 23082, since: '2018-07-16 06:42:09', shutdown: '2022-04-22 01:07:58',   fullyRestored: 'True',  owner: 'Savage',        admins: [] },
    4: { ip: '85.214.69.82',   port: 23073, since: 'unknown',             shutdown: '2013-10-01 10:57:54',   fullyRestored: 'False', owner: 'Spotix',        admins: [] },
    5: { ip: '209.141.52.123', port: 65401, since: '2008-07-10 02:20:37', shutdown: '2013-10-03 04:41:26',   fullyRestored: 'False', owner: 'Swine Bloo',  admins: ['Admin3'] },
    6: { ip: '80.72.37.10',    port: 23076, since: '2009-12-17 12:59:37', shutdown: '2017-06-10 02:00:00',   fullyRestored: 'True',  owner: 'helloer & Bonecrusher',        admins: [] },
};

const SERVER_FLAGS = {
    1: "us.gif",
    2: "pl.gif",
    3: "gb.gif",
    4: "de.gif",
    5: "us.gif",
    6: "pl.gif"
};

async function loadServerStats(serverId = 'all') {
    const container = document.getElementById('serverStats');
    if (!container) return;

    let serverInfo = null;

    try {
        const param = serverId !== 'all' ? `?server=${serverId}` : '';
        const res = await fetch(`/api/core/stats.php${param}`);
        const s = await res.json();

        let html = '';

        if (serverId !== 'all') {
            const info = SERVER_INFO[serverId];
            if (info) {
                const owner  = info.owner    || '-';
                serverInfo = {
                    addr:     info.ip && info.port ? `${info.ip}:${info.port}` : (info.ip || '-'),
                    since:    info.since          || '-',
                    shut:     info.shutdown        || 'Active',
                    restored: info.fullyRestored   || '-',
                };

                html = `
                    <div class="server-overview">
                        <div class="server-owner-name">powered by: ${owner}</div>
                        <div class="server-address-line">Address IP: ${serverInfo.addr}</div>
                        <div class="server-stat-row">Total Recorded Caps: <strong>${s.total_caps.toLocaleString()}</strong></div>
                        <div class="server-stat-row">Total Recorded Maps: <strong>${s.total_maps.toLocaleString()}</strong></div>
                        <div>Total Recorded Players: <strong>${s.total_players.toLocaleString()}</strong></div>
                    </div>
                `;
            }
        } else {
            html = `
                <div class="server-overview">
                    <div class="server-stat-row">Total Recorded Caps: <strong>${s.total_caps.toLocaleString()}</strong></div>
                    <div class="server-stat-row">Total Recorded Maps: <strong>${s.total_maps.toLocaleString()}</strong></div>
                    <div>Total Recorded Players: <strong>${s.total_players.toLocaleString()}</strong></div>
                </div>
            `;
        }

        container.innerHTML = html;
    } catch (err) {
        console.error('Server stats error:', err);
    }

    await loadServerLatestCaps(serverId, serverInfo);
}

async function loadServerLatestCaps(serverId = 'all', serverInfo = null) {
    const container = document.getElementById('serverLatestCaps');
    if (!container) return;

    try {
        const data = await fetchInitialCaps(serverId);

        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = '';
            return;
        }

        let rows = '';
        data.forEach((r, i) => {
            rows += `
            <div class="row ${i % 2 ? 'alt' : ''}">
                <div class="cell"><a href="map.html?map=${encodeURIComponent(r.map_name ?? '')}">${sanitize(r.map_name ?? '-')}</a></div>
                <div class="cell"><a href="profile.html?username=${encodeURIComponent(r.username ?? '')}">${sanitize(r.username ?? '-')}</a></div>
                <div class="cell">${formatTime(r.record_time)}</div>
                <div class="cell">${renderStatus(r.status)}</div>
                <div class="cell">${renderPosition(r.position)}</div>
                <div class="cell">${renderTeam(r.team)}</div>
                <div class="cell">${renderServer(r.server_id, r.server)}</div>
                <div class="cell">${formatDate(r.record_date)}</div>
            </div>`;
        });

        const addrBlock = serverInfo ? `
            <div class="server-addr-block">
                <div class="server-addr-row"><strong>Since: ${serverInfo.since}</strong></div>
                <div class="server-addr-row"><strong>Shutdown: ${serverInfo.shut}</strong></div>
                <div class="server-addr-row"><strong>Fully Restored: ${serverInfo.restored}</strong></div>
            </div>` : '';

        container.innerHTML = `
            <section class="latest-caps section-top">
                <div class="section-img-heading">
                    <img src="images/fonts/initial-caps.png" alt="Latest Caps">
                </div>
                ${addrBlock}
                <div class="statsbox">
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
                    ${rows}
                </div>
            </section>`;
    } catch (err) {
        console.error('Server latest caps error:', err);
    }
}

async function initServerTabs() {
    const tabsEl = document.getElementById('serverTabs');

    const res = await fetch('/api/core/servers.php');
    const servers = await res.json();

    const tabs = [
        { id: 'all', name: 'Combined', flag: null },
        ...(Array.isArray(servers) ? servers : []).map(s => ({
            id: s.id,
            name: s.name,
            flag: SERVER_FLAGS[s.id] ?? null
        }))
    ];

    tabs.forEach((tab, idx) => {
        const btn = document.createElement('button');
        btn.className = 'tab' + (idx === 0 ? ' active' : '');
        btn.dataset.serverId = tab.id;

        if (tab.flag) {
            const img = document.createElement('img');
            img.className = 'tab-flag';
            img.src = `images/tables/${tab.flag}`;
            img.alt = '';
            btn.appendChild(img);
            btn.appendChild(document.createTextNode(tab.name));
        } else {
            btn.textContent = tab.name;
        }

        btn.addEventListener('click', () => {
            tabsEl.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadServerStats(String(tab.id), tab.name);
        });

        tabsEl.appendChild(btn);
    });

    loadServerStats('all');
}

document.addEventListener('DOMContentLoaded', initServerTabs);
