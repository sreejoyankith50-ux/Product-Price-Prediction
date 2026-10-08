/**
 * NovaStore — E-Commerce & Seller Price Intelligence
 * Integrated with the trained GridSearchCV SVC model from Untitled1 (1).ipynb
 */

// ==================== STATE MANAGEMENT ====================
const state = {
  products: [],
  cart: [],
  activeCategory: 'all',
  searchQuery: '',
  sortBy: 'featured',
  listing: {
    selectedRating: 4.8,
    uploadedImageData: '',
    uploadedFileName: '',
    lastEvaluation: null,
    samplePresets: [
      {
        name: 'Headphones Pro',
        url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'
      },
      {
        name: 'Audio Speaker',
        url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80'
      },
      {
        name: 'Minimal Watch',
        url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80'
      },
      {
        name: 'Smart Kitchen',
        url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80'
      },
      {
        name: 'Bestseller Book',
        url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'
      }
    ],
    sampleIndex: 0
  }
};

let modalSimTimer = null;
let heroSimTimer = null;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  loadCartFromStorage();
  fetchProducts();

  // Search input listeners
  const searchInput = document.getElementById('storeSearchInput');
  const searchClear = document.getElementById('searchClearBtn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      searchClear.style.display = state.searchQuery ? 'block' : 'none';
      fetchProducts();
    });
  }

  // Setup Drag and Drop on Upload Dropzone
  setupDropzone();

  // Run initial hero simulation
  runHeroQuickCheck();
});

// ==================== PRODUCT CATALOG LOGIC ====================
async function fetchProducts() {
  const grid = document.getElementById('catalogGrid');
  const counter = document.getElementById('catalogResultsCount');

  try {
    const params = new URLSearchParams({
      category: state.activeCategory,
      search: state.searchQuery,
      sort: state.sortBy
    });

    const res = await fetch(`/api/products?${params.toString()}`);
    const data = await res.json();
    const items = data.products || [];
    state.products = items;

    counter.textContent = `Showing ${items.length} product${items.length === 1 ? '' : 's'}`;
    renderProductCards(items);

  } catch (err) {
    console.error('Error fetching products:', err);
    grid.innerHTML = `<div class="cart-empty-box"><p>Unable to load products. Check server connection.</p></div>`;
  }
}

function renderProductCards(items) {
  const grid = document.getElementById('catalogGrid');

  if (!items || items.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0;">
        <i class="fa-solid fa-box-open" style="font-size: 2.8rem; color: #cbd5e1; margin-bottom: 12px;"></i>
        <h4 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 6px;">No products match criteria</h4>
        <p style="color: #64748b; font-size: 0.88rem; margin-bottom: 16px;">Try adjusting search terms or department filters.</p>
        <button onclick="filterCategory('all')" style="background: #4f46e5; color: #fff; border: none; border-radius: 20px; padding: 8px 22px; font-weight: 700; cursor: pointer;">
          Reset Catalog Filters
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(p => {
    const fullStars = Math.floor(p.rating || 4.5);
    const starString = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);

    return `
      <div class="store-product-card" id="prod-card-${p.id}">
        <div class="card-media">
          <img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'">
          ${p.badge ? `<span class="card-pill-badge">${p.badge}</span>` : ''}
        </div>

        <div class="card-info">
          <span class="card-category">${escapeHtml(p.category || 'General')}</span>
          <h4 class="card-product-title" title="${escapeHtml(p.title)}">${escapeHtml(p.title)}</h4>

          <div class="card-rating-bar">
            <span class="rating-stars">${starString}</span>
            <span class="rating-count">(${Number(p.review_count || 120).toLocaleString()})</span>
          </div>

          <div class="card-price-container">
            <span class="card-active-price">$${Number(p.price).toFixed(2)}</span>
            ${p.original_price && p.original_price > p.price ? `
              <span class="card-original-price">$${Number(p.original_price).toFixed(2)}</span>
              <span class="card-discount-chip">-${p.discount_pct}%</span>
            ` : ''}
          </div>

          <div class="card-behavior-badge">
            <i class="fa-solid fa-chart-line"></i>
            <span>Customer Intent: ${p.customer_buy_intent || 'High'} (${p.ml_purchase_probability || 95}% Prob)</span>
          </div>

          <button class="card-btn-add" onclick="addToCart('${p.id}')">
            <i class="fa-solid fa-bag-shopping"></i> Add to Bag
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function filterCategory(cat) {
  state.activeCategory = cat;

  // Sync category pills
  const pills = document.querySelectorAll('.category-pills .pill');
  pills.forEach(btn => {
    const text = btn.textContent.trim().toLowerCase();
    const isTarget = (cat === 'all' && text.includes('all')) || text.includes(cat.toLowerCase());
    btn.classList.toggle('active', isTarget);
  });

  // Sync top nav links
  const navLinks = document.querySelectorAll('.nav-links .nav-link');
  navLinks.forEach(link => {
    const text = link.textContent.trim().toLowerCase();
    const isTarget = (cat === 'all' && text.includes('catalog')) || text.includes(cat.toLowerCase());
    link.classList.toggle('active', isTarget);
  });

  fetchProducts();
}

function handleSortChange() {
  const sel = document.getElementById('catalogSortSelect');
  state.sortBy = sel.value;
  fetchProducts();
}

function clearSearch() {
  const input = document.getElementById('storeSearchInput');
  input.value = '';
  state.searchQuery = '';
  document.getElementById('searchClearBtn').style.display = 'none';
  fetchProducts();
}

function scrollToCatalog() {
  const cat = document.getElementById('storeCatalog');
  if (cat) cat.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==================== HERO FAST-TEST CHECKER ====================
function runHeroQuickCheck() {
  const priceEl = document.getElementById('heroQuickPrice');
  if (!priceEl) return; // Hero widget removed, skip check

  clearTimeout(heroSimTimer);
  heroSimTimer = setTimeout(async () => {
    const price = parseFloat(priceEl.value || 79.99);
    const discount = parseFloat(document.getElementById('heroQuickDiscount')?.value || 15);
    const rating = parseFloat(document.getElementById('heroQuickRating')?.value || 4.8);
    const age = parseFloat(document.getElementById('heroQuickAge')?.value || 32);

    try {
      const res = await fetch('/api/simulate-customer-behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price, discount, rating, customer_age: age })
      });
      const data = await res.json();
      const pred = data.target_prediction;

      const pill = document.getElementById('heroStatusPill');
      const fill = document.getElementById('heroMeterFill');
      const text = document.getElementById('heroResultText');

      if (pred.will_buy) {
        pill.className = 'status-pill status-buy';
        pill.innerHTML = `<i class="fa-solid fa-circle-check"></i> WILL BUY (${pred.probability_pct}% Intent)`;
        fill.style.background = 'linear-gradient(90deg, #10b981, #059669)';
      } else {
        pill.className = 'status-pill status-reject';
        pill.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> REJECT / TOO HIGH (${pred.probability_pct}% Intent)`;
        fill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
      }

      fill.style.width = `${pred.probability_pct}%`;
      text.textContent = pred.verdict_message;

    } catch (e) {
      console.error('Hero check error:', e);
    }
  }, 180);
}

// =========================================================================
// LIST MY PRODUCT MODAL & ITEM PRICE CHECKER (IMAGE UPLOAD + RATING)
// =========================================================================

function openListingModal() {
  document.getElementById('listingModal').style.display = 'flex';
  
  // Set default sample image if empty
  if (!state.listing.uploadedImageData) {
    cycleSampleImage();
  }
  
  // Run behavior evaluation
  runModalBehaviorCheck();
}

function closeListingModal() {
  document.getElementById('listingModal').style.display = 'none';
}

/* Image Upload Handlers */
function triggerFileInput() {
  document.getElementById('productImageFileInput').click();
}

function setupDropzone() {
  const dropzone = document.getElementById('uploadDropzone');
  if (!dropzone) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  });
}

function handleImageFileSelected(event) {
  const files = event.target.files;
  if (files && files.length > 0) {
    processImageFile(files[0]);
  }
}

function processImageFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please select a valid image file (PNG, JPG, WEBP).');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    state.listing.uploadedImageData = e.target.result;
    state.listing.uploadedFileName = file.name;
    displayImagePreview(e.target.result, file.name);
    showToast(`Image "${file.name}" uploaded successfully!`);
  };
  reader.readAsDataURL(file);
}

function displayImagePreview(dataUrl, filename) {
  const previewBox = document.getElementById('dropzonePreview');
  const idleBox = document.getElementById('dropzoneIdle');
  const previewImg = document.getElementById('imagePreviewImg');
  const nameLabel = document.getElementById('previewFileName');

  previewImg.src = dataUrl;
  nameLabel.textContent = filename || 'product_image.jpg';
  idleBox.style.display = 'none';
  previewBox.style.display = 'block';
}

function removeUploadedImage() {
  state.listing.uploadedImageData = '';
  state.listing.uploadedFileName = '';
  document.getElementById('productImageFileInput').value = '';
  document.getElementById('dropzonePreview').style.display = 'none';
  document.getElementById('dropzoneIdle').style.display = 'flex';
}

function cycleSampleImage() {
  const preset = state.listing.samplePresets[state.listing.sampleIndex];
  state.listing.uploadedImageData = preset.url;
  state.listing.uploadedFileName = preset.name;
  displayImagePreview(preset.url, preset.name);
  state.listing.sampleIndex = (state.listing.sampleIndex + 1) % state.listing.samplePresets.length;
}

/* Star Rating Picker */
function setStarRating(stars) {
  state.listing.selectedRating = parseFloat(stars);

  // Update visual star elements
  const starEls = document.querySelectorAll('#starPickerContainer .star');
  starEls.forEach((el, idx) => {
    el.classList.toggle('active', idx < stars);
  });

  // Update badge and select dropdown
  const badge = document.getElementById('ratingNumericBadge');
  badge.textContent = `${stars.toFixed(1)} / 5.0`;

  const dropdown = document.getElementById('listRatingDropdown');
  if (dropdown) dropdown.value = stars.toFixed(1);

  runModalBehaviorCheck();
}

function syncDropdownToRating() {
  const dropdown = document.getElementById('listRatingDropdown');
  setStarRating(parseFloat(dropdown.value));
}

/* Slider & Input Synchronization */
function syncModalPriceFromSlider() {
  const slider = document.getElementById('listPriceSlider');
  const input = document.getElementById('listPriceInput');
  input.value = Number(slider.value).toFixed(2);
  runModalBehaviorCheck();
}

function syncModalPriceFromInput() {
  const slider = document.getElementById('listPriceSlider');
  const input = document.getElementById('listPriceInput');
  slider.value = Math.min(850, Math.max(10, parseFloat(input.value) || 10));
  runModalBehaviorCheck();
}

function syncModalDiscountFromSlider() {
  const slider = document.getElementById('listDiscountSlider');
  const input = document.getElementById('listDiscountInput');
  input.value = slider.value;
  runModalBehaviorCheck();
}

function syncModalDiscountFromInput() {
  const slider = document.getElementById('listDiscountSlider');
  const input = document.getElementById('listDiscountInput');
  slider.value = Math.min(60, Math.max(0, parseInt(input.value) || 0));
  runModalBehaviorCheck();
}

/* Item Price Checker API Call */
function runModalBehaviorCheck() {
  clearTimeout(modalSimTimer);
  modalSimTimer = setTimeout(async () => {
    const price = parseFloat(document.getElementById('listPriceInput')?.value || 89.99);
    const discount = parseFloat(document.getElementById('listDiscountInput')?.value || 15);
    const rating = state.listing.selectedRating || 4.8;
    const age = parseFloat(document.getElementById('listCustomerAge')?.value || 32);

    try {
      const res = await fetch('/api/simulate-customer-behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price, discount, rating, customer_age: age })
      });
      const data = await res.json();
      state.listing.lastEvaluation = data;

      updateModalVerdictUI(data);

    } catch (e) {
      console.error('Modal price check error:', e);
    }
  }, 180);
}

function updateModalVerdictUI(data) {
  const pred = data.target_prediction;

  const card = document.getElementById('modalVerdictCard');
  const icon = document.getElementById('modalVerdictIcon');
  const title = document.getElementById('modalVerdictTitle');
  const probVal = document.getElementById('modalProbVal');
  const sweetVal = document.getElementById('modalSweetSpot');
  const fill = document.getElementById('modalProgressFill');
  const msg = document.getElementById('modalVerdictMessage');
  const adoptLabel = document.getElementById('adoptBtnPrice');

  title.textContent = pred.verdict_title;
  msg.textContent = pred.verdict_message;
  probVal.textContent = `${pred.probability_pct}%`;
  fill.style.width = `${pred.probability_pct}%`;

  const sweet = data.recommended_sweet_spot || pred.price;
  sweetVal.textContent = `$${sweet.toFixed(2)}`;
  if (adoptLabel) adoptLabel.textContent = `$${sweet.toFixed(2)}`;

  if (pred.verdict_status === 'STRONG_BUY') {
    card.style.borderColor = '#86efac';
    icon.style.background = '#ecfdf5';
    icon.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #059669;"></i>`;
    fill.style.background = 'linear-gradient(90deg, #10b981, #059669)';
  } else if (pred.verdict_status === 'MODERATE_BUY') {
    card.style.borderColor = '#fde047';
    icon.style.background = '#fffbeb';
    icon.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: #d97706;"></i>`;
    fill.style.background = 'linear-gradient(90deg, #eab308, #ca8a04)';
  } else {
    card.style.borderColor = '#fca5a5';
    icon.style.background = '#fef2f2';
    icon.innerHTML = `<i class="fa-solid fa-circle-xmark" style="color: #ef4444;"></i>`;
    fill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
  }

  // Demographic breakdown
  const demoContainer = document.getElementById('modalDemoList');
  if (demoContainer && data.demographics_breakdown) {
    demoContainer.innerHTML = data.demographics_breakdown.map(d => `
      <div class="demo-item">
        <span>${escapeHtml(d.segment)}</span>
        <span class="${d.will_buy ? 'demo-badge-buy' : 'demo-badge-reject'}">
          ${d.will_buy ? '✓ Will Buy' : '✗ Abandon'} (${d.probability_pct}%)
        </span>
      </div>
    `).join('');
  }

  // Elasticity curve
  const elasticityContainer = document.getElementById('modalElasticityBars');
  if (elasticityContainer && data.price_elasticity_curve) {
    elasticityContainer.innerHTML = data.price_elasticity_curve.map(pt => {
      const height = Math.max(12, Math.round((pt.probability_pct / 100) * 44));
      const color = pt.will_buy ? '#10b981' : '#ef4444';
      return `
        <div class="e-bar-col" title="At $${pt.price}: ${pt.probability_pct}% purchase intent">
          <div class="e-fill" style="height: ${height}px; background-color: ${color};"></div>
          <span class="e-label">$${Math.round(pt.price)}</span>
        </div>
      `;
    }).join('');
  }
}

function adoptModalSweetSpot() {
  const sweet = state.listing.lastEvaluation?.recommended_sweet_spot;
  if (!sweet) return;

  const priceInput = document.getElementById('listPriceInput');
  const priceSlider = document.getElementById('listPriceSlider');

  priceInput.value = Number(sweet).toFixed(2);
  priceSlider.value = Math.round(sweet);

  runModalBehaviorCheck();
  showToast(`Adopted AI Sweet-Spot Price: $${sweet.toFixed(2)}`);
}

async function submitProductListing() {
  const title = document.getElementById('listProductTitle')?.value.trim();
  if (!title) {
    alert('Please enter a product title before listing.');
    return;
  }

  const category = document.getElementById('listProductCategory')?.value || 'Electronics';
  const rating = state.listing.selectedRating || 4.8;
  const age = parseFloat(document.getElementById('listCustomerAge')?.value || 32);
  const price = parseFloat(document.getElementById('listPriceInput')?.value || 89.99);
  const discount = parseFloat(document.getElementById('listDiscountInput')?.value || 15);
  const seller = document.getElementById('listSellerName')?.value.trim() || 'Verified NovaStore Seller';
  const image = state.listing.uploadedImageData || state.listing.samplePresets[0].url;

  const payload = {
    title,
    category,
    price,
    discount,
    rating,
    customer_age: age,
    seller_name: seller,
    image
  };

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      closeListingModal();
      showToast(`Product "${title.substring(0, 30)}..." listed with validated price!`);
      
      state.activeCategory = 'all';
      await fetchProducts();

      // Scroll to newly published product
      if (data.product && data.product.id) {
        setTimeout(() => {
          const card = document.getElementById(`prod-card-${data.product.id}`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.style.outline = '3px solid #4f46e5';
            setTimeout(() => { card.style.outline = 'none'; }, 2500);
          }
        }, 300);
      }
    } else {
      alert(data.error || 'Failed to list product.');
    }
  } catch (e) {
    console.error('Submit listing error:', e);
    alert('Network error submitting product listing.');
  }
}

// ==================== CART & CHECKOUT ====================
function toggleCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  const isOpen = drawer.classList.contains('open');

  if (isOpen) {
    drawer.classList.remove('open');
    overlay.style.display = 'none';
  } else {
    renderCart();
    drawer.classList.add('open');
    overlay.style.display = 'block';
  }
}

function addToCart(productId) {
  const prod = state.products.find(p => p.id === productId);
  if (!prod) return;

  const existing = state.cart.find(i => i.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({
      id: prod.id,
      title: prod.title,
      price: prod.price,
      image: prod.image,
      qty: 1
    });
  }

  saveCartToStorage();
  updateCartBadge();
  showToast(`Added to Bag: "${prod.title.substring(0, 26)}..."`);
}

function updateCartQty(productId, delta) {
  const item = state.cart.find(i => i.id === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    state.cart = state.cart.filter(i => i.id !== productId);
  }

  saveCartToStorage();
  renderCart();
  updateCartBadge();
}

function removeCartItem(productId) {
  state.cart = state.cart.filter(i => i.id !== productId);
  saveCartToStorage();
  renderCart();
  updateCartBadge();
  showToast('Item removed from bag');
}

function renderCart() {
  const container = document.getElementById('cartItemsList');
  const subtotalEl = document.getElementById('cartSubtotalAmount');
  const countEl = document.getElementById('cartCountTitle');

  const totalQty = state.cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = state.cart.reduce((s, i) => s + (i.price * i.qty), 0);

  countEl.textContent = totalQty;
  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-box">
        <i class="fa-solid fa-bag-shopping"></i>
        <h5 style="font-size: 1rem; font-weight: 700; margin-bottom: 4px;">Your Bag is Empty</h5>
        <p style="font-size: 0.82rem;">Explore the catalog to add items.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.cart.map(item => `
    <div class="cart-item-row">
      <img src="${item.image}" alt="${escapeHtml(item.title)}" class="cart-item-thumb">
      <div class="cart-item-details">
        <div class="cart-item-name">${escapeHtml(item.title)}</div>
        <div class="cart-item-price">$${Number(item.price * item.qty).toFixed(2)}</div>
        <div class="cart-qty-controls">
          <button class="qty-pill-btn" onclick="updateCartQty('${item.id}', -1)">-</button>
          <span class="qty-pill-num">${item.qty}</span>
          <button class="qty-pill-btn" onclick="updateCartQty('${item.id}', 1)">+</button>
          <button class="btn-remove-item" onclick="removeCartItem('${item.id}')">Remove</button>
        </div>
      </div>
    </div>
  `).join('');
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadgeCount');
  const total = state.cart.reduce((s, i) => s + i.qty, 0);
  if (badge) badge.textContent = total;
}

function saveCartToStorage() {
  try {
    localStorage.setItem('novastore_cart', JSON.stringify(state.cart));
  } catch (e) {}
}

function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem('novastore_cart');
    if (raw) {
      state.cart = JSON.parse(raw);
      updateCartBadge();
    }
  } catch (e) {}
}

function proceedToCheckout() {
  if (state.cart.length === 0) {
    alert('Your bag is empty. Please add items to checkout.');
    return;
  }

  const subtotal = state.cart.reduce((s, i) => s + (i.price * i.qty), 0);
  const totalQty = state.cart.reduce((s, i) => s + i.qty, 0);

  const box = document.getElementById('checkoutBreakdownBox');
  box.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
      <span>Subtotal (${totalQty} items):</span>
      <span>$${subtotal.toFixed(2)}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #10b981;">
      <span>Insured Shipping:</span>
      <span>FREE</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1.05rem; border-top: 1px solid #e2e8f0; padding-top: 6px;">
      <span>Total Paid:</span>
      <span style="color: #4f46e5;">$${subtotal.toFixed(2)}</span>
    </div>
  `;

  toggleCartDrawer();
  document.getElementById('checkoutSuccessModal').style.display = 'flex';

  state.cart = [];
  saveCartToStorage();
  updateCartBadge();
}

function closeCheckoutSuccessModal() {
  document.getElementById('checkoutSuccessModal').style.display = 'none';
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(msg) {
  const stack = document.getElementById('toastStack');
  if (!stack) return;

  const toast = document.createElement('div');
  toast.className = 'toast-box';
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #34d399;"></i> <span>${escapeHtml(msg)}</span>`;
  stack.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
