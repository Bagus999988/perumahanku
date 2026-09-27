// Public "Pasang Properti" form — writes into `listing_submissions`.
// Nothing here becomes a public listing until an admin approves it
// from /admin/submissions.html.
(function () {
  "use strict";

  const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  const form = document.getElementById("submitListingForm");
  const submitBtn = document.getElementById("submitBtn");
  const statusEl = document.getElementById("formStatus");

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

    const { error } = await sb.from("listing_submissions").insert({
      title: document.getElementById("titleInput").value.trim(),
      location: document.getElementById("locationInput").value.trim(),
      type: document.getElementById("typeInput").value,
      status: document.getElementById("statusInput").value,
      price: Number(document.getElementById("priceInput").value),
      area: Number(document.getElementById("areaInput").value),
      beds: Number(document.getElementById("bedsInput").value) || 0,
      baths: Number(document.getElementById("bathsInput").value) || 0,
      notes: document.getElementById("notesInput").value.trim() || null,
      submitter_name: document.getElementById("nameInput").value.trim(),
      submitter_email: document.getElementById("emailInput").value.trim(),
      submitter_phone: document.getElementById("phoneInput").value.trim() || null,
    });

    submitBtn.disabled = false;
    submitBtn.textContent = "Kirim Pengajuan";

    if (error) {
      setStatus("Terjadi kesalahan, silakan coba lagi.", true);
      console.error(error);
      return;
    }

    setStatus("Terima kasih! Pengajuan Anda akan ditinjau oleh admin sebelum tampil di website.", false);
    form.reset();
  });
})();
