export function formatTime(ms) {
    if (ms == null) return "-";

    const totalMs = Number(ms);

    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const milliseconds = totalMs % 1000;

    const mm = String(minutes);
    const ss = String(seconds).padStart(2, "0");
    const ms3 = String(milliseconds).padStart(3, "0");

    return `${mm}:${ss}:${ms3}`;
}

export function formatDate(epoch) {
    if (!epoch) return "-";

    const d = new Date(Number(epoch));

    const time = d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });

    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "long" });
    const year = d.getFullYear();

    const suffix =
        day % 10 === 1 && day !== 11 ? "st" :
            day % 10 === 2 && day !== 12 ? "nd" :
                day % 10 === 3 && day !== 13 ? "rd" :
                    "th";

    return `${time} on ${day}${suffix} ${month} ${year}`;
}
