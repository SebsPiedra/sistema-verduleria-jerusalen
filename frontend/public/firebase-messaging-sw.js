/* Se ejecuta en segundo plano aunque la página esté cerrada. */
importScripts('https://www.gstatic.com/firebasejs/13.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/13.2.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCJNmRHF8TUFk-KG3JOKCzjPoWXAKxM7w8',
  authDomain: 'verduleria-jerusalen.firebaseapp.com',
  projectId: 'verduleria-jerusalen',
  storageBucket: 'verduleria-jerusalen.firebasestorage.app',
  messagingSenderId: '782205606289',
  appId: '1:782205606289:web:231f9d8f8dcf8560886230',
});

firebase.messaging();
