// Lists everyone who submitted the public /register.html form.
(function () {
  "use strict";

  const sb = window.sbAdmin;
  const bodyEl = document.getElementById("registrationsBody");
  const countEl = document.getElementById("registrationCount");

  const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));
  }

  async function load() {
    const { data, error } = await sb
      .from("registrations")
      .select("id, name, email, phone, message, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      countEl.textContent = "Gagal memuat data.";
      bodyEl.innerHTML = `<tr><td colspan="5" class="admin-empty">${escapeHtml(error.message)}</td></tr>`;
      return;
    }

    countEl.textContent = `${data.length} orang telah mendaftar.`;

    if (data.length === 0) {
      bodyEl.innerHTML = `<tr><td colspan="5" class="admin-empty">Belum ada pendaftar.</td></tr>`;
      return;
    }

    bodyEl.innerHTML = data
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.name)}</td>
            <td>${escapeHtml(row.email)}</td>
            <td>${escapeHtml(row.phone || "-")}</td>
            <td class="wrap">${escapeHtml(row.message || "-")}</td>
            <td>${dateFormatter.format(new Date(row.created_at))}</td>
          </tr>
        `
      )
      .join("");
  }

  window.requireAdmin().then((session) => {
    if (session) load();
  });
})();
