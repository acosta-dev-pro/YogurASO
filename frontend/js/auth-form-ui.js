/**
 * auth-form-ui.js — detalles de interfaz de login y registro.
 * · Errores en línea (en lugar de la burbuja del navegador) con los mismos
 *   requisitos de cada campo (required, type, minlength).
 * · En registro, "Confirmar contraseña" avisa si no coincide.
 * · Botón Ver / Ocultar contraseña.
 * No envía nada ni toca la lógica de auth.js: el envío y la validación del
 * servidor siguen allí.
 */
(function () {
    'use strict';

    var MESSAGES = {
        email: { valueMissing: 'Escribe tu correo.', typeMismatch: 'Revisa el correo, falta algo.' },
        password: { valueMissing: 'Escribe tu contraseña.', tooShort: 'Usa al menos 8 caracteres.' },
        'confirm-password': { valueMissing: 'Repite la contraseña.', tooShort: 'Usa al menos 8 caracteres.' },
        nombre: { valueMissing: 'Escribe tu nombre.' },
        apellido: { valueMissing: 'Escribe tu apellido.' },
        telefono: { patternMismatch: 'Revisa el número.' },
        terminos: { valueMissing: 'Acepta el tratamiento de datos para continuar.' }
    };

    function messageFor(input) {
        var v = input.validity;
        var m = MESSAGES[input.id] || {};
        if (v.customError) return input.validationMessage;
        if (v.valueMissing) return m.valueMissing || 'Este campo es obligatorio.';
        if (v.typeMismatch) return m.typeMismatch || 'Revisa este dato.';
        if (v.tooShort) return m.tooShort || 'Es muy corto.';
        if (v.patternMismatch) return m.patternMismatch || 'Revisa este dato.';
        return input.validationMessage || 'Revisa este dato.';
    }

    function errorEl(input) {
        var id = input.id + '-error';
        var el = document.getElementById(id);
        if (el) return el;
        el = document.createElement('p');
        el.className = 'ya-error';
        el.id = id;
        el.hidden = true;
        el.setAttribute('aria-live', 'polite');
        var host = input.closest('.ya-field') || input.closest('.ya-check');
        if (!host) return null;
        if (host.classList.contains('ya-check')) host.insertAdjacentElement('afterend', el);
        else host.appendChild(el);
        var describedBy = (input.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
        if (describedBy.indexOf(id) === -1) describedBy.push(id);
        input.setAttribute('aria-describedby', describedBy.join(' '));
        return el;
    }

    function showError(input) {
        var el = errorEl(input);
        if (!el) return;
        el.textContent = messageFor(input);
        el.hidden = false;
        input.setAttribute('aria-invalid', 'true');
    }

    function clearError(input) {
        var el = document.getElementById(input.id + '-error');
        if (el) el.hidden = true;
        input.removeAttribute('aria-invalid');
    }

    function setupForm(form) {
        var firstInvalid = null;
        var raf = 0;

        form.addEventListener('invalid', function (e) {
            var input = e.target;
            e.preventDefault();
            showError(input);
            if (!firstInvalid) firstInvalid = input;
            if (!raf) {
                raf = requestAnimationFrame(function () {
                    if (firstInvalid) firstInvalid.focus({ preventScroll: false });
                    firstInvalid = null;
                    raf = 0;
                });
            }
        }, true);

        form.addEventListener('input', function (e) {
            var input = e.target;
            if (input.getAttribute('aria-invalid') === 'true' && input.checkValidity()) clearError(input);
        });
        form.addEventListener('change', function (e) {
            var input = e.target;
            if (input.type === 'checkbox' && input.checked) clearError(input);
        });
        form.addEventListener('focusout', function (e) {
            var input = e.target;
            if (!input.matches || !input.matches('.ya-input')) return;
            if (!input.value) return; // no regañar campos vacíos al pasar
            if (input.checkValidity()) clearError(input);
            else showError(input);
        });

        // Registro: confirmar contraseña
        var pass = form.querySelector('#password');
        var confirm = form.querySelector('#confirm-password');
        if (pass && confirm) {
            var sync = function () {
                confirm.setCustomValidity(confirm.value && confirm.value !== pass.value ? 'Las contraseñas no coinciden.' : '');
                if (confirm.getAttribute('aria-invalid') === 'true') {
                    if (confirm.checkValidity()) clearError(confirm);
                    else showError(confirm);
                }
            };
            pass.addEventListener('input', sync);
            confirm.addEventListener('input', sync);
        }
    }

    function setupEyes() {
        document.querySelectorAll('[data-ya-eye]').forEach(function (btn) {
            var input = document.getElementById(btn.getAttribute('aria-controls'));
            if (!input) return;
            btn.addEventListener('click', function () {
                var show = input.type === 'password';
                input.type = show ? 'text' : 'password';
                btn.textContent = show ? 'Ocultar' : 'Ver';
                btn.setAttribute('aria-pressed', show ? 'true' : 'false');
                btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
            });
        });
    }

    function init() {
        document.querySelectorAll('form.ya-form').forEach(setupForm);
        setupEyes();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
