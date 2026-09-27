// Admin listing manager: pick a listing on the left, edit its details and
// manage its up-to-4 photos on the right, or delete it entirely.
(function () {
  "use strict";

  const sb = window.sbAdmin;
  const listingListEl = document.getElementById("listingList");
  const photoPanelEl = document.getElementById("photoPanel");

  const currencyFormatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

  let listings = [];
  let activeListingId = null;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));
  }

  function publicUrlToStoragePath(url) {
    const marker = "/storage/v1/object/public/listing-photos/";
    const idx = url.indexOf(marker);
    return idx === -1 ? null : url.slice(idx + marker.length);
  }

  async function fetchListings() {
    const { data, error } = await sb
      .from("listings")
      .select(
        "id, title, location, type, status, price, beds, baths, area, notes, listing_photos(id, photo_url, sort_order)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      listingListEl.innerHTML = `<p class="admin-empty">Gagal memuat listing: ${escapeHtml(error.message)}</p>`;
      return [];
    }
    return data || [];
  }

  function renderList() {
    if (listings.length === 0) {
      listingListEl.innerHTML = `<p class="admin-empty">Belum ada listing.</p>`;
      return;
    }

    listingListEl.innerHTML = listings
      .map((listing) => {
        const count = (listing.listing_photos || []).length;
        const isActive = listing.id === activeListingId;
        return `
          <div class="admin-listing-item ${isActive ? "active" : ""}" data-id="${listing.id}">
            <h4>${escapeHtml(listing.title)}</h4>
            <p>${escapeHtml(listing.location)} &middot; ${currencyFormatter.format(listing.price)}</p>
            <span class="photo-count">${count}/4 foto</span>
          </div>
        `;
      })
      .join("");

    listingListEl.querySelectorAll(".admin-listing-item").forEach((el) => {
      el.addEventListener("click", () => {
        activeListingId = el.dataset.id;
        renderList();
        renderDetailPanel();
      });
    });
  }

  function typeOptions(selected) {
    return ["Rumah", "Apartemen", "Ruko", "Tanah"]
      .map((t) => `<option value="${t}" ${t === selected ? "selected" : ""}>${t}</option>`)
      .join("");
  }

  function statusOptions(selected) {
    return [
      { value: "sale", label: "Dijual" },
      { value: "rent", label: "Disewa" },
    ]
      .map((s) => `<option value="${s.value}" ${s.value === selected ? "selected" : ""}>${s.label}</option>`)
      .join("");
  }

  function renderDetailPanel() {
    const listing = listings.find((item) => item.id === activeListingId);
    if (!listing) {
      photoPanelEl.innerHTML = `<p class="admin-empty-hint">Pilih listing di sebelah kiri untuk mengelola datanya.</p>`;
      return;
    }

    const photosBySlot = {};
    (listing.listing_photos || []).forEach((photo) => {
      photosBySlot[photo.sort_order] = photo;
    });

    const slots = [1, 2, 3, 4]
      .map((slot) => {
        const photo = photosBySlot[slot];
        if (photo) {
          return `
            <div class="photo-slot filled" data-slot="${slot}">
              <img src="${photo.photo_url}" alt="Foto ${slot} - ${escapeHtml(listing.title)}" />
              <button
                type="button"
                class="slot-remove"
                data-photo-id="${photo.id}"
                data-photo-url="${photo.photo_url}"
                title="Hapus foto"
              >✕</button>
            </div>
          `;
        }
        return `
          <div class="photo-slot" data-slot="${slot}">
            <label class="slot-upload">
              <span>+ Unggah Foto ${slot}</span>
              <input type="file" accept="image/*" data-slot="${slot}" />
            </label>
          </div>
        `;
      })
      .join("");

    photoPanelEl.innerHTML = `
      <form id="editListingForm" class="admin-edit-form">
        <div class="admin-field">
          <label for="editTitle">Judul</label>
          <input type="text" id="editTitle" value="${escapeHtml(listing.title)}" required />
        </div>
        <div class="admin-field">
          <label for="editLocation">Lokasi</label>
          <input type="text" id="editLocation" value="${escapeHtml(listing.location)}" required />
        </div>
        <div class="admin-field">
          <label for="editType">Tipe</label>
          <select id="editType">${typeOptions(listing.type)}</select>
        </div>
        <div class="admin-field">
          <label for="editStatus">Status</label>
          <select id="editStatus">${statusOptions(listing.status)}</select>
        </div>
        <div class="admin-field">
          <label for="editPrice">Harga (Rp)</label>
          <input type="number" id="editPrice" min="0" value="${listing.price}" required />
        </div>
        <div class="admin-field">
          <label for="editArea">Luas (m²)</label>
          <input type="number" id="editArea" min="0" value="${listing.area}" required />
        </div>
        <div class="admin-field">
          <label for="editBeds">Kamar Tidur</label>
          <input type="number" id="editBeds" min="0" value="${listing.beds}" />
        </div>
        <div class="admin-field">
          <label for="editBaths">Kamar Mandi</label>
          <input type="number" id="editBaths" min="0" value="${listing.baths}" />
        </div>
        <div class="admin-field full-width">
          <label for="editNotes">Catatan / Deskripsi (tampil di halaman depan)</label>
          <textarea id="editNotes" rows="3">${escapeHtml(listing.notes || "")}</textarea>
        </div>

        <div class="admin-edit-actions full-width">
          <button type="submit" class="btn btn-primary" id="saveListingBtn">Simpan Perubahan</button>
          <button type="button" class="btn btn-danger" id="deleteListingBtn">Hapus Listing</button>
          <span class="admin-form-status" id="editStatusMsg"></span>
        </div>
      </form>

      <h3 class="admin-photo-heading">Foto Listing</h3>
      <p class="admin-empty-hint">Maksimal 4 foto. Foto slot 1 dipakai sebagai foto utama di halaman depan.</p>
      <div class="photo-grid">${slots}</div>
    `;

    document.getElementById("editListingForm").addEventListener("submit", saveListing);
    document.getElementById("deleteListingBtn").addEventListener("click", deleteListing);

    photoPanelEl.querySelectorAll(".slot-remove").forEach((btn) => {
      btn.addEventListener("click", () => removePhoto(btn.dataset.photoId, btn.dataset.photoUrl));
    });

    photoPanelEl.querySelectorAll('input[type="file"]').forEach((input) => {
      input.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) uploadPhoto(file, Number(input.dataset.slot));
      });
    });
  }

  async function saveListing(event) {
    event.preventDefault();
    const saveBtn = document.getElementById("saveListingBtn");
    const statusMsg = document.getElementById("editStatusMsg");

    saveBtn.disabled = true;
    saveBtn.textContent = "Menyimpan...";
    statusMsg.textContent = "";
    statusMsg.classList.remove("error");

    const updates = {
      title: document.getElementById("editTitle").value.trim(),
      location: document.getElementById("editLocation").value.trim(),
      type: document.getElementById("editType").value,
      status: document.getElementById("editStatus").value,
      price: Number(document.getElementById("editPrice").value),
      area: Number(document.getElementById("editArea").value),
      beds: Number(document.getElementById("editBeds").value) || 0,
      baths: Number(document.getElementById("editBaths").value) || 0,
      notes: document.getElementById("editNotes").value.trim() || null,
    };

    const { error } = await sb.from("listings").update(updates).eq("id", activeListingId);

    saveBtn.disabled = false;
    saveBtn.textContent = "Simpan Perubahan";

    if (error) {
      statusMsg.textContent = "Gagal menyimpan: " + error.message;
      statusMsg.classList.add("error");
      return;
    }

    statusMsg.textContent = "Tersimpan.";
    await refresh();
  }

  async function deleteListing() {
    const listing = listings.find((item) => item.id === activeListingId);
    if (!listing) return;

    if (!confirm(`Hapus listing "${listing.title}"? Semua foto listing ini juga akan dihapus. Tindakan ini tidak bisa dibatalkan.`)) {
      return;
    }

    const paths = (listing.listing_photos || [])
      .map((photo) => publicUrlToStoragePath(photo.photo_url))
      .filter(Boolean);

    if (paths.length > 0) {
      await sb.storage.from("listing-photos").remove(paths);
    }

    const { error } = await sb.from("listings").delete().eq("id", activeListingId);
    if (error) {
      alert("Gagal menghapus listing: " + error.message);
      return;
    }

    activeListingId = null;
    await refresh();
  }

  async function uploadPhoto(file, slot) {
    const listing = listings.find((item) => item.id === activeListingId);
    if (!listing) return;

    const slotEl = photoPanelEl.querySelector(`.photo-slot[data-slot="${slot}"]`);
    if (slotEl) slotEl.innerHTML = '<span class="admin-empty-hint">Mengunggah...</span>';

    const ext = file.name.split(".").pop();
    const path = `${listing.id}/${Date.now()}-slot${slot}.${ext}`;

    const { error: uploadError } = await sb.storage
      .from("listing-photos")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      alert("Gagal mengunggah foto: " + uploadError.message);
      renderDetailPanel();
      return;
    }

    const { data: publicUrlData } = sb.storage.from("listing-photos").getPublicUrl(path);

    const { error: insertError } = await sb.from("listing_photos").insert({
      listing_id: listing.id,
      photo_url: publicUrlData.publicUrl,
      sort_order: slot,
    });

    if (insertError) {
      alert("Gagal menyimpan data foto: " + insertError.message);
    }

    await refresh();
  }

  async function removePhoto(photoId, photoUrl) {
    if (!confirm("Hapus foto ini?")) return;

    const path = publicUrlToStoragePath(photoUrl);
    if (path) {
      await sb.storage.from("listing-photos").remove([path]);
    }

    const { error } = await sb.from("listing_photos").delete().eq("id", photoId);
    if (error) alert("Gagal menghapus foto: " + error.message);

    await refresh();
  }

  async function refresh() {
    listings = await fetchListings();
    renderList();
    renderDetailPanel();
  }

  window.requireAdmin().then((session) => {
    if (session) refresh();
  });
})();
