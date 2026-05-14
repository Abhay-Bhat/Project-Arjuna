// ============================================================
// ATHENA — Firebase Configuration Template
//
// js/firebase-config.js is NOT committed to this repository.
//
// LOCAL DEVELOPMENT:
//   Copy this file to js/firebase-config.js and fill in your
//   values from Firebase Console → Project Settings → Your apps.
//
// PRODUCTION (GitHub Pages):
//   The GitHub Actions workflow (.github/workflows/deploy.yml)
//   generates js/firebase-config.js automatically on every push
//   to main, injecting values from GitHub repository secrets.
//   See .github/workflows/deploy.yml for required secret names.
//
// FIRESTORE SECURITY RULES (required — paste into Firebase Console):
//
//   rules_version = '2';
//   service cloud.firestore {
//     match /databases/{database}/documents {
//       match /users/{userId}/data/{doc} {
//         allow read, write: if request.auth != null
//                            && request.auth.uid == userId;
//       }
//     }
//   }
// ============================================================

const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_AUTH_DOMAIN",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
