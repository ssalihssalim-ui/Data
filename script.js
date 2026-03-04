/* ===== MENU TOGGLE ===== */
const menuBtn = document.getElementById("menu-btn");
const menu = document.getElementById("menu");
const closeMenuBtn = document.getElementById("close-btn");

menuBtn.addEventListener("click", () => {
    menu.classList.add("active");
});

closeMenuBtn.addEventListener("click", () => {
    menu.classList.remove("active");
});

/* ===== CATEGORY MODAL ===== */
const openBtn = document.getElementById("openCategory");
const modal = document.getElementById("categoryModal");
const closeBtn = document.getElementById("closeCategory");
const saveBtn = document.getElementById("saveCategory");
const categoryInput = document.getElementById("categoryName");
const categoryList = document.getElementById("categoryList");

// Open modal
openBtn.addEventListener("click", () => {
    modal.style.display = "flex";
    loadCategories();
});

// Close modal
closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
});

// Save category
saveBtn.addEventListener("click", () => {
    const name = categoryInput.value.trim();

    if (!name) {
        alert("Enter category name");
        return;
    }

    let categories = JSON.parse(localStorage.getItem("categories")) || [];

    const newCategory = {
        id: Date.now(),
        category_name: name,
        created_at: new Date().toISOString()
    };

    categories.push(newCategory);
    localStorage.setItem("categories", JSON.stringify(categories));

    categoryInput.value = "";
    loadCategories();
});

// Load categories
function loadCategories() {
    categoryList.innerHTML = "";

    let categories = JSON.parse(localStorage.getItem("categories")) || [];

    categories.forEach(cat => {
        const li = document.createElement("li");

        li.innerHTML = `
            <strong>${cat.category_name}</strong><br>
            ID: ${cat.id}<br>
            Date: ${new Date(cat.created_at).toLocaleString()}
        `;

        categoryList.appendChild(li);
    });
}
