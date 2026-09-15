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
            (ok
                ? 'background:#e7f6ec;color:#1e7d43;'
                : 'background:#fdecea;color:#b3261e;');

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


    const qErr = urlParam('error');
    const qAdded = urlParam('added');
    const qUpdated = urlParam('updated');

    if (qErr) {
        banner(qErr, false);
    } else if (qAdded) {
        banner(qAdded + ' was added successfully.', true);
    } else if (qUpdated) {
        banner(qUpdated + ' was updated successfully.', true);
    } else if (urlParam('deleted')) {
        banner('Product deleted successfully.', true);
    }


    history.replaceState(null, '', window.location.pathname);

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

                        const current =
                            sel.dataset.current || sel.value;

                        sel.innerHTML =
                            '<option value="">Select Category</option>' +

                            activeCats.map(c =>
                                `<option value="${escapeHtml(c.name)}"
                                ${c.name === current ? 'selected' : ''}>
                                ${escapeHtml(c.name)}
                                </option>`
                            ).join('');

                    });
            }
            const filter = document.getElementById('categoryFilter');

            if (filter) {

                filter.innerHTML =
                    '<option value="all">All Categories</option>' +

                    cats.map(c =>
                        `<option value="${escapeHtml(c.name)}">
                            ${escapeHtml(c.name)}
                        </option>`
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

            return `
                <td style="color: var(--color-sale); font-weight: 600;">
                    0 in stock
                </td>
            `;
        }

        if (stock <= minStock) {

            return `
                <td style="color: var(--color-gold); font-weight: 600;">
                    ${stock} in stock
                </td>
            `;
        }

        return `
            <td class="stock-ok">
                ${stock} in stock
            </td>
        `;
    }


    function statusBadge(status, stock, minStock) {

        stock = Number(stock || 0);
        minStock = Number(minStock || 0);

        if (status === 'Draft') {
            return '<span class="badge badge-warning">Draft</span>';
        }

        if (status === 'Archived') {
            return '<span class="badge badge-danger">Archived</span>';
        }

        if (stock <= 0) {
            return '<span class="badge badge-danger">Out of Stock</span>';
        }

        if (stock <= minStock) {
            return '<span class="badge badge-warning">Low Stock</span>';
        }

        return '<span class="badge badge-success">Active</span>';
    }


    function renderProducts(products) {

        const tbody = document.querySelector('table tbody');

        if (!tbody) return;

        tbody.innerHTML = products.map(p => {

            const cat =
                categoryMap[p.categoryId] || '—';

            const desc =
                p.description
                    ? p.description.substring(0, 42)
                    : '';

            const img =
                p.hasImage
                    ? `/api/products/${p.id}/image`
                    : '../assets/images/logo.png';


            return `
                <tr data-id="${p.id}" data-status="${escapeHtml(p.status)}">

                    <td>
                        <div class="product-cell">

                            <img
                                src="${img}"
                                alt="${escapeHtml(p.name)}"
                            >

                            <div>

                                <div style="font-weight:600;">
                                    ${escapeHtml(p.name)}
                                </div>

                                <div style="
                                    font-size:0.75rem;
                                    color:var(--color-text-muted);
                                ">
                                    ${escapeHtml(desc)}
                                </div>

                            </div>

                        </div>
                    </td>

                    <td>${escapeHtml(cat)}</td>

                    <td>
                        <code>${escapeHtml(p.sku || '—')}</code>
                    </td>

                    <td>
                        <strong>${money(p.price)}</strong>
                    </td>

                    ${stockCell(p.stock, p.minStock)}

                    <td>
                        ${statusBadge(
                p.status,
                p.stock,
                p.minStock
            )}
                    </td>

                    <td>

                        <div class="row-actions">

                            <a
                                href="edit_product.html?id=${p.id}"
                                class="btn btn-outline btn-sm"
                            >
                                <i class="fas fa-pen"></i>
                                Edit
                            </a>

                            <button
                                type="button"
                                class="btn btn-danger btn-sm"
                                data-delete="${p.id}"
                                data-name="${escapeHtml(p.name)}"
                            >
                                <i class="fas fa-trash"></i>
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        }).join('');


        document
            .querySelectorAll('.pagination div:first-child')
            .forEach(el => {

                el.textContent =
                    `Showing 1 to ${products.length} of ${products.length} items`;

            });


        const totalSpan =
            document.querySelector('.toolbar span[style]');

        if (totalSpan) {

            totalSpan.textContent =
                `Total ${products.length} Items`;

        }
    }


    async function loadProducts() {

        const tbody =
            document.querySelector('table tbody');

        if (!tbody || ctx !== 'products') return;

        try {

            const res =
                await fetch('/api/products');

            if (!res.ok) {
                throw new Error('Failed to load products');
            }

            const products =
                await res.json();

            renderProducts(products);

        } catch (e) {

            console.error(e);

            banner(
                'Could not load products. Is the server running?',
                false
            );
        }
    }


    // =========================================================
    // PRODUCT DELETE
    // =========================================================

    document.addEventListener('click', async (e) => {

        const btn =
            e.target.closest('[data-delete]');

        if (!btn) return;

        e.preventDefault();

        const id =
            btn.dataset.delete;

        const name =
            btn.dataset.name || 'this product';


        if (!confirm(
            `Are you sure you want to delete ${name}?`
        )) {
            return;
        }


        try {

            const res =
                await fetch(
                    `/api/products/${id}`,
                    {
                        method: 'DELETE'
                    }
                );


            if (res.ok) {

                const row =
                    btn.closest('tr');

                if (row) {

                    row.style.transition =
                        'opacity 0.3s ease';

                    row.style.opacity = '0';


                    setTimeout(() => {

                        row.remove();

                        banner(
                            name + ' was deleted successfully.',
                            true
                        );

                    }, 250);
                }

            } else {

                let msg =
                    'Delete failed.';

                try {

                    const data =
                        await res.json();

                    msg =
                        data.error || msg;

                } catch (x) {}


                banner(msg, false);
            }

        } catch (error) {

            console.error(error);

            banner(
                'Could not delete product.',
                false
            );
        }
    });


    // =========================================================
    // EDIT PRODUCT
    // =========================================================

    function fillEditForm(p) {

        const f =
            document.querySelector('form.admin-form');

        if (!f) return;


        let hidden =
            f.querySelector('input[name="id"]');


        if (!hidden) {

            hidden =
                document.createElement('input');

            hidden.type = 'hidden';
            hidden.name = 'id';

            f.prepend(hidden);
        }


        hidden.value = p.id;

        f.action =
            '/admin/update_product';

        f.enctype =
            'multipart/form-data';

        f.method =
            'post';


        const productName =
            f.querySelector('#productName');

        if (productName) {
            productName.value =
                p.name || '';
        }


        const catName =
            categoryMap[p.categoryId] || '';


        const sku =
            f.querySelector('#sku');

        if (sku) {
            sku.value =
                p.sku || '';
        }


        const price =
            f.querySelector('#price');

        if (price) {

            price.value =
                p.originalPrice != null
                    ? p.originalPrice
                    : (p.price != null
                        ? p.price
                        : '');

        }


        const salePrice =
            f.querySelector('#salePrice');

        if (salePrice) {

            salePrice.value =
                (
                    p.originalPrice != null &&
                    p.price != null
                )
                    ? p.price
                    : '';

        }


        const stock =
            f.querySelector('#stock');

        if (stock) {
            stock.value =
                p.stock != null
                    ? p.stock
                    : 0;
        }


        const minStock =
            f.querySelector('#minStock');

        if (minStock) {
            minStock.value =
                p.minStock != null
                    ? p.minStock
                    : 5;
        }


        const status =
            f.querySelector('#status');

        if (status) {
            status.value =
                p.status || 'Active';
        }


        const description =
            f.querySelector('#description');

        if (description) {
            description.value =
                p.description || '';
        }


        // Category

        const sel =
            f.querySelector('#category');

        if (sel) {

            sel.dataset.current =
                catName;

            let found = false;


            [...sel.options].forEach(o => {

                o.selected =
                    o.value === catName;

                if (o.value === catName) {
                    found = true;
                }

            });


            if (catName && !found) {

                const opt =
                    document.createElement('option');

                opt.value =
                    catName;

                opt.textContent =
                    catName;

                opt.selected =
                    true;

                sel.appendChild(opt);
            }
        }


        // Existing image

        const preview =
            document.getElementById(
                'imagePreview'
            );


        if (preview && p.hasImage) {

            preview.src =
                `/api/products/${p.id}/image`;


            const c =
                document.getElementById(
                    'imagePreviewContainer'
                );


            if (c) {
                c.style.display =
                    'block';
            }
        }


        const header =
            document.querySelector(
                '.page-header h1'
            );

        if (header) {
            header.textContent =
                'Edit Product';
        }


        const sub =
            document.querySelector(
                '.page-header p'
            );

        if (sub) {

            sub.textContent =
                `Modifying: ${p.name}`;
        }


        // Delete button

        const delBtn =
            document.getElementById(
                'deleteProductBtn'
            );


        if (delBtn) {

            delBtn.onclick =
                async () => {

                    if (!confirm(
                        `Are you sure you want to delete ${p.name}?`
                    )) {
                        return;
                    }


                    try {

                        const res =
                            await fetch(
                                `/api/products/${p.id}`,
                                {
                                    method: 'DELETE'
                                }
                            );


                        if (res.ok) {

                            window.location.href =
                                'products.html?deleted=1';

                        } else {

                            let msg =
                                'Delete failed.';

                            try {

                                msg =
                                    (await res.json()).error
                                    || msg;

                            } catch (x) {}


                            banner(
                                msg,
                                false
                            );
                        }

                    } catch (error) {

                        banner(
                            'Could not delete product.',
                            false
                        );
                    }
                };
        }
    }


    async function loadEditProduct() {

        if (ctx !== 'edit') return;


        const id =
            urlParam('id');


        const loadingEl =
            document.getElementById(
                'editLoadingState'
            );


        const formCard =
            document.getElementById(
                'editFormCard'
            );


        if (!id) {

            banner(
                'No product selected. Pick one from the Products page.',
                false
            );


            if (formCard) {
                formCard.style.display =
                    'block';
            }

            return;
        }


        if (loadingEl) {
            loadingEl.style.display =
                'block';
        }


        if (formCard) {
            formCard.style.display =
                'none';
        }


        try {

            const [prodRes] =
                await Promise.all([

                    fetch(`/api/products/${id}`),

                    loadCategories()

                ]);


            if (prodRes.status === 404) {

                banner(
                    'Product not found.',
                    false
                );


                if (loadingEl) {
                    loadingEl.style.display =
                        'none';
                }


                if (formCard) {
                    formCard.style.display =
                        'block';
                }

                return;
            }


            if (!prodRes.ok) {
                throw new Error(
                    'Could not fetch product'
                );
            }


            const p =
                await prodRes.json();


            fillEditForm(p);


            if (loadingEl) {
                loadingEl.style.display =
                    'none';
            }


            if (formCard) {
                formCard.style.display =
                    'block';
            }

        } catch (e) {

            console.error(e);

            banner(
                'Could not load product. Is the server running?',
                false
            );


            if (loadingEl) {
                loadingEl.style.display =
                    'none';
            }


            if (formCard) {
                formCard.style.display =
                    'block';
            }
        }
    }


    // =========================================================
    // CATEGORIES
    // =========================================================

    function renderCategories(cats) {

        const grid =
            document.querySelector('.grid-cards');

        if (!grid) return;


        grid.innerHTML =
            cats.map(c => {

                const img =
                    c.hasImage
                        ? `/api/categories/${c.id}/image`
                        : '../assets/images/logo.png';


                return `
                    <div
                        class="category-card"
                        data-id="${c.id}"
                    >

                        <img
                            src="${img}"
                            alt="${escapeHtml(c.name)}"
                            class="category-card-img"
                        >


                        <div class="category-card-body">

                            <div class="category-card-header">

                                <h3 class="category-card-title">
                                    ${escapeHtml(c.name)}
                                </h3>

                                <span class="badge ${
                    c.status === 'Active'
                        ? 'badge-success'
                        : 'badge-warning'
                }">
                                    ${escapeHtml(c.status)}
                                </span>

                            </div>


                            <div class="category-card-slug">
                                /collections/${
                    escapeHtml(
                        c.slug ||
                        c.name
                            .toLowerCase()
                            .replace(
                                /[^a-z0-9]+/g,
                                '-'
                            )
                    )
                }
                            </div>


                            <p class="category-card-desc">
                                ${escapeHtml(
                    c.description || ''
                )}
                            </p>


                            <div class="category-card-footer">

                                <span class="category-count">

                                    <i class="fas fa-box"></i>

                                    ${c.productCount}
                                    Products

                                </span>


                                <div class="row-actions">

                                    <button
                                        type="button"
                                        class="btn btn-outline btn-sm"
                                        data-edit-cat="${c.id}"
                                    >
                                        Edit
                                    </button>


                                    <button
                                        type="button"
                                        class="btn btn-danger btn-sm"
                                        data-del-cat="${c.id}"
                                        data-name="${escapeHtml(c.name)}"
                                    >
                                        <i class="fas fa-trash"></i>
                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>
                `;

            }).join('');


        const count =
            document.querySelector(
                '.toolbar span:last-child'
            );


        if (count) {
            count.textContent =
                `${cats.length} Active Collections`;
        }
    }


    async function loadCategoriesGrid() {

        if (ctx !== 'categories') return;


        try {

            const res =
                await fetch('/api/categories');


            if (!res.ok) {
                throw new Error(
                    'Failed to load categories'
                );
            }


            const cats =
                await res.json();


            renderCategories(cats);

        } catch (e) {

            console.error(e);

            banner(
                'Could not load categories.',
                false
            );
        }
    }


    // Category form

    document.addEventListener(
        'submit',
        async (e) => {

            const f =
                e.target.closest(
                    'form[data-category-form]'
                );


            if (!f) return;

            e.preventDefault();


            try {

                const fd =
                    new FormData(f);

                const id =
                    f.dataset.editId;


                const url =
                    id
                        ? `/api/categories/${id}`
                        : '/api/categories';


                const method =
                    id
                        ? 'PUT'
                        : 'POST';


                const res =
                    await fetch(
                        url,
                        {
                            method,
                            body: fd
                        }
                    );


                if (res.ok) {

                    f.reset();

                    delete f.dataset.editId;


                    const btn =
                        f.querySelector(
                            'button[type="submit"]'
                        );


                    if (btn) {

                        btn.innerHTML =
                            '<i class="fas fa-plus"></i> Save Category';
                    }


                    banner(
                        id
                            ? 'Category updated successfully.'
                            : 'Category created successfully.',
                        true
                    );


                    loadCategoriesGrid();
                    loadCategories();

                } else {

                    let msg =
                        'Could not save category.';

                    try {

                        msg =
                            (await res.json()).error
                            || msg;

                    } catch (x) {}


                    banner(
                        msg,
                        false
                    );
                }

            } catch (error) {

                console.error(error);

                banner(
                    'Could not save category.',
                    false
                );
            }
        }
    );


    // Category edit/delete

    document.addEventListener(
        'click',
        async (e) => {

            const editBtn =
                e.target.closest(
                    '[data-edit-cat]'
                );


            if (editBtn) {

                const card =
                    editBtn.closest(
                        '.category-card'
                    );


                const id =
                    editBtn.dataset.editCat;


                const f =
                    document.querySelector(
                        'form[data-category-form]'
                    );


                if (!f) return;


                try {

                    const res =
                        await fetch(
                            '/api/categories'
                        );


                    const cats =
                        await res.json();


                    const c =
                        cats.find(
                            x =>
                                String(x.id) ===
                                String(id)
                        );


                    if (!c) return;


                    f.dataset.editId =
                        id;


                    const catName =
                        f.querySelector('#catName');

                    if (catName) {
                        catName.value =
                            c.name || '';
                    }


                    const catSlug =
                        f.querySelector('#catSlug');

                    if (catSlug) {
                        catSlug.value =
                            c.slug || '';
                    }


                    const catDesc =
                        f.querySelector('#catDesc');

                    if (catDesc) {
                        catDesc.value =
                            c.description || '';
                    }


                    const catOrder =
                        f.querySelector('#catOrder');

                    if (catOrder) {
                        catOrder.value =
                            c.sortOrder || 1;
                    }


                    const catStatus =
                        f.querySelector('#catStatus');

                    if (catStatus) {
                        catStatus.value =
                            c.status;
                    }


                    f.scrollIntoView({
                        behavior: 'smooth'
                    });


                    const btn =
                        f.querySelector(
                            'button[type="submit"]'
                        );


                    if (btn) {

                        btn.innerHTML =
                            '<i class="fas fa-check"></i> Update Category';
                    }


                    if (card) {

                        card.style.outline =
                            '2px solid var(--color-gold)';


                        setTimeout(() => {

                            card.style.outline =
                                '';

                        }, 1500);
                    }

                } catch (x) {

                    console.error(x);

                }
            }


            const delBtn =
                e.target.closest(
                    '[data-del-cat]'
                );


            if (delBtn) {

                const id =
                    delBtn.dataset.delCat;

                const name =
                    delBtn.dataset.name;


                if (!confirm(
                    `Are you sure you want to delete the category "${name}"?`
                )) {
                    return;
                }


                try {

                    const res =
                        await fetch(
                            `/api/categories/${id}`,
                            {
                                method: 'DELETE'
                            }
                        );


                    if (res.ok) {

                        banner(
                            `Category "${name}" deleted.`,
                            true
                        );


                        loadCategoriesGrid();
                        loadCategories();

                    } else {

                        let msg =
                            'Delete failed.';

                        try {

                            msg =
                                (await res.json()).error
                                || msg;

                        } catch (x) {}


                        banner(
                            msg,
                            false
                        );
                    }

                } catch (error) {

                    banner(
                        'Could not delete category.',
                        false
                    );
                }
            }

        }
    );


    // =========================================================
    // INVENTORY
    // =========================================================

    function renderInventory(products) {

        const tbody =
            document.querySelector('table tbody');

        if (!tbody || ctx !== 'inventory') return;


        tbody.innerHTML =
            products.map(p => {

                const cat =
                    categoryMap[p.categoryId] || '—';


                const img =
                    p.hasImage
                        ? `/api/products/${p.id}/image`
                        : '../assets/images/logo.png';


                return `
                    <tr
                        data-id="${p.id}"
                        data-status="${
                    p.stock <= 0
                        ? 'out of stock'
                        : (
                            p.stock <= p.minStock
                                ? 'low stock'
                                : 'in stock'
                        )
                }"
                    >

                        <td>
                            <code>
                                ${escapeHtml(p.sku || '—')}
                            </code>
                        </td>


                        <td>

                            <div class="product-cell">

                                <img
                                    src="${img}"
                                    alt="${escapeHtml(p.name)}"
                                >


                                <div>

                                    <div style="font-weight:600;">
                                        ${escapeHtml(p.name)}
                                    </div>

                                    <div style="
                                        font-size:0.75rem;
                                        color:var(--color-text-muted);
                                    ">
                                        ${
                    p.description
                        ? escapeHtml(
                            p.description.substring(
                                0,
                                42
                            )
                        )
                        : ''
                }
                                    </div>

                                </div>

                            </div>

                        </td>


                        <td>
                            ${escapeHtml(cat)}
                        </td>


                        <td>—</td>


                        <td>
                            ${p.minStock} units
                        </td>


                        <td>

                            <div class="stock-adjust">

                                <button
                                    type="button"
                                    class="stock-btn minus"
                                >
                                    -
                                </button>


                                <span
                                    class="stock-count"
                                    style="
                                        font-weight:600;
                                        min-width:28px;
                                        text-align:center;
                                    "
                                >
                                    ${p.stock}
                                </span>


                                <button
                                    type="button"
                                    class="stock-btn plus"
                                >
                                    +
                                </button>

                            </div>

                        </td>


                        <td>
                            ${statusBadge(
                    p.status,
                    p.stock,
                    p.minStock
                )}
                        </td>


                        <td>

                            <div class="row-actions">

                                <button
                                    type="button"
                                    class="btn btn-outline btn-sm"
                                    data-save-stock="${p.id}"
                                    data-name="${escapeHtml(p.name)}"
                                >
                                    <i class="fas fa-check"></i>
                                    Save
                                </button>


                                <a
                                    href="edit_product.html?id=${p.id}"
                                    class="btn btn-outline btn-sm"
                                >
                                    <i class="fas fa-pen"></i>
                                </a>


                                <button
                                    type="button"
                                    class="btn btn-danger btn-sm"
                                    data-inv-del="${p.id}"
                                    data-name="${escapeHtml(p.name)}"
                                >
                                    <i class="fas fa-trash"></i>
                                </button>

                            </div>

                        </td>

                    </tr>
                `;

            }).join('');


        document
            .querySelectorAll('.pagination div:first-child')
            .forEach(el => {

                el.textContent =
                    `Showing 1 to ${products.length} of ${products.length} inventory items`;

            });
    }


    async function loadInventory() {

        const tbody =
            document.querySelector('table tbody');

        if (!tbody || ctx !== 'inventory') return;


        try {

            const res =
                await fetch('/api/products');


            if (!res.ok) {
                throw new Error(
                    'Inventory loading failed'
                );
            }


            const products =
                await res.json();


            renderInventory(products);

        } catch (e) {

            console.error(e);

            banner(
                'Could not load inventory. Is the server running?',
                false
            );
        }
    }


    // Inventory buttons

    document.addEventListener(
        'click',
        async (e) => {

            const minus =
                e.target.closest(
                    '.stock-btn.minus'
                );


            const plus =
                e.target.closest(
                    '.stock-btn.plus'
                );


            if (minus || plus) {

                const counter =
                    (minus || plus)
                        .closest('.stock-adjust')
                        .querySelector('.stock-count');


                let current =
                    parseInt(
                        counter.textContent.trim(),
                        10
                    ) || 0;


                if (minus && current > 0) {
                    current -= 1;
                }


                if (plus) {
                    current += 1;
                }


                counter.textContent =
                    current;

                return;
            }


            // Save stock

            const save =
                e.target.closest(
                    '[data-save-stock]'
                );


            if (save) {

                const row =
                    save.closest('tr');


                const stock =
                    parseInt(
                        row
                            .querySelector(
                                '.stock-count'
                            )
                            .textContent
                            .trim(),
                        10
                    ) || 0;


                try {

                    const res =
                        await fetch(
                            `/api/products/${save.dataset.saveStock}/stock`,
                            {
                                method: 'PATCH',

                                headers: {
                                    'Content-Type':
                                        'application/json'
                                },

                                body:
                                    JSON.stringify({
                                        stock
                                    })
                            }
                        );


                    if (res.ok) {

                        banner(
                            `Stock for ${save.dataset.name} saved (${stock} units).`,
                            true
                        );


                        loadInventory();

                    } else {

                        banner(
                            'Could not save stock.',
                            false
                        );
                    }

                } catch (error) {

                    banner(
                        'Could not save stock.',
                        false
                    );
                }

                return;
            }


            // Delete inventory product

            const del =
                e.target.closest(
                    '[data-inv-del]'
                );


            if (del) {

                if (!confirm(
                    `Are you sure you want to delete ${del.dataset.name}?`
                )) {
                    return;
                }


                try {

                    const res =
                        await fetch(
                            `/api/products/${del.dataset.invDel}`,
                            {
                                method: 'DELETE'
                            }
                        );


                    if (res.ok) {

                        banner(
                            `${del.dataset.name} was deleted successfully.`,
                            true
                        );


                        loadInventory();

                    } else {

                        banner(
                            'Delete failed.',
                            false
                        );
                    }

                } catch (error) {

                    banner(
                        'Could not delete product.',
                        false
                    );
                }
            }

        }
    );


    // =========================================================
    // USER MANAGEMENT
    // =========================================================

    let allUsers = [];


    function getInitials(name) {

        if (!name) return 'U';


        const parts =
            String(name)
                .trim()
                .split(/\s+/);


        if (parts.length === 1) {

            return parts[0]
                .substring(0, 2)
                .toUpperCase();

        }


        return (
            parts[0][0] +
            parts[parts.length - 1][0]
        ).toUpperCase();
    }


    function userRoleBadge(role) {

        if (role === 'ADMIN') {

            return `
                <span class="badge badge-warning">
                    ADMIN
                </span>
            `;

        }


        return `
            <span class="badge badge-info">
                USER
            </span>
        `;
    }


    function userStatusBadge(enabled) {

        if (enabled) {

            return `
                <span class="badge badge-success">
                    Active
                </span>
            `;

        }


        return `
            <span class="badge badge-danger">
                Inactive
            </span>
        `;
    }


    function renderUsers(users) {

        const tbody =
            document.getElementById(
                'usersTableBody'
            );


        if (!tbody) return;


        if (!Array.isArray(users)) {
            users = [];
        }


        tbody.innerHTML =
            users.map(user => {

                const initials =
                    getInitials(user.name);


                return `
                    <tr
                        data-user-id="${user.id}"
                        data-role="${escapeHtml(user.role || 'USER')}"
                        data-status="${
                    user.enabled
                        ? 'active'
                        : 'inactive'
                }"
                    >

                        <td>

                            <div class="product-cell">

                                <div
                                    style="
                                        width:42px;
                                        height:42px;
                                        min-width:42px;
                                        border-radius:50%;
                                        display:flex;
                                        align-items:center;
                                        justify-content:center;
                                        font-weight:700;
                                        background:#f1f1f1;
                                    "
                                >
                                    ${initials}
                                </div>


                                <div>

                                    <div style="font-weight:600;">
                                        ${escapeHtml(
                    user.name || 'Unnamed User'
                )}
                                    </div>


                                    <div style="
                                        font-size:0.75rem;
                                        color:var(--color-text-muted);
                                    ">
                                        ID: ${user.id}
                                    </div>

                                </div>

                            </div>

                        </td>


                        <td>
                            ${escapeHtml(
                    user.username || '—'
                )}
                        </td>


                        <td>
                            ${escapeHtml(
                    user.email || '—'
                )}
                        </td>


                        <td>
                           ${userRoleBadge(user.role)}
                           </td>


                        <td>
                            ${userStatusBadge(
                    user.enabled
                )}
                        </td>


                        <td>

                            <div
                                class="row-actions"
                                style="
                                    display:flex;
                                    gap:6px;
                                    flex-wrap:wrap;
                                "
                            >

                                <button
                                    type="button"
                                    class="btn btn-outline btn-sm"
                                    data-toggle-user="${user.id}"
                                    data-enabled="${user.enabled}"
                                >
                                    ${
                    user.enabled
                        ? 'Disable'
                        : 'Enable'
                }
                                </button>


                                <button
                                    type="button"
                                    class="btn btn-danger btn-sm"
                                    data-delete-user="${user.id}"
                                    data-name="${escapeHtml(
                    user.name ||
                    user.username ||
                    'this user'
                )}"
                                >
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

        const countText =
            document.getElementById(
                'userCountText'
            );


        if (countText) {

            countText.textContent =
                `Showing ${users.length} of ${allUsers.length} users`;

        }
    }


    function updateUserMetrics() {

        const total =
            document.getElementById(
                'totalUsers'
            );


        const active =
            document.getElementById(
                'activeUsers'
            );


        const admins =
            document.getElementById(
                'adminUsers'
            );


        const totalCount =
            allUsers.length;


        const activeCount =
            allUsers.filter(
                u => u.enabled === true
            ).length;


        const adminCount =
            allUsers.filter(
                u => u.role === 'ADMIN'
            ).length;


        if (total) {
            total.textContent =
                totalCount;
        }


        if (active) {
            active.textContent =
                activeCount;
        }


        if (admins) {
            admins.textContent =
                adminCount;
        }
    }


    function filterUsers() {

        const searchInput =
            document.getElementById(
                'userSearch'
            );


        const search =
            searchInput
                ? searchInput.value
                    .toLowerCase()
                    .trim()
                : '';


        const activeTab =
            document.querySelector(
                '.tab-btn.active'
            );


        const filter =
            activeTab
                ? (
                    activeTab.dataset.filter ||
                    'all'
                ).toLowerCase()
                : 'all';


        let filtered =
            allUsers.filter(user => {

                const searchable =
                    [
                        user.name,
                        user.username,
                        user.email,
                        user.role
                    ]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase();


                const matchesSearch =
                    !search ||
                    searchable.includes(search);


                let matchesFilter = true;


                if (filter === 'customers') {

                    matchesFilter =
                        user.role === 'USER';

                } else if (filter === 'administrators') {

                    matchesFilter =
                        user.role === 'ADMIN';

                } else if (filter === 'active') {

                    matchesFilter =
                        user.enabled === true;

                } else if (filter === 'inactive') {

                    matchesFilter =
                        user.enabled === false;

                }


                return (
                    matchesSearch &&
                    matchesFilter
                );

            });


        renderUsers(filtered);
    }


    async function loadUsers() {

        if (ctx !== 'users') return;


        const tbody =
            document.getElementById(
                'usersTableBody'
            );


        if (!tbody) return;


        tbody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:2rem;
                    "
                >
                    Loading users...
                </td>
            </tr>
        `;


        try {

            const res =
                await fetch(
                    '/admin/api/users'
                );


            if (!res.ok) {

                if (res.status === 403) {

                    throw new Error(
                        'You do not have permission to view users.'
                    );
                }


                throw new Error(
                    'Could not load users.'
                );
            }


            allUsers =
                await res.json();


            if (!Array.isArray(allUsers)) {

                allUsers = [];

            }


            updateUserMetrics();

            renderUsers(allUsers);

        } catch (error) {

            console.error(
                'User loading error:',
                error
            );


            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        style="
                            text-align:center;
                            padding:2rem;
                            color:#b3261e;
                        "
                    >
                        Could not load users.
                        Make sure you are logged in as an administrator.
                    </td>
                </tr>
            `;


            banner(
                error.message ||
                'Could not load users.',
                false
            );
        }
    }


    // =========================================================
    // USER SEARCH
    // =========================================================

    const userSearch =
        document.getElementById(
            'userSearch'
        );


    if (userSearch) {

        userSearch.addEventListener(
            'input',
            filterUsers
        );
    }


    // =========================================================
    // USER TABS
    // =========================================================

    document
        .querySelectorAll(
            '.tab-btn'
        )
        .forEach(btn => {

            btn.addEventListener(
                'click',
                () => {

                    document
                        .querySelectorAll(
                            '.tab-btn'
                        )
                        .forEach(b =>
                            b.classList.remove(
                                'active'
                            )
                        );


                    btn.classList.add(
                        'active'
                    );


                    if (ctx === 'users') {

                        filterUsers();

                    } else {

                        // Existing behavior
                        // for products/inventory

                        const filterValue =
                            (
                                btn.getAttribute(
                                    'data-filter'
                                ) ||
                                'all'
                            ).toLowerCase();


                        const table =
                            document.querySelector(
                                'table tbody'
                            );


                        if (!table) return;


                        const rows =
                            table.querySelectorAll(
                                'tr'
                            );


                        rows.forEach(row => {

                            if (
                                filterValue ===
                                'all'
                            ) {

                                row.style.display =
                                    '';

                                return;
                            }


                            const statusAttr =
                                (
                                    row.getAttribute(
                                        'data-status'
                                    ) ||
                                    ''
                                ).toLowerCase();


                            row.style.display =
                                statusAttr ===
                                filterValue
                                    ? ''
                                    : 'none';

                        });

                    }

                }
            );
        });


    // =========================================================
    // USER ENABLE / DISABLE
    // =========================================================

    document.addEventListener(
        'click',
        async (e) => {

            const btn =
                e.target.closest(
                    '[data-toggle-user]'
                );


            if (!btn) return;


            const id =
                btn.dataset.toggleUser;


            const currentEnabled =
                btn.dataset.enabled ===
                'true';


            const newEnabled =
                !currentEnabled;


            if (
                !confirm(
                    newEnabled
                        ? 'Enable this user account?'
                        : 'Disable this user account?'
                )
            ) {
                return;
            }


            try {

                const res =
                    await fetch(
                        `/admin/api/users/${id}/status`,
                        {
                            method: 'PATCH',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body:
                                JSON.stringify({
                                    enabled:
                                    newEnabled
                                })
                        }
                    );


                if (!res.ok) {

                    let msg =
                        'Could not update user status.';

                    try {

                        const data =
                            await res.json();

                        msg =
                            data.error || msg;

                    } catch (x) {}


                    banner(
                        msg,
                        false
                    );

                    return;
                }


                banner(
                    newEnabled
                        ? 'User account enabled successfully.'
                        : 'User account disabled successfully.',
                    true
                );


                await loadUsers();

            } catch (error) {

                console.error(error);

                banner(
                    'Could not update user status.',
                    false
                );
            }

        }
    );

    // =========================================================
    // USER DELETE
    // =========================================================

    document.addEventListener(
        'click',
        async (e) => {

            const btn =
                e.target.closest(
                    '[data-delete-user]'
                );


            if (!btn) return;


            const id =
                btn.dataset.deleteUser;


            const name =
                btn.dataset.name ||
                'this user';


            if (!confirm(
                `Are you sure you want to permanently delete ${name}?`
            )) {
                return;
            }


            try {

                const res =
                    await fetch(
                        `/admin/api/users/${id}`,
                        {
                            method: 'DELETE'
                        }
                    );


                if (!res.ok) {

                    let msg =
                        'Could not delete user.';

                    try {

                        const data =
                            await res.json();

                        msg =
                            data.error || msg;

                    } catch (x) {}


                    banner(
                        msg,
                        false
                    );

                    return;
                }


                banner(
                    `${name} deleted successfully.`,
                    true
                );


                await loadUsers();

            } catch (error) {

                console.error(error);

                banner(
                    'Could not delete user.',
                    false
                );
            }

        }
    );


    // =========================================================
    // GENERIC SEARCH
    // =========================================================

    const searchInputs =
        document.querySelectorAll(
            '.search-field input'
        );


    searchInputs.forEach(input => {

        // User search is handled separately

        if (
            ctx === 'users' &&
            input.id === 'userSearch'
        ) {
            return;
        }


        input.addEventListener(
            'input',
            (e) => {

                const query =
                    e.target.value
                        .toLowerCase()
                        .trim();


                const table =
                    document.querySelector(
                        'table tbody'
                    );


                if (!table) return;


                const rows =
                    table.querySelectorAll(
                        'tr'
                    );


                rows.forEach(row => {

                    row.style.display =
                        row.textContent
                            .toLowerCase()
                            .includes(query)
                            ? ''
                            : 'none';

                });

            }
        );

    });


    // =========================================================
    // IMAGE PREVIEW
    // =========================================================

    const imageInput =
        document.querySelector(
            'input[type="file"]#image'
        );


    const previewContainer =
        document.getElementById(
            'imagePreviewContainer'
        );


    const previewImg =
        document.getElementById(
            'imagePreview'
        );


    if (imageInput && previewImg) {

        imageInput.addEventListener(
            'change',
            function () {

                const file =
                    this.files[0];


                if (!file) return;


                if (
                    file.size >
                    4 * 1024 * 1024
                ) {

                    alert(
                        'Image is ' +
                        (
                            file.size /
                            1048576
                        ).toFixed(1) +
                        ' MB. Please choose an image under 4 MB.'
                    );


                    this.value =
                        '';


                    if (previewContainer) {

                        previewContainer.style.display =
                            'none';
                    }


                    return;
                }


                const reader =
                    new FileReader();


                reader.onload =
                    function (ev) {

                        previewImg.src =
                            ev.target.result;


                        if (previewContainer) {

                            previewContainer.style.display =
                                'block';
                        }
                    };


                reader.readAsDataURL(file);

            }
        );
    }


    // =========================================================
    // ADMIN PRODUCT FORM VALIDATION
    // =========================================================

    document
        .querySelectorAll(
            'form.admin-form'
        )
        .forEach(f => {

            f.addEventListener(
                'submit',
                (ev) => {

                    const priceInput =
                        f.querySelector(
                            '#price'
                        );


                    if (
                        priceInput &&
                        (
                            parseFloat(
                                priceInput.value
                            ) <= 0 ||
                            isNaN(
                                parseFloat(
                                    priceInput.value
                                )
                            )
                        )
                    ) {

                        ev.preventDefault();


                        alert(
                            'Regular price must be greater than 0.'
                        );


                        return;
                    }


                    const input =
                        f.querySelector(
                            'input[type="file"]#image'
                        );


                    if (
                        input &&
                        input.files[0] &&
                        input.files[0].size >
                        4 * 1024 * 1024
                    ) {

                        ev.preventDefault();


                        alert(
                            'Image exceeds the 4 MB limit. Please choose a smaller image.'
                        );
                    }

                }
            );

        });


    // =========================================================
    // CATEGORY FILTER
    // =========================================================

    const filter =
        document.getElementById(
            'categoryFilter'
        );


    if (filter) {

        filter.addEventListener(
            'change',
            () => {

                const cat =
                    filter.value;


                const catIdx =
                    ctx === 'inventory'
                        ? 2
                        : 1;


                document
                    .querySelectorAll(
                        'table tbody tr'
                    )
                    .forEach(row => {

                        const cells =
                            row.querySelectorAll(
                                'td'
                            );


                        const match =
                            cat === 'all' ||
                            (
                                cells[catIdx] &&
                                cells[catIdx]
                                    .textContent
                                    .trim() === cat
                            );


                        row.style.display =
                            match
                                ? ''
                                : 'none';

                    });

            }
        );
    }


    // =========================================================
    // INITIALIZE ALL ADMIN PAGES
    // =========================================================

    async function init() {

        // Edit product loads categories itself

        if (ctx !== 'edit') {

            await loadCategories();

        }


        // Product page

        loadProducts();


        // Edit product page

        loadEditProduct();


        // Category page

        loadCategoriesGrid();


        // Inventory page

        loadInventory();


        // Users page

        loadUsers();

    }
    init();


    document
        .querySelectorAll(
            '.btn-danger:not([data-delete]):not([data-del-cat]):not([data-delete-user]):not([data-inv-del]):not(#deleteProductBtn)'
        )
        .forEach(btn => {

            if (
                btn.closest('table') ||
                btn.closest('.category-card')
            ) {
                return;
            }


            btn.addEventListener(
                'click',
                () => {

                    if (
                        btn.tagName ===
                        'BUTTON'
                    ) {

                        const item =
                            btn.closest('tr') ||
                            btn.closest(
                                '.category-card'
                            );


                        if (
                            item &&
                            confirm(
                                'Are you sure you want to delete this item?'
                            )
                        ) {

                            item.style.transition =
                                'opacity 0.3s ease';


                            item.style.opacity =
                                '0';


                            setTimeout(
                                () =>
                                    item.remove(),
                                300
                            );
                        }

                    }

                }
            );

        });

});