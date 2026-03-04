document.addEventListener('DOMContentLoaded', () => {

    /* ================= MENU LOGIC ================= */
    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-btn');
    const menuOverlay = document.getElementById('menu');

    menuBtn.addEventListener('click', () => {
        menuOverlay.classList.add('show');
    });

    closeBtn.addEventListener('click', () => {
        menuOverlay.classList.remove('show');
    });

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

    // Bouton pour télécharger JSON
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = 'Download JSON';
    downloadBtn.style.marginTop = '10px';
    downloadBtn.style.padding = '8px';
    downloadBtn.style.backgroundColor = '#00ffcc';
    downloadBtn.style.color = 'black';
    downloadBtn.style.border = 'none';
    downloadBtn.style.fontWeight = 'bold';
    downloadBtn.style.cursor = 'pointer';
    downloadBtn.style.borderRadius = '4px';
    categoryList.parentNode.appendChild(downloadBtn);

    // Open category modal
    openCategoryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'flex';
        menuOverlay.classList.remove('show'); // fermer menu si ouvert
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

    // Download JSON
    downloadBtn.addEventListener('click', () => {
        let categories = JSON.parse(localStorage.getItem('categories')) || [];
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(categories, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", "category.json");
        dlAnchor.click();
    });

    // Load categories into modal
    function loadCategories() {
        categoryList.innerHTML = '';
        let categories = JSON.parse(localStorage.getItem('categories')) || [];

        categories.forEach((cat, index) => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.style.paddingTop = '10px'; // padding top entre l'input et la liste

            li.innerHTML = `
                <span>
                    <strong>${cat.category_name}</strong><br>
                    ID: ${cat.id}<br>
                    ${new Date(cat.created_at).toLocaleString()}
                </span>
                <button class="delete-btn" style="
                    background:red;
                    color:white;
                    border:none;
                    padding:4px 8px;
                    border-radius:4px;
                    cursor:pointer;
                ">X</button>
            `;

            // Supprimer catégorie
            li.querySelector('.delete-btn').addEventListener('click', () => {
                categories.splice(index, 1);
                localStorage.setItem('categories', JSON.stringify(categories));
                loadCategories();
            });

            categoryList.appendChild(li);
        });
    }

});
