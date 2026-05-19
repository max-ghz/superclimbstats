export function renderPagination({
    containerId = "pagination",
    pagination,
    onPageChange
}) {
    const container = document.getElementById(containerId);

    if (!pagination || !pagination.totalPages) {
        container.innerHTML = '';
        return;
    }

    const { currentPage, totalPages } = pagination;

    let html = '<div class="pagination"><span class="label">Page:</span>';

    const maxVisible = 9;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
        html += `<a href="#" class="page-link" data-page="1">1</a>`;
        if (startPage > 2) {
            html += `<span class="dots">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            html += `<span class="current">${i}</span>`;
        } else {
            html += `<a href="#" class="page-link" data-page="${i}">${i}</a>`;
        }
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span class="dots">...</span>`;
        }
        html += `<a href="#" class="page-link" data-page="${totalPages}">${totalPages}</a>`;
    }

    html += '</div>';

    container.innerHTML = html;

    container.querySelectorAll('.page-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            onPageChange(parseInt(link.dataset.page));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}
