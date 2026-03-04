document.addEventListener('DOMContentLoaded', () => {

    /* ================= MENU LOGIC ================= */
    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-btn');
    const menuOverlay = document.getElementById('menu');

    // Open menu
    menuBtn.addEventListener('click', () => {
        menuOverlay.classList.add('show');
    });

    // Close menu
    closeBtn.addEventListener('click', () => {
        menuOverlay.classList.remove('show');
    });

    // Close menu if click outside links
    menuOverlay.addEventListener('click', (e) => {
        if (e.target === menuOverlay) {
            menuOverlay.classList.remove('show');
        }
    });

    /* ================= CATEGORY MODAL ================= */
    const openCategoryBtn = document.getElementById('openCategory');
    const modal = document.getElementById('categoryModal');
    const closeCategoryBtn = document.getElementById('closeCategory');
    const saveCategoryBtn = document.getElementById('saveCategory');
    const categoryInput = document.getElementById('categoryName');
    const categoryList = document.getElementById('categoryList');

    // Open category modal
    openCategoryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'flex';
        menuOverlay.classList.remove('show'); // close menu when opening modal
        loadCategories();
    });

    // Close modal
    closeCategoryBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal if click outside box
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Save category
    saveCategoryBtn.addEventListener('click', () => {
        const name = categoryInput.value.trim();
        if (!name) {
            alert('Enter category name');
            return;
        }

        let categories = JSON.parse(localStorage.getItem('categories')) || [];

        const newCategory = {
            id: Date.now(),
            category_name: name,
            created_at: new Date().toISOString()
        };

        categories.push(newCategory);
        localStorage.setItem('categories', JSON.stringify(categories));

        categoryInput.value = '';
        loadCategories();
    });

    // Load categories into modal
    function loadCategories() {
        categoryList.innerHTML = '';
        let categories = JSON.parse(localStorage.getItem('categories')) || [];

        categories.forEach(cat => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${cat.category_name}</strong><br>
                ID: ${cat.id}<br>
                ${new Date(cat.created_at).toLocaleString()}
            `;
            categoryList.appendChild(li);
        });
    }

});
