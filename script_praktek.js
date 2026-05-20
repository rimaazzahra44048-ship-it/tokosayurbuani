// ============================================================
//  script_praktek.js — Toko Sayur Bu Ani
//  Fitur: Keranjang belanja, notifikasi toast, form validasi,
//         highlight nav aktif, animasi scroll, counter pesanan
// ============================================================

/* ──────────────────────────────────────────────
   1. KERANJANG BELANJA (Cart)
   Mengelola item yang ditambah via tombol "+ Tambah"
   ────────────────────────────────────────────── */
const cart = {}; // { "🌿 Bayam Hijau": { qty: 2, harga: "Rp 3.000", satuan: "per ikat (~200gr)" } }

/**
 * Ambil nama produk, satuan, dan harga dari baris tabel (<tr>)
 * yang berisi tombol yang diklik.
 */
function getTabelData(button) {
  const row = button.closest("tr");
  const cols = row.querySelectorAll("td");
  return {
    nama: cols[0].textContent.trim(),
    satuan: cols[1].textContent.trim(),
    harga: cols[2].textContent.trim(),
  };
}

/** Tambah produk ke cart dan update badge. */
function tambahKeKeranjang(button) {
  const { nama, satuan, harga } = getTabelData(button);

  if (cart[nama]) {
    cart[nama].qty += 1;
  } else {
    cart[nama] = { qty: 1, harga, satuan };
  }

  updateBadge();
  showToast(`${nama} ditambahkan ke keranjang 🛒`);
  animasiButton(button);
}

/** Hitung total item di cart dan tampilkan di badge. */
function updateBadge() {
  const total = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  let badge = document.getElementById("cart-badge");

  if (!badge) return; // badge belum dibuat

  badge.textContent = total;
  badge.style.display = total > 0 ? "flex" : "none";

  // Animasi "bounce" pada badge
  badge.classList.remove("badge-bounce");
  void badge.offsetWidth; // reflow
  badge.classList.add("badge-bounce");
}

/** Animasi singkat pada tombol setelah diklik. */
function animasiButton(button) {
  button.textContent = "✓ Ditambah";
  button.style.backgroundColor = "#15803d";
  setTimeout(() => {
    button.textContent = "+ Tambah";
    button.style.backgroundColor = "";
  }, 1000);
}

/* ──────────────────────────────────────────────
   2. FLOATING CART BUTTON + MODAL KERANJANG
   Menampilkan ringkasan pesanan dan total harga
   ────────────────────────────────────────────── */
function buatFloatingCart() {
  // -- Tombol floating --
  const fab = document.createElement("button");
  fab.id = "fab-cart";
  fab.setAttribute("aria-label", "Lihat Keranjang");
  fab.innerHTML = `🛒 <span id="cart-badge" style="display:none">0</span>`;
  fab.title = "Lihat Keranjang";
  document.body.appendChild(fab);

  // -- Modal overlay --
  const overlay = document.createElement("div");
  overlay.id = "cart-overlay";
  overlay.innerHTML = `
    <div id="cart-modal" role="dialog" aria-modal="true" aria-label="Keranjang Belanja">
      <div id="cart-modal-header">
        <h3>🛒 Keranjang Belanja</h3>
        <button id="cart-close" aria-label="Tutup keranjang">✕</button>
      </div>
      <div id="cart-body"></div>
      <div id="cart-footer">
        <div id="cart-total"></div>
        <button id="btn-pesan-wa" class="tombol tombol-full">📲 Pesan via WhatsApp</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // -- Inject CSS khusus komponen --
  const style = document.createElement("style");
  style.textContent = `
    /* Floating button */
    #fab-cart {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 200;
      background-color: #16a34a;
      color: #fff;
      border: none;
      border-radius: 50px;
      padding: 14px 22px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background-color 0.2s, transform 0.2s;
    }
    #fab-cart:hover { background-color: #15803d; transform: translateY(-2px); }

    /* Badge angka */
    #cart-badge {
      background-color: #ef4444;
      color: #fff;
      border-radius: 50%;
      min-width: 22px;
      height: 22px;
      font-size: 0.78rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }
    @keyframes badgeBounce {
      0%,100% { transform: scale(1); }
      40%      { transform: scale(1.45); }
      70%      { transform: scale(0.9); }
    }
    .badge-bounce { animation: badgeBounce 0.4s ease; }

    /* Overlay gelap */
    #cart-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      z-index: 300;
      align-items: center;
      justify-content: center;
    }
    #cart-overlay.active { display: flex; }

    /* Modal */
    #cart-modal {
      background: #fff;
      border-radius: 16px;
      width: min(92vw, 460px);
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 12px 40px rgba(0,0,0,0.2);
      animation: slideUp 0.25s ease;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    #cart-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 22px;
      border-bottom: 1px solid #e5e7eb;
      background: #f0fdf4;
    }
    #cart-modal-header h3 { font-size: 1.1rem; color: #14532d; }
    #cart-close {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: #6b7280;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background 0.15s;
    }
    #cart-close:hover { background: #fee2e2; color: #ef4444; }

    /* Daftar item */
    #cart-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px 22px;
    }
    .cart-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f3f4f6;
      gap: 8px;
    }
    .cart-item-info { flex: 1; }
    .cart-item-nama { font-weight: 600; font-size: 0.92rem; color: #1f2937; }
    .cart-item-sub  { font-size: 0.8rem; color: #6b7280; }
    .cart-qty-wrap  { display: flex; align-items: center; gap: 6px; }
    .cart-qty-btn {
      background: #f3f4f6;
      border: none;
      border-radius: 6px;
      width: 28px; height: 28px;
      font-size: 1rem;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .cart-qty-btn:hover { background: #dcfce7; }
    .cart-qty-btn.hapus:hover { background: #fee2e2; color: #ef4444; }
    .cart-qty-num { font-weight: 700; min-width: 20px; text-align: center; }

    /* Kosong */
    .cart-kosong {
      text-align: center;
      padding: 40px 0;
      color: #9ca3af;
      font-size: 0.95rem;
    }

    /* Footer */
    #cart-footer {
      padding: 16px 22px;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
    }
    #cart-total {
      font-size: 0.95rem;
      font-weight: 700;
      color: #14532d;
      margin-bottom: 12px;
    }
  `;
  document.head.appendChild(style);

  // Event: buka modal
  fab.addEventListener("click", bukaModal);
  document.getElementById("cart-close").addEventListener("click", tutupModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) tutupModal();
  });
  document.getElementById("btn-pesan-wa").addEventListener("click", pesanWA);
}

function bukaModal() {
  renderKeranjang();
  document.getElementById("cart-overlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function tutupModal() {
  document.getElementById("cart-overlay").classList.remove("active");
  document.body.style.overflow = "";
}

/** Render isi keranjang ke dalam modal. */
function renderKeranjang() {
  const body = document.getElementById("cart-body");
  const totalEl = document.getElementById("cart-total");
  const items = Object.entries(cart);

  if (items.length === 0) {
    body.innerHTML = `<div class="cart-kosong">🛒<br>Keranjang masih kosong.<br>Silakan pilih produk dulu.</div>`;
    totalEl.textContent = "";
    return;
  }

  body.innerHTML = items
    .map(
      ([nama, { qty, harga, satuan }]) => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-nama">${nama}</div>
          <div class="cart-item-sub">${satuan} · ${harga}</div>
        </div>
        <div class="cart-qty-wrap">
          <button class="cart-qty-btn hapus" data-nama="${nama}" data-aksi="kurang" title="Kurangi">−</button>
          <span class="cart-qty-num">${qty}</span>
          <button class="cart-qty-btn" data-nama="${nama}" data-aksi="tambah" title="Tambah">+</button>
        </div>
      </div>`
    )
    .join("");

  // Event qty buttons di dalam modal
  body.querySelectorAll(".cart-qty-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nama = btn.dataset.nama;
      const aksi = btn.dataset.aksi;
      if (aksi === "tambah") {
        cart[nama].qty += 1;
      } else {
        cart[nama].qty -= 1;
        if (cart[nama].qty <= 0) delete cart[nama];
      }
      updateBadge();
      renderKeranjang();
    });
  });

  // Hitung total (angka saja dari string "Rp 3.000")
  const totalHarga = items.reduce((sum, [, { qty, harga }]) => {
    const angka = parseInt(harga.replace(/[^\d]/g, ""), 10) || 0;
    return sum + angka * qty;
  }, 0);

  totalEl.textContent = `Total: Rp ${totalHarga.toLocaleString("id-ID")} (${items.reduce((s, [, { qty }]) => s + qty, 0)} item)`;
}

/** Redirect ke WhatsApp dengan ringkasan pesanan. */
function pesanWA() {
  const items = Object.entries(cart);
  if (items.length === 0) {
    showToast("Keranjang masih kosong!", "error");
    return;
  }
  const baris = items
    .map(([nama, { qty, harga }]) => `- ${nama} x${qty} (${harga})`)
    .join("%0A");
  const pesan = `Halo Bu Ani, saya ingin memesan:%0A${baris}%0ATerima kasih! 🙏`;
  const nomorWA = "6281234567890"; // sesuai nomor di HTML (0812-3456-7890)
  window.open(`https://wa.me/${nomorWA}?text=${pesan}`, "_blank");
}

/* ──────────────────────────────────────────────
   3. TOAST NOTIFICATION
   Pesan kecil muncul di pojok layar
   ────────────────────────────────────────────── */
function injectToastCSS() {
  const style = document.createElement("style");
  style.textContent = `
    #toast-container {
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 500;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    }
    .toast {
      background: #1f2937;
      color: #fff;
      padding: 12px 18px;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 500;
      box-shadow: 0 4px 14px rgba(0,0,0,0.2);
      opacity: 0;
      transform: translateX(30px);
      transition: opacity 0.3s, transform 0.3s;
      max-width: 280px;
    }
    .toast.show { opacity: 1; transform: translateX(0); }
    .toast.success { border-left: 4px solid #16a34a; }
    .toast.error   { border-left: 4px solid #ef4444; }
    .toast.info    { border-left: 4px solid #3b82f6; }
  `;
  document.head.appendChild(style);

  const container = document.createElement("div");
  container.id = "toast-container";
  document.body.appendChild(container);
}

/**
 * Tampilkan toast.
 * @param {string} pesan - Teks yang ditampilkan
 * @param {"success"|"error"|"info"} tipe
 */
function showToast(pesan, tipe = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${tipe}`;
  toast.textContent = pesan;
  container.appendChild(toast);

  // Trigger animasi masuk
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });

  // Hapus setelah 2.8 detik
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 350);
  }, 2800);
}

/* ──────────────────────────────────────────────
   4. VALIDASI & FEEDBACK FORM KONTAK
   Memberi pesan error/sukses pada #form-kontak
   ────────────────────────────────────────────── */
function inisialisasiForm() {
  const form = document.getElementById("form-kontak");
  if (!form) return;

  // Inject CSS validasi
  const style = document.createElement("style");
  style.textContent = `
    .form-group input:focus,
    .form-group textarea:focus {
      border-color: #16a34a;
      box-shadow: 0 0 0 3px rgba(22,163,74,0.12);
    }
    .form-group input.invalid,
    .form-group textarea.invalid {
      border-color: #ef4444 !important;
    }
    .form-group input.valid,
    .form-group textarea.valid {
      border-color: #16a34a;
    }
    .error-msg {
      color: #ef4444;
      font-size: 0.8rem;
      margin-top: 4px;
      display: block;
    }
    .sukses-msg {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #14532d;
      border-radius: 10px;
      padding: 16px;
      text-align: center;
      font-size: 0.95rem;
      font-weight: 600;
      margin-top: 12px;
      display: none;
    }
  `;
  document.head.appendChild(style);

  // Tambahkan elemen pesan sukses di bawah form
  const suksesEl = document.createElement("div");
  suksesEl.className = "sukses-msg";
  suksesEl.id = "form-sukses";
  suksesEl.textContent = "✅ Pesan terkirim! Kami akan segera menghubungi Anda.";
  form.after(suksesEl);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    bersihkanError(form);

    const nama = form.querySelector("#nama");
    const telepon = form.querySelector("#telepon");
    const pesan = form.querySelector("#pesan");
    let valid = true;

    if (nama.value.trim().length < 3) {
      tampilkanError(nama, "Nama minimal 3 karakter.");
      valid = false;
    } else {
      tandaiValid(nama);
    }

    if (!/^08\d{8,12}$/.test(telepon.value.trim())) {
      tampilkanError(telepon, "Masukkan nomor WhatsApp yang valid (contoh: 08123456789).");
      valid = false;
    } else {
      tandaiValid(telepon);
    }

    if (pesan.value.trim().length < 10) {
      tampilkanError(pesan, "Pesan minimal 10 karakter.");
      valid = false;
    } else {
      tandaiValid(pesan);
    }

    if (valid) {
      // Simulasi pengiriman
      const tombol = form.querySelector("[type=submit]");
      tombol.textContent = "⏳ Mengirim...";
      tombol.disabled = true;

      setTimeout(() => {
        form.reset();
        bersihkanError(form);
        tombol.textContent = "📨 Kirim Pesan";
        tombol.disabled = false;

        const suksesDiv = document.getElementById("form-sukses");
        suksesDiv.style.display = "block";
        suksesDiv.scrollIntoView({ behavior: "smooth", block: "center" });
        showToast("Pesan berhasil dikirim! 🎉", "success");

        setTimeout(() => (suksesDiv.style.display = "none"), 5000);
      }, 1200);
    }
  });
}

function tampilkanError(input, msg) {
  input.classList.add("invalid");
  input.classList.remove("valid");
  const span = document.createElement("span");
  span.className = "error-msg";
  span.textContent = msg;
  input.parentElement.appendChild(span);
}

function tandaiValid(input) {
  input.classList.add("valid");
  input.classList.remove("invalid");
}

function bersihkanError(form) {
  form.querySelectorAll(".error-msg").forEach((el) => el.remove());
  form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
}

/* ──────────────────────────────────────────────
   5. HIGHLIGHT NAVBAR AKTIF (Scroll Spy)
   Tandai link nav sesuai section yang terlihat
   ────────────────────────────────────────────── */
function inisialisasiScrollSpy() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-links a");

  // Inject CSS active
  const style = document.createElement("style");
  style.textContent = `
    .nav-links a.aktif {
      color: #16a34a !important;
      border-bottom: 2px solid #16a34a;
      padding-bottom: 2px;
    }
  `;
  document.head.appendChild(style);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => link.classList.remove("aktif"));
          const aktif = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
          if (aktif) aktif.classList.add("aktif");
        }
      });
    },
    { rootMargin: "-50% 0px -45% 0px" }
  );

  sections.forEach((sec) => observer.observe(sec));
}

/* ──────────────────────────────────────────────
   6. ANIMASI FADE-IN SAAT SCROLL
   Section muncul halus saat pertama kali masuk viewport
   ────────────────────────────────────────────── */
function inisialisasiAnimasiScroll() {
  const style = document.createElement("style");
  style.textContent = `
    .fade-in-up {
      opacity: 0;
      transform: translateY(32px);
      transition: opacity 0.55s ease, transform 0.55s ease;
    }
    .fade-in-up.visible {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);

  // Tambahkan kelas ke section yang ingin dianimasi
  const targets = document.querySelectorAll(
    ".section-produk, .section-cara-pesan, .section-kontak, .langkah-list li, table"
  );
  targets.forEach((el) => el.classList.add("fade-in-up"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target); // cukup satu kali
        }
      });
    },
    { threshold: 0.12 }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ──────────────────────────────────────────────
   7. SEARCH / FILTER TABEL PRODUK
   Input pencarian langsung filter baris tabel
   ────────────────────────────────────────────── */
function tambahFiturCariProduk() {
  const sectionProduk = document.querySelector(".section-produk");
  const tabel = sectionProduk?.querySelector("table");
  if (!sectionProduk || !tabel) return;

  // Buat elemen input pencarian
  const wrapper = document.createElement("div");
  wrapper.id = "cari-wrapper";

  const input = document.createElement("input");
  input.type = "search";
  input.id = "cari-produk";
  input.placeholder = "🔍 Cari produk...";
  input.setAttribute("aria-label", "Cari produk");

  wrapper.appendChild(input);

  // Inject CSS
  const style = document.createElement("style");
  style.textContent = `
    #cari-wrapper {
      margin-bottom: 18px;
      display: flex;
      justify-content: flex-end;
    }
    #cari-produk {
      padding: 10px 16px;
      border: 1.5px solid #e5e7eb;
      border-radius: 50px;
      font-size: 0.9rem;
      outline: none;
      width: min(100%, 280px);
      transition: border-color 0.2s, box-shadow 0.2s;
      font-family: inherit;
      background: #fff;
    }
    #cari-produk:focus {
      border-color: #16a34a;
      box-shadow: 0 0 0 3px rgba(22,163,74,0.12);
    }
    tr.tersembunyi { display: none; }
    .tidak-ada-produk {
      text-align: center;
      color: #9ca3af;
      font-size: 0.9rem;
      padding: 20px;
    }
  `;
  document.head.appendChild(style);

  // Sisipkan input sebelum tabel
  tabel.before(wrapper);

  const rows = tabel.querySelectorAll("tbody tr");

  // Elemen "produk tidak ditemukan"
  const kosong = document.createElement("tr");
  kosong.innerHTML = `<td colspan="4" class="tidak-ada-produk">Produk tidak ditemukan 😔</td>`;
  kosong.id = "baris-kosong";
  kosong.style.display = "none";
  tabel.querySelector("tbody").appendChild(kosong);

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    let ada = false;

    rows.forEach((row) => {
      const nama = row.querySelector("td")?.textContent.toLowerCase() || "";
      if (nama.includes(q)) {
        row.classList.remove("tersembunyi");
        ada = true;
      } else {
        row.classList.add("tersembunyi");
      }
    });

    kosong.style.display = ada ? "none" : "table-row";
  });
}

/* ──────────────────────────────────────────────
   8. TOMBOL "KEMBALI KE ATAS"
   Muncul setelah scroll ke bawah
   ────────────────────────────────────────────── */
function buatTombolKembaliAtas() {
  const btn = document.createElement("button");
  btn.id = "btn-top";
  btn.setAttribute("aria-label", "Kembali ke atas");
  btn.textContent = "↑";
  document.body.appendChild(btn);

  const style = document.createElement("style");
  style.textContent = `
    #btn-top {
      position: fixed;
      bottom: 96px;
      right: 28px;
      z-index: 200;
      background: #fff;
      color: #16a34a;
      border: 2px solid #16a34a;
      border-radius: 50%;
      width: 44px;
      height: 44px;
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s, transform 0.2s;
    }
    #btn-top.visible { opacity: 1; pointer-events: auto; }
    #btn-top:hover { background: #f0fdf4; transform: translateY(-2px); }
  `;
  document.head.appendChild(style);

  window.addEventListener("scroll", () => {
    btn.classList.toggle("visible", window.scrollY > 400);
  });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ──────────────────────────────────────────────
   INIT — Jalankan semua fitur setelah DOM siap
   ────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  injectToastCSS();
  buatFloatingCart();
  inisialisasiForm();
  inisialisasiScrollSpy();
  inisialisasiAnimasiScroll();
  tambahFiturCariProduk();
  buatTombolKembaliAtas();

  // Pasang event ke semua tombol "+ Tambah" di tabel
  document.querySelectorAll(".btn-tambah").forEach((btn) => {
    btn.addEventListener("click", () => tambahKeKeranjang(btn));
  });

  // Sambutan toast pertama kali
  setTimeout(() => showToast("Selamat datang di Toko Sayur Bu Ani! 🥬", "info"), 800);
});
