
import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAJRLTZyy-bPtHg9IKiwfQvVCTVG1Ns",
  authDomain: "zola-95ff6.firebaseapp.com",
  projectId: "zola-95ff6",
  storageBucket: "zola-95ff6.appspot.com",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id",
  measurementId: "your_measurement_id"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, RecaptchaVerifier, signInWithPhoneNumber };
