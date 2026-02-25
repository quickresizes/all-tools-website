const themeToggle = document.querySelector(".theme-toggle");
const storedTheme = localStorage.getItem("mediatools-theme");

if (storedTheme === "dark") {
  document.body.classList.add("dark");
}

const updateThemeButton = () => {
  if (!themeToggle) return;

  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
  themeToggle.setAttribute("aria-pressed", String(isDark));
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
const categories = document.querySelectorAll(".tool-category");
const noResults = document.getElementById("no-results");

const filterTools = (query) => {
  let visibleCount = 0;

  toolCards.forEach((card) => {
    const text = (card.dataset.toolName || card.innerText).toLowerCase();
    const isVisible = text.includes(query);
    card.hidden = !isVisible;

    if (isVisible) {
      visibleCount += 1;
    }
  });

  categories.forEach((category) => {
    const visibleInCategory = category.querySelectorAll(".tool-card:not([hidden])").length;
    category.hidden = visibleInCategory === 0;
  });

  if (noResults) {
    noResults.hidden = visibleCount > 0;
  }
};

searchInput?.addEventListener("input", (event) => {
  const query = event.target.value.trim().toLowerCase();
  filterTools(query);
});
