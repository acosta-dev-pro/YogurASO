# Archivos eliminados

Todo se borró con `git rm` en la rama `redesign/yoguraso-v2`, en commits separados por categoría. Nada se subió a GitHub. La copia completa está en `C:\Users\acost\Desktop\YOGURASO-BACKUP-2026-10-04.zip` y también en la historia de Git (rama `main`).

Para recuperar un archivo concreto: `git checkout main -- ruta/del/archivo`.

## 1. Carpeta `backup/` (2 archivos)

| Archivo | Por qué |
|---------|---------|
| `backup/index.html` | Copia vieja de la portada. Nada la referencia. `.gitignore` ya la excluía, pero Git la seguía versionando |
| `backup/styles.css.bak` | Copia vieja de estilos. 0 referencias |

## 2. Máquina virtual Ubuntu (14 archivos)

Todo el grupo se llamaba entre sí y nada fuera del grupo lo usaba: ni `package.json`, ni el README, ni las pruebas, ni el workflow de Pages, ni el backend, ni los documentos del taller. `INICIAR-YOGURASO.bat` (que sí se conserva) no los llama.

| Archivo | Para qué servía |
|---------|-----------------|
| `ABRIR-YOGURASO-AA5.bat` | Lanzaba `ubuntu-auto-docker-raro.ps1` |
| `scripts/ubuntu-auto-docker-raro.ps1` | Montaba la web en Ubuntu con Docker |
| `scripts/iniciar-todo-aa5.ps1`, `iniciar-ubuntu-vm.ps1`, `deploy-ubuntu-aa5.ps1`, `arreglar-firefox-ubuntu.ps1` | Arrancaban y arreglaban la máquina virtual |
| `scripts/deploy-standalone.sh`, `deploy-ubuntu-raro.sh`, `ubuntu-aa5-deploy.sh`, `abrir-yoguraso-firefox.sh` | Se ejecutaban dentro de Ubuntu |
| `scripts/aa5-one.txt`, `aa5-step1.txt`, `aa5-step2.txt`, `aa5-step3.txt` | Comandos para pegar en la máquina virtual |

Motivo extra: varios de estos archivos escribían la contraseña de la máquina virtual en texto plano.

La carpeta `scripts/` quedó vacía y Git ya no la muestra.

## 3. Imágenes sin referencias (10 archivos, 15,6 MB)

Se buscó cada nombre y la ruta `assets/img/` en HTML, CSS, JS, SQL, pruebas, workflow, README, documentos y los 60 archivos de texto de `docs/taller-pruebas`. Cero coincidencias.

| Archivo | Tamaño |
|---------|--------|
| `frontend/assets/img/BG.png` | 1.642.481 |
| `frontend/assets/img/Cafe.png` | 1.637.221 |
| `frontend/assets/img/Frutos Rojos.png` | 1.533.768 |
| `frontend/assets/img/Guanabana.png` | 1.394.978 |
| `frontend/assets/img/Mango.png` | 1.348.498 |
| `frontend/assets/img/Melocoton.png` | 1.282.797 |
| `frontend/assets/img/Mora.png` | 1.355.734 |
| `frontend/assets/img/Piña.png` | 1.386.082 |
| `frontend/assets/img/Yogurt Griego.png` | 1.343.480 |
| `frontend/assets/img/tazon.png` | 3.481.624 |

Quedan en `frontend/assets/img/` solo las 4 que usa `index.html`: `Fresa.png`, `fresa sin fondo.png`, `leche.jpg` y `fresitas.png`.

## Lo que NO se borró (y por qué)

| Qué | Por qué |
|-----|---------|
| `backend/`, `database/` | Se necesitan hasta tener paridad con Supabase |
| `frontend/` (HTML, CSS, JS en uso) | La web actual sigue funcionando |
| `tests/`, `.github/workflows/pages.yml` | Pruebas y publicación |
| `docs/taller-pruebas/` | Tareas del SENA |
| `INICIAR-YOGURASO.bat` | Es la forma de abrir la web hoy en Windows |
| `fresa sin fondo.png` (duplicado de `Fresa.png`) | Las dos las usa `index.html`; se resuelve al rediseñar el hero |
| Código muerto dentro de `api.js` y `styles.css` | Estarían en archivos que se reescriben; ver `INFORME_AUDITORIA.md` |

## Comprobación

Después de borrar se recorrió todo `frontend/` con un script que revisa cada `src`, `href`, `content` de imagen, `url(...)`, `@import` e `import` de HTML, CSS y JS y comprueba que el archivo existe: **206 referencias locales revisadas**.

Resultado: las mismas 13 "rotas" que había **antes** de borrar nada, y ninguna nueva.

- 4 son los `@font-face` de `styles.css` hacia `font/*.ttf`, una carpeta que nunca existió (ya estaba anotado como código muerto).
- 9 son texto como `'pages/login.html'` dentro de `auth.js`, `api.js`, `cart.js` y `cart_view.js`. Se usan para redirigir desde la página que está abierta, así que dependen de dónde esté la página y el script no puede resolverlas; no son enlaces rotos.

Ninguna imagen, hoja de estilo ni script tiene referencia rota. `index.html` sigue encontrando sus 4 imágenes.

No se pudo abrir la web en un navegador ni correr `npm test`: Playwright no tiene Chromium instalado en este PC y no se instalaron dependencias en esta fase. Queda pendiente correr `npx playwright install chromium` y `npm test` cuando lo autorices.