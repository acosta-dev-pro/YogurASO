/**
 * cart.js — Carrito
 * Los items se guardan en localStorage (clave yogur_cart).
 * El botón de compra arma un texto y abre WhatsApp; el servidor no guarda el pedido.
 */
(function () {
    const STORAGE_KEY = 'yogur_cart';

    function utils() {
        return window.YogurUtils || {};
    }

    function escapeHtml(v) {
        return utils().escapeHtml ? utils().escapeHtml(v) : String(v ?? '');
    }

    function formatCOP(n) {
        return utils().formatCOP ? utils().formatCOP(n) : `$${Number(n || 0).toLocaleString('es-CO')}`;
    }

    function getConfig() {
        return utils().getConfig ? utils().getConfig() : (window.YOGUR_CONFIG || {});
    }

    function showToast(message, type = 'success') {
        // Sin avisos flotantes al agregar o quitar: el contador del header late (cart-fx.js).
        if (type === 'success' || type === 'info') return;
        if (utils().showToast) utils().showToast(message, type);
    }

    function loadCartFx() {
        if (window.CartFx || document.getElementById('cart-fx-js')) return;
        const script = document.querySelector("script[src*='cart.js']");
        const base = (script ? script.getAttribute('src') : 'js/cart.js').replace(/js\/cart\.js(\?.*)?$/, '');
        const css = document.createElement('link');
        css.id = 'cart-fx-css';
        css.rel = 'stylesheet';
        css.href = base + 'css/cart-fx.css';
        document.head.appendChild(css);
        const js = document.createElement('script');
        js.id = 'cart-fx-js';
        js.src = base + 'js/cart-fx.js';
        js.defer = true;
        document.head.appendChild(js);
    }
    loadCartFx();

    function askConfirm(opts) {
        if (window.CartFx && window.CartFx.confirm) return window.CartFx.confirm(opts);
        if (utils().confirmAction) {
            return utils().confirmAction({
                title: opts.title,
                message: opts.name || '',
                confirmText: opts.confirmText || 'Quitar',
                cancelText: 'Cancelar',
                danger: true
            });
        }
        return Promise.resolve(window.confirm(opts.title + (opts.name ? ' ' + opts.name : '')));
    }

    let carrito = loadCart();

    function sanitizeCartItem(item) {
        if (!item || item.id == null) return null;
        const cantidad = Number(item.cantidad);
        const precio = Number(item.precio);
        if (!Number.isFinite(cantidad) || cantidad <= 0) return null;
        if (!Number.isFinite(precio) || precio < 0) return null;
        return {
            id: item.id,
            nombre: String(item.nombre || 'Producto'),
            precio,
            cantidad,
            imagen: item.imagen || item.imagen_url || '',
            stock: Number.isFinite(Number(item.stock)) ? Number(item.stock) : null,
            tamano: item.tamano || item.presentacion || ''
        };
    }

    function loadCart() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return [];
            const raw = JSON.parse(stored);
            if (!Array.isArray(raw)) {
                localStorage.removeItem(STORAGE_KEY);
                return [];
            }
            const clean = raw.map(sanitizeCartItem).filter(Boolean);
            if (clean.length !== raw.length) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
            }
            return clean;
        } catch {
            localStorage.removeItem(STORAGE_KEY);
            return [];
        }
    }

    function syncFromStorage() {
        carrito = loadCart();
        return carrito;
    }

    function guardarCarrito() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
        window.dispatchEvent(new CustomEvent('yogur:cart-updated'));
    }

    function pulseBadge() {
        if (window.CartFx && window.CartFx.pulse) { window.CartFx.pulse(); return; }
        const contador = document.getElementById('cart-count');
        const btn = document.getElementById('cartBtn');
        if (contador) {
            contador.classList.remove('badge-bounce');
            void contador.offsetWidth;
            contador.classList.add('badge-bounce');
        }
        if (btn) {
            btn.classList.remove('cart-btn-pulse');
            void btn.offsetWidth;
            btn.classList.add('cart-btn-pulse');
        }
    }

    function updateCounter() {
        syncFromStorage();
        const contador = document.getElementById('cart-count');
        if (!contador) return;
        const totalItems = carrito.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
        contador.textContent = String(totalItems);
        contador.hidden = totalItems === 0;
        contador.setAttribute('aria-label', `${totalItems} productos en el carrito`);
    }

    function getCartTotal(items) {
        return items.reduce((acc, item) => acc + Number(item.precio) * Number(item.cantidad), 0);
    }

    function clampQty(item, cantidad) {
        const next = Number(cantidad);
        if (!Number.isFinite(next) || next <= 0) return 0;
        const stock = Number(item.stock);
        if (Number.isFinite(stock) && stock >= 0) return Math.min(next, stock);
        return next;
    }

    function productsHref() {
        return window.location.pathname.includes('/pages/') ? 'productos.html' : 'pages/productos.html';
    }

    function emptyCartHTML(compact) {
        const href = productsHref();
        return `
            <div class="cart-empty-state${compact ? ' is-compact' : ''}">
                <div class="cart-empty-icon" aria-hidden="true">${compact ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18"/><path d="M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25"/><circle cx="18" cy="20" r="2"/><circle cx="8" cy="20" r="2"/></svg>' : '<i class="fas fa-shopping-bag"></i>'}</div>
                <p class="cart-empty-title">Tu carrito está vacío</p>
                <p class="cart-empty-text">${compact
                    ? 'Elige tus sabores y arma tu pedido en segundos.'
                    : 'Aún no agregaste yogures. Explora el catálogo y arma tu pedido.'}</p>
                <a class="cart-empty-cta" href="${href}">${compact ? "Ver sabores" : "Ver productos"}</a>
            </div>`;
    }

    function ensureTicketCss() {
        if (document.getElementById("cart-ticket-css")) return;
        const link = document.createElement("link");
        link.id = "cart-ticket-css";
        link.rel = "stylesheet";
        const script = document.querySelector("script[src*='cart.js']");
        const src = script ? script.getAttribute("src") : "js/cart.js";
        link.href = src.replace(/js\/cart\.js(\\?.*)?$/, "css/cart-ticket.css");
        document.head.appendChild(link);
    }

    function dressTicketShell() {
        ensureTicketCss();
        const sidebar = document.getElementById("cartSidebar");
        if (!sidebar || sidebar.dataset.ticket === "1") return;
        const header = sidebar.querySelector(".cart-header");
        const items = document.getElementById("cart-sidebar-items");
        const total = sidebar.querySelector(".cart-total");
        if (!header || !items || !total) return;

        sidebar.dataset.ticket = "1";
        sidebar.classList.add("cart-ticket");

        const sheet = document.createElement("div");
        sheet.className = "cart-sheet";

        const brand = document.createElement("div");
        brand.className = "cart-sheet-brand";
        const loc = String(getConfig().COMPANY_LOCATION || "").trim();
        const tag = loc ? "Yogurt artesanal · " + loc : "Yogurt artesanal";
        brand.innerHTML = '<div class="cart-sheet-logo">YogurASO</div><p>' + escapeHtml(tag) + "</p>";

        const cutTop = document.createElement("div");
        cutTop.className = "cart-cut";
        cutTop.setAttribute("aria-hidden", "true");

        const bottom = document.createElement("div");
        bottom.className = "cart-sheet-bottom";
        const cutBot = document.createElement("div");
        cutBot.className = "cart-cut";
        cutBot.setAttribute("aria-hidden", "true");

        total.classList.add("cart-ticket-sum");
        total.innerHTML = [
            '<div class="cart-subline"><span id="cartSubLabel">Subtotal</span><span class="num" id="cartSubAmount">$0</span></div>',
            '<div class="cart-grand"><span>TOTAL</span><span class="num" id="cartTotalAmount">$0</span></div>',
            '<div class="cart-barcode-wrap" id="cartBarcode" aria-hidden="true"></div>',
            '<p class="cart-order-code" id="cartOrderCode"></p>'
        ].join("");
        bottom.append(cutBot, total);

        header.after(sheet);
        sheet.append(brand, cutTop, items, bottom);

        const foot = document.createElement("div");
        foot.className = "cart-ticket-foot";
        sheet.after(foot);
        const clearBtn = document.getElementById("btn-clear-cart-sidebar");
        const checkout = document.getElementById("checkoutBtn");
        if (clearBtn) { clearBtn.textContent = "Vaciar"; foot.append(clearBtn); }
        if (checkout) foot.append(checkout);

        const span = header.querySelector("span");
        if (span) {
            span.className = "cart-ticket-headcopy";
            span.innerHTML = '<span class="cart-ticket-title">Carrito</span><span class="cart-ticket-sub" id="cartTicketSub"></span>';
        }
    }

    function flavorStyle(item) {
        const name = String(item.nombre || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const map = [
            ["fresa", "--bg-fresa", "--fondo-claro-fresa", "#9E2530"],
            ["guanabana", "--bg-guanabana", "--fondo-claro-guanabana", "#356628"],
            ["mango", "--bg-mango", "--fondo-claro-mango", "#A85A06"],
            ["pina", "--bg-pina", "--fondo-claro-pina", "#8A6408"],
            ["mora", "--bg-mora", "--fondo-claro-mora", "#6A2A56"],
            ["melocoton", "--bg-melocoton", "--fondo-claro-melocoton", "#A34A16"],
            ["durazno", "--bg-melocoton", "--fondo-claro-melocoton", "#A34A16"],
            ["frutos", "--bg-frutos-rojos", "--fondo-claro-frutos-rojos", "#8E243E"],
            ["cafe", "--bg-cafe", "--fondo-claro-cafe", "#5C382C"]
        ];
        for (let i = 0; i < map.length; i++) {
            if (name.includes(map[i][0])) {
                return { line: "var(" + map[i][1] + ")", wash: "var(" + map[i][2] + ")", ink: map[i][3] };
            }
        }
        return { line: "var(--rojo-marca)", wash: "#F6F1EA", ink: "#1F1B1A" };
    }

    function syncTicketMeta(items) {
        const units = items.reduce((n, i) => n + Number(i.cantidad || 0), 0);
        const total = getCartTotal(items);
        const sub = document.getElementById("cartTicketSub");
        if (sub) sub.textContent = units ? units + (units === 1 ? " producto" : " productos") : "Sin productos";
        const label = document.getElementById("cartSubLabel");
        if (label) label.textContent = units ? "Subtotal (" + units + (units === 1 ? " ud." : " uds.") + ")" : "Subtotal";
        const subAmt = document.getElementById("cartSubAmount");
        if (subAmt) subAmt.textContent = formatCOP(total);
        const totalEl = document.getElementById("cartTotalAmount");
        if (totalEl) totalEl.textContent = formatCOP(total);
        paintBarcode(items);
    }

    function orderCode(items) {
        const raw = items.map((i) => [i.id, i.cantidad, i.precio].join(":")).join("|") || "vacio";
        let h = 2166136261;
        for (let i = 0; i < raw.length; i++) {
            h ^= raw.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return "YG-" + String(h >>> 0).padStart(10, "0").slice(-8);
    }

    function barcodeSvg(code) {
        const bits = [1, 1, 0, 1];
        const s = String(code);
        for (let i = 0; i < s.length; i++) {
            const c = s.charCodeAt(i);
            for (let b = 0; b < 6; b++) bits.push((c >> b) & 1);
            bits.push(i % 2 ? 0 : 1, 0);
        }
        bits.push(1, 0, 1, 1);
        const w = 1.35;
        const rects = [];
        let run = 0;
        let start = 0;
        for (let i = 0; i < bits.length; i++) {
            if (bits[i]) {
                if (!run) start = i;
                run++;
            } else if (run) {
                rects.push([start, run]);
                run = 0;
            }
        }
        if (run) rects.push([start, run]);
        const width = bits.length * w;
        const bars = rects.map(([sx, len]) =>
            '<rect x="' + (sx * w).toFixed(2) + '" y="0" width="' + Math.max(0.8, len * w - 0.25).toFixed(2) + '" height="34"/>'
        ).join("");
        return '<svg class="cart-barcode" viewBox="0 0 ' + width.toFixed(2) + ' 34" preserveAspectRatio="none" role="img" aria-label="Codigo ' + escapeHtml(code) + '">' + bars + "</svg>";
    }

    function paintBarcode(items) {
        const host = document.getElementById("cartBarcode");
        const label = document.getElementById("cartOrderCode");
        if (!host || !label) return;
        if (!items.length) {
            host.innerHTML = "";
            label.textContent = "";
            return;
        }
        const code = orderCode(items);
        host.innerHTML = barcodeSvg(code);
        label.textContent = code;
    }

    function smallBottle(item) {
        const src = String(item.imagen || "");
        if (!src) return "";
        if (/-sm\.webp($|\?)/i.test(src)) return src;
        return src.replace(/-500ml\.webp/i, "-500ml-sm.webp");
    }

    function syncFlavorShots(root) {
        const scope = root || document.getElementById("cart-sidebar-items");
        if (!scope) return;
        scope.querySelectorAll(".cart-chip").forEach((chip) => {
            const on = chip.querySelector(".cart-item-check")?.checked;
            chip.classList.toggle("is-selected", Boolean(on));
        });
    }

    function renderSidebar() {
        dressTicketShell();
        const container = document.getElementById("cart-sidebar-items");
        if (!container) return;

        const items = syncFromStorage();
        container._checkedIds = new Set(
            [...container.querySelectorAll(".cart-item-check:checked")].map((box) => String(box.dataset.id))
        );
        const clearBtn = document.getElementById("btn-clear-cart-sidebar");
        if (clearBtn) clearBtn.hidden = items.length === 0;
        const sidebar = document.getElementById("cartSidebar");
        if (sidebar) sidebar.classList.toggle("is-empty", items.length === 0);

        if (items.length === 0) {
            container.innerHTML = emptyCartHTML(true);
            syncTicketMeta([]);
            return;
        }

        container.innerHTML = `
            <div class="cart-select-bar">
                <label class="cart-select-all">
                    <input type="checkbox" data-action="toggle-all" aria-label="Seleccionar todos">
                    <span>Todos</span>
                </label>
                <button type="button" class="cart-remove-selected" data-action="remove-selected" disabled>Eliminar</button>
            </div>
            ${items.map((item) => {
            const tone = flavorStyle(item);
            const meta = productMeta(item);
            const line = Number(item.precio) * Number(item.cantidad);
            const detail = [meta.size, formatCOP(item.precio) + " c/u"].filter(Boolean).join(" · ");
            const shot = smallBottle(item);
            if (shot) {
                const pre = new Image();
                pre.src = shot;
            }
            const shotHtml = shot
                ? `<span class="cart-flavor-shot" aria-hidden="true"><img src="${escapeHtml(shot)}" alt="" decoding="sync"></span>`
                : "";
            return `
            <article class="cart-chip" data-id="${escapeHtml(item.id)}" style="--chip-line:${tone.line};--chip-wash:${tone.wash};--chip-ink:${tone.ink}">
                <label class="cart-pick">
                    <input type="checkbox" class="cart-item-check" data-id="${escapeHtml(item.id)}" aria-label="Seleccionar ${escapeHtml(meta.name)}">
                </label>
                <div class="cart-chip-top">
                    <div class="cart-chip-lead">
                        ${shotHtml}
                        <div>
                        <div class="cart-chip-name">${escapeHtml(meta.name)}</div>
                        <div class="cart-chip-meta">${escapeHtml(detail)}</div>
                        </div>
                    </div>
                    <button type="button" class="cart-chip-x" data-action="remove" data-id="${escapeHtml(item.id)}" aria-label="Quitar ${escapeHtml(meta.name)}">×</button>
                </div>
                <div class="cart-chip-bot">
                    <div class="cart-chip-step">
                        <button type="button" class="cart-qty-btn" data-action="qty" data-id="${escapeHtml(item.id)}" data-delta="-1" aria-label="Disminuir cantidad">−</button>
                        <span class="cart-item-qty" aria-label="Cantidad">${escapeHtml(item.cantidad)}</span>
                        <button type="button" class="cart-qty-btn" data-action="qty" data-id="${escapeHtml(item.id)}" data-delta="1" aria-label="Aumentar cantidad">+</button>
                    </div>
                    <span class="cart-chip-price num">${formatCOP(line)}</span>
                </div>
            </article>`;
        }).join("")}`;

        const kept = container._checkedIds;
        if (kept && kept.size) {
            container.querySelectorAll(".cart-item-check").forEach((box) => {
                if (kept.has(String(box.dataset.id))) box.checked = true;
            });
        }
        syncFlavorShots(container);
        syncSelectToolbar(container);
        syncTicketMeta(items);
    }

    function setQuantity(id, cantidad) {
        syncFromStorage();
        const idx = carrito.findIndex((i) => String(i.id) === String(id));
        if (idx === -1) return;

        const prev = Number(carrito[idx].cantidad);
        const next = clampQty(carrito[idx], cantidad);
        if (next <= 0) {
            removeItemConfirm(id);
            return;
        }
        if (Number.isFinite(Number(carrito[idx].stock)) && next >= Number(carrito[idx].stock) && cantidad > prev) {
            showToast('Stock máximo alcanzado', 'warning');
        }
        carrito[idx].cantidad = next;

        guardarCarrito();
        updateCounter();
        renderSidebar();
    }

    function changeQuantity(id, delta) {
        syncFromStorage();
        const item = carrito.find((i) => String(i.id) === String(id));
        if (!item) return;
        setQuantity(id, Number(item.cantidad) + Number(delta));
    }

    function removeItem(id) {
        syncFromStorage();
        carrito = carrito.filter((i) => String(i.id) !== String(id));
        guardarCarrito();
        updateCounter();
        renderSidebar();
        pulseBadge();
    }

    async function removeItemConfirm(id) {
        syncFromStorage();
        const item = carrito.find((i) => String(i.id) === String(id));
        const meta = item ? productMeta(item) : { name: 'este producto', size: '' };
        const ok = await askConfirm({
            name: [meta.name, meta.size].filter(Boolean).join(' · '),
            title: '¿Quitar del carrito?',
            confirmText: 'Quitar'
        });
        if (!ok) return;
        removeItem(id);
    }

    function syncSelectToolbar(root) {
        const scope = root || document;
        const checks = [...scope.querySelectorAll('.cart-item-check')];
        const selected = checks.filter((c) => c.checked);
        const toggleAll = scope.querySelector('[data-action="toggle-all"]');
        const removeBtn = scope.querySelector('[data-action="remove-selected"]');
        if (toggleAll) {
            toggleAll.checked = checks.length > 0 && selected.length === checks.length;
            toggleAll.indeterminate = selected.length > 0 && selected.length < checks.length;
        }
        if (removeBtn) {
            removeBtn.disabled = selected.length === 0;
            removeBtn.textContent = selected.length > 0
                ? `Eliminar (${selected.length})`
                : 'Eliminar';
        }
    }

    async function removeSelectedConfirm(root) {
        const scope = root || document.getElementById('cart-sidebar-items') || document;
        const ids = [...scope.querySelectorAll('.cart-item-check:checked')].map((c) => c.dataset.id);
        if (!ids.length) {
            showToast('Selecciona al menos un producto', 'warning');
            return;
        }
        const ok = await askConfirm({
            name: `${ids.length} producto${ids.length === 1 ? '' : 's'} seleccionado${ids.length === 1 ? '' : 's'}`,
            title: '¿Quitar del carrito?',
            confirmText: 'Quitar'
        });
        if (!ok) return;
        syncFromStorage();
        const set = new Set(ids.map(String));
        carrito = carrito.filter((i) => !set.has(String(i.id)));
        guardarCarrito();
        updateCounter();
        renderSidebar();
        pulseBadge();
    }

    function addToCart(producto) {
        if (!producto || producto.id == null) return;

        syncFromStorage();
        const stock = Number(producto.stock);
        const qtyAdd = Math.max(1, Number(producto.cantidad) || 1);
        const lineId = producto.lineId || producto.id;
        const label = producto.tamano
            ? `${producto.nombre} · ${producto.tamano}`
            : producto.nombre;
        const existe = carrito.find((item) => String(item.id) === String(lineId));

        if (existe) {
            const next = Number(existe.cantidad) + qtyAdd;
            if (Number.isFinite(stock) && stock >= 0 && next > stock) {
                showToast('No hay más stock disponible', 'warning');
                return;
            }
            existe.cantidad = next;
            existe.precio = Number(producto.precio) || existe.precio;
            if (Number.isFinite(stock)) existe.stock = stock;
        } else {
            if (Number.isFinite(stock) && stock <= 0) {
                showToast('Producto sin stock', 'error');
                return;
            }
            carrito.push({
                id: lineId,
                nombre: label,
                precio: Number(producto.precio),
                imagen: producto.imagen_url || producto.imagen || '',
                stock: Number.isFinite(stock) ? stock : null,
                cantidad: qtyAdd,
                tamano: producto.tamano || ''
            });
        }

        guardarCarrito();
        updateCounter();
        renderSidebar();
        if (window.CartFx && window.CartFx.fly) window.CartFx.fly(producto);
        else pulseBadge();
    }

    function getCart() {
        return syncFromStorage().map((item) => ({ ...item }));
    }

    function clearCart() {
        localStorage.removeItem(STORAGE_KEY);
        carrito = [];
        updateCounter();
        renderSidebar();
        window.dispatchEvent(new CustomEvent('yogur:cart-updated'));
    }

    async function clearCartConfirm() {
        const items = syncFromStorage();
        if (!items.length) {
            showToast('Tu carrito ya está vacío', 'info');
            return;
        }

        const units = items.reduce((n, i) => n + Number(i.cantidad || 0), 0);
        const ok = await askConfirm({
            name: `${units} producto${units === 1 ? '' : 's'} en el carrito`,
            title: '¿Vaciar el carrito?',
            confirmText: 'Vaciar'
        });

        if (!ok) return;
        clearCart();
        pulseBadge();
    }

    function customerName() {
        try {
            const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
            return usuario ? `${usuario.nombre || ''}${usuario.apellido ? ' ' + usuario.apellido : ''}`.trim() : '';
        } catch {
            return '';
        }
    }

    function greeting() {
        const h = new Date().getHours();
        if (h < 12) return 'Buenos días';
        if (h < 19) return 'Buenas tardes';
        return 'Buenas noches';
    }

    function productMeta(item) {
        let size = item.tamano || item.presentacion || '';
        let name = String(item.nombre || 'Producto');
        if (!size && name.includes('·')) {
            const parts = name.split('·');
            name = parts[0].trim();
            size = parts.slice(1).join('·').trim();
        } else {
            name = name.replace(/\s·\s.*$/, '').trim();
        }
        return { name, size };
    }

    function productLines(item) {
        const { name, size } = productMeta(item);
        const unit = Number(item.precio);
        const qty = Number(item.cantidad);
        return [
            `- ${name}`,
            size ? `- Presentación: ${size}` : null,
            `- Cantidad: ${qty} ${qty === 1 ? 'unidad' : 'unidades'}`,
            `- Precio unitario: ${formatCOP(unit)}`,
            `- Subtotal: ${formatCOP(unit * qty)}`
        ].filter(Boolean);
    }

    function buildWhatsAppMessage(items) {
        const company = getConfig().COMPANY_NAME || 'YogurASO';
        const location = getConfig().COMPANY_LOCATION || 'Neiva y Tello, Huila';
        const total = getCartTotal(items);
        const units = items.reduce((n, i) => n + Number(i.cantidad || 0), 0);
        const nombre = customerName();
        const blocks = [];

        items.forEach((item, i) => {
            if (i > 0) blocks.push('');
            blocks.push(...productLines(item));
        });

        return [
            `${greeting()}.`,
            '',
            'Cordial saludo.',
            '',
            `Solicito el siguiente pedido de yogurt artesanal ${company}, según lo seleccionado en la tienda:`,
            '',
            'Especificación de productos:',
            ...blocks,
            '',
            'Resumen:',
            `- Referencias: ${items.length}`,
            `- Unidades: ${units}`,
            `- Total del pedido: ${formatCOP(total)}`,
            '',
            `Cobertura: ${location}.`,
            'Quedo atento a confirmación, disponibilidad y datos de entrega.',
            '',
            'Gracias.',
            nombre || ''
        ].filter((line, idx, arr) => line !== '' || arr[idx - 1] !== '').join('\n').trim();
    }

    function previewCheckout(items) {
        return new Promise((resolve) => {
            const total = getCartTotal(items);
            const units = items.reduce((n, i) => n + Number(i.cantidad || 0), 0);
            const overlay = document.createElement('div');
            overlay.className = 'order-preview-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.innerHTML = `
                <div class="order-preview">
                    <p class="order-preview-kicker">Antes de WhatsApp</p>
                    <h3>Revisa tu pedido</h3>
                    <p class="order-preview-lead">Esto es lo que vas a enviar. Si está bien, se abre WhatsApp con el mensaje listo.</p>
                    <ul class="order-preview-list">
                        ${items.map((item) => {
                            const { name, size } = productMeta(item);
                            return `<li>
                                <strong>${escapeHtml(name)}</strong>
                                <span>${size ? escapeHtml(size) + ' · ' : ''}${escapeHtml(item.cantidad)} und. · ${formatCOP(Number(item.precio) * Number(item.cantidad))}</span>
                            </li>`;
                        }).join('')}
                    </ul>
                    <div class="order-preview-total">
                        <span>${items.length} referencias · ${units} unidades</span>
                        <strong>${formatCOP(total)}</strong>
                    </div>
                    <div class="order-preview-actions">
                        <button type="button" class="order-preview-cancel">Seguir editando</button>
                        <button type="button" class="order-preview-ok"><i class="fab fa-whatsapp" aria-hidden="true"></i> Enviar pedido</button>
                    </div>
                </div>
            `;
            const close = (ok) => {
                overlay.remove();
                document.removeEventListener('keydown', onKey);
                resolve(ok);
            };
            const onKey = (e) => { if (e.key === 'Escape') close(false); };
            overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
            overlay.querySelector('.order-preview-cancel').addEventListener('click', () => close(false));
            overlay.querySelector('.order-preview-ok').addEventListener('click', () => close(true));
            document.addEventListener('keydown', onKey);
            document.body.appendChild(overlay);
            overlay.querySelector('.order-preview-ok').focus();
        });
    }

    const ORDERS_KEY = 'yogur_order_history';

    function saveOrderHistory(items) {
        let usuario = null;
        try { usuario = JSON.parse(localStorage.getItem('usuario') || 'null'); } catch { usuario = null; }
        let orders = [];
        try { orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); } catch { orders = []; }
        if (!Array.isArray(orders)) orders = [];
        orders.unshift({
            id: `WA-${Date.now()}`,
            userId: usuario?.id || null,
            email: usuario?.email || null,
            createdAt: new Date().toISOString(),
            total: getCartTotal(items),
            items: items.map((item) => ({
                id: item.id,
                nombre: item.nombre,
                cantidad: item.cantidad,
                precio: item.precio,
                tamano: item.tamano || item.presentacion || ''
            }))
        });
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders.slice(0, 40)));
    }

    async function checkoutWhatsApp() {
        const items = syncFromStorage();
        if (items.length === 0) {
            showToast('Tu carrito está vacío', 'warning');
            return;
        }

        const ok = await previewCheckout(items);
        if (!ok) return;

        saveOrderHistory(items);

        openWhatsApp(items, buildWhatsAppMessage(items));
    }

    function ticketWhatsAppText(items) {
        return buildWhatsAppMessage(items) + "\n\nCódigo de pedido: " + orderCode(items);
    }

    function openWhatsApp(items, text) {
        const wa = getConfig().WHATSAPP_NUMBER || '573001234567';
        const url = "https://wa.me/" + wa + "?text=" + encodeURIComponent(text);
        window.open(url, "_blank", "noopener,noreferrer");
    }

    function checkoutDirect() {
        const items = syncFromStorage();
        if (items.length === 0) {
            showToast("Tu carrito está vacío", "warning");
            return;
        }
        saveOrderHistory(items);
        openWhatsApp(items, ticketWhatsAppText(items));
    }

    function openSidebar() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        if (!sidebar) return;
        dressTicketShell();
        renderSidebar();
        sidebar.classList.add('cart-ticket-ready');
        void sidebar.offsetHeight;
        sidebar.classList.add('show');
        overlay?.classList.add('show');
        sidebar.setAttribute('aria-hidden', 'false');
        document.body.classList.add('cart-open');
    }

    function closeSidebar() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        if (!sidebar) return;
        sidebar.classList.remove('show');
        overlay?.classList.remove('show');
        sidebar.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('cart-open');
    }

    function bindSidebar() {
        const cartBtn = document.getElementById('cartBtn');
        const close = document.getElementById('closeCart');
        const overlay = document.getElementById('cartOverlay');
        const checkoutBtn = document.getElementById('checkoutBtn');
        const sidebarItems = document.getElementById('cart-sidebar-items');
        const clearSidebar = document.getElementById('btn-clear-cart-sidebar');
        const clearPage = document.getElementById('btn-clear-cart');

        if (cartBtn) cartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openSidebar();
        });
        if (close) {
            close.addEventListener('click', closeSidebar);
            close.setAttribute('role', 'button');
            close.setAttribute('tabindex', '0');
            close.setAttribute('aria-label', 'Cerrar carrito');
            close.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    closeSidebar();
                }
            });
        }
        if (overlay) overlay.addEventListener('click', closeSidebar);
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', checkoutDirect);
            checkoutBtn.innerHTML = '<i class="fab fa-whatsapp" aria-hidden="true"></i> Comprar por WhatsApp';
        }
        if (clearSidebar) clearSidebar.addEventListener('click', clearCartConfirm);
        if (clearPage) clearPage.addEventListener('click', clearCartConfirm);

        if (sidebarItems) {
            sidebarItems.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-action]');
                if (!btn) return;
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                if (action === 'qty') changeQuantity(id, Number(btn.dataset.delta));
                else if (action === 'remove') removeItemConfirm(id);
                else if (action === 'remove-selected') removeSelectedConfirm(sidebarItems);
            });
            sidebarItems.addEventListener('change', (e) => {
                if (e.target.classList.contains('cart-item-check') || e.target.dataset.action === 'toggle-all') {
                    if (e.target.dataset.action === 'toggle-all') {
                        const on = e.target.checked;
                        sidebarItems.querySelectorAll('.cart-item-check').forEach((c) => { c.checked = on; });
                    }
                    syncSelectToolbar(sidebarItems);
                    syncFlavorShots(sidebarItems);
                }
            });
        }
    }

    window.Cart = {
        addToCart,
        updateCounter,
        getCart,
        clearCart,
        clearCartConfirm,
        showToast,
        renderSidebar,
        changeQuantity,
        setQuantity,
        removeItem,
        removeItemConfirm,
        removeSelectedConfirm,
        syncSelectToolbar,
        checkoutWhatsApp,
        getCartTotal,
        openSidebar,
        closeSidebar
    };

    document.addEventListener('DOMContentLoaded', () => {
        dressTicketShell();
        updateCounter();
        bindSidebar();
        renderSidebar();
    });
})();
