document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-btn');
    const menuOverlay = document.getElementById('menu');

    // Ouvrir menu
    menuBtn.addEventListener('click', () => {
        menuOverlay.classList.add('show');
    });

    // Fermer menu
    closeBtn.addEventListener('click', () => {
        menuOverlay.classList.remove('show');
    });

    // Fermer si clic en dehors des liens
    menuOverlay.addEventListener('click', (e) => {
        if (e.target === menuOverlay) {
            menuOverlay.classList.remove('show');
        }
    });
});
