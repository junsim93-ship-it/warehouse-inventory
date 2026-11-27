// The shell and the two deployed frames share the same default Auth app and session.
// The emulator test build supplies a demo project at compile time.
const emulator = typeof LOTFOLIO_TEST_EMULATORS === 'undefined' ? null : LOTFOLIO_TEST_EMULATORS;
const options = {
  apiKey: 'AIzaSyDHSvdVLhkOHWs1whqkJ4pyol69S6P5C4M',
  authDomain: 'warehouse-inventory-84fef.firebaseapp.com',
  projectId: 'warehouse-inventory-84fef',
  storageBucket: 'warehouse-inventory-84fef.firebasestorage.app',
  messagingSenderId: '148799748197',
  appId: '1:148799748197:web:01f8b6022b7e471e306e8c',
};
if (emulator)
  Object.assign(options, { projectId: 'demo-lotfolio', storageBucket: 'demo-lotfolio.appspot.com' });
export const app = firebase.initializeApp(options);
export const storeOptions = emulator ? { storageOrigin: emulator.storage } : {};
if (emulator) {
  app.auth().useEmulator(emulator.auth, { disableWarnings: true });
  app.firestore().useEmulator('127.0.0.1', emulator.firestorePort);
}
