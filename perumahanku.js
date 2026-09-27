// ==========================================================================
// PerumahanKu — Real Estate Website Logic
// Listings are loaded live from Supabase (see supabase/schema.sql);
// admin edits made in /admin appear here automatically.
// ==========================================================================

(function () {
  "use strict";

  const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const FALLBACK_IMAGE_SEED = "https://picsum.photos/seed/";

  let properties = [];

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

  const currencyFormatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

  /* ---------------- Data loading ---------------- */
  async function loadListings() {
    const { data, error } = await sb
      .from("listings")
      .select(
        "id, title, location, type, status, price, beds, baths, area, notes, created_at, listing_photos(photo_url, sort_order)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gagal memuat listing dari Supabase:", error.message);
      return [];
    }

    return (data || []).map((row) => {
      const photos = [...(row.listing_photos || [])].sort((a, b) => a.sort_order - b.sort_order);
      return {
        id: row.id,
        title: row.title,
        location: row.location,
        type: row.type,
        status: row.status,
        price: Number(row.price),
        beds: row.beds,
        baths: row.baths,
        area: Number(row.area),
        notes: row.notes,
        image: photos[0] ? photos[0].photo_url : `${FALLBACK_IMAGE_SEED}${row.id}/600/450`,
        createdAt: row.created_at,
      };
    });
  }

  async function logVisit() {
    try {
      await sb.from("visitors").insert({
        page: window.location.pathname || "/",
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
      });
    } catch (err) {
      // Visitor logging is best-effort; never block the page for it.
      console.warn("Gagal mencatat kunjungan:", err);
    }
  }

  /* ---------------- Rendering ---------------- */
  function formatPrice(property) {
    const formatted = currencyFormatter.format(property.price);
    return property.status === "rent" ? `${formatted} / bulan` : formatted;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));
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
          <img src="${property.image}" alt="${escapeHtml(property.title)}" loading="lazy" />
          <span class="${badgeClass}">${badgeLabel}</span>
          <span class="property-price-tag">${formatPrice(property)}</span>
        </div>
        <div class="property-body">
          <span class="property-type">${escapeHtml(property.type)}</span>
          <h3 class="property-title">${escapeHtml(property.title)}</h3>
          <p class="property-location">📍 ${escapeHtml(property.location)}</p>
          ${property.notes ? `<p class="property-notes">${escapeHtml(property.notes)}</p>` : ""}
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

  /* ---------------- Init ---------------- */
  async function init() {
    logVisit();

    resultsCount.textContent = "Memuat properti...";
    properties = await loadListings();
    statListings.textContent = properties.length;
    renderListings(sortListings(properties, "newest"));
  }

  document.addEventListener("DOMContentLoaded", init);
})();
