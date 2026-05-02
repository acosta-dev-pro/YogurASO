/* empaque.js — Aquí queda la sección Empaque.
   Solo muestra temperatura y material si están escritos en product-info.js.
   Optimizado para máxima compatibilidad con iOS Safari / Apple y navegadores móviles. */
(function () {
    var sec = document.getElementById('empaque');
    if (!sec) return;
    var I = window.YOG_INFO || {};
    var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

    sec.querySelectorAll('[data-info]').forEach(function (el) {
        var v = I[el.getAttribute('data-info')];
        var label = el.getAttribute('data-label');
        if (v) { el.innerHTML = (label ? '<b>' + esc(label) + ':</b> ' : '') + esc(v); el.hidden = false; }
        else el.hidden = true;
    });

    var video = sec.querySelector('.emp__video');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

    function stillPoster() {
        if (!video) return;
        video.pause();
        video.removeAttribute('autoplay');
        video.preload = 'none';
        video.load(); // vuelve a mostrar el póster
    }
    if (video && reduce && reduce.matches) stillPoster();
    if (reduce && reduce.addEventListener) reduce.addEventListener('change', function (e) { if (e.matches) stillPoster(); });

    sec.classList.add('is-js');
    var shown = false;
    function show() { if (shown) return; shown = true; sec.classList.add('is-in'); }
    if (!('IntersectionObserver' in window)) { show(); return; }
    new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) { if (en.isIntersecting) { show(); obs.disconnect(); } });
    }, { threshold: 0.01, rootMargin: '120px 0px 80px 0px' }).observe(sec);
    window.setTimeout(show, 900);

    if (video) {
        // Configuración imperativa estricta para iOS WebKit / Safari
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');

        // En iPhone / iOS Safari, el decodificador de video ignora el canal alfa de WebM VP9
        // (mostrando fondo negro #000000) o usa MP4 sin transparencia.
        // Si detectamos fondo opaco en la esquina (2,2), proyectamos el video en un <canvas>
        // con recorte de luminancia en tiempo real para que el fondo sea 100% transparente.
        var canvas = null;
        var gl = null;
        var glProg = null;
        var glTex = null;
        var ctx2d = null;
        var rafId = 0;
        var isVisible = false;
        var chromaChecked = false;
        var needsChromaKey = false;
        var bgIsDark = true;

        function initWebGLKeyer(cvs) {
            try {
                var context = cvs.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true });
                if (!context) return false;
                var vsSrc = 'attribute vec2 a_pos; varying vec2 v_uv; void main(){ v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5); gl_Position = vec4(a_pos, 0.0, 1.0); }';
                var fsSrc = [
                    'precision mediump float;',
                    'varying vec2 v_uv;',
                    'uniform sampler2D u_tex;',
                    'uniform float u_darkBg;',
                    'void main(){',
                    '  vec4 c = texture2D(u_tex, v_uv);',
                    '  if (u_darkBg > 0.5) {',
                    '    float m = max(max(c.r, c.g), c.b);',
                    '    float a = smoothstep(0.035, 0.165, m);',
                    '    vec3 rgb = a > 0.001 ? clamp(c.rgb / max(a, 0.12), 0.0, 1.0) : vec3(0.0);',
                    '    gl_FragColor = vec4(rgb * a, a);',
                    '  } else {',
                    '    vec3 key = vec3(1.0, 0.9725, 0.9568);',
                    '    float dist = distance(c.rgb, key);',
                    '    float edge = min(min(v_uv.x, 1.0 - v_uv.x), min(v_uv.y, 1.0 - v_uv.y));',
                    '    float a = edge < 0.08 ? smoothstep(0.02, 0.09, dist) : 1.0;',
                    '    gl_FragColor = vec4(c.rgb * a, a);',
                    '  }',
                    '}'
                ].join('\n');

                function compile(type, src) {
                    var s = context.createShader(type);
                    context.shaderSource(s, src);
                    context.compileShader(s);
                    if (!context.getShaderParameter(s, context.COMPILE_STATUS)) return null;
                    return s;
                }
                var vs = compile(context.VERTEX_SHADER, vsSrc);
                var fs = compile(context.FRAGMENT_SHADER, fsSrc);
                if (!vs || !fs) return false;

                var prog = context.createProgram();
                context.attachShader(prog, vs);
                context.attachShader(prog, fs);
                context.linkProgram(prog);
                if (!context.getProgramParameter(prog, context.LINK_STATUS)) return false;

                context.useProgram(prog);
                var buf = context.createBuffer();
                context.bindBuffer(context.ARRAY_BUFFER, buf);
                context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), context.STATIC_DRAW);
                var aPos = context.getAttribLocation(prog, 'a_pos');
                context.enableVertexAttribArray(aPos);
                context.vertexAttribPointer(aPos, 2, context.FLOAT, false, 0, 0);

                var tex = context.createTexture();
                context.bindTexture(context.TEXTURE_2D, tex);
                context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
                context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
                context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
                context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);

                gl = context;
                glProg = prog;
                glTex = tex;
                return true;
            } catch (_) {
                return false;
            }
        }

        function renderCanvasFrame() {
            rafId = 0;
            if (!needsChromaKey || !canvas || !isVisible) return;
            if (video.readyState >= 2 && !video.paused && !video.ended) {
                var vw = video.videoWidth || 520;
                var vh = video.videoHeight || 720;
                if (canvas.width !== vw || canvas.height !== vh) {
                    canvas.width = vw;
                    canvas.height = vh;
                    if (gl) gl.viewport(0, 0, vw, vh);
                }
                if (gl && glProg && glTex) {
                    gl.clearColor(0, 0, 0, 0);
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    gl.bindTexture(gl.TEXTURE_2D, glTex);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
                    var uDark = gl.getUniformLocation(glProg, 'u_darkBg');
                    gl.uniform1f(uDark, bgIsDark ? 1.0 : 0.0);
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                } else if (ctx2d) {
                    ctx2d.clearRect(0, 0, vw, vh);
                    ctx2d.drawImage(video, 0, 0, vw, vh);
                    var imgData = ctx2d.getImageData(0, 0, vw, vh);
                    var d = imgData.data;
                    if (bgIsDark) {
                        for (var i = 0; i < d.length; i += 4) {
                            var m = Math.max(d[i], d[i + 1], d[i + 2]);
                            if (m < 12) {
                                d[i + 3] = 0;
                            } else if (m < 42) {
                                d[i + 3] = Math.round(((m - 12) / 30) * 255);
                            }
                        }
                    }
                    ctx2d.putImageData(imgData, 0, 0);
                }
            }
            if (isVisible && !video.paused) {
                rafId = window.requestAnimationFrame(renderCanvasFrame);
            }
        }

        function checkVideoTransparency() {
            if (chromaChecked || video.readyState < 2) return;
            try {
                var probe = document.createElement('canvas');
                probe.width = 8;
                probe.height = 8;
                var pctx = probe.getContext('2d');
                pctx.drawImage(video, 0, 0, 8, 8);
                var px = pctx.getImageData(1, 1, 1, 1).data;
                chromaChecked = true;
                // Si el píxel de la esquina ya es transparente (alpha < 20), el navegador soporta WebM alpha nativo
                if (px[3] < 20) {
                    needsChromaKey = false;
                    return;
                }
                // Si el píxel de la esquina es opaco (ej. negro #000 en iPhone/iOS), activar canvas transparente
                needsChromaKey = true;
                bgIsDark = (px[0] < 80 && px[1] < 80 && px[2] < 80);
                canvas = document.createElement('canvas');
                canvas.className = 'emp__video emp__canvas';
                canvas.width = video.videoWidth || 520;
                canvas.height = video.videoHeight || 720;
                canvas.setAttribute('aria-hidden', 'true');
                if (!initWebGLKeyer(canvas)) {
                    ctx2d = canvas.getContext('2d', { willReadFrequently: true });
                }
                video.parentNode.insertBefore(canvas, video);
                video.classList.add('is-canvas-source');
                if (isVisible && !rafId) {
                    rafId = window.requestAnimationFrame(renderCanvasFrame);
                }
            } catch (_) {}
        }

        video.addEventListener('loadeddata', checkVideoTransparency);
        video.addEventListener('playing', function () {
            checkVideoTransparency();
            if (needsChromaKey && isVisible && !rafId) {
                rafId = window.requestAnimationFrame(renderCanvasFrame);
            }
        });

        var tryPlay = function () {
            if (reduce && reduce.matches) return;
            var p = video.play();
            if (p && p.catch) {
                p.catch(function () {
                    // Si iOS bloquea autoplay por Modo de Bajo Consumo, desbloquear con el primer toque
                    var unlock = function () {
                        video.play().catch(function () {});
                        window.removeEventListener('touchstart', unlock);
                        window.removeEventListener('click', unlock);
                    };
                    window.addEventListener('touchstart', unlock, { passive: true, once: true });
                    window.addEventListener('click', unlock, { passive: true, once: true });
                });
            }
        };

        var hasPlayedOnce = false;
        new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (reduce && reduce.matches) return;
                isVisible = en.isIntersecting;
                if (en.isIntersecting) {
                    hasPlayedOnce = true;
                    tryPlay();
                    if (needsChromaKey && !rafId) {
                        rafId = window.requestAnimationFrame(renderCanvasFrame);
                    }
                } else if (hasPlayedOnce) {
                    video.pause();
                    if (rafId) {
                        window.cancelAnimationFrame(rafId);
                        rafId = 0;
                    }
                }
            });
        }, { threshold: 0.05, rootMargin: '160px 0px 160px 0px' }).observe(sec);
    }
})();
