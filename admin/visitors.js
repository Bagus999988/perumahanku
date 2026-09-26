// Lists site visits logged by nav.js/perumahanku.js on every public page view.
(function () {
  "use strict";

  const sb = window.sbAdmin;
  const bodyEl = document.getElementById("visitorsBody");
  const summaryEl = document.getElementById("visitorSummary");

  const ROW_LIMIT = 300;

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

  function shortenUserAgent(ua) {
    if (!ua) return "-";
    return ua.length > 60 ? ua.slice(0, 60) + "…" : ua;
  }

  async function load() {
    const { count, error: countError } = await sb
      .from("visitors")
      .select("id", { count: "exact", head: true });

    const { data, error } = await sb
      .from("visitors")
      .select("id, page, referrer, user_agent, visited_at")
      .order("visited_at", { ascending: false })
      .limit(ROW_LIMIT);

    if (countError || error) {
      summaryEl.textContent = "Gagal memuat data.";
      bodyEl.innerHTML = `<tr><td colspan="4" class="admin-empty">${escapeHtml((error || countError).message)}</td></tr>`;
      return;
    }

    summaryEl.textContent = `${count} total kunjungan tercatat${
      count > ROW_LIMIT ? ` (menampilkan ${ROW_LIMIT} terbaru)` : ""
    }.`;

    if (data.length === 0) {
      bodyEl.innerHTML = `<tr><td colspan="4" class="admin-empty">Belum ada data kunjungan.</td></tr>`;
      return;
    }

    bodyEl.innerHTML = data
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.page)}</td>
            <td class="wrap">${escapeHtml(row.referrer || "Langsung")}</td>
            <td class="wrap">${escapeHtml(shortenUserAgent(row.user_agent))}</td>
            <td>${dateFormatter.format(new Date(row.visited_at))}</td>
          </tr>
        `
      )
      .join("");
  }

  window.requireAdmin().then((session) => {
    if (session) load();
  });
})();
