// Shared mobile nav toggle + sticky header behavior for all public pages.
(function () {
  "use strict";

  const header = document.getElementById("siteHeader");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  const navAuth = document.getElementById("navAuth");

  if (!header || !navToggle || !navLinks || !navAuth) return;

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

  // Only pages with a hero (data-transparent="true") fade the header in on scroll;
  // other pages keep the solid header set directly in their markup.
  function handleScroll() {
    if (header.dataset.transparent === "true") {
      header.classList.toggle("scrolled", window.scrollY > 20);
    }
  }

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  // Reveal the "Admin" link only if this browser currently holds a signed-in
  // admin session (checked against Supabase, not guessed from local state).
  // Public visitors and logged-out owners never see it.
  const adminNavItem = document.getElementById("adminNavItem");
  if (adminNavItem && window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    (async () => {
      try {
        const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
        const {
          data: { session },
        } = await sb.auth.getSession();
        if (!session) return;

        const { data: isAdmin } = await sb.rpc("is_admin");
        if (isAdmin) adminNavItem.style.display = "";
      } catch (err) {
        // Fail silently — the link just stays hidden.
      }
    })();
  }
})();
