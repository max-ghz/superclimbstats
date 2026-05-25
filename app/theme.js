const html = document.documentElement;

if (localStorage.getItem('theme') === 'dark') {
    html.classList.add('dark');
}

const btn = document.getElementById('theme-toggle');
if (btn) {
    btn.addEventListener('click', function () {
        const dark = !html.classList.contains('dark');
        html.classList.toggle('dark', dark);
        localStorage.setItem('theme', dark ? 'dark' : 'light');
    });
}
