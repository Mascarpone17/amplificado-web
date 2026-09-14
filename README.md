# Amplificado

Catálogo de guitarras eléctricas con login real (Firebase Authentication). Sitio estático — sin backend propio.

## 1. Configurar Firebase (login real)

1. Entrá a https://console.firebase.google.com y creá un proyecto nuevo (podés dejar Google Analytics desactivado).
2. En el menú izquierdo: **Authentication → Get started → Sign-in method → Email/Password → habilitar**.
3. Andá a **Configuración del proyecto** (ícono de engranaje, arriba a la izquierda) **→ General**.
4. Bajá hasta "Tus apps" y hacé clic en el ícono web `</>` para registrar una app (nombre: `amplificado-web`, no hace falta Firebase Hosting).
5. Firebase te muestra un objeto `firebaseConfig`. Copiá esos valores en **`firebase-config.js`**, reemplazando los `TU_XXX`.
6. Guardá el archivo. Con eso el login/registro ya funciona en local y en producción.

Opcional pero recomendado: en **Authentication → Settings → Authorized domains**, agregá el dominio que te dé Vercel en el paso 3 (ej. `amplificado.vercel.app`). `localhost` ya viene habilitado.

## 2. Probarlo en tu computadora

No hace falta instalar nada especial, es HTML/CSS/JS puro. Cualquier servidor estático simple sirve, por ejemplo:

```bash
npx serve .
```

o si tenés Ruby instalado (viene con macOS):

```bash
ruby -run -e httpd . -p 8000
```

Y abrís `http://localhost:8000`.

## 3. Subir el código a GitHub

```bash
git init
git add .
git commit -m "Catálogo Amplificado con login Firebase"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

(Creá antes el repo vacío en https://github.com/new — sin README ni .gitignore, para que no choque con el push.)

## 4. Desplegar en Vercel (el link público)

1. Entrá a https://vercel.com e iniciá sesión con tu cuenta de GitHub.
2. **Add New… → Project** y elegí el repo que acabás de subir.
3. Framework Preset: **Other** (es un sitio estático, no hace falta build command ni output directory).
4. **Deploy**.

Vercel te da una URL pública tipo `amplificado.vercel.app` — ese es el link que podés mandar a cualquiera. Cada vez que hagas `git push` a `main`, Vercel vuelve a desplegar solo.

## Estructura del proyecto

```
index.html          la app completa (vistas: login, catálogo, ficha técnica)
catalog-data.js      los datos de los 11 modelos de guitarra
firebase-config.js   tu configuración de Firebase (completala en el paso 1)
img/                 fotos de producto (Wikimedia Commons, CC BY-SA / CC BY)
```

## Notas

- El `apiKey` de Firebase que va en `firebase-config.js` **no es secreto** — está diseñado para viajar en el código del cliente. La seguridad real la dan las reglas de Firebase y el dominio autorizado, no ocultar esa clave.
- Los favoritos (☆) se guardan en el navegador de cada persona (`localStorage`), no están ligados a la cuenta todavía.
- Los modelos, precios y especificaciones del catálogo son de ejemplo.
