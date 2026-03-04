document.addEventListener("DOMContentLoaded", () => {

    // MENU
    const menuBtn = document.getElementById("menu-btn");
    const closeBtn = document.getElementById("close-btn");
    const menu = document.getElementById("menu");

    menuBtn.onclick = () => menu.classList.add("show");
    closeBtn.onclick = () => menu.classList.remove("show");

    // CATEGORY
    const openCategory = document.getElementById("openCategory");
    const categoryModal = document.getElementById("categoryModal");
    const closeCategory = document.getElementById("closeCategory");
    const saveCategory = document.getElementById("saveCategory");
    const categoryList = document.getElementById("categoryList");

    openCategory.onclick = (e) => {
        e.preventDefault();
        menu.classList.remove("show");
        categoryModal.classList.add("show");
        loadCategories();
    };

    closeCategory.onclick = () => categoryModal.classList.remove("show");

    saveCategory.onclick = () => {
        const name = document.getElementById("categoryName").value.trim();
        if (!name) return alert("Enter category name");

        let categories = JSON.parse(localStorage.getItem("categories")) || [];
        categories.push({ id: Date.now(), name });
        localStorage.setItem("categories", JSON.stringify(categories));
        loadCategories();
    };

    function loadCategories() {
        const categories = JSON.parse(localStorage.getItem("categories")) || [];
        categoryList.innerHTML = "";
        categories.forEach(cat => {
            const li = document.createElement("li");
            li.innerHTML = `${cat.name} <button onclick="deleteCategory(${cat.id})">X</button>`;
            categoryList.appendChild(li);
        });
    }

    window.deleteCategory = function(id) {
        let categories = JSON.parse(localStorage.getItem("categories")) || [];
        categories = categories.filter(cat => cat.id !== id);
        localStorage.setItem("categories", JSON.stringify(categories));
        loadCategories();
    }

    // PRODUCT
    const openProduct = document.getElementById("openProduct");
    const productModal = document.getElementById("productModal");
    const closeProduct = document.getElementById("closeProduct");
    const saveProduct = document.getElementById("saveProduct");
    const productList = document.getElementById("productList");

    openProduct.onclick = (e) => {
        e.preventDefault();
        menu.classList.remove("show");
        productModal.classList.add("show");
        loadProducts();
    };

    closeProduct.onclick = () => productModal.classList.remove("show");

    saveProduct.onclick = () => {
        const name = document.getElementById("productName").value.trim();
        const unitPrice = parseFloat(document.getElementById("unitPrice").value) || 0;
        const sellPrice = parseFloat(document.getElementById("sellPrice").value) || 0;
        const profit = sellPrice - unitPrice;

        if (!name) return alert("Enter product name");

        let products = JSON.parse(localStorage.getItem("products")) || [];
        products.push({ id: Date.now(), name, unitPrice, sellPrice, profit });
        localStorage.setItem("products", JSON.stringify(products));
        loadProducts();
    };

    function loadProducts() {
        const products = JSON.parse(localStorage.getItem("products")) || [];
        productList.innerHTML = "";
        products.forEach(p => {
            const li = document.createElement("li");
            li.innerHTML = `${p.name} | Profit: ${p.profit} <button onclick="deleteProduct(${p.id})">X</button>`;
            productList.appendChild(li);
        });
    }

    window.deleteProduct = function(id) {
        let products = JSON.parse(localStorage.getItem("products")) || [];
        products = products.filter(p => p.id !== id);
        localStorage.setItem("products", JSON.stringify(products));
        loadProducts();
    }

});
