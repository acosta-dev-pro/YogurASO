/**
 * admin/pedidos.js — Pedidos guardados en Supabase (orders + order_items).
 * Hoy la tienda manda el pedido por WhatsApp y solo lo guarda en el navegador
 * del cliente; cuando el checkout escriba en "orders", aparecen aquí.
 */
import { esc, cop, fmtDate, STATUS_O } from './shared.js';
import { listOrders, setOrderStatus } from './data.js';

export function mountPedidos(ctx) {
    const $ = (id) => document.getElementById(id);
    let data = null;
    let filter = '';
    let loading = null;

    function load() {
        if (!loading) {
            loading = listOrders().then((res) => {
                data = res.success ? { orders: res.orders } : { error: res.message, needs: res.needs };
                loading = null;
            });
        }
        return loading;
    }

    function waLink(phone) {
        const digits = String(phone || '').replace(/\D/g, '');
        if (!digits) return '';
        const full = digits.length === 10 ? `57${digits}` : digits;
        return `https://wa.me/${full}`;
    }

    function renderSide() {
        const host = $('o-side');
        const orders = data?.orders || [];
        const abiertos = orders.filter((o) => ['pendiente', 'en_proceso'].includes(o.status)).length;
        host.innerHTML = `
            <h2>Pedidos</h2>
            <p>Los pedidos que quedan guardados en la tienda, con su estado.</p>
            ${data?.orders ? `<p class="adm-u-count">${orders.length} en total · ${abiertos} abiertos</p>` : ''}
            <p class="adm-muted">Hoy los pedidos del carrito se envían por WhatsApp y no quedan en la base. Para verlos aquí, el carrito debe guardarlos en Supabase antes de abrir WhatsApp.</p>`;
    }

    function renderList() {
        const host = $('o-list');
        document.querySelectorAll('#o-filters [data-o]').forEach((b) => b.classList.toggle('is-on', b.dataset.o === filter));
        if (!data) {
            host.innerHTML = '<p class="adm-empty">Cargando pedidos…</p>';
            return;
        }
        if (data.error) {
            host.innerHTML = `<div class="adm-emptybox"><strong>${esc(data.error)}</strong><p>Intenta de nuevo con «Actualizar».</p></div>`;
            return;
        }
        const q = ctx.query().trim().toLowerCase();
        const list = data.orders.filter((o) => (!filter || o.status === filter)
            && (!q || `${o.order_number} ${o.shipping_name || ''} ${o.shipping_phone || ''} ${o.city || ''}`.toLowerCase().includes(q)));
        if (!list.length) {
            host.innerHTML = data.orders.length
                ? '<p class="adm-empty">Ningún pedido con estos filtros.</p>'
                : `<div class="adm-emptybox"><strong>Todavía no hay pedidos guardados</strong>
                    <p>Cuando el carrito guarde los pedidos en la base, aparecen aquí con el cliente, los productos y el total.</p></div>`;
            return;
        }
        host.innerHTML = list.map((o) => {
            const wa = waLink(o.shipping_phone);
            return `
            <article class="adm-order is-${esc(o.status)}">
                <header>
                    <div><strong>${esc(o.order_number || `#${o.id}`)}</strong><time>${esc(fmtDate(o.created_at))}</time></div>
                    <label class="adm-select-pill adm-select-pill--sm">
                        <span class="sr-only">Estado del pedido</span>
                        <select data-order="${esc(o.id)}">
                            ${Object.entries(STATUS_O).map(([v, l]) => `<option value="${v}" ${v === o.status ? 'selected' : ''}>${l}</option>`).join('')}
                        </select>
                    </label>
                </header>
                <p class="adm-order-who">${esc(o.shipping_name || 'Sin nombre')}${o.city ? ` · ${esc(o.city)}` : ''}${o.shipping_phone ? ` · ${wa ? `<a href="${esc(wa)}" target="_blank" rel="noopener">${esc(o.shipping_phone)}</a>` : esc(o.shipping_phone)}` : ''}</p>
                <ul class="adm-order-items">${(o.order_items || []).map((i) => `<li><span>${esc(i.quantity)} × ${esc(i.product_name)}</span><span>${cop(i.subtotal ?? i.unit_price * i.quantity)}</span></li>`).join('')}</ul>
                <footer><span>${esc(o.payment_method || '')}${o.payment_status ? ` · pago ${esc(o.payment_status)}` : ''}</span><strong>${cop(o.total)}</strong></footer>
            </article>`;
        }).join('');
    }

    function render() {
        renderSide();
        renderList();
    }

    $('o-filters').addEventListener('click', (e) => {
        const b = e.target.closest('[data-o]');
        if (!b) return;
        filter = b.dataset.o;
        renderList();
    });
    $('btn-reload-orders').addEventListener('click', async () => {
        data = null;
        render();
        await load();
        render();
    });
    $('o-list').addEventListener('change', async (e) => {
        const sel = e.target.closest('[data-order]');
        if (!sel) return;
        sel.disabled = true;
        const res = await setOrderStatus(Number(sel.dataset.order), sel.value);
        sel.disabled = false;
        if (!res.success) {
            ctx.toast(res.message || 'No se pudo cambiar el estado', 'error');
            await load();
            render();
            return;
        }
        ctx.toast(`Pedido: ${STATUS_O[sel.value]}`, 'success');
        await load();
        render();
    });

    return {
        async open() {
            render();
            if (!data) {
                await load();
                render();
            }
        },
        render,
        data: async () => {
            if (!data) await load();
            return data?.orders || [];
        }
    };
}
