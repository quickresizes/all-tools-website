const themeToggle = document.querySelector(".theme-toggle");
const storedTheme = localStorage.getItem("mediatools-theme");

if (storedTheme === "dark") {
  document.body.classList.add("dark");
}

const updateThemeButton = () => {
  if (!themeToggle) return;
  themeToggle.textContent = document.body.classList.contains("dark")
    ? "☀️ Light Mode"
    : "🌙 Dark Mode";
};

updateThemeButton();

themeToggle?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "mediatools-theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
  updateThemeButton();
});

const searchInput = document.getElementById("tool-search");
const toolCards = document.querySelectorAll(".tool-card");

searchInput?.addEventListener("input", (event) => {
  const query = event.target.value.trim().toLowerCase();
  toolCards.forEach((card) => {
    const text = card.dataset.toolName || card.innerText.toLowerCase();
    card.style.display = text.includes(query) ? "flex" : "none";
  });
});
