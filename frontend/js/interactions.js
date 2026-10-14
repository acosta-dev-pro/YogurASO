/**
 * interactions.js — Aquí quedan los me gusta del post Nosotros y de los productos.
 */
import { supabase, supabaseListo } from './supabase-client.js';

const POST_ID = 'nosotros';
const VISITOR_KEY = 'yog_visitor_id';
const LOCAL_KEY = 'yog_ix_v1';
const OFFLINE_NOTE = 'Pendiente de conectar. Tu mensaje queda en este navegador hasta que Supabase esté listo.';

function visitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) || fallbackUuid();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch (_) {
    return fallbackUuid();
  }
}

function fallbackUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function loadLocal() {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
    return {
      questions: Array.isArray(raw.questions) ? raw.questions : [],
      likes: raw.likes && typeof raw.likes === 'object' ? raw.likes : {}
    };
  } catch (_) {
    return { questions: [], likes: {} };
  }
}

function saveLocal(data) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); } catch (_) {}
}

function likeKey(type, id) { return type + ':' + id; }

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function clip(s, n) {
  return String(s || '').trim().slice(0, n);
}

function stamp() { return new Date().toISOString(); }

function online() { return Boolean(supabaseListo && supabase); }

function setOfflineNotes(show) {
  document.querySelectorAll('[data-ix-offline]').forEach((el) => {
    el.hidden = !show;
  });
}

function statusLabel(status, mine) {
  if (status === 'approved') return '';
  if (mine) return 'en revisión';
  return 'en revisión';
}

async function fetchQuestions(vid) {
  if (!online()) {
    return loadLocal().questions.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }
  const { data, error } = await supabase.rpc('list_faq_questions', { p_visitor_id: vid });
  if (error) throw error;
  return data || [];
}

async function fetchLike(type, id, vid) {
  if (!online()) {
    const bag = loadLocal().likes[likeKey(type, id)] || { count: 0, visitors: [] };
    return { likes: bag.count || bag.visitors.length || 0, liked: bag.visitors.includes(vid) };
  }
  const { data, error } = await supabase.rpc('like_state', {
    p_target_type: type,
    p_target_id: String(id),
    p_visitor_id: vid
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { likes: Number(row?.likes || 0), liked: Boolean(row?.liked) };
}

async function sendQuestion(name, body, vid) {
  const row = {
    visitor_id: vid,
    author_name: name || null,
    body,
    status: 'pending',
    created_at: stamp(),
    mine: true
  };
  if (!online()) {
    const bag = loadLocal();
    bag.questions.unshift(row);
    saveLocal(bag);
    return row;
  }
  const { error } = await supabase.from('faq_questions').insert({
    visitor_id: vid,
    author_name: name || null,
    body,
    status: 'pending'
  });
  if (error) throw error;
  return row;
}

async function toggleLike(type, id, vid) {
  if (!online()) {
    const bag = loadLocal();
    const key = likeKey(type, id);
    const cur = bag.likes[key] || { visitors: [] };
    const visitors = cur.visitors.slice();
    const i = visitors.indexOf(vid);
    if (i >= 0) visitors.splice(i, 1); else visitors.push(vid);
    bag.likes[key] = { visitors, count: visitors.length };
    saveLocal(bag);
    return { likes: visitors.length, liked: i < 0 };
  }
  const { data, error } = await supabase.rpc('toggle_like', {
    p_target_type: type,
    p_target_id: String(id),
    p_visitor_id: vid
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { likes: Number(row?.likes || 0), liked: Boolean(row?.liked) };
}

function paintQuestions(rows) {
  const host = document.getElementById('faq-ask-thread');
  if (!host) return;
  if (!rows.length) {
    host.innerHTML = '';
    return;
  }
  host.innerHTML = rows.map((q) => {
    const who = clip(q.author_name, 40) || 'Alguien';
    const meta = statusLabel(q.status, q.mine);
    return '<article class="showcase-gray-box faq-ask-card">'
      + '<p class="faq-ask-who">' + esc(who) + '</p>'
      + '<p class="showcase-sublead">' + esc(q.body) + '</p>'
      + (meta ? '<p class="faq-ask-meta">' + esc(meta) + '</p>' : '')
      + (q.answer
        ? '<div class="faq-ask-answer"><p class="faq-ask-answer-who">Respuesta de YogurASO</p><p>' + esc(q.answer) + '</p></div>'
        : '')
      + '</article>';
  }).join('');
}

function paintPostLike(state) {
  const btn = document.querySelector('[data-ix-like="post"]');
  const count = document.querySelector('[data-ix-post-count]');
  const n = Number(state?.likes || 0);
  if (count) count.textContent = String(n);
  if (btn) {
    btn.classList.toggle('is-active', Boolean(state?.liked));
    btn.setAttribute('aria-pressed', state?.liked ? 'true' : 'false');
    btn.setAttribute('aria-label', state?.liked ? 'Quitar me gusta' : 'Me gusta');
  }
}

function paintProductLike(id, state) {
  document.querySelectorAll('.hp-card[data-id="' + CSS.escape(String(id)) + '"] [data-hp-fav]').forEach((btn) => {
    const on = Boolean(state?.liked);
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    let badge = btn.querySelector('[data-ix-prod-count]');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'ix-prod-count';
      badge.dataset.ixProdCount = '';
      btn.appendChild(badge);
    }
    const n = Number(state?.likes || 0);
    badge.textContent = n > 0 ? String(n) : '';
    badge.hidden = n < 1;
  });
}

function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

function setPhase(form, phase, message) {
  const btn = form.querySelector('[type="submit"]');
  const label = btn?.querySelector('.ix-btn-label');
  const spin = btn?.querySelector('.ix-spin');
  const status = form.querySelector('[data-ix-status]');
  if (btn && label && !btn.dataset.idle) btn.dataset.idle = label.textContent;
  const sending = phase === 'sending';
  form.querySelectorAll('input, textarea').forEach((el) => { el.disabled = sending; });
  if (btn) btn.disabled = sending;
  if (label) label.textContent = sending ? 'Enviando…' : (btn.dataset.idle || label.textContent);
  if (spin) spin.hidden = !sending;
  if (!status) return;
  status.className = 'ix-status';
  if (phase === 'sent') {
    status.hidden = false;
    status.classList.add('is-sent');
    status.innerHTML = '<span class="ix-check" aria-hidden="true">✓</span> Enviado, se publicará tras revisión';
  } else if (phase === 'error') {
    status.hidden = false;
    status.classList.add('is-error');
    status.textContent = message || 'No se pudo enviar. Inténtalo de nuevo.';
  } else {
    status.hidden = true;
    status.textContent = '';
  }
}

async function runSend(form, work, failMessage) {
  setPhase(form, 'sending');
  try {
    await Promise.all([work(), wait(380)]);
    setPhase(form, 'sent');
  } catch (err) {
    const spam = err?.code === 'P0001';
    setPhase(form, 'error', spam
      ? 'Ya enviaste varios mensajes. Espera un momento.'
      : failMessage);
  }
}

function wireAsk(vid) {
  const wrap = document.querySelector('[data-ix-ask]');
  const toggle = document.getElementById('faq-ask-toggle');
  const form = document.getElementById('faq-ask-form');
  if (!wrap || !toggle || !form) return;

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    form.hidden = open;
    if (!open) {
      const field = form.querySelector('[name="body"]');
      if (field) field.focus();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = clip(form.elements.name?.value, 40);
    const body = clip(form.elements.body?.value, 500);
    if (body.length < 8) {
      setPhase(form, 'error', 'Cuéntanos un poco más (mínimo 8 caracteres).');
      return;
    }
    runSend(form, async () => {
      await sendQuestion(name, body, vid);
      form.reset();
      paintQuestions(await fetchQuestions(vid));
    }, 'No se pudo enviar ahora. Inténtalo de nuevo.');
  });
}

function wirePost(vid) {
  const likeBtn = document.querySelector('[data-ix-like="post"]');
  if (likeBtn) {
    likeBtn.addEventListener('click', async () => {
      likeBtn.disabled = true;
      try { paintPostLike(await toggleLike('post', POST_ID, vid)); }
      catch (_) {}
      finally { likeBtn.disabled = false; }
    });
  }
}

const productSeen = new Set();

function watchProducts(vid) {
  const scan = () => {
    document.querySelectorAll('.hp-card[data-id]').forEach((card) => {
      const id = card.dataset.id;
      if (!id || productSeen.has(id)) return;
      productSeen.add(id);
      fetchLike('product', id, vid).then((state) => paintProductLike(id, state)).catch(() => {});
    });
  };
  scan();
  const root = document.getElementById('home-products') || document.body;
  const obs = new MutationObserver(scan);
  obs.observe(root, { childList: true, subtree: true });

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest?.('[data-hp-fav]');
    if (!btn) return;
    const card = btn.closest('.hp-card');
    const id = card?.dataset.id;
    if (!id) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      const state = await toggleLike('product', id, vid);
      paintProductLike(id, state);
    } catch (_) {}
  }, true);
}

async function boot() {
  const vid = visitorId();
  setOfflineNotes(!online());
  wireAsk(vid);
  wirePost(vid);
  watchProducts(vid);
  try { paintQuestions(await fetchQuestions(vid)); } catch (_) {}
  try { paintPostLike(await fetchLike('post', POST_ID, vid)); } catch (_) { paintPostLike({ likes: 0, liked: false }); }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { boot(); });
} else {
  boot();
}
