
const burgerBtn = document.getElementById("burgerBtn");
const sidebar = document.querySelector(".sidebar");
const overlay = document.getElementById("sidebarOverlay");

burgerBtn.addEventListener("click", () => {
    sidebar.classList.toggle("sidebar-open");
    overlay.classList.toggle("overlay-visible");
});

overlay.addEventListener("click", () => {
    sidebar.classList.remove("sidebar-open");
    overlay.classList.remove("overlay-visible");
});