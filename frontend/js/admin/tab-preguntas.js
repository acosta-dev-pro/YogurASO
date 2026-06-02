/**
 * admin/tab-preguntas.js — Pestaña Preguntas: moderación de preguntas de clientes (responder, publicar, eliminar).
 */
import { state } from './state.js';
import { escapeHtml, toast, confirmAction } from './ui.js';

export const STORAGE_IX_KEY = 'yog_ix_v1';

export const LEGACY_IX_KEY = 'yog_local_interactions_v1';

export async function cargarTablaPreguntas() {
    const listEl = document.getElementById('admin-questions-list');
    if (!listEl) return;

    let sbQuestions = [];
    try {
        const sb = await import('../supabase-client.js').then((m) => m.obtenerSupabase()).catch(() => null);
        if (sb) {
            const { data, error } = await sb.from('faq_questions').select('*').order('created_at', { ascending: false });
            if (!error && Array.isArray(data)) sbQuestions = data;
        }
    } catch (_) {}

    let localQuestions = [];
    try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_IX_KEY) || '{}');
        if (Array.isArray(raw.questions)) localQuestions = raw.questions;
    } catch (_) {}

    try {
        const rawLegacy = JSON.parse(localStorage.getItem(LEGACY_IX_KEY) || '{}');
        if (Array.isArray(rawLegacy.questions)) {
            localQuestions = [...localQuestions, ...rawLegacy.questions];
        }
    } catch (_) {}

    const map = new Map();
    sbQuestions.forEach((q) => map.set(String(q.id), { ...q }));
    localQuestions.forEach((q) => {
        const key = String(q.id);
        if (!map.has(key)) {
            map.set(key, { ...q });
        } else {
            const cur = map.get(key);
            if (q.answer && !cur.answer) {
                cur.answer = q.answer;
                cur.status = q.status || 'approved';
            }
        }
    });

    let questions = Array.from(map.values());
    if (!questions.length) {
        questions = [
            {
                id: 'q-demo-1',
                author_name: 'María Alejandra',
                body: '¿Hacen envíos a domicilio en Neiva los fines de semana y qué costo tiene?',
                answer: '¡Hola María! Sí, realizamos entregas en Neiva los sábados y domingos en la mañana sin costo adicional por pedidos desde 3 botellas.',
                status: 'approved',
                created_at: new Date(Date.now() - 3600000 * 4).toISOString()
            },
            {
                id: 'q-demo-2',
                author_name: 'Carlos Gómez',
                body: '¿Cuál es la presentación más recomendada para familias o negocios de desayunos?',
                answer: '',
                status: 'pending',
                created_at: new Date(Date.now() - 3600000 * 2).toISOString()
            },
            {
                id: 'q-demo-3',
                author_name: 'Valentina R.',
                body: '¿El yogurt artesanal tiene conservantes artificiales o es 100% natural?',
                answer: '',
                status: 'pending',
                created_at: new Date(Date.now() - 3600000 * 1).toISOString()
            }
        ];
    }

    questions.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    state.questions = questions;

    updateQuestionStats();
    renderAdminQuestions(getVisibleQuestions());
}

export function updateQuestionStats() {
    const total = state.questions.length;
    const pending = state.questions.filter((q) => !q.answer || q.status === 'pending').length;
    const answered = total - pending;

    const tEl = document.getElementById('stat-q-total');
    const pEl = document.getElementById('stat-q-pending');
    const aEl = document.getElementById('stat-q-answered');
    const chip = document.getElementById('admin-pending-q-chip');

    if (tEl) tEl.textContent = String(total);
    if (pEl) pEl.textContent = String(pending);
    if (aEl) aEl.textContent = String(answered);

    if (chip) {
        chip.textContent = String(pending);
        chip.style.display = pending > 0 ? 'inline-block' : 'none';
    }
}

export function getVisibleQuestions() {
    const q = (document.getElementById('admin-q-search')?.value || '').trim().toLowerCase();
    const filter = document.getElementById('admin-q-filter')?.value || '';

    return state.questions.filter((item) => {
        const matchQ = !q
            || String(item.body || '').toLowerCase().includes(q)
            || String(item.author_name || '').toLowerCase().includes(q)
            || String(item.answer || '').toLowerCase().includes(q);

        const isAnswered = Boolean(item.answer && item.status === 'approved');
        const matchFilter = !filter
            || (filter === 'pending' && !isAnswered)
            || (filter === 'approved' && isAnswered);

        return matchQ && matchFilter;
    });
}

export function renderAdminQuestions(questions) {
    const host = document.getElementById('admin-questions-list');
    if (!host) return;

    if (!questions.length) {
        host.innerHTML = '<div class="admin-sheet-empty" style="background:#fff; border-radius:16px; padding:32px; text-align:center;">No hay preguntas para mostrar con este filtro.</div>';
        return;
    }

    host.innerHTML = questions.map((item) => {
        const who = escapeHtml(item.author_name || 'Cliente anónimo');
        const body = escapeHtml(item.body || '');
        const hasAnswer = Boolean(item.answer && item.status === 'approved');
        const answer = escapeHtml(item.answer || '');
        const dateStr = item.created_at
            ? new Date(item.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
            : 'Reciente';

        return `
            <article class="admin-q-card ${hasAnswer ? 'is-answered' : 'is-pending'}" data-id="${escapeHtml(item.id)}">
                <div class="admin-q-head">
                    <span class="admin-q-author"><i class="fas fa-user-circle"></i> ${who}</span>
                    <div class="admin-q-meta">
                        <span class="admin-q-date"><i class="far fa-clock"></i> ${dateStr}</span>
                        <span class="status-pill ${hasAnswer ? 'is-active' : ''}" style="${hasAnswer ? '' : 'background:#FEECE0; color:#D35400;'}">
                            ${hasAnswer ? '<i class="fas fa-check-circle"></i> Respondida' : '<i class="fas fa-hourglass-half"></i> Pendiente'}
                        </span>
                    </div>
                </div>

                <div class="admin-q-body">
                    <strong>Pregunta del cliente:</strong> "${body}"
                </div>

                ${hasAnswer ? `
                    <div class="admin-q-answer-published" id="q-answer-box-${escapeHtml(item.id)}">
                        <strong><i class="fas fa-comment-dots"></i> Respuesta oficial publicada en la tienda:</strong>
                        <p>${answer}</p>
                    </div>
                ` : ''}

                <div class="admin-q-reply-box">
                    <label for="q-reply-${escapeHtml(item.id)}"><i class="fas fa-reply"></i> ${hasAnswer ? 'Editar respuesta oficial:' : 'Escribir respuesta oficial de YogurASO:'}</label>
                    <textarea class="admin-q-textarea" id="q-reply-${escapeHtml(item.id)}" rows="2" placeholder="Escribe aquí la respuesta para el cliente...">${hasAnswer ? escapeHtml(item.answer) : ''}</textarea>
                    
                    <div class="admin-q-actions">
                        <button type="button" class="btn btn-secondary btn-del-q" data-id="${escapeHtml(item.id)}" title="Eliminar pregunta" style="color: #C3343E;">
                            <i class="fas fa-trash-alt"></i> Eliminar
                        </button>
                        <button type="button" class="btn btn-primary btn-save-q-reply" data-id="${escapeHtml(item.id)}">
                            <i class="fas fa-paper-plane"></i> ${hasAnswer ? 'Actualizar respuesta' : 'Responder y publicar'}
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    host.querySelectorAll('.btn-save-q-reply').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const textarea = document.getElementById(`q-reply-${id}`);
            const replyText = textarea?.value.trim();
            if (!replyText) {
                toast('Escribe una respuesta antes de guardar', 'warning');
                textarea?.focus();
                return;
            }
            btn.disabled = true;
            await guardarRespuestaPregunta(id, replyText);
            btn.disabled = false;
        });
    });

    host.querySelectorAll('.btn-del-q').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const ok = confirmAction
                ? await confirmAction({
                    title: 'Eliminar pregunta',
                    message: '¿Estás seguro de eliminar esta pregunta?',
                    confirmText: 'Sí, eliminar',
                    cancelText: 'Cancelar',
                    danger: true
                })
                : window.confirm('¿Eliminar esta pregunta?');

            if (!ok) return;
            btn.disabled = true;
            await eliminarPregunta(id);
        });
    });
}

export async function guardarRespuestaPregunta(id, answer) {
    const qIdx = state.questions.findIndex((q) => String(q.id) === String(id));
    if (qIdx !== -1) {
        state.questions[qIdx].answer = answer;
        state.questions[qIdx].status = 'approved';
        state.questions[qIdx].updated_at = new Date().toISOString();
    }

    try {
        const sb = await import('../supabase-client.js').then((m) => m.obtenerSupabase()).catch(() => null);
        if (sb) {
            await sb.from('faq_questions').update({ answer, status: 'approved' }).eq('id', id);
        }
    } catch (_) {}

    try {
        const local = JSON.parse(localStorage.getItem(STORAGE_IX_KEY) || '{}');
        local.questions = Array.isArray(local.questions) ? local.questions : [];
        const locIdx = local.questions.findIndex((q) => String(q.id) === String(id));
        if (locIdx !== -1) {
            local.questions[locIdx].answer = answer;
            local.questions[locIdx].status = 'approved';
        } else if (qIdx !== -1) {
            local.questions.unshift(state.questions[qIdx]);
        }
        localStorage.setItem(STORAGE_IX_KEY, JSON.stringify(local));
    } catch (_) {}

    toast('Respuesta publicada con éxito', 'success');
    updateQuestionStats();
    renderAdminQuestions(getVisibleQuestions());
}

export async function eliminarPregunta(id) {
    state.questions = state.questions.filter((q) => String(q.id) !== String(id));

    try {
        const sb = await import('../supabase-client.js').then((m) => m.obtenerSupabase()).catch(() => null);
        if (sb) await sb.from('faq_questions').delete().eq('id', id);
    } catch (_) {}

    try {
        const local = JSON.parse(localStorage.getItem(STORAGE_IX_KEY) || '{}');
        if (Array.isArray(local.questions)) {
            local.questions = local.questions.filter((q) => String(q.id) !== String(id));
            localStorage.setItem(STORAGE_IX_KEY, JSON.stringify(local));
        }
    } catch (_) {}

    toast('Pregunta eliminada', 'success');
    updateQuestionStats();
    renderAdminQuestions(getVisibleQuestions());
}
