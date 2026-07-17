/**
 * utils.js — Utilidades compartidas
 * escapeHtml, formatCOP, toasts, confirmaciones y applySiteConfig (logo/footer/WA).
 */
(function () {
    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatCOP(amount) {
        return `$${Number(amount || 0).toLocaleString('es-CO')}`;
    }

    function getConfig() {
        return window.YOGUR_CONFIG || {};
    }

    const TOAST_ICONS = {
        success: 'fa-check',
        error: 'fa-exclamation',
        info: 'fa-info',
        warning: 'fa-exclamation-triangle'
    };

    function showToast(message, type = 'success') {
        const existing = document.querySelectorAll('.toast-notification');
        existing.forEach((el) => el.remove());

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type} show`;
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.innerHTML = `
            <div class="toast-icon"><i class="fas ${TOAST_ICONS[type] || TOAST_ICONS.info}"></i></div>
            <div class="toast-message"><strong>${escapeHtml(message)}</strong></div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 280);
        }, type === 'error' ? 2800 : 1800);
    }

    function confirmAction({
        title = 'Confirmar',
        message = '¿Estás seguro?',
        confirmText = 'Confirmar',
        cancelText = 'Cancelar',
        danger = false
    } = {}) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'confirm-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-labelledby', 'confirm-title');
            overlay.innerHTML = `
                <div class="confirm-dialog">
                    <h3 id="confirm-title">${escapeHtml(title)}</h3>
                    <p>${escapeHtml(message)}</p>
                    <div class="confirm-actions">
                        <button type="button" class="confirm-cancel">${escapeHtml(cancelText)}</button>
                        <button type="button" class="confirm-ok ${danger ? 'is-danger' : ''}">${escapeHtml(confirmText)}</button>
                    </div>
                </div>
            `;

            const close = (value) => {
                overlay.remove();
                document.removeEventListener('keydown', onKey);
                resolve(value);
            };

            const onKey = (e) => {
                if (e.key === 'Escape') close(false);
            };

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) close(false);
            });
            overlay.querySelector('.confirm-cancel').addEventListener('click', () => close(false));
            overlay.querySelector('.confirm-ok').addEventListener('click', () => close(true));
            document.addEventListener('keydown', onKey);
            document.body.appendChild(overlay);
            overlay.querySelector('.confirm-ok').focus();
        });
    }

    function applySiteConfig() {
        const cfg = getConfig();
        const name = cfg.COMPANY_NAME || 'YogurASO';
        const waNumber = cfg.WHATSAPP_NUMBER || '573001234567';
        const waDisplay = cfg.WHATSAPP_DISPLAY || waNumber;
        const email = cfg.COMPANY_EMAIL || 'hola@yoguraso.co';
        const location = cfg.COMPANY_LOCATION || 'Colombia';
        const tagline = cfg.COMPANY_TAGLINE || '';
        const ig = cfg.INSTAGRAM || '#';
        const fb = cfg.FACEBOOK || '#';

        document.querySelectorAll('[data-config="company-name"]').forEach((el) => {
            el.textContent = name;
        });
        document.querySelectorAll('[data-config="company-tagline"]').forEach((el) => {
            el.innerHTML = tagline.replace(/\n/g, '<br>');
        });
        document.querySelectorAll('[data-config="company-email"]').forEach((el) => {
            el.textContent = email;
            if (el.tagName === 'A') el.href = `mailto:${email}`;
        });
        document.querySelectorAll('[data-config="company-location"]').forEach((el) => {
            el.textContent = location;
        });
        document.querySelectorAll('[data-config="whatsapp-display"]').forEach((el) => {
            el.textContent = waDisplay;
        });
        document.querySelectorAll('a[data-config="instagram"]').forEach((el) => {
            el.href = ig;
        });
        document.querySelectorAll('a[data-config="facebook"]').forEach((el) => {
            el.href = fb;
        });
        document.querySelectorAll('a[data-config="whatsapp"]').forEach((el) => {
            const text = el.dataset.waText || `Hola ${name}`;
            el.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
        });
    }

    window.YogurUtils = {
        escapeHtml,
        formatCOP,
        getConfig,
        showToast,
        confirmAction,
        applySiteConfig
    };

    document.addEventListener('DOMContentLoaded', applySiteConfig);
})();
