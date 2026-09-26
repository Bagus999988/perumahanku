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
})();
