/**
 * admin/social.js — Vista «Instagram»: el post estilo Instagram de la web
 * («Sobre nosotros» en el inicio). Me gusta y comentarios reales de Supabase
 * (migración 0002); responder, publicar, ocultar y borrar desde el panel.
 * También muestra los me gusta de cada sabor.
 */
import { esc, fmtDate, flavorOf, photoFor, colorsFor, initials, STATUS_Q } from './shared.js';
import { likeCounts } from './data.js';
import { POST_ID, getPostLikes, listPostComments, setCommentStatus, replyToComment, deleteComment } from './instagram.js';

const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3s-7.3-4.4-9.2-9A5.2 5.2 0 0 1 12 6.1a5.2 5.2 0 0 1 9.2 5.2c-1.9 4.6-9.2 9-9.2 9Z" fill="currentColor"/></svg>';
const BUBBLE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true"><path d="M20.7 11.4a8.4 8.4 0 0 1-12.4 7.4L3.3 20l1.3-4.8a8.4 8.4 0 1 1 16.1-3.8Z"/></svg>';
const STATUS_C = { pending: 'Por revisar', approved: 'Publicado', hidden: 'Oculto' };

export function mountSocial(ctx) {
    const $ = (id) => document.getElementById(id);
    let post = null;      // { likes } | { error }
    let comments = null;  // { list, canReply } | { error, needs }
    let flavors = null;   // { products } | { error }
    let filter = 'pending';
    let loaded = false;

    async function loadPost() {
        const [l, c] = await Promise.all([getPostLikes(POST_ID), listPostComments(POST_ID)]);
        post = l.success ? { likes: l.likes } : { error: l.message, needs: l.needs };
        comments = c.success ? { list: c.comments, canReply: c.canReply } : { error: c.message, needs: c.needs };
    }

    async function loadFlavors() {
        const products = ctx.products().filter((p) => p.activo);
        const targets = [];
        products.forEach((p) => {
            targets.push({ type: 'product', id: String(p.id), pid: p.id });
            const slug = flavorOf(p);
            // Si la tienda cayó al catálogo local, el corazón queda como local-<sabor>.
            if (slug) targets.push({ type: 'product', id: `local-${slug}`, pid: p.id });
        });
        const res = targets.length ? await likeCounts(targets) : { success: true, items: [] };
        if (!res.success) {
            flavors = { error: res.message };
            return;
        }
        const by = new Map();
        res.items.forEach((t) => by.set(t.pid, (by.get(t.pid) || 0) + t.likes));
        flavors = { products: products.map((p) => ({ p, n: by.get(p.id) || 0 })).sort((a, b) => b.n - a.n) };
    }

    /* ---------- Tarjeta del post (columna izquierda) ---------- */
    function renderCard() {
        const host = $('post-card');
        const list = comments?.list || [];
        const pending = list.filter((c) => c.status === 'pending').length;
        const likes = post && !post.error ? post.likes.toLocaleString('es-CO') : '—';
        host.innerHTML = `
            <header class="adm-post-head">
                <span class="adm-post-ring"><img src="../assets/favicon.svg" alt="" width="34" height="34"></span>
                <div><strong>yoguraso</strong><small>Post «Sobre nosotros» · inicio</small></div>
            </header>
            <p class="adm-post-title">Pasión por la frescura natural</p>
            <div class="adm-post-stats">
                <span class="is-heart">${HEART}<strong>${likes}</strong> me gusta</span>
                <span>${BUBBLE}<strong>${comments && !comments.error ? list.length.toLocaleString('es-CO') : '—'}</strong> comentarios</span>
            </div>
            ${pending ? `<p class="adm-post-pending">${pending} ${pending === 1 ? 'comentario espera' : 'comentarios esperan'} tu revisión</p>` : ''}
            ${post?.error ? `<p class="adm-note">${esc(post.error)}</p>` : ''}
            <p class="adm-muted">Hoy el post de la web solo muestra el corazón. Si vuelves a abrir los comentarios en la página, llegan aquí.</p>
            <a class="adm-btn" href="../index.html#nosotros" target="_blank" rel="noopener">Ver el post en la web</a>`;
    }

    /* ---------- Comentarios ---------- */
    function commentHtml(c) {
        const name = c.author_name || 'Sin nombre';
        const canReply = comments.canReply !== false;
        return `
            <article class="adm-q is-${esc(c.status)}" data-cid="${esc(c.id)}">
                <header>
                    <span class="adm-avatar" aria-hidden="true">${esc(initials(name))}</span>
                    <div><strong>${esc(name)}</strong><time datetime="${esc(c.created_at)}">${esc(fmtDate(c.created_at))}</time></div>
                    <span class="adm-qstatus is-${esc(c.status)}">${esc(STATUS_C[c.status] || STATUS_Q[c.status] || c.status)}</span>
                </header>
                <p class="adm-q-body">${esc(c.body)}</p>
                ${c.reply ? `<div class="adm-q-answer"><small>Respuesta de YogurASO${c.replied_at ? ` · ${esc(fmtDate(c.replied_at))}` : ''}</small><p>${esc(c.reply)}</p></div>` : ''}
                <form class="adm-q-form">
                    ${canReply ? `<label class="sr-only" for="cr-${esc(c.id)}">Respuesta</label>
                    <textarea id="cr-${esc(c.id)}" rows="2" maxlength="400" placeholder="${c.reply ? 'Cambiar la respuesta…' : 'Responder como YogurASO…'}"></textarea>` : ''}
                    <div class="adm-q-actions">
                        ${canReply ? '<button type="submit" class="adm-btn adm-btn--red adm-btn--sm" data-cact="reply">Responder y publicar</button>' : ''}
                        ${c.status !== 'approved' ? '<button type="button" class="adm-btn adm-btn--sm" data-cact="approved">Publicar</button>' : ''}
                        ${c.status !== 'hidden' ? '<button type="button" class="adm-btn adm-btn--sm adm-btn--ghost" data-cact="hidden">Ocultar</button>' : '<button type="button" class="adm-btn adm-btn--sm adm-btn--ghost" data-cact="pending">Volver a revisar</button>'}
                        <button type="button" class="adm-btn adm-btn--sm adm-btn--ghost adm-btn--danger" data-cact="delete">Borrar</button>
                    </div>
                </form>
            </article>`;
    }

    function renderComments() {
        const host = $('post-comments');
        document.querySelectorAll('#post-filters [data-c]').forEach((b) => b.classList.toggle('is-on', b.dataset.c === filter));
        if (!comments) {
            host.innerHTML = '<p class="adm-empty">Cargando comentarios…</p>';
            return;
        }
        if (comments.error) {
            host.innerHTML = `<div class="adm-emptybox"><strong>${esc(comments.error)}</strong>
                <p>${comments.needs === 'tabla' ? 'Cuando la base tenga las tablas de interacciones, aquí ves y respondes los comentarios del post.' : 'Intenta de nuevo con «Actualizar».'}</p></div>`;
            return;
        }
        const q = ctx.query().trim().toLowerCase();
        const list = comments.list.filter((c) => (!filter || c.status === filter)
            && (!q || `${c.body} ${c.author_name || ''} ${c.reply || ''}`.toLowerCase().includes(q)));
        const onlyApproved = comments.list.length > 0 && comments.list.every((c) => c.status === 'approved');
        const empty = { pending: 'No hay comentarios por revisar.', approved: 'Aún no hay comentarios publicados.', hidden: 'No hay comentarios ocultos.', '': 'Todavía nadie ha comentado el post.' };
        host.innerHTML = (comments.canReply === false ? '<p class="adm-note">Para guardar respuestas falta un campo en la base. Mientras tanto puedes publicar, ocultar o borrar.</p>' : '')
            + (onlyApproved ? '<p class="adm-note">Solo se ven los publicados: la base aún no deja que el admin lea los pendientes.</p>' : '')
            + (list.length ? list.map(commentHtml).join('') : `<p class="adm-empty">${q ? 'Ningún comentario coincide con la búsqueda.' : empty[filter]}</p>`);
    }

    /* ---------- Me gusta por sabor ---------- */
    function renderFlavors() {
        const host = $('web-likes');
        if (!flavors) {
            host.innerHTML = '<p class="adm-empty">Leyendo los me gusta…</p>';
            return;
        }
        if (flavors.error) {
            host.innerHTML = `<div class="adm-emptybox"><strong>${esc(flavors.error)}</strong><p>Cuando la base tenga las tablas de interacciones, aquí ves los corazones de cada sabor.</p></div>`;
            return;
        }
        const max = Math.max(1, ...flavors.products.map((x) => x.n));
        const q = ctx.query().trim().toLowerCase();
        const rows = flavors.products.filter((x) => !q || String(x.p.nombre).toLowerCase().includes(q));
        host.innerHTML = `<ul class="adm-likelist">${rows.map(({ p, n }) => {
            const c = colorsFor(p);
            const photo = photoFor(p);
            return `<li style="--strong:${c.fuerte};--soft:${c.fondo}">
                <span class="adm-likelist-img">${photo ? `<img src="${esc(photo)}" alt="" loading="lazy" onerror="this.hidden=true">` : ''}</span>
                <span class="adm-likelist-name">${esc(p.nombre)}</span>
                <span class="adm-likelist-bar"><i style="width:${n ? Math.max(4, (n / max) * 100) : 0}%"></i></span>
                <span class="adm-likelist-n">${HEART}${n.toLocaleString('es-CO')}</span>
            </li>`;
        }).join('') || '<li class="adm-empty">Sin sabores con esa búsqueda.</li>'}</ul>`;
    }

    async function act(id, action, form) {
        if (action === 'delete') {
            const ok = await ctx.confirm({
                title: 'Borrar comentario',
                message: 'Se borra para siempre. Si solo quieres que no se vea, usa «Ocultar».',
                confirmText: 'Borrar', cancelText: 'Cancelar', danger: true, type: 'danger'
            });
            if (!ok) return;
        }
        const buttons = form.querySelectorAll('button');
        buttons.forEach((b) => { b.disabled = true; });
        let res;
        if (action === 'reply') {
            const text = form.querySelector('textarea')?.value.trim();
            if (!text) {
                buttons.forEach((b) => { b.disabled = false; });
                ctx.toast('Escribe la respuesta antes de enviarla', 'error');
                form.querySelector('textarea')?.focus();
                return;
            }
            res = await replyToComment(id, text);
        } else if (action === 'delete') {
            res = await deleteComment(id);
        } else {
            res = await setCommentStatus(id, action);
        }
        buttons.forEach((b) => { b.disabled = false; });
        if (!res.success) {
            ctx.toast(res.message || 'No se pudo guardar', 'error');
            return;
        }
        ctx.toast({ reply: 'Respuesta publicada', approved: 'Comentario publicado', hidden: 'Comentario oculto', pending: 'Comentario en revisión', delete: 'Comentario borrado' }[action], 'success');
        await loadPost();
        render();
    }

    $('post-filters').addEventListener('click', (e) => {
        const b = e.target.closest('[data-c]');
        if (!b) return;
        filter = b.dataset.c;
        renderComments();
    });
    $('btn-reload-post').addEventListener('click', async () => {
        comments = null;
        render();
        await Promise.all([loadPost(), loadFlavors()]);
        render();
    });
    $('post-comments').addEventListener('click', (e) => {
        const b = e.target.closest('[data-cact]');
        if (!b || b.type === 'submit') return;
        const art = b.closest('[data-cid]');
        act(Number(art.dataset.cid), b.dataset.cact, art.querySelector('form'));
    });
    $('post-comments').addEventListener('submit', (e) => {
        e.preventDefault();
        const art = e.target.closest('[data-cid]');
        if (art) act(Number(art.dataset.cid), 'reply', e.target);
    });

    function render() {
        renderCard();
        renderComments();
        renderFlavors();
    }

    return {
        async open() {
            render();
            if (loaded) return;
            loaded = true;
            await Promise.all([loadPost(), loadFlavors()]);
            render();
        },
        render,
        /** Para Excel y la campanita: comentarios ya cargados (o los carga). */
        async data() {
            if (!comments) await loadPost();
            return comments?.list || [];
        }
    };
}
