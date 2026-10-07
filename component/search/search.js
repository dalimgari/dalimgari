function initSearch(searchRoot) {
  const input = searchRoot.querySelector(".search-input");
  const results = searchRoot.querySelector(".search-results");

  if (!input || !results) return;

  const searchableContent = [
    { title: "Home", url: "content/home.html" },
    { title: "Profile", url: "content/profile.html" },
    { title: "Login", url: "content/login.html" },
    { title: "Create Account", url: "content/create-account.html" },
    { title: "Forgot Password", url: "content/forgot-password.html" }
  ];

  function renderResults(query) {
    const value = query.trim().toLowerCase();
    results.replaceChildren();

    if (!value) return;

    const matches = searchableContent.filter(item =>
      item.title.toLowerCase().includes(value)
    );

    if (!matches.length) {
      const message = document.createElement("div");
      message.textContent = "No results found";
      results.appendChild(message);
      return;
    }

    matches.forEach(item => {
      const link = document.createElement("a");
      link.className = "search-result";
      link.href = item.url;
      link.textContent = item.title;
      results.appendChild(link);
    });
  }

  input.addEventListener("input", () => renderResults(input.value));

  input.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      input.value = "";
      results.replaceChildren();
      input.blur();
    }
  });
}

document.querySelectorAll("[data-search]").forEach(initSearch);