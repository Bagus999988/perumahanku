// ==========================================================================
// PerumahanKu — Real Estate Website Logic
// ==========================================================================

(function () {
  "use strict";

  /* ---------------- Sample property data ---------------- */
  const properties = [
    {
      id: 1,
      title: "Rumah Minimalis Green Valley",
      location: "Bandung, Jawa Barat",
      type: "Rumah",
      status: "sale",
      price: 850000000,
      beds: 3,
      baths: 2,
      area: 90,
      image: "https://picsum.photos/seed/perumahanku1/600/450",
      createdAt: "2026-08-20",
    },
    {
      id: 2,
      title: "Apartemen Skyline Residence",
      location: "Jakarta Selatan, DKI Jakarta",
      type: "Apartemen",
      status: "rent",
      price: 6500000,
      beds: 2,
      baths: 1,
      area: 45,
      image: "https://picsum.photos/seed/perumahanku2/600/450",
      createdAt: "2026-09-10",
    },
    {
      id: 3,
      title: "Ruko Strategis Jalan Utama",
      location: "Surabaya, Jawa Timur",
      type: "Ruko",
      status: "sale",
      price: 1750000000,
      beds: 0,
      baths: 2,
      area: 120,
      image: "https://picsum.photos/seed/perumahanku3/600/450",
      createdAt: "2026-07-02",
    },
    {
      id: 4,
      title: "Tanah Kavling Siap Bangun",
      location: "Bogor, Jawa Barat",
      type: "Tanah",
      status: "sale",
      price: 450000000,
      beds: 0,
      baths: 0,
      area: 200,
      image: "https://picsum.photos/seed/perumahanku4/600/450",
      createdAt: "2026-06-15",
    },
    {
      id: 5,
      title: "Rumah Modern Cluster Harmoni",
      location: "Tangerang, Banten",
      type: "Rumah",
      status: "sale",
      price: 1250000000,
      beds: 4,
      baths: 3,
      area: 150,
      image: "https://picsum.photos/seed/perumahanku5/600/450",
      createdAt: "2026-09-18",
    },
    {
      id: 6,
      title: "Apartemen Studio Central Park",
      location: "Jakarta Barat, DKI Jakarta",
      type: "Apartemen",
      status: "sale",
      price: 620000000,
      beds: 1,
      baths: 1,
      area: 32,
      image: "https://picsum.photos/seed/perumahanku6/600/450",
      createdAt: "2026-05-28",
    },
    {
      id: 7,
      title: "Rumah Asri Dekat Sekolah",
      location: "Yogyakarta, DI Yogyakarta",
      type: "Rumah",
      status: "rent",
      price: 4200000,
      beds: 2,
      baths: 1,
      area: 70,
      image: "https://picsum.photos/seed/perumahanku7/600/450",
      createdAt: "2026-08-02",
    },
    {
      id: 8,
      title: "Ruko 3 Lantai Kawasan Bisnis",
      location: "Medan, Sumatera Utara",
      type: "Ruko",
      status: "rent",
      price: 15000000,
      beds: 0,
      baths: 2,
      area: 180,
      image: "https://picsum.photos/seed/perumahanku8/600/450",
      createdAt: "2026-04-11",
    },
    {
      id: 9,
      title: "Tanah Komersial Pinggir Jalan Raya",
      location: "Semarang, Jawa Tengah",
      type: "Tanah",
      status: "sale",
      price: 980000000,
      beds: 0,
      baths: 0,
      area: 300,
      image: "https://picsum.photos/seed/perumahanku9/600/450",
      createdAt: "2026-09-01",
    },
  ];

  /* ---------------- DOM references ---------------- */
  const grid = document.getElementById("listingsGrid");
  const noResults = document.getElementById("noResults");
  const resultsCount = document.getElementById("resultsCount");
  const statListings = document.getElementById("statListings");

  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const typeSelect = document.getElementById("typeSelect");
  const priceSelect = document.getElementById("priceSelect");
  const sortSelect = document.getElementById("sortSelect");

  const header = document.getElementById("siteHeader");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  const navAuth = document.getElementById("navAuth");

  const currencyFormatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

  /* ---------------- Rendering ---------------- */
  function formatPrice(property) {
    const formatted = currencyFormatter.format(property.price);
    return property.status === "rent" ? `${formatted} / bulan` : formatted;
  }

  function createCard(property) {
    const badgeLabel = property.status === "rent" ? "Disewa" : "Dijual";
    const badgeClass = property.status === "rent" ? "property-badge rent" : "property-badge";

    const featureBits = [];
    if (property.beds > 0) featureBits.push(`<span>🛏️ ${property.beds} KT</span>`);
    if (property.baths > 0) featureBits.push(`<span>🛁 ${property.baths} KM</span>`);
    featureBits.push(`<span>📐 ${property.area} m²</span>`);

    return `
      <article class="property-card" data-id="${property.id}">
        <div class="property-media">
          <img src="${property.image}" alt="${property.title}" loading="lazy" />
          <span class="${badgeClass}">${badgeLabel}</span>
          <span class="property-price-tag">${formatPrice(property)}</span>
        </div>
        <div class="property-body">
          <span class="property-type">${property.type}</span>
          <h3 class="property-title">${property.title}</h3>
          <p class="property-location">📍 ${property.location}</p>
          <div class="property-features">${featureBits.join("")}</div>
          <a href="#" class="property-cta" data-id="${property.id}">Lihat Detail</a>
        </div>
      </article>
    `;
  }

  function renderListings(list) {
    grid.innerHTML = list.map(createCard).join("");
    noResults.hidden = list.length > 0;
    grid.style.display = list.length > 0 ? "grid" : "none";
    resultsCount.textContent = `Menampilkan ${list.length} dari ${properties.length} properti`;
  }

  /* ---------------- Filtering & sorting ---------------- */
  function getFilteredListings() {
    const keyword = searchInput.value.trim().toLowerCase();
    const type = typeSelect.value;
    const priceRange = priceSelect.value;

    let result = properties.filter((property) => {
      const matchesKeyword =
        !keyword ||
        property.title.toLowerCase().includes(keyword) ||
        property.location.toLowerCase().includes(keyword);

      const matchesType = type === "all" || property.type === type;

      let matchesPrice = true;
      if (priceRange !== "all") {
        const [min, max] = priceRange.split("-").map(Number);
        matchesPrice = property.price >= min && property.price <= max;
      }

      return matchesKeyword && matchesType && matchesPrice;
    });

    result = sortListings(result, sortSelect.value);
    return result;
  }

  function sortListings(list, sortBy) {
    const sorted = [...list];
    switch (sortBy) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "area-desc":
        sorted.sort((a, b) => b.area - a.area);
        break;
      case "newest":
      default:
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }
    return sorted;
  }

  function applyFilters() {
    renderListings(getFilteredListings());
  }

  /* ---------------- Event bindings ---------------- */
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    applyFilters();
    document.getElementById("listings").scrollIntoView({ behavior: "smooth" });
  });

  typeSelect.addEventListener("change", applyFilters);
  priceSelect.addEventListener("change", applyFilters);
  sortSelect.addEventListener("change", applyFilters);

  let debounceTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyFilters, 250);
  });

  // Footer property-type quick links feed back into the type filter.
  document.querySelectorAll("[data-type]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      typeSelect.value = link.dataset.type;
      applyFilters();
      document.getElementById("listings").scrollIntoView({ behavior: "smooth" });
    });
  });

  // Mobile nav toggle
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navAuth.classList.toggle("open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navAuth.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  // Sticky header shadow on scroll
  function handleScroll() {
    header.classList.toggle("scrolled", window.scrollY > 20);
  }
  window.addEventListener("scroll", handleScroll, { passive: true });

  /* ---------------- Init ---------------- */
  function init() {
    statListings.textContent = properties.length;
    handleScroll();
    renderListings(sortListings(properties, "newest"));
  }

  document.addEventListener("DOMContentLoaded", init);
})();
