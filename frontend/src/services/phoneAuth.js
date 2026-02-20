import { auth } from '../config/firebase';
import { signInWithPhoneNumber, PhoneAuthProvider, RecaptchaVerifier } from 'firebase/auth';

// Helper to trigger phone verification
export async function verifyPhoneNumber(phoneNumber, setVerificationId, setError) {
  try {
    // Set up reCAPTCHA (required by Firebase)
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: (response) => {},
      }, auth);
    }
    const appVerifier = window.recaptchaVerifier;
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    setVerificationId(confirmationResult.verificationId);
    return confirmationResult;
  } catch (error) {
    setError(error.message);
    return null;
  }
}

// Helper to confirm OTP
export async function confirmOTP(verificationId, otp, setError) {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, otp);
    const userCredential = await auth.signInWithCredential(credential);
    return userCredential;
  } catch (error) {
    setError(error.message);
    return null;
  }
}
