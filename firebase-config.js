// 1. Andá a https://console.firebase.google.com y creá un proyecto (o usá uno existente).
// 2. Menú izquierdo > Authentication > Get started > Sign-in method > habilitá "Email/Password".
// 3. Menú izquierdo > Firestore Database > Create database > modo producción (las reglas
//    de seguridad están en firestore.rules, en la raíz del proyecto: pegalas en
//    Firestore Database > Reglas y publicá).
// 4. Configuración del proyecto (ícono de engranaje) > General > "Tus apps" > ícono web </> > registrá una app.
// 5. Firebase te muestra un objeto firebaseConfig: copiá esos valores acá abajo, reemplazando los TU_XXX.
// 6. (Recomendado) En Authentication > Settings > Authorized domains, agregá el dominio que te dé Vercel
//    (ej. amplificado.vercel.app) cuando lo tengas — localhost ya viene habilitado por defecto.

var firebaseConfig = {
  apiKey: "AIzaSyDIMufpoNAw3vANigSLlWnzb04X1b6yo38",
  authDomain: "amplificado-ed863.firebaseapp.com",
  projectId: "amplificado-ed863",
  storageBucket: "amplificado-ed863.firebasestorage.app",
  messagingSenderId: "143495908960",
  appId: "1:143495908960:web:8adf103cfa55bc9a60bd05"
};

firebase.initializeApp(firebaseConfig);
