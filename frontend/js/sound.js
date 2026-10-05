/**
 * sound.js — Espacio preparado para sonidos suaves de la interfaz (clic, cambio de sabor).
 * Hoy NO hay archivos de audio: el módulo no carga ni reproduce nada, y el botón de silencio
 * solo aparece cuando se registra al menos un sonido.
 *
 * Reglas (docs/design/PLAN_MAESTRO_REDISENO.md, sección 19):
 *  - apagado por defecto; la persona lo activa con el botón
 *  - nunca se reproduce solo ni al pasar el cursor, volumen bajo
 *  - el audio se descarga recién cuando se usa por primera vez
 *
 * Para usarlo más adelante:
 *   YOGUR_SOUND.register('sabor', 'assets/sounds/sabor.mp3');
 *   YOGUR_SOUND.play('sabor');
 */
(function () {
    'use strict';
    var KEY = 'yogur-sonido';
    var registry = {};
    var cache = {};
    var button = null;
    var on = false;
    try { on = localStorage.getItem(KEY) === 'on'; } catch (e) { on = false; }

    function paint() {
        if (!button) return;
        button.setAttribute('aria-pressed', on ? 'true' : 'false');
        button.setAttribute('aria-label', on ? 'Silenciar sonidos' : 'Activar sonidos');
        button.dataset.state = on ? 'on' : 'off';
    }

    function ensureButton() {
        if (button || !Object.keys(registry).length) return;
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'sound-toggle';
        button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z"/><path class="on" d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/><path class="off" d="m16 9.5 5 5m0-5-5 5"/></svg>';
        button.addEventListener('click', function () {
            on = !on;
            try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* sin almacenamiento */ }
            paint();
        });
        document.body.appendChild(button);
        paint();
    }

    window.YOGUR_SOUND = {
        register: function (name, url) { registry[name] = url; ensureButton(); },
        play: function (name) {
            if (!on || !registry[name]) return;
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            var a = cache[name] || (cache[name] = new Audio(registry[name]));
            a.volume = 0.25;
            a.currentTime = 0;
            a.play().catch(function () { /* el navegador exige un gesto previo */ });
        },
        isOn: function () { return on; }
    };
})();
