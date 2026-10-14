/**
 * post-comments.js — Aquí quedan los comentarios del post Nosotros.
 * Si la base todavía no tiene la tabla, la caja lo dice y no inventa mensajes.
 */
const POST_ID = 'nosotros';
const VISITOR_KEY = 'yog_visitor_id';
const SHOW_FIRST = 3;
const MISSING = /PGRST202|PGRST205|42P01|42883|could not find the (function|table)|does not exist/i;

let clientPromise = null;
function client() {
  if (!clientPromise) {
    clientPromise = import('./supabase-client.js')
      .then((m) => m.obtenerSupabase())
      .catch((err) => { clientPromise = null; throw err; });
  }
  return clientPromise;
}

function visitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id && crypto.randomUUID) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return /^[0-9a-f-]{36}$/i.test(String(id || '')) ? id : null;
  } catch (_) {
    return null;
  }
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

const errText = (e) => `${e?.code || ''} ${e?.message || e || ''}`;

const BUBBLE = '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M20.7 11.4a8.4 8.4 0 0 1-12.4 7.4L3.3 20l1.3-4.8a8.4 8.4 0 1 1 16.1-3.8Z"/></svg>';

function build(card) {
  const box = document.createElement('div');
  box.className = 'pc';
  box.innerHTML = `
    <button type="button" class="pc-more" data-pc-more hidden></button>
    <ul class="pc-list" data-pc-list aria-live="polite"></ul>
    <p class="pc-note" data-pc-note hidden></p>
    <form class="pc-form" data-pc-form novalidate>
      <label class="pc-sr" for="pc-name">Tu nombre</label>
      <input id="pc-name" name="name" class="pc-name" type="text" maxlength="40" autocomplete="given-name" placeholder="Nombre">
      <label class="pc-sr" for="pc-body">Comentario</label>
      <input id="pc-body" name="body" class="pc-body" type="text" maxlength="400" placeholder="Añade un comentario…" autocomplete="off">
      <button type="submit" class="pc-send" disabled>Publicar</button>
    </form>
    <p class="pc-status" data-pc-status role="status" hidden></p>`;
  const anchor = card.querySelector('.insta-engagement-row');
  if (anchor) anchor.after(box); else card.appendChild(box);

  const icons = card.querySelector('.insta-icons-left');
  const like = icons?.querySelector('[data-ix-like="post"], .insta-btn-icon');
  if (icons && !icons.querySelector('[data-pc-focus]')) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'insta-btn-icon pc-icon';
    b.dataset.pcFocus = '';
    b.setAttribute('aria-label', 'Comentar');
    b.innerHTML = BUBBLE;
    if (like) like.after(b); else icons.prepend(b);
    b.addEventListener('click', () => box.querySelector('.pc-body').focus());
  }
  return box;
}

function itemHtml(c) {
  const who = String(c.author_name || '').trim() || 'Alguien';
  const pending = c.status && c.status !== 'approved';
  return `<li class="pc-item${pending ? ' is-pending' : ''}">
      <p><strong>${esc(who)}</strong> ${esc(c.body)}</p>
      ${pending ? '<small class="pc-meta">En revisión · solo tú lo ves</small>' : ''}
      ${c.reply ? `<div class="pc-reply"><p><strong>yoguraso</strong> ${esc(c.reply)}</p></div>` : ''}
    </li>`;
}

function mount(card) {
  const box = build(card);
  const list = box.querySelector('[data-pc-list]');
  const more = box.querySelector('[data-pc-more]');
  const note = box.querySelector('[data-pc-note]');
  const form = box.querySelector('[data-pc-form]');
  const send = form.querySelector('.pc-send');
  const status = box.querySelector('[data-pc-status]');
  const vid = visitorId();
  let rows = [];
  let expanded = false;

  function paint() {
    const shown = expanded ? rows : rows.slice(-SHOW_FIRST);
    list.innerHTML = shown.map(itemHtml).join('');
    list.hidden = !rows.length;
    const hiddenCount = rows.length - shown.length;
    more.hidden = hiddenCount < 1;
    more.textContent = hiddenCount === 1 ? 'Ver 1 comentario más' : `Ver los ${rows.length} comentarios`;
  }

  function say(text, kind) {
    status.hidden = !text;
    status.textContent = text || '';
    status.className = 'pc-status' + (kind ? ' is-' + kind : '');
  }

  function unavailable(text) {
    note.hidden = false;
    note.textContent = text;
    form.hidden = true;
    const icon = card.querySelector('[data-pc-focus]');
    if (icon) icon.hidden = true;
  }

  async function load() {
    try {
      const sb = await client();
      const { data, error } = await sb.rpc('list_post_comments', { p_target_id: POST_ID, p_visitor_id: vid });
      if (error) throw error;
      rows = Array.isArray(data) ? data : [];
      note.hidden = true;
      form.hidden = false;
      const icon = card.querySelector('[data-pc-focus]');
      if (icon) icon.hidden = false;
      paint();
    } catch (err) {
      rows = [];
      paint();
      if (MISSING.test(errText(err))) unavailable('Los comentarios se activan muy pronto.');
      else { note.hidden = false; note.textContent = 'No se pudieron cargar los comentarios.'; }
    }
  }

  more.addEventListener('click', () => { expanded = true; paint(); });

  form.elements.body.addEventListener('input', () => {
    send.disabled = form.elements.body.value.trim().length < 2;
    if (!status.hidden && status.classList.contains('is-error')) say('');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = form.elements.body.value.trim().slice(0, 400);
    const name = form.elements.name.value.trim().slice(0, 40);
    if (body.length < 2) return;
    if (!vid) { say('Tu navegador no deja guardar el comentario.', 'error'); return; }
    send.disabled = true;
    send.textContent = 'Enviando…';
    try {
      const sb = await client();
      const { error } = await sb.from('content_comments').insert({
        target_type: 'post',
        target_id: POST_ID,
        visitor_id: vid,
        author_name: name || null,
        body
      });
      if (error) throw error;
      form.elements.body.value = '';
      say('Enviado. Se publica cuando lo revisemos.', 'ok');
      await load();
    } catch (err) {
      const txt = errText(err);
      if (err?.code === 'P0001') say('Ya enviaste varios comentarios. Espera un momento.', 'error');
      else if (MISSING.test(txt)) { say(''); unavailable('Los comentarios se activan muy pronto.'); }
      else say('No se pudo enviar. Inténtalo de nuevo.', 'error');
    } finally {
      send.textContent = 'Publicar';
      send.disabled = form.elements.body.value.trim().length < 2;
    }
  });

  load();
}

function boot() {
  const card = document.querySelector('#nosotros .showcase-insta-card');
  if (card && !card.querySelector('.pc')) mount(card);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
