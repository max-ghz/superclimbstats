import { formatTime, formatDate } from '../utils/formatters.js';
import { renderStatus, renderPosition, renderTeam, renderServer } from '../utils/renderers.js';
import { fetchLatestCaps } from '../api/core/apiClient.js';
import { sanitize } from '../utils/sanitize.js';

export async function loadLatestCaps() {
    try {
        const data = await fetchLatestCaps();

        if (!Array.isArray(data)) {
            console.error("Latest caps: invalid response", data);
            return;
        }

        const container = document.getElementById("latestCaps");

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

    } catch (err) {
        console.error("Latest caps error:", err);
    }
}
