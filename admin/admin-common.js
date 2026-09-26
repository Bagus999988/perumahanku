// Shared setup for every protected /admin page (not login.html):
// - creates the Supabase client
// - exposes requireAdmin(), which redirects to login.html unless the
//   signed-in user is present in the `admins` table (checked via the
//   is_admin() RPC, enforced for real by RLS — see supabase/schema.sql)
// - wires the logout button and sidebar active-link highlighting
window.sbAdmin = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

(function () {
  "use strict";

  const sb = window.sbAdmin;

  async function requireAdmin() {
    const {
      data: { session },
    } = await sb.auth.getSession();

    if (!session) {
      window.location.href = "login.html";
      return null;
    }

    const { data: isAdmin, error } = await sb.rpc("is_admin");
    if (error || !isAdmin) {
      await sb.auth.signOut();
      window.location.href = "login.html";
      return null;
    }

    const userLabel = document.getElementById("adminUserLabel");
    if (userLabel) userLabel.textContent = session.user.email;

    return session;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await sb.auth.signOut();
      window.location.href = "login.html";
    });
  }

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".admin-nav a").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });

  window.requireAdmin = requireAdmin;
})();
