document.addEventListener("DOMContentLoaded", () => {

    // MENU
    const menuBtn = document.getElementById("menu-btn");
    const closeBtn = document.getElementById("close-btn");
    const menu = document.getElementById("menu");

    menuBtn.addEventListener("click", () => {
        menu.classList.add("show");
    });

    closeBtn.addEventListener("click", () => {
        menu.classList.remove("show");
    });

    // CATEGORY
    const openCategory = document.getElementById("openCategory");
    const categoryModal = document.getElementById("categoryModal");
    const closeCategory = document.getElementById("closeCategory");
    const saveCategory = document.getElementById("saveCategory");
    const categoryList = document.getElementById("categoryList");

    openCategory.addEventListener("click", (e) => {
        e.preventDefault();
        menu.classList.remove("show");
        categoryModal.classList.add("show");
        loadCategories();
    });

    closeCategory.addEventListener("click", () => {
        categoryModal.classList.remove("show");
    });

    saveCategory.addEventListener("click", () => {
        const name = document.getElementById("categoryName").value.trim();
        if (!name) return;

        let categories = JSON.parse(localStorage.getItem("categories")) || [];
        categories.push({ id: Date.now(), name });
        localStorage.setItem("categories", JSON.stringify(categories));
        loadCategories();
    });

    function loadCategories() {
        const categories = JSON.parse(localStorage.getItem("categories")) || [];
        categoryList.innerHTML = "";
        categories.forEach(cat => {
            const li = document.createElement("li");
            li.textContent = cat.name;
            categoryList.appendChild(li);
        });
    }

    // PRODUCT
    const openProduct = document.getElementById("openProduct");
    const productModal = document.getElementById("productModal");
    const closeProduct = document.getElementById("closeProduct");
    const saveProduct = document.getElementById("saveProduct");
    const productList = document.getElementById("productList");

    openProduct.addEventListener("click", (e) => {
        e.preventDefault();
        menu.classList.remove("show");
        productModal.classList.add("show");
        loadProducts();
    });

    closeProduct.addEventListener("click", () => {
        productModal.classList.remove("show");
    });

    saveProduct.addEventListener("click", () => {
        const name = document.getElementById("productName").value.trim();
        const unitPrice = parseFloat(document.getElementById("unitPrice").value) || 0;
        const sellPrice = parseFloat(document.getElementById("sellPrice").value) || 0;

        if (!name) return;

        let products = JSON.parse(localStorage.getItem("products")) || [];
        products.push({ id: Date.now(), name, unitPrice, sellPrice });
        localStorage.setItem("products", JSON.stringify(products));
        loadProducts();
    });

    function loadProducts() {
        const products = JSON.parse(localStorage.getItem("products")) || [];
        productList.innerHTML = "";
        products.forEach(p => {
            const li = document.createElement("li");
            li.textContent = `${p.name} - ${p.sellPrice}`;
            productList.appendChild(li);
        });
    }

});
