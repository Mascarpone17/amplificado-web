// Configuración de Firebase del Registro Internacional del Chiste.
// Es un proyecto de Firebase APARTE del de Amplificado (usuarios y datos separados).
//
// 1. Andá a https://console.firebase.google.com y creá un proyecto nuevo (ej. "registro-chistes").
// 2. Authentication > Get started > Sign-in method > habilitá "Email/Password".
// 3. Firestore Database > Create database > modo producción. Después, en Firestore Database > Reglas,
//    pegá el contenido de chistes/firestore.rules y publicá.
// 4. Configuración del proyecto (engranaje) > General > "Tus apps" > ícono web </> > registrá una app.
// 5. Copiá los valores de firebaseConfig acá abajo, reemplazando los TU_XXX.
//
// Mientras queden los TU_XXX el sitio funciona en "modo vitrina": se puede recorrer
// todo el Patrimonio, pero el registro de chistes de usuarios queda desactivado.

var firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

if(firebaseConfig.apiKey.indexOf("TU_") !== 0){
  firebase.initializeApp(firebaseConfig);
}
