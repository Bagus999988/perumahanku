// Admin listing manager: pick a listing on the left, manage its up-to-4
// photos on the right (upload into Supabase Storage, row into listing_photos).
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

  function publicUrlToStoragePath(url) {
    const marker = "/storage/v1/object/public/listing-photos/";
    const idx = url.indexOf(marker);
    return idx === -1 ? null : url.slice(idx + marker.length);
  }

  async function fetchListings() {
    const { data, error } = await sb
      .from("listings")
      .select("id, title, location, price, listing_photos(id, photo_url, sort_order)")
      .order("created_at", { ascending: false });

    if (error) {
      listingListEl.innerHTML = `<p class="admin-empty">Gagal memuat listing: ${error.message}</p>`;
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
            <h4>${listing.title}</h4>
            <p>${listing.location} &middot; ${currencyFormatter.format(listing.price)}</p>
            <span class="photo-count">${count}/4 foto</span>
          </div>
        `;
      })
      .join("");

    listingListEl.querySelectorAll(".admin-listing-item").forEach((el) => {
      el.addEventListener("click", () => {
        activeListingId = el.dataset.id;
        renderList();
        renderPhotoPanel();
      });
    });
  }

  function renderPhotoPanel() {
    const listing = listings.find((item) => item.id === activeListingId);
    if (!listing) {
      photoPanelEl.innerHTML = `<p class="admin-empty-hint">Pilih listing di sebelah kiri untuk mengelola fotonya.</p>`;
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
              <img src="${photo.photo_url}" alt="Foto ${slot} - ${listing.title}" />
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
      <h3>${listing.title}</h3>
      <p class="admin-empty-hint">Maksimal 4 foto. Foto slot 1 dipakai sebagai foto utama di halaman depan.</p>
      <div class="photo-grid">${slots}</div>
    `;

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
      renderPhotoPanel();
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
    renderPhotoPanel();
  }

  window.requireAdmin().then((session) => {
    if (session) refresh();
  });
})();
