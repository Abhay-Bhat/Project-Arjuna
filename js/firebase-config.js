// ============================================================
// ATHENA — Firebase Project Configuration
//
// SETUP INSTRUCTIONS (one-time, ~5 minutes):
//
// 1. Go to https://console.firebase.google.com
// 2. Click "Add project" → name it "project-arjuna" → Continue
// 3. Disable Google Analytics (not needed) → Create project
// 4. In the project dashboard, click the web icon </>
//    Register app with nickname "ATHENA" → Register app
// 5. Copy the firebaseConfig object shown and paste it below
// 6. In the left sidebar: Build → Authentication
//    → Get started → Google → Enable → Save
// 7. In the left sidebar: Build → Firestore Database
//    → Create database → Start in production mode
//    → Choose a region near you → Enable
// 8. In Firestore: Rules tab → replace with:
//
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        match /users/{userId}/data/{doc} {
//          allow read, write: if request.auth != null
//                             && request.auth.uid == userId;
//        }
//      }
//    }
//
//    → Publish
// 9. In Authentication → Settings → Authorised domains
//    Add: abhay-bhat.github.io
//
// NOTE: Firebase web configs are intentionally public — security
// is enforced by the Firestore rules above, not by hiding this file.
// ============================================================

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBqjufENNuKZwMnB9vx7mU7rZMzQIalA_E",
  authDomain:        "project-arjuna-8f395.firebaseapp.com",
  projectId:         "project-arjuna-8f395",
  storageBucket:     "project-arjuna-8f395.firebasestorage.app",
  messagingSenderId: "506100195161",
  appId:             "1:506100195161:web:67635cc7746035fb79b648"
};
