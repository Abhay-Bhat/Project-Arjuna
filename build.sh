#!/bin/bash
# Generates js/firebase-config.js from environment variables.
# Used by Cloudflare Pages (set these as env vars in CF dashboard).
# Identical logic to the GitHub Actions workflow step.

set -e

cat > js/firebase-config.js << EOF
const FIREBASE_CONFIG = {
  apiKey:            "${FIREBASE_API_KEY}",
  authDomain:        "${FIREBASE_AUTH_DOMAIN}",
  projectId:         "${FIREBASE_PROJECT_ID}",
  storageBucket:     "${FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${FIREBASE_MESSAGING_SENDER_ID}",
  appId:             "${FIREBASE_APP_ID}"
};
EOF

echo "firebase-config.js generated."
