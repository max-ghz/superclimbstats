import { sanitize } from './sanitize.js';

export function renderTeam(team) {
    if (team == 1) {
        return `<img src="images/tables/alpha.gif" alt="alpha">`;
    }
    if (team == 2) {
        return `<img src="images/tables/bravo.gif" alt="bravo">`;
    }
    return team != null ? sanitize(team) : "-";
}

export function renderStatus(status) {
    if (status == 1 || status === "VALID") {
        return `<img src="images/tables/verified.png" alt="verified">`;
    }

    if (status == 2 || status === "INVALID") {
        return `<img src="images/tables/unverified.png" alt="unverified">`;
    }

    return status != null ? sanitize(status) : "-";
}

export function renderServer(serverId, serverName) {
    const flags = {
        1: "us.gif",
        2: "pl.gif",
        3: "gb.gif",
        4: "de.gif",
        5: "us.gif",
        6: "pl.gif"
    };

    if (serverId == null) {
        return `<img src="images/tables/--.gif" alt="combined"> Combined`;
    }

    const flag = flags[serverId];
    const safeName = sanitize(serverName ?? "-");

    if (!flag) {
        return safeName;
    }

    return `<img src="images/tables/${flag}" alt="flag"> ${safeName}`;
}

export function renderPosition(pos) {
    if (pos == 1) {
        return `<img src="images/tables/medal-gold.png" alt="gold">`;
    }
    if (pos == 2) {
        return `<img src="images/tables/medal-silver.png" alt="silver">`;
    }
    if (pos == 3) {
        return `<img src="images/tables/medal-bronze.png" alt="bronze">`;
    }
    // I did positions above 3rd intentionally hidden, only medals are shown in the table
    return "";
}
