// Public registration form — writes a lead into Supabase `registrations`.
// Visible to the site owner under /admin/registrations.html.
(function () {
  "use strict";

  const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  const form = document.getElementById("registerForm");
  const submitBtn = document.getElementById("submitBtn");
  const statusEl = document.getElementById("formStatus");

  const nameInput = document.getElementById("nameInput");
  const emailInput = document.getElementById("emailInput");
  const phoneInput = document.getElementById("phoneInput");
  const messageInput = document.getElementById("messageInput");

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.toggle("form-status-error", Boolean(isError));
    statusEl.classList.toggle("form-status-success", !isError && Boolean(message));
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = "Mengirim...";
    setStatus("", false);

    const { error } = await sb.from("registrations").insert({
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim() || null,
      message: messageInput.value.trim() || null,
    });

    submitBtn.disabled = false;
    submitBtn.textContent = "Kirim Pendaftaran";

    if (error) {
      setStatus("Terjadi kesalahan, silakan coba lagi.", true);
      console.error(error);
      return;
    }

    setStatus("Terima kasih! Pendaftaran Anda berhasil dikirim.", false);
    form.reset();
  });
})();
