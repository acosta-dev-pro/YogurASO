/**
 * admin/imagen.js — Procesado de imágenes del producto en el navegador: normaliza la botella al encuadre estándar
 * YogurASO (640×1110, 95 % de altura, base alineada) y comprime a WebP.
 */

/** Normaliza la imagen de la botella para que encuadre con el estándar YogurASO (640x1110, altura 1055px, base alineada). */
export function normalizeBottleImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const rawUrl = String(ev?.target?.result || '');
            if (!rawUrl) { resolve({ dataUrl: '', blob: null }); return; }
            const img = new Image();
            img.onload = () => {
                try {
                    const natW = img.naturalWidth || img.width;
                    const natH = img.naturalHeight || img.height;
                    const srcCanvas = document.createElement('canvas');
                    srcCanvas.width = natW;
                    srcCanvas.height = natH;
                    const srcCtx = srcCanvas.getContext('2d');
                    if (!srcCtx) { resolve({ dataUrl: rawUrl, blob: file }); return; }
                    srcCtx.drawImage(img, 0, 0, natW, natH);

                    let minX = natW, maxX = 0, minY = natH, maxY = 0;
                    let hasAlpha = false;
                    try {
                        const imgData = srcCtx.getImageData(0, 0, natW, natH);
                        const d = imgData.data;
                        let transpCount = 0;
                        for (let y = 0; y < natH; y++) {
                            for (let x = 0; x < natW; x++) {
                                const idx = (y * natW + x) * 4;
                                const a = d[idx + 3];
                                if (a < 240) { hasAlpha = true; transpCount++; }
                                if (a > 25) {
                                    if (x < minX) minX = x;
                                    if (x > maxX) maxX = x;
                                    if (y < minY) minY = y;
                                    if (y > maxY) maxY = y;
                                }
                            }
                        }
                        if (!hasAlpha || transpCount < (natW * natH * 0.01) || minX > maxX || minY > maxY) {
                            minX = 0; maxX = natW - 1; minY = 0; maxY = natH - 1;
                        }
                    } catch (_) {
                        minX = 0; maxX = natW - 1; minY = 0; maxY = natH - 1;
                    }

                    const boxW = Math.max(1, maxX - minX + 1);
                    const boxH = Math.max(1, maxY - minY + 1);
                    const TARGET_W = 640;
                    const TARGET_H = 1110;
                    const TARGET_BOTTLE_H = 1055;
                    const BOTTOM_PAD = 26;

                    let scale = TARGET_BOTTLE_H / boxH;
                    if (boxW * scale > TARGET_W * 0.94) {
                        scale = (TARGET_W * 0.94) / boxW;
                    }

                    const drawW = Math.round(boxW * scale);
                    const drawH = Math.round(boxH * scale);
                    const drawX = Math.round((TARGET_W - drawW) / 2);
                    const drawY = Math.round(TARGET_H - BOTTOM_PAD - drawH);

                    const destCanvas = document.createElement('canvas');
                    destCanvas.width = TARGET_W;
                    destCanvas.height = TARGET_H;
                    const destCtx = destCanvas.getContext('2d');
                    if (!destCtx) { resolve({ dataUrl: rawUrl, blob: file }); return; }
                    destCtx.clearRect(0, 0, TARGET_W, TARGET_H);
                    destCtx.drawImage(srcCanvas, minX, minY, boxW, boxH, drawX, drawY, drawW, drawH);

                    destCanvas.toBlob((blob) => {
                        const webpDataUrl = destCanvas.toDataURL('image/webp', 0.88);
                        const normalizedBlob = blob || file;
                        const normalizedFile = new File(
                            [normalizedBlob],
                            (file.name || 'botella').replace(/\.[^.]+$/, '') + '.webp',
                            { type: 'image/webp' }
                        );
                        resolve({ dataUrl: webpDataUrl, blob: normalizedFile });
                    }, 'image/webp', 0.88);
                } catch (_) {
                    resolve({ dataUrl: rawUrl, blob: file });
                }
            };
            img.onerror = () => resolve({ dataUrl: rawUrl, blob: file });
            img.src = rawUrl;
        };
        reader.onerror = () => resolve({ dataUrl: '', blob: null });
        reader.readAsDataURL(file);
    });
}

export function compressProductFileToDataUrl(file, maxW = 640, maxH = 880, quality = 0.85) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const rawUrl = String(ev?.target?.result || '');
            if (!rawUrl) { resolve(''); return; }
            const img = new Image();
            img.onload = () => {
                try {
                    let w = img.naturalWidth || img.width || 400;
                    let h = img.naturalHeight || img.height || 600;
                    const ratio = Math.min(1, maxW / w, maxH / h);
                    w = Math.max(1, Math.round(w * ratio));
                    h = Math.max(1, Math.round(h * ratio));
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) { resolve(rawUrl); return; }
                    ctx.clearRect(0, 0, w, h);
                    ctx.drawImage(img, 0, 0, w, h);
                    const webp = canvas.toDataURL('image/webp', quality);
                    resolve(webp && webp.length < rawUrl.length ? webp : rawUrl);
                } catch (_) {
                    resolve(rawUrl);
                }
            };
            img.onerror = () => resolve(rawUrl);
            img.src = rawUrl;
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
    });
}
