// Admin login: signs in with Supabase Auth, then verifies the account is
// actually in the `admins` allow-list before letting it into the panel.
(function () {
  "use strict";

  const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  const form = document.getElementById("loginForm");
  const statusEl = document.getElementById("loginStatus");
  const submitBtn = document.getElementById("loginBtn");

  function setError(message) {
    statusEl.textContent = message;
    statusEl.classList.toggle("error", Boolean(message));
  }

  // If already logged in as an admin, skip straight to the dashboard.
  (async () => {
    const {
      data: { session },
    } = await sb.auth.getSession();
    if (!session) return;
    const { data: isAdmin } = await sb.rpc("is_admin");
    if (isAdmin) window.location.href = "index.html";
  })();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = "Memeriksa...";
    setError("");

    const email = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passwordInput").value;

    const { error: signInError } = await sb.auth.signInWithPassword({ email, password });

    if (signInError) {
      // Show Supabase's real reason (e.g. "Invalid login credentials" vs
      // "Email not confirmed") instead of a generic message, so it's
      // actually possible to diagnose a failed login.
      setError(`Gagal masuk: ${signInError.message}`);
      submitBtn.disabled = false;
      submitBtn.textContent = "Masuk";
      return;
    }

    const { data: isAdmin } = await sb.rpc("is_admin");
    if (!isAdmin) {
      await sb.auth.signOut();
      setError("Akun ini tidak memiliki akses admin.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Masuk";
      return;
    }

    window.location.href = "index.html";
  });
})();
