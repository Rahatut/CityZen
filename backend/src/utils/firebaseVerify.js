const admin = require('firebase-admin');

// Initialize Firebase Admin SDK (ensure you have your service account key JSON)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // or use admin.credential.cert(serviceAccount)
  });
}

/**
 * Verifies a Firebase ID token and checks if the phone number is verified.
 * @param {string} idToken - The Firebase ID token from the client.
 * @returns {Promise<{uid: string, phone_number: string}>}
 */
async function verifyFirebasePhoneToken(idToken) {
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  if (!decodedToken.phone_number) {
    throw new Error('Phone number not verified in Firebase.');
  }
  return { uid: decodedToken.uid, phone_number: decodedToken.phone_number };
}

module.exports = { verifyFirebasePhoneToken };
