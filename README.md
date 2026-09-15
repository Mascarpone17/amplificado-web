# Amplificado

Red social para músicos y entusiastas de los instrumentos: publicá tu guitarra, tu
bajo, tu amplificador o cualquier instrumento, recibí likes y chatéa con otros
usuarios. Login real con Firebase Authentication, datos con Firestore. Sitio
estático — sin backend propio.

## Qué incluye

- **Perfiles**: foto, descripción y "instrumento principal / favorito".
- **Muro**: publicaciones de instrumentos de todos los usuarios, filtrables por tipo
  (guitarra eléctrica, acústica, bajo, amplificador, otro).
- **Likes**: tocás ♡ en cualquier instrumento para sumarle un like.
- **Ficha de instrumento con anclajes interactivos**: al publicar un instrumento
  cargás especificaciones libres (pastillas, mástil, diapasón, potencia, lo que
  sea) y opcionalmente las anclás con un pin sobre puntos concretos de la foto —
  ideal para guitarras personalizadas o de luthier que no siguen un modelo
  estándar. En la ficha, pasar el cursor (o tocar en mobile) sobre un pin muestra
  esa especificación.
- **Mensajes**: chat 1 a 1 en tiempo real entre usuarios, accesible desde el
  perfil de cualquier persona ("Enviar mensaje").

## 1. Configurar Firebase

1. Entrá a https://console.firebase.google.com y creá un proyecto nuevo (podés dejar Google Analytics desactivado).
2. **Authentication → Get started → Sign-in method → Email/Password → habilitar**.
3. **Firestore Database → Create database** (modo producción, elegí la región más cercana).
4. En **Firestore Database → Reglas**, pegá el contenido de [`firestore.rules`](firestore.rules) (en la raíz de este proyecto) y publicá. Sin esto nadie va a poder leer ni escribir nada.
5. **Configuración del proyecto** (ícono de engranaje, arriba a la izquierda) **→ General**.
6. Bajá hasta "Tus apps" y hacé clic en el ícono web `</>` para registrar una app (nombre: `amplificado-web`, no hace falta Firebase Hosting).
7. Firebase te muestra un objeto `firebaseConfig`. Copiá esos valores en **`firebase-config.js`**, reemplazando los `TU_XXX`.
8. Guardá el archivo. Con eso el login/registro, el muro, los likes y los mensajes ya funcionan en local y en producción.

Opcional pero recomendado: en **Authentication → Settings → Authorized domains**, agregá el dominio que te dé Vercel en el paso 3 de la sección siguiente (ej. `amplificado.vercel.app`). `localhost` ya viene habilitado.

### Sobre las fotos

Las fotos de perfil y de instrumentos se redimensionan en el navegador y se guardan
como imagen embebida directamente en el documento de Firestore (no usan Firebase
Storage), así no hace falta activar ningún servicio de pago adicional. Por eso
conviene subir fotos razonablemente livianas.

## 2. Probarlo en tu computadora

No hace falta instalar nada especial, es HTML/CSS/JS puro. Cualquier servidor estático simple sirve, por ejemplo:

```bash
npx serve .
```

o si tenés Ruby instalado (viene con macOS):

```bash
ruby -run -e httpd . -p 8000
```

Y abrís `http://localhost:8000`. Al crear tu primera cuenta te va a pedir que completes tu perfil (nombre, foto, instrumento principal, bio). Si el muro está vacío, hay un botón para cargar un catálogo de ejemplo (11 guitarras de demostración) y ver la red social en acción.

## 3. Subir el código a GitHub

```bash
git init
git add .
git commit -m "Amplificado: red social de instrumentos con Firebase"
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
index.html          la app completa (vistas: login, muro, publicar, ficha, perfil, mensajes)
app.js               toda la lógica: auth, router, feed, likes, hotspots, chat
firebase-config.js   tu configuración de Firebase (completala en el paso 1)
firestore.rules      reglas de seguridad para pegar en Firestore Database → Reglas
seed-data.js         11 instrumentos de ejemplo para poblar el muro vacío (opcional)
img/                 fotos de producto usadas por el catálogo de ejemplo (Wikimedia Commons, CC BY-SA / CC BY)
```

## Modelo de datos (Firestore)

```
users/{uid}                    displayName, bio, mainInstrument, photoData, likedInstrumentIds[]
instruments/{id}                ownerId, ownerName, type, name, brand, description,
                                 photoData, specs[{label,value}], hotspots[{specIndex,x,y}], likesCount
chats/{uidA_uidB}               participants[], participantNames{}, lastMessage, lastMessageAt
chats/{uidA_uidB}/messages/{id} senderId, text, createdAt
```

## Índices de Firestore

Dos consultas combinan un filtro con un orden (mensajes por participante + fecha,
instrumentos por dueño + fecha) y Firestore va a pedir crear un índice compuesto la
primera vez que se ejecuten. Cuando eso pase vas a ver un error en la consola del
navegador con un link tipo `https://console.firebase.google.com/.../firestore/indexes?create_composite=...`
— entrá a ese link, confirmá la creación del índice (tarda uno o dos minutos) y
recargá la página.

## Notas

- El `apiKey` de Firebase que va en `firebase-config.js` **no es secreto** — está diseñado para viajar en el código del cliente. La seguridad real la dan las reglas de Firestore (`firestore.rules`) y el dominio autorizado, no ocultar esa clave.
- No hay edición ni borrado de instrumentos publicados todavía, ni moderación de contenido — es una base para seguir iterando.
- Los datos del catálogo de ejemplo (`seed-data.js`) son de demostración; se publican bajo un usuario ficticio "Amplificado Demo".
