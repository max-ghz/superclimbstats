import { loadMapInfo, initMapServerFilter } from '../components/mapInfo.js';

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const map = params.get("map");

    if (!map) {
        document.getElementById("mapTitle").textContent = "Map not found";
        return;
    }

    document.getElementById("mapTitle").textContent = `Map: ${map}`;
    loadMapInfo(map, 1);
    initMapServerFilter();
});
