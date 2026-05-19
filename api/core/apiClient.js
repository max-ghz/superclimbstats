export async function fetchLatestCaps(serverId = 'all') {
    const param = serverId !== 'all' ? `?server=${encodeURIComponent(serverId)}` : '';
    const res = await fetch(`/api/home/latest.php${param}`);
    const json = await res.json();
    return Array.isArray(json) ? json : json.data || [];
}

export async function fetchInitialCaps(serverId = 'all') {
    const param = serverId !== 'all' ? `?server=${encodeURIComponent(serverId)}` : '';
    const res = await fetch(`/api/home/initial.php${param}`);
    const json = await res.json();
    return Array.isArray(json) ? json : json.data || [];
}

export async function fetchTopPlayers(serverId = 'all', search = '', sort = 'gold') {
    const params = new URLSearchParams({ sort });
    if (serverId !== 'all') params.set('server', serverId);
    if (search) params.set('search', search);
    const res = await fetch(`/api/home/topPlayers.php?${params}`);
    const json = await res.json();
    return Array.isArray(json) ? json : json.data || [];
}

export async function fetchServers() {
    const res = await fetch("/api/core/servers.php");
    const json = await res.json();
    return Array.isArray(json) ? json : [];
}
