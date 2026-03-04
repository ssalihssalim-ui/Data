document.addEventListener('DOMContentLoaded', () => {

    /* ================= MENU ================= */
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
        if (e.target === menuOverlay) menuOverlay.classList.remove('show');
    });

    /* ================= CATEGORY MODAL ================= */
    const openCategoryBtn = document.getElementById('openCategory');
    const modal = document.getElementById('categoryModal');
    const closeCategoryBtn = document.getElementById('closeCategory');
    const saveCategoryBtn = document.getElementById('saveCategory');
    const downloadCategoryBtn = document.getElementById('downloadCategory');
    const importCategoryInput = document.getElementById('importCategory');
    const categoryInput = document.getElementById('categoryName');
    const categoryList = document.getElementById('categoryList');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    const ITEMS_PER_PAGE = 4;
    let currentPage = 1;

    /* --- Open modal --- */
    openCategoryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'flex';
        menuOverlay.classList.remove('show');
        currentPage = 1;
        loadCategories();
    });

    /* --- Close modal --- */
    closeCategoryBtn.addEventListener('click', () => modal.style.display = 'none');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    /* --- Save category --- */
    saveCategoryBtn.addEventListener('click', () => {
        const name = categoryInput.value.trim();
        if (!name) return alert('Enter category name');

        let categories = JSON.parse(localStorage.getItem('categories')) || [];
        const newCategory = {
            id: Date.now(),
            category_name: name,
            created_at: new Date().toISOString()
        };
        categories.push(newCategory);
        localStorage.setItem('categories', JSON.stringify(categories));
        categoryInput.value = '';
        currentPage = Math.ceil(categories.length / ITEMS_PER_PAGE);
        loadCategories();
    });

    /* --- Download JSON --- */
    downloadCategoryBtn.addEventListener('click', () => {
        const categories = JSON.parse(localStorage.getItem('categories')) || [];
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(categories, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", "category.json");
        dlAnchor.click();
    });

    /* --- Import JSON --- */
    importCategoryInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const imported = JSON.parse(event.target.result);
                if (!Array.isArray(imported)) throw "Invalid JSON";
                let categories = JSON.parse(localStorage.getItem('categories')) || [];
                imported.forEach(cat => {
                    if(cat.id && cat.category_name && cat.created_at) categories.push(cat);
                });
                localStorage.setItem('categories', JSON.stringify(categories));
                currentPage = 1;
                loadCategories();
            } catch(err) {
                alert('Invalid JSON file!');
            }
        };
        reader.readAsText(file);
        e.target.value = ""; // reset file input
    });

    /* --- Pagination --- */
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) currentPage--;
        loadCategories();
    });

    nextPageBtn.addEventListener('click', () => {
        let categories = JSON.parse(localStorage.getItem('categories')) || [];
        if (currentPage < Math.ceil(categories.length / ITEMS_PER_PAGE)) currentPage++;
        loadCategories();
    });

    /* --- Load categories --- */
    function loadCategories() {
        const categories = JSON.parse(localStorage.getItem('categories')) || [];
        const totalPages = Math.max(Math.ceil(categories.length / ITEMS_PER_PAGE),1);
        const start = (currentPage-1)*ITEMS_PER_PAGE;
        const pageItems = categories.slice(start, start + ITEMS_PER_PAGE);

        categoryList.innerHTML = '';
        pageItems.forEach((cat,index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>
                    <strong>${cat.category_name}</strong><br>
                    ID: ${cat.id}<br>
                    ${new Date(cat.created_at).toLocaleString()}
                </span>
                <button class="delete-btn">X</button>
            `;
            li.querySelector('.delete-btn').addEventListener('click', () => {
                const globalIndex = start + index;
                categories.splice(globalIndex,1);
                localStorage.setItem('categories', JSON.stringify(categories));
                if(currentPage > Math.ceil(categories.length / ITEMS_PER_PAGE)) currentPage--;
                loadCategories();
            });
            categoryList.appendChild(li);
        });

        pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }

});
