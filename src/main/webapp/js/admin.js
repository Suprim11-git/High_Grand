document.addEventListener('DOMContentLoaded', () => {

    const ctx = document.body.dataset.page || '';

    function banner(text, ok) {
        const old = document.querySelector('.crud-banner');
        if (old) old.remove();

        if (!text) return;

        const b = document.createElement('div');
        b.className = 'crud-banner';
        b.style.cssText =
            'margin:0 0 1rem;padding:0.9rem 1.2rem;border-radius:8px;font-weight:500;' +
            (ok ? 'background:#e7f6ec;color:#1e7d43;' : 'background:#fdecea;color:#b3261e;');
        b.textContent = (ok ? '✓ ' : '⚠ ') + text;

        const main = document.querySelector('.main-content');
        const first = main ? main.querySelector('.page-header') : null;

        if (first && first.nextSibling) {
            first.parentNode.insertBefore(b, first.nextSibling);
        } else {
            document.body.prepend(b);
        }
    }

    function urlParam(name) {
        return new URLSearchParams(window.location.search).get(name);
    }

    function escapeHtml(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function money(v) {
        return 'Rs. ' +
            Number(v || 0).toLocaleString('en-IN', {
                maximumFractionDigits: 0
            });
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    }

    function formatDateTime(dateStr) {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }) + ' ' + d.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateStr;
        }
    }

    function getInitials(name) {
        if (!name) return 'HG';
        const parts = String(name).trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    function fulfillmentBadge(status) {
        const s = (status || 'Pending').toLowerCase();
        if (s === 'delivered') return '<span class="badge badge-success">Delivered</span>';
        if (s === 'shipped') return '<span class="badge badge-info">Shipped</span>';
        if (s === 'processing') return '<span class="badge badge-warning">Processing</span>';
        if (s === 'pending') return '<span class="badge badge-warning">Pending</span>';
        if (s === 'cancelled') return '<span class="badge badge-danger">Cancelled</span>';
        return `<span class="badge badge-secondary">${escapeHtml(status || 'Pending')}</span>`;
    }

    function paymentBadge(status) {
        const s = (status || 'Pending').toLowerCase();
        if (s === 'paid') return '<span class="badge badge-success">Paid</span>';
        if (s === 'pending') return '<span class="badge badge-warning">Pending</span>';
        if (s === 'refunded') return '<span class="badge badge-danger">Refunded</span>';
        if (s === 'failed') return '<span class="badge badge-danger">Failed</span>';
        return `<span class="badge badge-secondary">${escapeHtml(status || 'Pending')}</span>`;
    }

    const qErr = urlParam('error');
    const qAdded = urlParam('added');
    const qUpdated = urlParam('updated');
    const qDeleted = urlParam('deleted');

    if (qErr) {
        banner(qErr, false);
    } else if (qAdded) {
        banner(qAdded + ' was added successfully.', true);
    } else if (qUpdated) {
        banner(qUpdated + ' was updated successfully.', true);
    } else if (qDeleted) {
        banner('Product deleted successfully.', true);
    }

    if (qErr || qAdded || qUpdated || qDeleted) {
        try {
            const url = new URL(window.location.href);
            url.searchParams.delete('error');
            url.searchParams.delete('added');
            url.searchParams.delete('updated');
            url.searchParams.delete('deleted');
            const qs = url.searchParams.toString();
            history.replaceState(null, '', url.pathname + (qs ? '?' + qs : ''));
        } catch (e) {}
    }

    const categoryMap = {};

    async function loadCategories() {
        try {
            const res = await fetch('/api/categories');
            if (!res.ok) return;
            const cats = await res.json();
            if (!Array.isArray(cats) || cats.length === 0) return;

            cats.forEach(c => {
                categoryMap[c.id] = c.name;
            });

            const activeCats = cats.filter(c => c.status === 'Active');

            if (activeCats.length > 0) {
                document
                    .querySelectorAll('[data-category-options], select#category')
                    .forEach(sel => {
                        const current = sel.dataset.current || sel.value;
                        sel.innerHTML =
                            '<option value="">Select Category</option>' +
                            activeCats.map(c =>
                                `<option value="${escapeHtml(c.name)}" ${c.name === current ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
                            ).join('');
                    });
            }

            const filter = document.getElementById('categoryFilter');
            if (filter) {
                filter.innerHTML =
                    '<option value="all">All Categories</option>' +
                    cats.map(c =>
                        `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`
                    ).join('');
            }

        } catch (e) {
            console.error('Category loading error:', e);
        }
    }

    function stockCell(stock, minStock) {
        stock = Number(stock || 0);
        minStock = Number(minStock || 0);

        if (stock <= 0) {
            return `<td style="color: var(--color-sale); font-weight: 600;">0 in stock</td>`;
        }
        if (stock <= minStock) {
            return `<td style="color: var(--color-gold); font-weight: 600;">${stock} in stock</td>`;
        }
        return `<td class="stock-ok">${stock} in stock</td>`;
    }

    function statusBadge(status, stock, minStock) {
        stock = Number(stock || 0);
        minStock = Number(minStock || 0);

        if (status === 'Draft') return '<span class="badge badge-warning">Draft</span>';
        if (status === 'Archived') return '<span class="badge badge-danger">Archived</span>';
        if (stock <= 0) return '<span class="badge badge-danger">Out of Stock</span>';
        if (stock <= minStock) return '<span class="badge badge-warning">Low Stock</span>';
        return '<span class="badge badge-success">Active</span>';
    }

    // =========================================================
    // PRODUCTS PAGE
    // =========================================================

    function renderProducts(products) {
        const tbody = document.querySelector('table tbody');
        if (!tbody) return;

        tbody.innerHTML = products.map(p => {
            const cat = categoryMap[p.categoryId] || '—';
            const desc = p.description ? p.description.substring(0, 42) : '';
            const img = p.hasImage ? `/api/products/${p.id}/image` : '../assets/images/logo.png';

            return `
                <tr data-id="${p.id}" data-status="${escapeHtml(p.status)}">
                    <td>
                        <div class="product-cell">
                            <img src="${img}" alt="${escapeHtml(p.name)}">
                            <div>
                                <div style="font-weight:600;">${escapeHtml(p.name)}</div>
                                <div style="font-size:0.75rem; color:var(--color-text-muted);">${escapeHtml(desc)}</div>
                            </div>
                        </div>
                    </td>
                    <td>${escapeHtml(cat)}</td>
                    <td><code>${escapeHtml(p.sku || '—')}</code></td>
                    <td><strong>${money(p.price)}</strong></td>
                    ${stockCell(p.stock, p.minStock)}
                    <td>${statusBadge(p.status, p.stock, p.minStock)}</td>
                    <td>
                        <div class="row-actions">
                            <a href="edit_product.html?id=${p.id}" class="btn btn-outline btn-sm">
                                <i class="fas fa-pen"></i> Edit
                            </a>
                            <button type="button" class="btn btn-danger btn-sm" data-delete="${p.id}" data-name="${escapeHtml(p.name)}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        document.querySelectorAll('.pagination div:first-child').forEach(el => {
            el.textContent = `Showing 1 to ${products.length} of ${products.length} items`;
        });

        const totalSpan = document.querySelector('.toolbar span[style]');
        if (totalSpan) {
            totalSpan.textContent = `Total ${products.length} Items`;
        }
    }

    async function loadProducts() {
        const tbody = document.querySelector('table tbody');
        if (!tbody || ctx !== 'products') return;

        try {
            const res = await fetch('/api/products');
            if (!res.ok) throw new Error('Failed to load products');
            const products = await res.json();
            renderProducts(products);
        } catch (e) {
            console.error(e);
            banner('Could not load products. Is the server running?', false);
        }
    }

    // PRODUCT DELETE
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-delete]');
        if (!btn) return;
        e.preventDefault();

        const id = btn.dataset.delete;
        const name = btn.dataset.name || 'this product';

        if (!confirm(`Are you sure you want to delete ${name}?`)) return;

        try {
            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            if (res.ok) {
                const row = btn.closest('tr');
                if (row) {
                    row.style.transition = 'opacity 0.3s ease';
                    row.style.opacity = '0';
                    setTimeout(() => {
                        row.remove();
                        banner(name + ' was deleted successfully.', true);
                    }, 250);
                }
            } else {
                let msg = 'Delete failed.';
                try {
                    const data = await res.json();
                    msg = data.error || msg;
                } catch (x) {}
                banner(msg, false);
            }
        } catch (error) {
            console.error(error);
            banner('Could not delete product.', false);
        }
    });

    // =========================================================
    // EDIT PRODUCT
    // =========================================================

    function fillEditForm(p) {
        const f = document.querySelector('form.admin-form');
        if (!f) return;

        let hidden = f.querySelector('input[name="id"]');
        if (!hidden) {
            hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = 'id';
            f.prepend(hidden);
        }
        hidden.value = p.id;
        f.action = '/admin/update_product';
        f.enctype = 'multipart/form-data';
        f.method = 'post';

        const productName = f.querySelector('#productName');
        if (productName) productName.value = p.name || '';

        const displayProductName = document.getElementById('displayProductName');
        if (displayProductName) displayProductName.textContent = p.name || 'Unnamed Product';

        const displayProductSku = document.getElementById('displayProductSku');
        if (displayProductSku) displayProductSku.textContent = p.sku ? 'SKU: ' + p.sku : '';

        const catName = categoryMap[p.categoryId] || '';
        const sku = f.querySelector('#sku');
        if (sku) sku.value = p.sku || '';

        const price = f.querySelector('#price');
        if (price) {
            price.value = p.originalPrice != null ? p.originalPrice : (p.price != null ? p.price : '');
        }

        const salePrice = f.querySelector('#salePrice');
        if (salePrice) {
            salePrice.value = (p.originalPrice != null && p.price != null) ? p.price : '';
        }

        const stock = f.querySelector('#stock');
        if (stock) stock.value = p.stock != null ? p.stock : 0;

        const minStock = f.querySelector('#minStock');
        if (minStock) minStock.value = p.minStock != null ? p.minStock : 5;

        const status = f.querySelector('#status');
        if (status) status.value = p.status || 'Active';

        const description = f.querySelector('#description');
        if (description) description.value = p.description || '';

        const sel = f.querySelector('#category');
        if (sel) {
            sel.dataset.current = catName;
            let found = false;
            [...sel.options].forEach(o => {
                o.selected = o.value === catName;
                if (o.value === catName) found = true;
            });
            if (catName && !found) {
                const opt = document.createElement('option');
                opt.value = catName;
                opt.textContent = catName;
                opt.selected = true;
                sel.appendChild(opt);
            }
        }

        const preview = document.getElementById('imagePreview');
        if (preview && p.hasImage) {
            preview.src = `/api/products/${p.id}/image`;
            const c = document.getElementById('imagePreviewContainer');
            if (c) c.style.display = 'block';
        }

        const header = document.querySelector('.page-header h1');
        if (header) header.textContent = 'Edit Product';

        const sub = document.querySelector('.page-header p');
        if (sub) sub.textContent = `Modifying: ${p.name}`;

        const delBtn = document.getElementById('deleteProductBtn');
        if (delBtn) {
            delBtn.onclick = async () => {
                if (!confirm(`Are you sure you want to delete ${p.name}?`)) return;
                try {
                    const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE' });
                    if (res.ok) {
                        window.location.href = 'products.html?deleted=1';
                    } else {
                        let msg = 'Delete failed.';
                        try { msg = (await res.json()).error || msg; } catch (x) {}
                        banner(msg, false);
                    }
                } catch (error) {
                    banner('Could not delete product.', false);
                }
            };
        }
    }

    async function loadEditProduct() {
        if (ctx !== 'edit') return;
        let id = urlParam('id');

        const loadingEl = document.getElementById('editLoadingState');
        const formCard = document.getElementById('editFormCard');
        const selectDropdown = document.getElementById('productSelectDropdown');

        if (loadingEl) loadingEl.style.display = 'block';
        if (formCard) formCard.style.display = 'none';

        try {
            let allProducts = [];
            try {
                const listRes = await fetch('/api/products');
                if (listRes.ok) allProducts = await listRes.json();
            } catch (e) {
                console.error('Failed to fetch product list:', e);
            }

            if (selectDropdown && Array.isArray(allProducts) && allProducts.length > 0) {
                selectDropdown.innerHTML = '<option value="">Select a product…</option>' +
                    allProducts.map(item =>
                        `<option value="${item.id}" ${String(item.id) === String(id) ? 'selected' : ''}>
                            ${escapeHtml(item.name)} (SKU: ${escapeHtml(item.sku || '—')})
                        </option>`
                    ).join('');

                selectDropdown.onchange = function() {
                    if (this.value) {
                        window.location.href = 'edit_product.html?id=' + this.value;
                    }
                };
            }

            if (!id && allProducts.length > 0) {
                id = allProducts[0].id;
                if (selectDropdown) selectDropdown.value = id;
            }

            if (!id) {
                banner('No product selected. Pick one from the Products page.', false);
                if (loadingEl) loadingEl.style.display = 'none';
                if (formCard) formCard.style.display = 'block';
                return;
            }

            const [prodRes] = await Promise.all([
                fetch(`/api/products/${id}`),
                loadCategories()
            ]);

            if (prodRes.status === 404) {
                banner('Product not found.', false);
                if (loadingEl) loadingEl.style.display = 'none';
                if (formCard) formCard.style.display = 'block';
                return;
            }

            if (!prodRes.ok) throw new Error('Could not fetch product');

            const p = await prodRes.json();
            fillEditForm(p);

            if (selectDropdown) selectDropdown.value = p.id;
            if (loadingEl) loadingEl.style.display = 'none';
            if (formCard) formCard.style.display = 'block';

        } catch (e) {
            console.error(e);
            banner('Could not load product details.', false);
            if (loadingEl) loadingEl.style.display = 'none';
            if (formCard) formCard.style.display = 'block';
        }
    }

    // =========================================================
    // CATEGORIES
    // =========================================================

    let allCategoriesList = [];

    function renderCategories(cats) {
        const grid = document.querySelector('.grid-cards');
        if (!grid) return;

        grid.innerHTML = cats.map(c => {
            const img = c.hasImage ? `/api/categories/${c.id}/image` : '../assets/images/logo.png';
            const slug = c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            return `
                <div class="category-card" data-id="${c.id}" data-name="${escapeHtml(c.name)}">
                    <img src="${img}" alt="${escapeHtml(c.name)}" class="category-card-img">
                    <div class="category-card-body">
                        <div class="category-card-header">
                            <h3 class="category-card-title">${escapeHtml(c.name)}</h3>
                            <span class="badge ${c.status === 'Active' ? 'badge-success' : 'badge-warning'}">
                                ${escapeHtml(c.status)}
                            </span>
                        </div>
                        <div class="category-card-slug">/collections/${escapeHtml(slug)}</div>
                        <p class="category-card-desc">${escapeHtml(c.description || '')}</p>
                        <div class="category-card-footer">
                            <span class="category-count">
                                <i class="fas fa-box"></i> ${c.productCount || 0} Products
                            </span>
                            <div class="row-actions">
                                <button type="button" class="btn btn-outline btn-sm" data-edit-cat="${c.id}">Edit</button>
                                <button type="button" class="btn btn-danger btn-sm" data-del-cat="${c.id}" data-name="${escapeHtml(c.name)}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const countBadge = document.getElementById('categoryCountBadge') || document.querySelector('.toolbar span:last-child');
        if (countBadge) {
            const activeCount = cats.filter(c => c.status === 'Active').length;
            countBadge.textContent = `${activeCount} Active Collections (${cats.length} Total)`;
        }
    }

    async function loadCategoriesGrid() {
        if (ctx !== 'categories') return;

        try {
            const res = await fetch('/api/categories');
            if (!res.ok) throw new Error('Failed to load categories');
            allCategoriesList = await res.json();
            renderCategories(allCategoriesList);
        } catch (e) {
            console.error(e);
            banner('Could not load categories.', false);
        }
    }

    // Category form submission
    document.addEventListener('submit', async (e) => {
        const f = e.target.closest('form[data-category-form]');
        if (!f) return;
        e.preventDefault();

        try {
            const fd = new FormData(f);
            const id = f.dataset.editId;
            const url = id ? `/api/categories/${id}` : '/api/categories';
            const method = id ? 'PUT' : 'POST';

            const res = await fetch(url, { method, body: fd });
            if (res.ok) {
                f.reset();
                delete f.dataset.editId;
                const btn = f.querySelector('button[type="submit"]');
                if (btn) btn.innerHTML = '<i class="fas fa-plus"></i> Save Category';

                banner(id ? 'Category updated successfully.' : 'Category created successfully.', true);
                loadCategoriesGrid();
                loadCategories();
            } else {
                let msg = 'Could not save category.';
                try { msg = (await res.json()).error || msg; } catch (x) {}
                banner(msg, false);
            }
        } catch (error) {
            console.error(error);
            banner('Could not save category.', false);
        }
    });

    // Category edit/delete
    document.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('[data-edit-cat]');
        if (editBtn) {
            const card = editBtn.closest('.category-card');
            const id = editBtn.dataset.editCat;
            const f = document.querySelector('form[data-category-form]');
            if (!f) return;

            try {
                const res = await fetch('/api/categories');
                const cats = await res.json();
                const c = cats.find(x => String(x.id) === String(id));
                if (!c) return;

                f.dataset.editId = id;
                const catName = f.querySelector('#catName');
                if (catName) catName.value = c.name || '';

                const catSlug = f.querySelector('#catSlug');
                if (catSlug) catSlug.value = c.slug || '';

                const catDesc = f.querySelector('#catDesc');
                if (catDesc) catDesc.value = c.description || '';

                const catOrder = f.querySelector('#catOrder');
                if (catOrder) catOrder.value = c.sortOrder || 1;

                const catStatus = f.querySelector('#catStatus');
                if (catStatus) catStatus.value = c.status;

                f.scrollIntoView({ behavior: 'smooth' });

                const btn = f.querySelector('button[type="submit"]');
                if (btn) btn.innerHTML = '<i class="fas fa-check"></i> Update Category';

                if (card) {
                    card.style.outline = '2px solid var(--color-gold)';
                    setTimeout(() => { card.style.outline = ''; }, 1500);
                }
            } catch (x) {
                console.error(x);
            }
        }

        const delBtn = e.target.closest('[data-del-cat]');
        if (delBtn) {
            const id = delBtn.dataset.delCat;
            const name = delBtn.dataset.name;

            if (!confirm(`Are you sure you want to delete the category "${name}"?`)) return;

            try {
                const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    banner(`Category "${name}" deleted.`, true);
                    loadCategoriesGrid();
                    loadCategories();
                } else {
                    let msg = 'Delete failed.';
                    try { msg = (await res.json()).error || msg; } catch (x) {}
                    banner(msg, false);
                }
            } catch (error) {
                banner('Could not delete category.', false);
            }
        }
    });

    // =========================================================
    // INVENTORY MANAGEMENT
    // =========================================================

    let allInventoryProducts = [];

    function renderInventory(products) {
        const tbody = document.getElementById('inventoryTableBody') || document.querySelector('table tbody');
        if (!tbody || ctx !== 'inventory') return;

        if (!Array.isArray(products) || products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem; color: var(--color-text-muted);">No inventory items match the current filter.</td></tr>`;
            return;
        }

        tbody.innerHTML = products.map(p => {
            const cat = categoryMap[p.categoryId] || '—';
            const img = p.hasImage ? `/api/products/${p.id}/image` : '../assets/images/logo.png';
            const statusKey = p.stock <= 0 ? 'out of stock' : (p.stock <= (p.minStock || 5) ? 'low stock' : 'in stock');

            return `
                <tr data-id="${p.id}" data-status="${statusKey}">
                    <td><code>${escapeHtml(p.sku || '—')}</code></td>
                    <td>
                        <div class="product-cell">
                            <img src="${img}" alt="${escapeHtml(p.name)}">
                            <div>
                                <div style="font-weight:600;">${escapeHtml(p.name)}</div>
                                <div style="font-size:0.75rem; color:var(--color-text-muted);">
                                    ${p.description ? escapeHtml(p.description.substring(0, 42)) : ''}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>${escapeHtml(cat)}</td>
                    <td>Bay ${((p.id % 8) + 1)}-A</td>
                    <td>${p.minStock || 5} units</td>
                    <td>
                        <div class="stock-adjust">
                            <button type="button" class="stock-btn minus">-</button>
                            <span class="stock-count" style="font-weight:600; min-width:28px; text-align:center;">
                                ${p.stock}
                            </span>
                            <button type="button" class="stock-btn plus">+</button>
                        </div>
                    </td>
                    <td>${statusBadge(p.status, p.stock, p.minStock || 5)}</td>
                    <td>
                        <div class="row-actions">
                            <button type="button" class="btn btn-outline btn-sm" data-save-stock="${p.id}" data-name="${escapeHtml(p.name)}">
                                <i class="fas fa-check"></i> Save
                            </button>
                            <a href="edit_product.html?id=${p.id}" class="btn btn-outline btn-sm">
                                <i class="fas fa-pen"></i>
                            </a>
                            <button type="button" class="btn btn-danger btn-sm" data-inv-del="${p.id}" data-name="${escapeHtml(p.name)}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        const pagText = document.getElementById('invPaginationText') || document.querySelector('.pagination div:first-child');
        if (pagText) {
            pagText.textContent = `Showing 1 to ${products.length} of ${allInventoryProducts.length} inventory items`;
        }
    }

    function filterInventory() {
        const searchInput = document.getElementById('invSearchInput');
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

        const activeTab = document.querySelector('#invTabGroup .tab-btn.active, .tab-group .tab-btn.active');
        const tabFilter = activeTab ? (activeTab.dataset.filter || 'all').toLowerCase() : 'all';

        const catFilterEl = document.getElementById('categoryFilter');
        const selectedCat = catFilterEl ? catFilterEl.value : 'all';

        const filtered = allInventoryProducts.filter(p => {
            const catName = categoryMap[p.categoryId] || '';
            const matchesSearch = !query || 
                (p.name && p.name.toLowerCase().includes(query)) ||
                (p.sku && p.sku.toLowerCase().includes(query)) ||
                (catName && catName.toLowerCase().includes(query));

            let matchesTab = true;
            if (tabFilter === 'low stock') {
                matchesTab = p.stock > 0 && p.stock <= (p.minStock || 5);
            } else if (tabFilter === 'out of stock') {
                matchesTab = p.stock <= 0;
            } else if (tabFilter === 'in stock') {
                matchesTab = p.stock > (p.minStock || 5);
            }

            let matchesCat = true;
            if (selectedCat && selectedCat !== 'all') {
                matchesCat = catName === selectedCat;
            }

            return matchesSearch && matchesTab && matchesCat;
        });

        renderInventory(filtered);
    }

    async function loadInventory() {
        if (ctx !== 'inventory') return;

        try {
            const [prodRes] = await Promise.all([
                fetch('/api/products'),
                loadCategories()
            ]);

            if (!prodRes.ok) throw new Error('Inventory loading failed');
            allInventoryProducts = await prodRes.json();

            // Calculate Inventory Summary Metrics
            let totalStockUnits = 0;
            let lowStockCount = 0;
            let outOfStockCount = 0;

            allInventoryProducts.forEach(p => {
                const stock = Number(p.stock || 0);
                const min = Number(p.minStock || 5);
                totalStockUnits += stock;
                if (stock <= 0) {
                    outOfStockCount++;
                } else if (stock <= min) {
                    lowStockCount++;
                }
            });

            const invTotalStock = document.getElementById('invTotalStock');
            if (invTotalStock) invTotalStock.textContent = totalStockUnits.toLocaleString();

            const invUniqueSkus = document.getElementById('invUniqueSkus');
            if (invUniqueSkus) invUniqueSkus.textContent = `Across ${allInventoryProducts.length} catalog items`;

            const invLowStock = document.getElementById('invLowStock');
            if (invLowStock) invLowStock.textContent = lowStockCount;

            const invOutOfStock = document.getElementById('invOutOfStock');
            if (invOutOfStock) invOutOfStock.textContent = outOfStockCount;

            const invAlert = document.getElementById('inventoryAlert');
            const invAlertText = document.getElementById('inventoryAlertText');
            if (invAlert) {
                if (lowStockCount > 0 || outOfStockCount > 0) {
                    invAlert.style.display = 'flex';
                    if (invAlertText) {
                        invAlertText.innerHTML = `<strong>Reorder Advisory:</strong> ${outOfStockCount} items out of stock and ${lowStockCount} items running low on safety stock.`;
                    }
                } else {
                    invAlert.style.display = 'none';
                }
            }

            renderInventory(allInventoryProducts);

            // Wire up filters for inventory page
            const invSearch = document.getElementById('invSearchInput');
            if (invSearch) invSearch.oninput = filterInventory;

            const catFilter = document.getElementById('categoryFilter');
            if (catFilter) catFilter.onchange = filterInventory;

            const tabs = document.querySelectorAll('#invTabGroup .tab-btn');
            tabs.forEach(btn => {
                btn.onclick = () => {
                    tabs.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    filterInventory();
                };
            });

        } catch (e) {
            console.error(e);
            banner('Could not load inventory. Is the server running?', false);
        }
    }

    // Inventory buttons (minus, plus, save stock, delete)
    document.addEventListener('click', async (e) => {
        const minus = e.target.closest('.stock-btn.minus');
        const plus = e.target.closest('.stock-btn.plus');

        if (minus || plus) {
            const counter = (minus || plus).closest('.stock-adjust').querySelector('.stock-count');
            let current = parseInt(counter.textContent.trim(), 10) || 0;
            if (minus && current > 0) current -= 1;
            if (plus) current += 1;
            counter.textContent = current;
            return;
        }

        const save = e.target.closest('[data-save-stock]');
        if (save) {
            const row = save.closest('tr');
            const stock = parseInt(row.querySelector('.stock-count').textContent.trim(), 10) || 0;

            try {
                const res = await fetch(`/api/products/${save.dataset.saveStock}/stock`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stock })
                });

                if (res.ok) {
                    banner(`Stock for ${save.dataset.name} saved (${stock} units).`, true);
                    loadInventory();
                } else {
                    banner('Could not save stock.', false);
                }
            } catch (error) {
                banner('Could not save stock.', false);
            }
            return;
        }

        const del = e.target.closest('[data-inv-del]');
        if (del) {
            if (!confirm(`Are you sure you want to delete ${del.dataset.name}?`)) return;

            try {
                const res = await fetch(`/api/products/${del.dataset.invDel}`, { method: 'DELETE' });
                if (res.ok) {
                    banner(`${del.dataset.name} was deleted successfully.`, true);
                    loadInventory();
                } else {
                    banner('Delete failed.', false);
                }
            } catch (error) {
                banner('Could not delete product.', false);
            }
        }
    });

    // =========================================================
    // DASHBOARD MANAGEMENT
    // =========================================================

    async function loadDashboard() {
        if (ctx !== 'dashboard') return;

        try {
            const res = await fetch('/api/admin/dashboard/stats');
            if (!res.ok) throw new Error('Failed to load dashboard statistics');
            const stats = await res.json();

            // 1. KPI Cards
            const dashRevenue = document.getElementById('dashRevenue');
            if (dashRevenue) dashRevenue.textContent = money(stats.totalRevenue);

            const dashOrders = document.getElementById('dashOrders');
            if (dashOrders) dashOrders.textContent = stats.totalOrders || 0;

            const dashProducts = document.getElementById('dashProducts');
            if (dashProducts) dashProducts.textContent = stats.totalProducts || 0;

            const dashUsers = document.getElementById('dashUsers');
            if (dashUsers) dashUsers.textContent = stats.totalUsers || 0;

            // 2. Alert Notification
            const dashAlert = document.getElementById('dashAlert');
            const dashAlertText = document.getElementById('dashAlertText');
            if (dashAlert) {
                if ((stats.lowStockCount > 0 || stats.outOfStockCount > 0)) {
                    dashAlert.style.display = 'flex';
                    if (dashAlertText) {
                        dashAlertText.textContent = `Inventory Notice: ${stats.outOfStockCount || 0} items out of stock, ${stats.lowStockCount || 0} items low on stock.`;
                    }
                } else {
                    dashAlert.style.display = 'none';
                }
            }

            // 3. Recent Orders Table
            const recentOrdersTbody = document.getElementById('recentOrdersTableBody');
            if (recentOrdersTbody) {
                const orders = stats.recentOrders || [];
                if (orders.length === 0) {
                    recentOrdersTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--color-text-muted);">No recent orders found.</td></tr>`;
                } else {
                    recentOrdersTbody.innerHTML = orders.map(o => `
                        <tr>
                            <td>
                                <a href="order_details.html?id=${o.id}" style="font-weight:600; text-decoration:underline;">
                                    #${escapeHtml(o.orderNumber || o.id)}
                                </a>
                            </td>
                            <td>
                                <strong>${escapeHtml(o.customerName || 'Customer')}</strong>
                                <div style="font-size:0.75rem; color:var(--color-text-muted);">${escapeHtml(o.customerEmail || '')}</div>
                            </td>
                            <td>${formatDate(o.createdAt)}</td>
                            <td>${fulfillmentBadge(o.status)}</td>
                            <td><strong>${money(o.totalAmount)}</strong></td>
                            <td>
                                <a href="order_details.html?id=${o.id}" class="btn btn-outline btn-sm">
                                    <i class="fas fa-eye"></i> View
                                </a>
                            </td>
                        </tr>
                    `).join('');
                }
            }

            // 4. Catalog Highlights / Best Sellers
            const bestSellersContainer = document.getElementById('bestSellersContainer');
            if (bestSellersContainer) {
                const bestSellers = stats.bestSellers || [];
                if (bestSellers.length === 0) {
                    bestSellersContainer.innerHTML = `<div style="text-align:center; padding:1.5rem; color:var(--color-text-muted);">No products in catalog.</div>`;
                } else {
                    bestSellersContainer.innerHTML = bestSellers.map(p => {
                        const img = p.hasImage ? `/api/products/${p.id}/image` : '../assets/images/logo.png';
                        return `
                            <div style="display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:0.5rem 0; border-bottom:1px solid var(--color-border-light);">
                                <div style="display:flex; align-items:center; gap:0.75rem;">
                                    <img src="${img}" alt="${escapeHtml(p.name)}" style="width:40px; height:40px; border-radius:6px; object-fit:cover; border:1px solid var(--color-border);">
                                    <div>
                                        <div style="font-weight:600; font-size:0.9rem;">${escapeHtml(p.name)}</div>
                                        <div style="font-size:0.75rem; color:var(--color-text-muted);">SKU: ${escapeHtml(p.sku || '—')}</div>
                                    </div>
                                </div>
                                <div style="text-align:right;">
                                    <div style="font-weight:700; color:var(--color-primary);">${money(p.price)}</div>
                                    <div style="font-size:0.75rem;">${statusBadge(p.status, p.stock, p.minStock || 5)}</div>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }

        } catch (e) {
            console.error('Dashboard load error:', e);
            banner('Could not load dashboard data from backend.', false);
        }
    }

    // =========================================================
    // ORDERS MANAGEMENT
    // =========================================================

    let allOrdersList = [];

    function renderOrders(orders) {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody || ctx !== 'orders') return;

        if (!Array.isArray(orders) || orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem; color: var(--color-text-muted);">No orders found matching the filter criteria.</td></tr>`;
            const countText = document.getElementById('orderCountText');
            if (countText) countText.textContent = `Showing 0 of ${allOrdersList.length} orders`;
            return;
        }

        tbody.innerHTML = orders.map(o => `
            <tr data-order-id="${o.id}" data-status="${escapeHtml(o.status || '').toLowerCase()}">
                <td>
                    <a href="order_details.html?id=${o.id}" style="font-weight:600; text-decoration:underline;">
                        #${escapeHtml(o.orderNumber || o.id)}
                    </a>
                </td>
                <td>
                    <strong>${escapeHtml(o.customerName || 'Customer')}</strong>
                    <div style="font-size:0.75rem; color:var(--color-text-muted);">${escapeHtml(o.customerEmail || '—')}</div>
                </td>
                <td>${formatDate(o.createdAt)}</td>
                <td>${o.itemCount || 1} items</td>
                <td>${paymentBadge(o.paymentStatus)}</td>
                <td>${fulfillmentBadge(o.status)}</td>
                <td><strong>${money(o.totalAmount)}</strong></td>
                <td>
                    <div class="row-actions">
                        <a href="order_details.html?id=${o.id}" class="btn btn-outline btn-sm">
                            <i class="fas fa-eye"></i> View
                        </a>
                        <button type="button" class="btn btn-danger btn-sm" data-delete-order="${o.id}" data-order-num="${escapeHtml(o.orderNumber || o.id)}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        const countText = document.getElementById('orderCountText');
        if (countText) {
            countText.textContent = `Showing ${orders.length} of ${allOrdersList.length} orders`;
        }
    }

    function filterOrders() {
        const searchInput = document.getElementById('orderSearch');
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

        const activeTab = document.querySelector('#orderTabGroup .tab-btn.active');
        const tabFilter = activeTab ? (activeTab.dataset.filter || 'all').toLowerCase() : 'all';

        const filtered = allOrdersList.filter(o => {
            const searchable = [
                o.orderNumber,
                o.customerName,
                o.customerEmail,
                o.customerPhone,
                o.city,
                o.paymentMethod,
                o.status,
                o.paymentStatus,
                o.trackingNumber,
                o.itemsSummary
            ].filter(Boolean).join(' ').toLowerCase();

            const matchesSearch = !query || searchable.includes(query);

            let matchesTab = true;
            if (tabFilter && tabFilter !== 'all') {
                matchesTab = String(o.status || '').toLowerCase() === tabFilter;
            }

            return matchesSearch && matchesTab;
        });

        renderOrders(filtered);
    }

    async function loadOrders() {
        if (ctx !== 'orders') return;

        try {
            const res = await fetch('/api/orders');
            if (!res.ok) throw new Error('Failed to load orders');
            allOrdersList = await res.json();
            renderOrders(allOrdersList);

            const searchInput = document.getElementById('orderSearch');
            if (searchInput) searchInput.oninput = filterOrders;

            const tabs = document.querySelectorAll('#orderTabGroup .tab-btn');
            tabs.forEach(btn => {
                btn.onclick = () => {
                    tabs.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    filterOrders();
                };
            });

        } catch (e) {
            console.error('Orders loading error:', e);
            banner('Could not load orders from backend.', false);
        }
    }

    // ORDER DELETE
    document.addEventListener('click', async (e) => {
        const delBtn = e.target.closest('[data-delete-order]');
        if (!delBtn) return;
        e.preventDefault();

        const id = delBtn.dataset.deleteOrder;
        const num = delBtn.dataset.orderNum || id;

        if (!confirm(`Are you sure you want to delete order #${num}? This cannot be undone.`)) return;

        try {
            const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
            if (res.ok) {
                banner(`Order #${num} was deleted successfully.`, true);
                loadOrders();
            } else {
                banner('Could not delete order.', false);
            }
        } catch (err) {
            console.error(err);
            banner('Could not delete order.', false);
        }
    });

    // =========================================================
    // ORDER DETAILS
    // =========================================================

    async function loadOrderDetails() {
        if (ctx !== 'order-details') return;

        const id = urlParam('id');
        if (!id) {
            banner('No Order ID specified. Please select an order from the list.', false);
            return;
        }

        try {
            const [orderRes, prodRes] = await Promise.all([
                fetch(`/api/orders/${id}`),
                fetch('/api/products')
            ]);

            if (!orderRes.ok) throw new Error('Order not found');
            const order = await orderRes.json();
            const products = prodRes.ok ? await prodRes.json() : [];

            // Update Page Heading and Badges
            document.title = `Order #${order.orderNumber || order.id} - High Grand Admin`;

            const heading = document.getElementById('orderDetailHeading');
            if (heading) heading.textContent = `Order #${order.orderNumber || order.id}`;

            const orderStatusBadge = document.getElementById('orderStatusBadge');
            if (orderStatusBadge) {
                orderStatusBadge.className = 'badge';
                const s = (order.status || 'Processing').toLowerCase();
                if (s === 'delivered') orderStatusBadge.classList.add('badge-success');
                else if (s === 'shipped') orderStatusBadge.classList.add('badge-info');
                else if (s === 'cancelled') orderStatusBadge.classList.add('badge-danger');
                else orderStatusBadge.classList.add('badge-warning');
                orderStatusBadge.textContent = order.status || 'Processing';
            }

            const orderPaymentBadge = document.getElementById('orderPaymentBadge');
            if (orderPaymentBadge) {
                orderPaymentBadge.className = 'badge';
                const p = (order.paymentStatus || 'Paid').toLowerCase();
                if (p === 'paid') orderPaymentBadge.classList.add('badge-success');
                else if (p === 'refunded' || p === 'failed') orderPaymentBadge.classList.add('badge-danger');
                else orderPaymentBadge.classList.add('badge-warning');
                orderPaymentBadge.textContent = order.paymentStatus || 'Paid';
            }

            const placedSub = document.getElementById('orderPlacedSub');
            if (placedSub) {
                placedSub.textContent = `Placed on ${formatDateTime(order.createdAt)} · Order Reference: #${order.orderNumber || order.id}`;
            }

            // Purchased Items Table
            const itemsSummary = order.itemsSummary || '';
            const itemsTbody = document.getElementById('orderItemsTableBody');
            const itemCountText = document.getElementById('orderItemCountText');

            if (itemCountText) {
                itemCountText.textContent = `${order.itemCount || 1} Items`;
            }

            if (itemsTbody) {
                const parsedItems = itemsSummary.split(',').map(s => s.trim()).filter(Boolean);
                if (parsedItems.length === 0) {
                    itemsTbody.innerHTML = `
                        <tr>
                            <td>
                                <div class="product-cell">
                                    <img src="../assets/images/logo.png" alt="Luxury Order Item">
                                    <div>
                                        <div style="font-weight:600;">High Grand Luxury Order Item</div>
                                        <div style="font-size:0.75rem; color:var(--color-text-muted);">Standard Delivery Package</div>
                                    </div>
                                </div>
                            </td>
                            <td>${money(order.subtotal || order.totalAmount)}</td>
                            <td>${order.itemCount || 1}</td>
                            <td><strong>${money(order.subtotal || order.totalAmount)}</strong></td>
                        </tr>
                    `;
                } else {
                    itemsTbody.innerHTML = parsedItems.map(itemStr => {
                        let name = itemStr;
                        let qty = 1;
                        const match = itemStr.match(/(.+?)\s*[xX]\s*(\d+)$/);
                        if (match) {
                            name = match[1].trim();
                            qty = parseInt(match[2], 10) || 1;
                        }

                        // Try finding product in catalog for image & SKU
                        const matchedProd = products.find(p => p.name && p.name.toLowerCase() === name.toLowerCase());
                        const img = matchedProd && matchedProd.hasImage ? `/api/products/${matchedProd.id}/image` : '../assets/images/logo.png';
                        const sku = matchedProd ? matchedProd.sku : 'HG-SKU';
                        const itemPrice = matchedProd ? matchedProd.price : (order.subtotal ? Number(order.subtotal) / parsedItems.length : Number(order.totalAmount) / parsedItems.length);
                        const lineTotal = itemPrice * qty;

                        return `
                            <tr>
                                <td>
                                    <div class="product-cell">
                                        <img src="${img}" alt="${escapeHtml(name)}">
                                        <div>
                                            <div style="font-weight:600;">${escapeHtml(name)}</div>
                                            <div style="font-size:0.75rem; color:var(--color-text-muted);">SKU: ${escapeHtml(sku)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>${money(itemPrice)}</td>
                                <td>${qty}</td>
                                <td><strong>${money(lineTotal)}</strong></td>
                            </tr>
                        `;
                    }).join('');
                }
            }

            // Summary Financials
            const subtotal = order.subtotal != null ? order.subtotal : order.totalAmount;
            const tax = order.tax != null ? order.tax : 0;
            const shipping = order.shippingFee != null ? order.shippingFee : 0;
            const total = order.totalAmount != null ? order.totalAmount : subtotal;

            const orderSubtotal = document.getElementById('orderSubtotal');
            if (orderSubtotal) orderSubtotal.textContent = money(subtotal);

            const orderTax = document.getElementById('orderTax');
            if (orderTax) orderTax.textContent = money(tax);

            const orderShipping = document.getElementById('orderShipping');
            if (orderShipping) orderShipping.textContent = money(shipping);

            const orderTotal = document.getElementById('orderTotal');
            if (orderTotal) orderTotal.textContent = money(total);

            // Timeline
            const timeline = document.getElementById('orderTimeline');
            if (timeline) {
                const s = (order.status || 'Processing').toLowerCase();
                const isDelivered = s === 'delivered';
                const isShipped = isDelivered || s === 'shipped';
                const isProcessing = isShipped || s === 'processing';
                const isCancelled = s === 'cancelled';

                timeline.innerHTML = `
                    <div class="timeline-step done">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <strong>Order Placed & Verified</strong>
                            <p style="font-size:0.8rem; color:var(--color-text-muted); margin:0.2rem 0 0;">${formatDateTime(order.createdAt)} · Initial authorization confirmed</p>
                        </div>
                    </div>
                    <div class="timeline-step ${order.paymentStatus === 'Paid' ? 'done' : 'active'}">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <strong>Payment: ${escapeHtml(order.paymentMethod || 'Cash on Delivery')}</strong>
                            <p style="font-size:0.8rem; color:var(--color-text-muted); margin:0.2rem 0 0;">Status: ${escapeHtml(order.paymentStatus || 'Pending')}</p>
                        </div>
                    </div>
                    <div class="timeline-step ${isProcessing && !isCancelled ? 'done' : (isCancelled ? '' : 'active')}">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <strong>Warehouse Fulfillment & Packaging</strong>
                            <p style="font-size:0.8rem; color:var(--color-text-muted); margin:0.2rem 0 0;">${isProcessing ? 'Inventory allocated and packed in High Grand gift packaging' : 'Pending fulfillment'}</p>
                        </div>
                    </div>
                    <div class="timeline-step ${isShipped && !isCancelled ? 'done' : ''}">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <strong>In Transit / Courier Dispatched</strong>
                            <p style="font-size:0.8rem; color:var(--color-text-muted); margin:0.2rem 0 0;">Tracking: <code>${escapeHtml(order.trackingNumber || 'Pending assignment')}</code></p>
                        </div>
                    </div>
                    <div class="timeline-step ${isDelivered ? 'done' : ''}">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <strong>Delivered to Customer</strong>
                            <p style="font-size:0.8rem; color:var(--color-text-muted); margin:0.2rem 0 0;">${isDelivered ? 'Package safely received by customer' : 'Awaiting delivery confirmation'}</p>
                        </div>
                    </div>
                `;
            }

            // Customer Card
            const customerAvatar = document.getElementById('customerAvatar');
            if (customerAvatar) customerAvatar.textContent = getInitials(order.customerName);

            const customerName = document.getElementById('customerName');
            if (customerName) customerName.textContent = order.customerName || 'Customer';

            const customerEmail = document.getElementById('customerEmail');
            if (customerEmail) customerEmail.textContent = order.customerEmail || '—';

            const customerPhone = document.getElementById('customerPhone');
            if (customerPhone) customerPhone.textContent = order.customerPhone || '—';

            const customerNotes = document.getElementById('customerNotes');
            if (customerNotes) customerNotes.textContent = order.notes || 'No notes provided by customer.';

            // Shipping Card
            const shippingRecipient = document.getElementById('shippingRecipient');
            if (shippingRecipient) shippingRecipient.textContent = order.customerName || '—';

            const shippingAddressLine = document.getElementById('shippingAddressLine');
            if (shippingAddressLine) shippingAddressLine.textContent = order.shippingAddress || '—';

            const shippingCityZip = document.getElementById('shippingCityZip');
            if (shippingCityZip) {
                shippingCityZip.textContent = [order.city, order.postalCode].filter(Boolean).join(', ') || '—';
            }

            // Payment Card
            const paymentMethodText = document.getElementById('paymentMethodText');
            if (paymentMethodText) paymentMethodText.textContent = order.paymentMethod || 'Cash on Delivery';

            const paymentStatusBadge = document.getElementById('paymentStatusBadge');
            if (paymentStatusBadge) {
                paymentStatusBadge.className = 'badge';
                const p = (order.paymentStatus || 'Paid').toLowerCase();
                if (p === 'paid') paymentStatusBadge.classList.add('badge-success');
                else if (p === 'refunded' || p === 'failed') paymentStatusBadge.classList.add('badge-danger');
                else paymentStatusBadge.classList.add('badge-warning');
                paymentStatusBadge.textContent = order.paymentStatus || 'Paid';
            }

            const trackingCodeText = document.getElementById('trackingCodeText');
            if (trackingCodeText) trackingCodeText.textContent = order.trackingNumber || 'Pending Assignment';

            // Status Update Form Pre-fill & Event
            const statusSelect = document.getElementById('orderStatusSelect');
            if (statusSelect) statusSelect.value = order.status || 'Processing';

            const trackingInput = document.getElementById('orderTrackingInput');
            if (trackingInput) trackingInput.value = order.trackingNumber || '';

            const updateBtn = document.getElementById('updateOrderStatusBtn');
            if (updateBtn) {
                updateBtn.onclick = async () => {
                    const newStatus = statusSelect ? statusSelect.value : order.status;
                    const newTracking = trackingInput ? trackingInput.value : order.trackingNumber;

                    try {
                        const updRes = await fetch(`/api/orders/${order.id}/status?status=${encodeURIComponent(newStatus)}&trackingNumber=${encodeURIComponent(newTracking)}`, {
                            method: 'PUT'
                        });

                        if (updRes.ok) {
                            banner(`Order status updated to "${newStatus}" successfully.`, true);
                            loadOrderDetails();
                        } else {
                            banner('Could not update order status.', false);
                        }
                    } catch (err) {
                        console.error(err);
                        banner('Could not update order status.', false);
                    }
                };
            }

        } catch (e) {
            console.error('Order details loading error:', e);
            banner('Could not load order details from backend.', false);
        }
    }

    // =========================================================
    // USER MANAGEMENT
    // =========================================================

    let allUsers = [];

    function userRoleBadge(role) {
        if (role === 'ADMIN') {
            return `<span class="badge badge-warning">ADMIN</span>`;
        }
        return `<span class="badge badge-info">USER</span>`;
    }

    function userStatusBadge(enabled) {
        if (enabled) {
            return `<span class="badge badge-success">Active</span>`;
        }
        return `<span class="badge badge-danger">Inactive</span>`;
    }

    function renderUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (!Array.isArray(users)) users = [];

        tbody.innerHTML = users.map(user => {
            const initials = getInitials(user.name);

            return `
                <tr data-user-id="${user.id}" data-role="${escapeHtml(user.role || 'USER')}" data-status="${user.enabled ? 'active' : 'inactive'}">
                    <td>
                        <div class="product-cell">
                            <div style="width:42px; height:42px; min-width:42px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; background:#f1f1f1;">
                                ${initials}
                            </div>
                            <div>
                                <div style="font-weight:600;">${escapeHtml(user.name || 'Unnamed User')}</div>
                                <div style="font-size:0.75rem; color:var(--color-text-muted);">ID: ${user.id}</div>
                            </div>
                        </div>
                    </td>
                    <td>${escapeHtml(user.username || '—')}</td>
                    <td>${escapeHtml(user.email || '—')}</td>
                    <td>${userRoleBadge(user.role)}</td>
                    <td>${userStatusBadge(user.enabled)}</td>
                    <td>
                        <div class="row-actions" style="display:flex; gap:6px; flex-wrap:wrap;">
                            <button type="button" class="btn btn-outline btn-sm" data-toggle-user="${user.id}" data-enabled="${user.enabled}">
                                ${user.enabled ? 'Disable' : 'Enable'}
                            </button>
                            <button type="button" class="btn btn-danger btn-sm" data-delete-user="${user.id}" data-name="${escapeHtml(user.name || user.username || 'this user')}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        updateUserCount(users);
    }

    function updateUserCount(users) {
        const countText = document.getElementById('userCountText');
        if (countText) {
            countText.textContent = `Showing ${users.length} of ${allUsers.length} users`;
        }
    }

    function updateUserMetrics() {
        const total = document.getElementById('totalUsers');
        const active = document.getElementById('activeUsers');
        const admins = document.getElementById('adminUsers');

        const totalCount = allUsers.length;
        const activeCount = allUsers.filter(u => u.enabled === true).length;
        const adminCount = allUsers.filter(u => u.role === 'ADMIN').length;

        if (total) total.textContent = totalCount;
        if (active) active.textContent = activeCount;
        if (admins) admins.textContent = adminCount;
    }

    function filterUsers() {
        const searchInput = document.getElementById('userSearch');
        const search = searchInput ? searchInput.value.toLowerCase().trim() : '';

        const activeTab = document.querySelector('.tab-btn.active');
        const filter = activeTab ? (activeTab.dataset.filter || 'all').toLowerCase() : 'all';

        let filtered = allUsers.filter(user => {
            const searchable = [user.name, user.username, user.email, user.role].filter(Boolean).join(' ').toLowerCase();
            const matchesSearch = !search || searchable.includes(search);

            let matchesFilter = true;
            if (filter === 'customers') matchesFilter = user.role === 'USER';
            else if (filter === 'administrators') matchesFilter = user.role === 'ADMIN';
            else if (filter === 'active') matchesFilter = user.enabled === true;
            else if (filter === 'inactive') matchesFilter = user.enabled === false;

            return matchesSearch && matchesFilter;
        });

        renderUsers(filtered);
    }

    async function loadUsers() {
        if (ctx !== 'users') return;

        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem;">Loading users...</td></tr>`;

        try {
            const res = await fetch('/admin/api/users');
            if (!res.ok) {
                if (res.status === 403) throw new Error('You do not have permission to view users.');
                throw new Error('Could not load users.');
            }

            allUsers = await res.json();
            if (!Array.isArray(allUsers)) allUsers = [];

            updateUserMetrics();
            renderUsers(allUsers);

        } catch (error) {
            console.error('User loading error:', error);
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:#b3261e;">Could not load users. Make sure you are logged in as an administrator.</td></tr>`;
            banner(error.message || 'Could not load users.', false);
        }
    }

    // USER SEARCH
    const userSearch = document.getElementById('userSearch');
    if (userSearch) userSearch.addEventListener('input', filterUsers);

    // USER TABS
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (ctx === 'users') {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                filterUsers();
            }
        });
    });

    // USER ENABLE / DISABLE
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-toggle-user]');
        if (!btn) return;

        const id = btn.dataset.toggleUser;
        const currentEnabled = btn.dataset.enabled === 'true';
        const newEnabled = !currentEnabled;

        if (!confirm(newEnabled ? 'Enable this user account?' : 'Disable this user account?')) return;

        try {
            const res = await fetch(`/admin/api/users/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: newEnabled })
            });

            if (!res.ok) {
                let msg = 'Could not update user status.';
                try { const data = await res.json(); msg = data.error || msg; } catch (x) {}
                banner(msg, false);
                return;
            }

            banner(newEnabled ? 'User account enabled successfully.' : 'User account disabled successfully.', true);
            await loadUsers();
        } catch (error) {
            console.error(error);
            banner('Could not update user status.', false);
        }
    });

    // USER DELETE
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-delete-user]');
        if (!btn) return;

        const id = btn.dataset.deleteUser;
        const name = btn.dataset.name || 'this user';

        if (!confirm(`Are you sure you want to permanently delete ${name}?`)) return;

        try {
            const res = await fetch(`/admin/api/users/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                let msg = 'Could not delete user.';
                try { const data = await res.json(); msg = data.error || msg; } catch (x) {}
                banner(msg, false);
                return;
            }

            banner(`${name} deleted successfully.`, true);
            await loadUsers();
        } catch (error) {
            console.error(error);
            banner('Could not delete user.', false);
        }
    });

    // =========================================================
    // CATEGORIES SEARCH
    // =========================================================
    if (ctx === 'categories') {
        const catSearchInput = document.querySelector('.toolbar input[type="search"]');
        if (catSearchInput) {
            catSearchInput.addEventListener('input', (e) => {
                const q = e.target.value.toLowerCase().trim();
                const filtered = allCategoriesList.filter(c => 
                    (c.name && c.name.toLowerCase().includes(q)) ||
                    (c.description && c.description.toLowerCase().includes(q))
                );
                renderCategories(filtered);
            });
        }
    }

    // =========================================================
    // IMAGE PREVIEW
    // =========================================================

    const imageInput = document.querySelector('input[type="file"]#image');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImg = document.getElementById('imagePreview');

    if (imageInput && previewImg) {
        imageInput.addEventListener('change', function () {
            const file = this.files[0];
            if (!file) return;

            if (file.size > 4 * 1024 * 1024) {
                alert('Image is ' + (file.size / 1048576).toFixed(1) + ' MB. Please choose an image under 4 MB.');
                this.value = '';
                if (previewContainer) previewContainer.style.display = 'none';
                return;
            }

            const reader = new FileReader();
            reader.onload = function (ev) {
                previewImg.src = ev.target.result;
                if (previewContainer) previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
    }

    // =========================================================
    // ADMIN PRODUCT FORM VALIDATION
    // =========================================================

    document.querySelectorAll('form.admin-form').forEach(f => {
        f.addEventListener('submit', (ev) => {
            const priceInput = f.querySelector('#price');
            if (priceInput && (parseFloat(priceInput.value) <= 0 || isNaN(parseFloat(priceInput.value)))) {
                ev.preventDefault();
                alert('Regular price must be greater than 0.');
                return;
            }

            const input = f.querySelector('input[type="file"]#image');
            if (input && input.files[0] && input.files[0].size > 4 * 1024 * 1024) {
                ev.preventDefault();
                alert('Image exceeds the 4 MB limit. Please choose a smaller image.');
            }
        });
    });

    // =========================================================
    // INITIALIZE ALL ADMIN PAGES
    // =========================================================

    async function init() {
        if (ctx !== 'edit') {
            await loadCategories();
        }

        // Run page-specific dynamic loaders based on body[data-page]
        if (ctx === 'dashboard') {
            loadDashboard();
        } else if (ctx === 'products') {
            loadProducts();
        } else if (ctx === 'edit') {
            loadEditProduct();
        } else if (ctx === 'categories') {
            loadCategoriesGrid();
        } else if (ctx === 'inventory') {
            loadInventory();
        } else if (ctx === 'orders') {
            loadOrders();
        } else if (ctx === 'order-details') {
            loadOrderDetails();
        } else if (ctx === 'users') {
            loadUsers();
        }
    }

    init();
});