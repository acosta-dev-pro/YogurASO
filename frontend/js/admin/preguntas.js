/**
 * admin/preguntas.js — Preguntas que la gente deja en el FAQ del home
 * (tabla faq_questions). Publicar, ocultar y responder.
 */
import { esc, fmtDate, initials, STATUS_Q } from './shared.js';
import { listQuestions, setQuestionStatus, answerQuestion } from './data.js';

export function mountPreguntas(ctx) {
    const $ = (id) => document.getElementById(id);
    let data = null; // { questions, canAnswer } | { error, needs }
    let filter = 'pending';
    let loading = null;

    async function load() {
        if (!loading) {
            loading = listQuestions().then((res) => {
                data = res.success
                    ? { questions: res.questions, canAnswer: res.canAnswer }
                    : { error: res.message, needs: res.needs };
                loading = null;
                const pending = data.questions ? data.questions.filter((q) => q.status === 'pending').length : null;
                ctx.setQuestionCount(pending);
            });
        }
        return loading;
    }

    function counts() {
        const c = { pending: 0, approved: 0, hidden: 0 };
        (data?.questions || []).forEach((q) => { c[q.status] = (c[q.status] || 0) + 1; });
        return c;
    }

    function renderSide() {
        const host = $('q-side');
        const c = counts();
        const all = data?.questions || [];
        const onlyApproved = all.length > 0 && all.every((q) => q.status === 'approved');
        host.innerHTML = `
            <h2>Lo que pregunta la gente</h2>
            <p>Llegan desde «¿Tienes otra pregunta?» en el inicio. Nada se publica hasta que tú lo apruebes.</p>
            ${data?.questions ? `
            <ul class="adm-qcounts">
                <li><span class="adm-dot is-warn"></span>Por revisar <strong>${c.pending}</strong></li>
                <li><span class="adm-dot is-on"></span>Publicadas <strong>${c.approved}</strong></li>
                <li><span class="adm-dot"></span>Ocultas <strong>${c.hidden}</strong></li>
            </ul>` : ''}
            ${data && data.canAnswer === false ? '<p class="adm-note">Para guardar respuestas falta un campo en la base. Mientras tanto puedes publicar u ocultar.</p>' : ''}
            ${onlyApproved ? '<p class="adm-note">Solo se ven las publicadas: la base todavía no deja que el admin lea las pendientes.</p>' : ''}
            <p class="adm-muted">Los mensajes de Contacto y de distribuidores llegan a WhatsApp, no a este panel.</p>`;
    }

    function itemHtml(q) {
        const name = q.author_name || 'Sin nombre';
        const canAnswer = data.canAnswer !== false;
        return `
            <article class="adm-q is-${esc(q.status)}" data-qid="${esc(q.id)}">
                <header>
                    <span class="adm-avatar" aria-hidden="true">${esc(initials(name))}</span>
                    <div><strong>${esc(name)}</strong><time datetime="${esc(q.created_at)}">${esc(fmtDate(q.created_at))}</time></div>
                    <span class="adm-qstatus is-${esc(q.status)}">${esc(STATUS_Q[q.status] || q.status)}</span>
                </header>
                <p class="adm-q-body">${esc(q.body)}</p>
                ${q.answer ? `<div class="adm-q-answer"><small>Tu respuesta${q.answered_at ? ` · ${esc(fmtDate(q.answered_at))}` : ''}</small><p>${esc(q.answer)}</p></div>` : ''}
                <form class="adm-q-form">
                    ${canAnswer ? `<label class="sr-only" for="qa-${esc(q.id)}">Respuesta</label>
                    <textarea id="qa-${esc(q.id)}" rows="2" maxlength="800" placeholder="${q.answer ? 'Cambiar la respuesta…' : 'Escribe la respuesta…'}"></textarea>` : ''}
                    <div class="adm-q-actions">
                        ${canAnswer ? '<button type="submit" class="adm-btn adm-btn--red adm-btn--sm" data-qact="answer">Responder y publicar</button>' : ''}
                        ${q.status !== 'approved' ? '<button type="button" class="adm-btn adm-btn--sm" data-qact="approved">Publicar</button>' : ''}
                        ${q.status !== 'hidden' ? '<button type="button" class="adm-btn adm-btn--sm adm-btn--ghost" data-qact="hidden">Ocultar</button>' : ''}
                        ${q.status === 'hidden' ? '<button type="button" class="adm-btn adm-btn--sm adm-btn--ghost" data-qact="pending">Volver a revisar</button>' : ''}
                    </div>
                </form>
            </article>`;
    }

    function renderList() {
        const host = $('q-list');
        document.querySelectorAll('#q-filters [data-q]').forEach((b) => b.classList.toggle('is-on', b.dataset.q === filter));
        if (!data) {
            host.innerHTML = '<p class="adm-empty">Cargando preguntas…</p>';
            return;
        }
        if (data.error) {
            host.innerHTML = `<div class="adm-emptybox"><strong>${esc(data.error)}</strong>
                <p>${data.needs === 'tabla' ? 'Cuando la base tenga la tabla de preguntas, aquí las ves y las respondes.' : 'Intenta de nuevo con «Actualizar».'}</p></div>`;
            return;
        }
        const q = ctx.query().trim().toLowerCase();
        const list = data.questions.filter((x) => (!filter || x.status === filter)
            && (!q || `${x.body} ${x.author_name || ''} ${x.answer || ''}`.toLowerCase().includes(q)));
        const empty = { pending: 'No hay preguntas por revisar.', approved: 'Aún no hay preguntas publicadas.', hidden: 'No hay preguntas ocultas.', '': 'Todavía nadie ha preguntado.' };
        host.innerHTML = list.length ? list.map(itemHtml).join('') : `<p class="adm-empty">${q ? 'Ninguna pregunta coincide con la búsqueda.' : empty[filter]}</p>`;
    }

    function render() {
        renderSide();
        renderList();
    }

    async function act(id, action, form) {
        const buttons = form.querySelectorAll('button');
        buttons.forEach((b) => { b.disabled = true; });
        let res;
        if (action === 'answer') {
            const text = form.querySelector('textarea')?.value.trim();
            if (!text) {
                buttons.forEach((b) => { b.disabled = false; });
                ctx.toast('Escribe la respuesta antes de enviarla', 'error');
                form.querySelector('textarea')?.focus();
                return;
            }
            res = await answerQuestion(id, text, { publish: true });
        } else {
            res = await setQuestionStatus(id, action);
        }
        buttons.forEach((b) => { b.disabled = false; });
        if (!res.success) {
            ctx.toast(res.message || 'No se pudo guardar', 'error');
            return;
        }
        ctx.toast({ answer: 'Respuesta guardada y publicada', approved: 'Pregunta publicada', hidden: 'Pregunta oculta', pending: 'Pregunta en revisión' }[action], 'success');
        await load();
        render();
    }

    $('q-filters').addEventListener('click', (e) => {
        const b = e.target.closest('[data-q]');
        if (!b) return;
        filter = b.dataset.q;
        renderList();
    });
    $('btn-reload-questions').addEventListener('click', async () => {
        data = null;
        render();
        await load();
        render();
    });
    $('q-list').addEventListener('click', (e) => {
        const b = e.target.closest('[data-qact]');
        if (!b || b.type === 'submit') return;
        const art = b.closest('[data-qid]');
        act(Number(art.dataset.qid), b.dataset.qact, art.querySelector('form'));
    });
    $('q-list').addEventListener('submit', (e) => {
        e.preventDefault();
        const art = e.target.closest('[data-qid]');
        if (art) act(Number(art.dataset.qid), 'answer', e.target);
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
        refreshCount: () => load().then(() => { if (document.body.dataset.view === 'preguntas') render(); }),
        data: async () => {
            if (!data) await load();
            return data?.questions || [];
        }
    };
}
