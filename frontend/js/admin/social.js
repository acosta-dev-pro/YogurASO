/**
 * admin/social.js — Vista "Instagram": me gusta de la web (reales, Supabase)
 * y la cuenta de Instagram (Graph API vía Edge Function, ver instagram.js).
 */
import { esc, fmtDate, flavorOf, photoFor, colorsFor } from './shared.js';
import { likeCounts } from './data.js';
import { instagramStatus, listMedia, listComments, replyToComment } from './instagram.js';

const IG_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="0.6" fill="currentColor"/></svg>';
const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3s-7.3-4.4-9.2-9A5.2 5.2 0 0 1 12 6.1a5.2 5.2 0 0 1 9.2 5.2c-1.9 4.6-9.2 9-9.2 9Z" fill="currentColor"/></svg>';
const BUBBLE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true"><path d="M20.7 11.4a8.4 8.4 0 0 1-12.4 7.4L3.3 20l1.3-4.8a8.4 8.4 0 1 1 16.1-3.8Z"/></svg>';

export function mountSocial(ctx) {
    const $ = (id) => document.getElementById(id);
    let loaded = false;
    let ig = { status: null, posts: [], selected: null, comments: [], loadingComments: false };
    let likes = null;

    /* ---------- Me gusta de la web ---------- */
    async function loadLikes() {
        const products = ctx.products().filter((p) => p.activo);
        const targets = [{ type: 'post', id: 'nosotros' }];
        products.forEach((p) => {
            targets.push({ type: 'product', id: String(p.id), pid: p.id });
            const slug = flavorOf(p);
            // Si la tienda cayó al catálogo local, el corazón se guarda como local-<sabor>.
            if (slug) targets.push({ type: 'product', id: `local-${slug}`, pid: p.id });
        });
        const res = await likeCounts(targets);
        if (!res.success) {
            likes = { error: res.message, needs: res.needs };
            return;
        }
        const post = res.items.find((t) => t.type === 'post')?.likes || 0;
        const byProduct = new Map();
        res.items.filter((t) => t.type === 'product').forEach((t) => byProduct.set(t.pid, (byProduct.get(t.pid) || 0) + t.likes));
        likes = {
            post,
            products: products.map((p) => ({ p, n: byProduct.get(p.id) || 0 })).sort((a, b) => b.n - a.n)
        };
    }

    function renderLikes() {
        const host = $('web-likes');
        if (!likes) {
            host.innerHTML = '<p class="adm-empty">Leyendo los me gusta…</p>';
            return;
        }
        if (likes.error) {
            host.innerHTML = `<div class="adm-emptybox"><strong>${esc(likes.error)}</strong>
                <p>Cuando la base tenga las tablas de interacciones, aquí ves cuántos corazones tiene cada sabor y el post de «Sobre nosotros».</p></div>`;
            return;
        }
        const max = Math.max(1, ...likes.products.map((x) => x.n));
        const q = ctx.query().trim().toLowerCase();
        const rows = likes.products.filter((x) => !q || String(x.p.nombre).toLowerCase().includes(q));
        host.innerHTML = `
            <article class="adm-likepost">
                <span class="adm-likepost-ico">${HEART}</span>
                <div>
                    <small>Post «Sobre nosotros»</small>
                    <strong>${likes.post.toLocaleString('es-CO')} <span>${likes.post === 1 ? 'me gusta' : 'me gusta'}</span></strong>
                </div>
                <a href="../index.html#nosotros" target="_blank" rel="noopener">Ver en la web</a>
            </article>
            <ul class="adm-likelist">
                ${rows.map(({ p, n }) => {
                    const c = colorsFor(p);
                    const photo = photoFor(p);
                    return `<li style="--strong:${c.fuerte};--soft:${c.fondo}">
                        <span class="adm-likelist-img">${photo ? `<img src="${esc(photo)}" alt="" loading="lazy" onerror="this.hidden=true">` : ''}</span>
                        <span class="adm-likelist-name">${esc(p.nombre)}</span>
                        <span class="adm-likelist-bar"><i style="width:${n ? Math.max(4, (n / max) * 100) : 0}%"></i></span>
                        <span class="adm-likelist-n">${HEART}${n.toLocaleString('es-CO')}</span>
                    </li>`;
                }).join('') || '<li class="adm-empty">Sin sabores con esa búsqueda.</li>'}
            </ul>`;
    }

    /* ---------- Cuenta de Instagram ---------- */
    function renderAccount() {
        const host = $('ig-account');
        const cfg = window.YOGUR_CONFIG || {};
        const profileUrl = cfg.INSTAGRAM || 'https://instagram.com/';
        const st = ig.status;
        if (!st) {
            host.innerHTML = `<div class="adm-ig-ico">${IG_ICON}</div><p class="adm-empty">Revisando la conexión…</p>`;
            return;
        }
        if (st.connected) {
            const a = st.account || {};
            host.classList.add('is-connected');
            host.innerHTML = `
                <div class="adm-ig-profile">
                    ${a.profile_picture_url ? `<img src="${esc(a.profile_picture_url)}" alt="">` : `<span class="adm-ig-ico">${IG_ICON}</span>`}
                    <div><strong>@${esc(a.username || '')}</strong><span>${esc(a.name || '')}</span></div>
                </div>
                <dl class="adm-ig-facts">
                    ${a.media_count != null ? `<div><dt>Publicaciones</dt><dd>${Number(a.media_count).toLocaleString('es-CO')}</dd></div>` : ''}
                    ${a.followers_count != null ? `<div><dt>Seguidores</dt><dd>${Number(a.followers_count).toLocaleString('es-CO')}</dd></div>` : ''}
                </dl>
                <a class="adm-btn" href="https://instagram.com/${esc(a.username || '')}" target="_blank" rel="noopener">Abrir en Instagram</a>`;
            return;
        }
        host.classList.remove('is-connected');
        const why = st.reason === 'permiso'
            ? 'Tu sesión no tiene permiso para leer Instagram.'
            : (st.reason === 'offline' ? 'Sin conexión con Supabase.' : '');
        host.innerHTML = `
            <div class="adm-ig-ico">${IG_ICON}</div>
            <h2>Conecta tu cuenta de Instagram para ver likes y comentarios</h2>
            ${why ? `<p class="adm-note">${esc(why)}</p>` : ''}
            <p>Instagram solo comparte esos datos con cuentas conectadas. Hace falta:</p>
            <ol class="adm-steps">
                <li>Que <strong>@yoguraso</strong> sea cuenta <strong>Business</strong> o <strong>Creator</strong> (se cambia gratis en la app).</li>
                <li>Una app en <strong>Meta for Developers</strong> con permiso para leer y responder comentarios.</li>
                <li>Guardar el token en Supabase (nunca en la página) y activar la función <em>instagram</em>.</li>
            </ol>
            <a class="adm-btn" href="${esc(profileUrl)}" target="_blank" rel="noopener">Abrir Instagram</a>`;
    }

    function renderFeed() {
        const host = $('ig-feed');
        const st = ig.status;
        if (!st) {
            host.innerHTML = '<p class="adm-empty">Cargando…</p>';
            return;
        }
        if (!st.connected) {
            host.innerHTML = `<div class="adm-emptybox adm-emptybox--ig">
                <span class="adm-ig-ico">${IG_ICON}</span>
                <div><strong>Aún no hay cuenta conectada</strong>
                <p>Cuando la conectes, aquí salen tus publicaciones con sus me gusta y comentarios, y puedes responder sin salir del panel.</p></div>
            </div>`;
            return;
        }
        if (ig.error) {
            host.innerHTML = `<p class="adm-empty">${esc(ig.error)}</p>`;
            return;
        }
        const q = ctx.query().trim().toLowerCase();
        const posts = ig.posts.filter((p) => !q || String(p.caption || '').toLowerCase().includes(q));
        if (!posts.length) {
            host.innerHTML = `<p class="adm-empty">${ig.posts.length ? 'Ninguna publicación coincide.' : 'Tu cuenta aún no tiene publicaciones.'}</p>`;
            return;
        }
        host.innerHTML = `
            <div class="adm-ig-layout">
                <div class="adm-ig-grid">
                    ${posts.map((p) => `
                        <button type="button" class="adm-ig-post${ig.selected === p.id ? ' is-on' : ''}" data-media="${esc(p.id)}" aria-label="Ver comentarios de la publicación del ${esc(fmtDate(p.timestamp))}">
                            <img src="${esc(p.thumbnail_url || p.media_url || '')}" alt="" loading="lazy" onerror="this.hidden=true">
                            <span class="adm-ig-meta"><span>${HEART}${Number(p.like_count || 0).toLocaleString('es-CO')}</span><span>${BUBBLE}${Number(p.comments_count || 0).toLocaleString('es-CO')}</span></span>
                        </button>`).join('')}
                </div>
                <div class="adm-panel adm-ig-comments" id="ig-comments">${commentsHtml()}</div>
            </div>`;
    }

    function commentsHtml() {
        const post = ig.posts.find((p) => p.id === ig.selected);
        if (!post) return '<p class="adm-empty">Elige una publicación para ver sus comentarios.</p>';
        if (ig.loadingComments) return '<p class="adm-empty">Cargando comentarios…</p>';
        const head = `
            <header class="adm-ig-chead">
                <p>${esc((post.caption || '').slice(0, 140))}${(post.caption || '').length > 140 ? '…' : ''}</p>
                <small>${esc(fmtDate(post.timestamp))} · <a href="${esc(post.permalink || '#')}" target="_blank" rel="noopener">Abrir</a></small>
            </header>`;
        if (ig.commentsError) return `${head}<p class="adm-empty">${esc(ig.commentsError)}</p>`;
        if (!ig.comments.length) return `${head}<p class="adm-empty">Esta publicación no tiene comentarios.</p>`;
        return `${head}<ul class="adm-ig-clist">${ig.comments.map((c) => `
            <li>
                <p><strong>@${esc(c.username || '')}</strong> ${esc(c.text || '')}</p>
                <small>${esc(fmtDate(c.timestamp))}${c.like_count ? ` · ${c.like_count} me gusta` : ''}</small>
                ${(c.replies || []).map((r) => `<div class="adm-ig-reply"><p><strong>@${esc(r.username || '')}</strong> ${esc(r.text || '')}</p><small>${esc(fmtDate(r.timestamp))}</small></div>`).join('')}
                <form class="adm-ig-replyform" data-comment="${esc(c.id)}">
                    <input type="text" maxlength="300" placeholder="Responder a @${esc(c.username || '')}" aria-label="Respuesta">
                    <button type="submit">Responder</button>
                </form>
            </li>`).join('')}</ul>`;
    }

    async function openPost(id) {
        ig.selected = id;
        ig.loadingComments = true;
        ig.commentsError = '';
        renderFeed();
        const res = await listComments(id);
        ig.loadingComments = false;
        ig.comments = res.success ? res.comments : [];
        ig.commentsError = res.success ? '' : (res.message || 'No se pudieron cargar los comentarios');
        renderFeed();
    }

    async function loadInstagram() {
        ig.status = await instagramStatus();
        if (ig.status.connected) {
            const res = await listMedia(18);
            ig.posts = res.success ? res.posts : [];
            ig.error = res.success ? '' : (res.message || 'No se pudieron cargar las publicaciones');
        }
    }

    $('ig-feed').addEventListener('click', (e) => {
        const b = e.target.closest('[data-media]');
        if (b) openPost(b.dataset.media);
    });
    $('ig-feed').addEventListener('submit', async (e) => {
        const form = e.target.closest('[data-comment]');
        if (!form) return;
        e.preventDefault();
        const input = form.querySelector('input');
        const btn = form.querySelector('button');
        btn.disabled = true;
        const res = await replyToComment(form.dataset.comment, input.value);
        btn.disabled = false;
        if (!res.success) {
            ctx.toast(res.message || 'No se pudo responder', 'error');
            return;
        }
        ctx.toast('Respuesta publicada en Instagram', 'success');
        openPost(ig.selected);
    });

    function render() {
        renderLikes();
        renderAccount();
        renderFeed();
    }

    async function open() {
        render();
        if (loaded) return;
        loaded = true;
        await Promise.all([loadLikes(), loadInstagram()]);
        render();
    }

    return { open, render };
}
