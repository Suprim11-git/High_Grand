(function () {
    'use strict';

    // -------------------------------------------------------------
    // Path & Utility Helpers
    // -------------------------------------------------------------
    var isSubpage = window.location.pathname.includes('/pages/');
    var assetPrefix = isSubpage ? '../../assets/images/' : 'assets/images/';
    var productDetailBase = isSubpage ? 'product.html' : 'pages/product/product.html';
    var categoryShopBase = isSubpage ? 'category.html' : 'pages/product/category.html';

    function money(v) {
        return 'Rs. ' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getCategoryFallbackImage(name) {
        var n = (name || '').toLowerCase();
        if (n.includes('women')) return assetPrefix + 'womenwear.jpg';
        if (n.includes('men')) return assetPrefix + 'menwear.jpg';
        if (n.includes('shoe') || n.includes('footwear')) return assetPrefix + 'shoes.jpg';
        if (n.includes('perfume') || n.includes('fragrance')) return assetPrefix + 'perfume.jpg';
        if (n.includes('bag') || n.includes('leather')) return assetPrefix + 'category_bag.jpg';
        if (n.includes('accessor')) return assetPrefix + 'accessories.jpg';
        return assetPrefix + 'womenwear.jpg';
    }

    function urlParam(name) {
        return new URLSearchParams(window.location.search).get(name);
    }

    // -------------------------------------------------------------
    // Mobile menu toggle
    // -------------------------------------------------------------
    var menuBtn = document.querySelector('.mobile-menu-btn');
    var mobileNav = document.querySelector('.mobile-nav');

    if (menuBtn && mobileNav) {
        menuBtn.addEventListener('click', function () {
            var isOpen = mobileNav.classList.toggle('open');
            menuBtn.setAttribute('aria-expanded', isOpen);
        });
    }

    // -------------------------------------------------------------
    // Newsletter form placeholder
    // -------------------------------------------------------------
    var newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var input = newsletterForm.querySelector('input[type="email"]');
            if (input && input.value.trim()) {
                alert('Thank you for subscribing! Email notifications will be sent to ' + input.value.trim() + '.');
                input.value = '';
            }
        });
    }

    // -------------------------------------------------------------
    // Global Categories & Products Cache
    // -------------------------------------------------------------
    var categoryMap = {};
    var allCategories = [];
    var allProducts = [];

    async function fetchCategories() {
        try {
            var res = await fetch('/api/categories');
            if (!res.ok) return [];
            var cats = await res.json();
            if (Array.isArray(cats)) {
                allCategories = cats;
                cats.forEach(function (c) {
                    categoryMap[c.id] = c.name;
                });
            }
            return allCategories;
        } catch (e) {
            return [];
        }
    }

    async function fetchProducts() {
        try {
            var res = await fetch('/api/products');
            if (!res.ok) return [];
            var prods = await res.json();
            if (Array.isArray(prods)) {
                // Filter only Active products for storefront
                allProducts = prods.filter(function (p) {
                    return !p.status || p.status.toLowerCase() === 'active';
                });
            }
            return allProducts;
        } catch (e) {
            return [];
        }
    }

    // -------------------------------------------------------------
    // Render Category Cards (Home.html & category.html)
    // -------------------------------------------------------------
    function renderCategoryCards(categories) {
        var grid = document.querySelector('.category-grid');
        if (!grid) return;

        if (!categories || categories.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--color-text-muted); padding: 2rem 0;">No categories available yet. Create categories from the Admin Panel.</p>';
            return;
        }

        grid.innerHTML = categories.map(function (c) {
            var img = c.hasImage ? '/api/categories/' + c.id + '/image' : getCategoryFallbackImage(c.name);
            var link = categoryShopBase + '?category=' + encodeURIComponent(c.name);
            return '<a href="' + link + '" class="category-card">' +
                '<img src="' + img + '" alt="' + escapeHtml(c.name) + '">' +
                '<div class="category-overlay">' +
                '<h3>' + escapeHtml(c.name) + '</h3>' +
                '<span>Explore <i class="fas fa-arrow-right"></i></span>' +
                '</div>' +
                '</a>';
        }).join('');
    }

    // -------------------------------------------------------------
    // Favorites / Wishlist Management
    // -------------------------------------------------------------
    var FAV_STORAGE_KEY = 'highgrand_favorites';

    function getFavorites() {
        try {
            var raw = localStorage.getItem(FAV_STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function saveFavorites(ids) {
        try {
            localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(ids));
        } catch (e) {}
        updateFavoriteBadges();
    }

    function isFavorite(id) {
        if (id == null) return false;
        var favs = getFavorites();
        return favs.indexOf(Number(id)) !== -1;
    }

    function toggleFavorite(id) {
        var numId = Number(id);
        var favs = getFavorites();
        var idx = favs.indexOf(numId);
        var added = false;
        if (idx === -1) {
            favs.push(numId);
            added = true;
        } else {
            favs.splice(idx, 1);
            added = false;
        }
        saveFavorites(favs);
        return added;
    }

    function updateFavoriteBadges() {
        var count = getFavorites().length;
        document.querySelectorAll('.fav-badge').forEach(function (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'inline-flex';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    // -------------------------------------------------------------
    // Render Product Cards (Home.html, category.html, collection.html)
    // -------------------------------------------------------------
    function buildProductCard(p) {
        var catName = categoryMap[p.categoryId] || 'Collection';
        var img = p.hasImage ? '/api/products/' + p.id + '/image' : assetPrefix + 'logo.png';
        var detailLink = productDetailBase + '?id=' + p.id;
        var isOnSale = p.originalPrice && Number(p.originalPrice) > Number(p.price);
        var fav = isFavorite(p.id);

        return '<article class="product-card" data-category="' + p.categoryId + '" data-category-name="' + escapeHtml(catName.toLowerCase()) + '">' +
            '<div class="product-image">' +
            '<a href="' + detailLink + '">' +
            '<img src="' + img + '" alt="' + escapeHtml(p.name) + '">' +
            '</a>' +
            (isOnSale ? '<span class="badge badge-sale">Sale</span>' : '') +
            '<button class="wishlist-btn' + (fav ? ' active' : '') + '" type="button" aria-label="Add to wishlist" data-wishlist-id="' + p.id + '">' +
            '<i class="' + (fav ? 'fas' : 'far') + ' fa-heart"></i>' +
            '</button>' +
            '<div class="product-quick-actions">' +
            '<a href="' + detailLink + '" class="quick-btn" title="View details"><i class="fas fa-eye"></i></a>' +
            '<button class="quick-btn" type="button" title="Add to cart" data-add-cart="' + p.id + '"><i class="fas fa-shopping-bag"></i></button>' +
            '</div>' +
            '</div>' +
            '<div class="product-info">' +
            '<span class="product-category">' + escapeHtml(catName) + '</span>' +
            '<h3><a href="' + detailLink + '">' + escapeHtml(p.name) + '</a></h3>' +
            '<div class="product-meta">' +
            '<div class="price">' +
            '<span class="price-current">' + money(p.price) + '</span>' +
            (isOnSale ? '<span class="price-original">' + money(p.originalPrice) + '</span>' : '') +
            '</div>' +
            (p.stock <= 0 ? '<span style="font-size:0.75rem;color:var(--color-sale);font-weight:600;">Out of stock</span>' : '') +
            '</div>' +
            '</div>' +
            '</article>';
    }

    function renderProductsGrid(products, targetGrid) {
        var grid = targetGrid || document.querySelector('.product-grid');
        if (!grid) return;

        if (!products || products.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--color-text-muted);">' +
                '<i class="fas fa-box-open" style="font-size: 2.5rem; margin-bottom: 0.75rem; opacity: 0.5;"></i>' +
                '<p>No products available in this selection yet.<br>Products added from the Admin Panel will appear here.</p>' +
                '</div>';
            return;
        }

        grid.innerHTML = products.map(buildProductCard).join('');

        // Attach quick-action listeners
        grid.querySelectorAll('.wishlist-btn, .quick-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                var cartId = btn.getAttribute('data-add-cart');
                var favId = btn.getAttribute('data-wishlist-id');

                if (cartId) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = isSubpage ? '../cart/cart.html?added=' + cartId : 'pages/cart/cart.html?added=' + cartId;
                } else if (favId) {
                    e.preventDefault();
                    e.stopPropagation();
                    var isNowFav = toggleFavorite(favId);
                    btn.classList.toggle('active', isNowFav);
                    var icon = btn.querySelector('i');
                    if (icon) {
                        icon.className = (isNowFav ? 'fas' : 'far') + ' fa-heart';
                    }
                    if (document.getElementById('favoritesGrid')) {
                        renderFavoritesPage();
                    }
                }
            });
        });
    }

    // -------------------------------------------------------------
    // Filter Bar Setup & Interaction
    // -------------------------------------------------------------
    function setupFilterBar(categories, onFilterChange) {
        var filterBar = document.querySelector('.filter-bar');
        if (!filterBar) return;

        var chipsHtml = '<button class="filter-chip active" data-filter="all">All</button>';
        categories.forEach(function (c) {
            chipsHtml += '<button class="filter-chip" data-filter="' + c.id + '" data-category-name="' + escapeHtml(c.name.toLowerCase()) + '">' + escapeHtml(c.name) + '</button>';
        });
        filterBar.innerHTML = chipsHtml;

        var chips = filterBar.querySelectorAll('.filter-chip');
        chips.forEach(function (chip) {
            chip.addEventListener('click', function () {
                chips.forEach(function (c) { c.classList.remove('active'); });
                chip.classList.add('active');
                var filterVal = chip.getAttribute('data-filter');
                if (onFilterChange) onFilterChange(filterVal);
            });
        });
    }

    function filterProducts(filterVal, searchQuery) {
        return allProducts.filter(function (p) {
            var matchesCategory = true;
            if (filterVal && filterVal !== 'all') {
                matchesCategory = String(p.categoryId) === String(filterVal);
            }

            var matchesSearch = true;
            if (searchQuery) {
                var q = searchQuery.toLowerCase().trim();
                var pName = (p.name || '').toLowerCase();
                var pDesc = (p.description || '').toLowerCase();
                var pSku = (p.sku || '').toLowerCase();
                matchesSearch = pName.includes(q) || pDesc.includes(q) || pSku.includes(q);
            }

            return matchesCategory && matchesSearch;
        });
    }

    // -------------------------------------------------------------
    // Product Details Page (product.html) Dynamic Loader
    // -------------------------------------------------------------
    async function loadProductDetails() {
        var detailContainer = document.getElementById('productDetailContainer');
        var notFoundContainer = document.getElementById('productNotFound');
        if (!detailContainer) return;

        var id = urlParam('id');
        if (!id) {
            detailContainer.style.display = 'none';
            if (notFoundContainer) notFoundContainer.style.display = 'block';
            return;
        }

        try {
            var res = await fetch('/api/products/' + id);
            if (!res.ok) {
                detailContainer.style.display = 'none';
                if (notFoundContainer) notFoundContainer.style.display = 'block';
                return;
            }

            var p = await res.json();
            var catName = categoryMap[p.categoryId] || 'Collection';

            // Title & Breadcrumb
            document.title = p.name + ' | High Grand';
            var breadcrumbCat = document.getElementById('breadcrumbCategory');
            var breadcrumbTitle = document.getElementById('breadcrumbTitle');
            if (breadcrumbCat) breadcrumbCat.textContent = catName;
            if (breadcrumbTitle) breadcrumbTitle.textContent = p.name;

            // Image
            var imgEl = document.getElementById('productImage');
            if (imgEl) {
                imgEl.src = p.hasImage ? '/api/products/' + p.id + '/image' : assetPrefix + 'logo.png';
                imgEl.alt = p.name;
            }

            // Info
            var catEl = document.getElementById('productCategory');
            if (catEl) catEl.textContent = catName;

            var titleEl = document.getElementById('productTitle');
            if (titleEl) titleEl.textContent = p.name;

            // Price & Sale Price
            var priceEl = document.getElementById('productPrice');
            if (priceEl) priceEl.textContent = money(p.price);

            var origPriceEl = document.getElementById('productOriginalPrice');
            if (origPriceEl) {
                if (p.originalPrice && Number(p.originalPrice) > Number(p.price)) {
                    origPriceEl.textContent = money(p.originalPrice);
                    origPriceEl.style.display = 'inline';
                } else {
                    origPriceEl.style.display = 'none';
                }
            }

            // Stock badge
            var stockBadge = document.getElementById('productStockBadge');
            var addBtn = document.getElementById('addToCartBtn');
            var buyBtn = document.getElementById('buyNowBtn');

            if (stockBadge) {
                if (p.stock <= 0) {
                    stockBadge.innerHTML = '<span style="color: var(--color-sale);"><i class="fas fa-circle-xmark"></i> Out of Stock</span>';
                    if (addBtn) addBtn.disabled = true;
                    if (buyBtn) buyBtn.classList.add('disabled');
                } else if (p.stock <= (p.minStock || 5)) {
                    stockBadge.innerHTML = '<span style="color: #b8860b;"><i class="fas fa-triangle-exclamation"></i> Low Stock (' + p.stock + ' left)</span>';
                } else {
                    stockBadge.innerHTML = '<span style="color: #1e7d43;"><i class="fas fa-circle-check"></i> In Stock (' + p.stock + ' available)</span>';
                }
            }

            // Description & SKU
            var descEl = document.getElementById('productDescription');
            if (descEl) descEl.textContent = p.description || 'No description provided for this product.';

            var skuEl = document.getElementById('productSku');
            if (skuEl) skuEl.textContent = p.sku || 'N/A';

            var idInput = document.getElementById('formProductId');
            if (idInput) idInput.value = p.id;

            // Detail page wishlist button
            var detailFavBtn = document.getElementById('detailWishlistBtn');
            if (detailFavBtn) {
                var isFav = isFavorite(p.id);
                detailFavBtn.classList.toggle('active', isFav);
                var favIcon = detailFavBtn.querySelector('i');
                if (favIcon) favIcon.className = (isFav ? 'fas' : 'far') + ' fa-heart';

                detailFavBtn.onclick = function (e) {
                    e.preventDefault();
                    var added = toggleFavorite(p.id);
                    detailFavBtn.classList.toggle('active', added);
                    if (favIcon) favIcon.className = (added ? 'fas' : 'far') + ' fa-heart';
                };
            }

            detailContainer.style.display = 'grid';
            if (notFoundContainer) notFoundContainer.style.display = 'none';

        } catch (e) {
            detailContainer.style.display = 'none';
            if (notFoundContainer) notFoundContainer.style.display = 'block';
        }
    }

    // -------------------------------------------------------------
    // Favorites Page Renderer (favorites.html)
    // -------------------------------------------------------------
    function renderFavoritesPage() {
        var grid = document.getElementById('favoritesGrid');
        var empty = document.getElementById('favoritesEmpty');
        var countEl = document.getElementById('favoritesCount');
        var clearBtn = document.getElementById('clearFavoritesBtn');
        if (!grid) return;

        var favIds = getFavorites();
        var favProducts = allProducts.filter(function (p) {
            return favIds.indexOf(Number(p.id)) !== -1;
        });

        if (favProducts.length === 0) {
            grid.innerHTML = '';
            grid.style.display = 'none';
            if (empty) empty.style.display = 'block';
            if (countEl) countEl.textContent = '0 items saved';
            if (clearBtn) clearBtn.style.display = 'none';
        } else {
            if (empty) empty.style.display = 'none';
            grid.style.display = 'grid';
            renderProductsGrid(favProducts, grid);
            if (countEl) countEl.textContent = favProducts.length + ' item' + (favProducts.length === 1 ? '' : 's') + ' saved';
            if (clearBtn) {
                clearBtn.style.display = 'inline-flex';
                clearBtn.onclick = function () {
                    if (confirm('Are you sure you want to remove all items from your favorites?')) {
                        saveFavorites([]);
                        renderFavoritesPage();
                    }
                };
            }
        }
    }

    // -------------------------------------------------------------
    // Page Initializer
    // -------------------------------------------------------------
    document.addEventListener('DOMContentLoaded', async function () {
        // Update favorite badges in header immediately
        updateFavoriteBadges();

        // Fetch baseline categories & products
        await fetchCategories();
        await fetchProducts();

        // Check if on Favorites page
        if (document.getElementById('favoritesGrid')) {
            renderFavoritesPage();
            return;
        }

        // 1. Render Categories grid (if present on Home.html or category.html)
        renderCategoryCards(allCategories);

        // 2. Product Details page initialization
        if (document.getElementById('productDetailContainer')) {
            await loadProductDetails();
            return;
        }

        // 3. Category / Shop page catalog & Home page featured grid
        var currentFilter = 'all';
        var searchQuery = urlParam('q') || '';
        var categoryParam = urlParam('category') || '';

        // If URL has ?category=..., match to category ID
        if (categoryParam) {
            var matchedCat = allCategories.find(function (c) {
                return c.name.toLowerCase() === categoryParam.toLowerCase() ||
                    c.slug.toLowerCase() === categoryParam.toLowerCase();
            });
            if (matchedCat) {
                currentFilter = matchedCat.id;
            }
        }

        // Setup filter bar
        setupFilterBar(allCategories, function (selectedFilter) {
            currentFilter = selectedFilter;
            var filtered = filterProducts(currentFilter, searchQuery);
            renderProductsGrid(filtered);
            updateToolbarCount(filtered.length);
        });

        // Set initial active chip if categoryParam was given
        if (currentFilter !== 'all') {
            var filterBar = document.querySelector('.filter-bar');
            if (filterBar) {
                var chips = filterBar.querySelectorAll('.filter-chip');
                chips.forEach(function (c) {
                    if (c.getAttribute('data-filter') === String(currentFilter)) {
                        chips.forEach(function (x) { x.classList.remove('active'); });
                        c.classList.add('active');
                    }
                });
            }
        }

        // Initial product grid render
        var initialList = filterProducts(currentFilter, searchQuery);
        renderProductsGrid(initialList);
        updateToolbarCount(initialList.length);

        function updateToolbarCount(count) {
            var countEl = document.getElementById('catalogProductCount');
            if (countEl) {
                countEl.textContent = 'Showing ' + count + ' product' + (count === 1 ? '' : 's');
            }
        }
    });

})();

