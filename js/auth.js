// ============================================================
// ATHENA — Authentication
// Google Sign-In via Firebase Auth.
// Falls back to local-only mode if Firebase is not configured.
// ============================================================

const Auth = {
  _user:       null,
  _localOnly:  false,
  _configured: false,

  // Call once before anything else. Returns a Promise that
  // resolves when the initial auth state is known.
  init() {
    return new Promise((resolve) => {

      const cfg = (typeof FIREBASE_CONFIG !== 'undefined') ? FIREBASE_CONFIG : null;
      const isPlaceholder = !cfg || cfg.apiKey === 'YOUR_API_KEY';

      if (isPlaceholder || typeof firebase === 'undefined') {
        console.warn('ATHENA: Firebase not configured — running in local-only mode.');
        this._localOnly  = true;
        this._configured = false;
        this._hideOverlay();
        resolve(null);
        return;
      }

      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(FIREBASE_CONFIG);
        }
        this._configured = true;
      } catch (e) {
        console.error('ATHENA: Firebase init error:', e);
        this._localOnly = true;
        this._hideOverlay();
        resolve(null);
        return;
      }

      // Single listener handles both the initial state and subsequent changes.
      // initialFire flag prevents the sign-out reload from triggering on startup.
      let initialFire = true;
      firebase.auth().onAuthStateChanged((user) => {
        this._user = user;

        if (initialFire) {
          initialFire = false;
          if (user) {
            this._applyUserUI(user);
            this._hideOverlay();
          } else {
            this._showOverlay();
          }
          resolve(user);
          return;
        }

        // Subsequent state changes (sign-out)
        if (user) {
          this._applyUserUI(user);
          this._hideOverlay();
        } else {
          this._showOverlay();
        }
      });
    });
  },

  get user()            { return this._user; },
  get uid()             { return this._user?.uid  || null; },
  get isAuthenticated() { return !!this._user; },
  get isLocalOnly()     { return this._localOnly; },

  // ── Sign-in ───────────────────────────────────────────────
  async signInWithGoogle() {
    if (!this._configured) return;
    const btn = document.getElementById('authSignInBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result   = await firebase.auth().signInWithPopup(provider);
      // Reload once — Firebase persists the session so the user stays
      // signed in, the app boots fresh and pulls cloud data cleanly.
      location.reload();
    } catch (e) {
      console.error('ATHENA: Sign-in failed:', e);
      if (btn) { btn.disabled = false; btn.textContent = 'Sign in with Google'; }
      const errEl = document.getElementById('authError');
      if (errEl) {
        errEl.textContent = e.code === 'auth/popup-closed-by-user'
          ? 'Sign-in cancelled.'
          : 'Sign-in failed. Please try again.';
        errEl.style.display = 'block';
      }
    }
  },

  // ── Sign-out ──────────────────────────────────────────────
  async signOut() {
    if (!this._configured) return;
    await firebase.auth().signOut();
    location.reload();
  },

  // ── UI helpers ────────────────────────────────────────────
  _showOverlay() {
    document.getElementById('authOverlay')?.classList.add('show');
    document.getElementById('app-shell')?.classList.add('auth-blur');
  },

  _hideOverlay() {
    document.getElementById('authOverlay')?.classList.remove('show');
    document.getElementById('app-shell')?.classList.remove('auth-blur');
  },

  _applyUserUI(user) {
    const avatar = document.getElementById('userAvatar');
    const name   = document.getElementById('userName');

    if (avatar) {
      if (user.photoURL) {
        avatar.innerHTML = `<img src="${user.photoURL}" alt="${user.displayName}" referrerpolicy="no-referrer">`;
      } else {
        avatar.textContent = (user.displayName || user.email || '?')[0].toUpperCase();
      }
      avatar.style.display = 'flex';
    }
    if (name) {
      name.textContent = user.displayName?.split(' ')[0] || user.email || '';
      name.style.display = 'block';
    }

    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) signOutBtn.style.display = 'inline-flex';

    // Show local-mode badge if not syncing
    const localBadge = document.getElementById('localModeBadge');
    if (localBadge) localBadge.style.display = 'none';
  },

  // Called when running without Firebase
  applyLocalModeUI() {
    const localBadge = document.getElementById('localModeBadge');
    if (localBadge) localBadge.style.display = 'inline-flex';
    const avatar = document.getElementById('userAvatar');
    if (avatar) avatar.style.display = 'none';
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) signOutBtn.style.display = 'none';
  }
};
