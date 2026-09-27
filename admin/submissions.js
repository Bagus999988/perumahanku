// Reviews properties submitted publicly via /submit-listing.html.
// Approving copies the submission into the public `listings` table;
// rejecting just marks it so and leaves it out of the public site.
(function () {
  "use strict";

  const sb = window.sbAdmin;
  const bodyEl = document.getElementById("submissionsBody");
  const summaryEl = document.getElementById("submissionSummary");

  const currencyFormatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

  const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const STATUS_LABEL = {
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
  };

  let submissions = [];

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
      .from("listing_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      summaryEl.textContent = "Gagal memuat data.";
      bodyEl.innerHTML = `<tr><td colspan="6" class="admin-empty">${escapeHtml(error.message)}</td></tr>`;
      return;
    }

    submissions = data || [];
    const pendingCount = submissions.filter((s) => s.review_status === "pending").length;
    summaryEl.textContent = `${submissions.length} pengajuan total, ${pendingCount} menunggu tinjauan.`;

    render();
  }

  function render() {
    if (submissions.length === 0) {
      bodyEl.innerHTML = `<tr><td colspan="6" class="admin-empty">Belum ada pengajuan properti.</td></tr>`;
      return;
    }

    bodyEl.innerHTML = submissions
      .map((row) => {
        const propertyLabel = `${escapeHtml(row.title)}<br><span class="admin-empty-hint">${escapeHtml(row.location)} &middot; ${escapeHtml(row.type)}</span>`;
        const submitterLabel = `${escapeHtml(row.submitter_name)}<br><span class="admin-empty-hint">${escapeHtml(row.submitter_email)}${row.submitter_phone ? " · " + escapeHtml(row.submitter_phone) : ""}</span>`;

        let actions = `<span class="admin-empty-hint">-</span>`;
        if (row.review_status === "pending") {
          actions = `
            <button type="button" class="btn btn-primary btn-sm" data-action="approve" data-id="${row.id}">Setujui</button>
            <button type="button" class="btn btn-danger btn-sm" data-action="reject" data-id="${row.id}">Tolak</button>
          `;
        } else {
          actions = `<button type="button" class="btn btn-danger btn-sm" data-action="delete" data-id="${row.id}">Hapus Catatan</button>`;
        }

        return `
          <tr>
            <td class="wrap">${propertyLabel}</td>
            <td>${currencyFormatter.format(row.price)}</td>
            <td class="wrap">${submitterLabel}</td>
            <td><span class="status-badge ${row.review_status}">${STATUS_LABEL[row.review_status] || row.review_status}</span></td>
            <td>${dateFormatter.format(new Date(row.created_at))}</td>
            <td class="admin-actions-cell">${actions}</td>
          </tr>
        `;
      })
      .join("");

    bodyEl.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => handleAction(btn.dataset.action, btn.dataset.id));
    });
  }

  async function handleAction(action, id) {
    const submission = submissions.find((s) => s.id === id);
    if (!submission) return;

    if (action === "approve") {
      if (!confirm(`Setujui dan tampilkan "${submission.title}" di halaman depan?`)) return;

      const { error: insertError } = await sb.from("listings").insert({
        title: submission.title,
        location: submission.location,
        type: submission.type,
        status: submission.status,
        price: submission.price,
        beds: submission.beds,
        baths: submission.baths,
        area: submission.area,
        notes: submission.notes,
      });

      if (insertError) {
        alert("Gagal membuat listing: " + insertError.message);
        return;
      }

      await sb
        .from("listing_submissions")
        .update({ review_status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", id);
    } else if (action === "reject") {
      if (!confirm(`Tolak pengajuan "${submission.title}"?`)) return;
      await sb
        .from("listing_submissions")
        .update({ review_status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", id);
    } else if (action === "delete") {
      if (!confirm("Hapus catatan pengajuan ini secara permanen?")) return;
      await sb.from("listing_submissions").delete().eq("id", id);
    }

    await load();
  }

  window.requireAdmin().then((session) => {
    if (session) load();
  });
})();
