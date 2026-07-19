// Android-build-only step. Extracts the Web-type OAuth client ID (the
// "client_type": 3 entry) from the CI-downloaded google-services.json and
// injects it as capacitor.config.json's FirebaseAuthentication.serverClientId
// before `cap sync android` runs.
//
// Why this matters: @capacitor-firebase/authentication's native Google
// Sign-In needs a serverClientId to request an ID token whose audience
// matches Firebase's expectation. Without one explicitly configured, it
// falls back to auto-discovering a "default_web_client_id" Android resource
// that the google-services Gradle plugin only generates from a client_type:3
// entry -- if that entry is ever missing (e.g. the GOOGLE_SERVICES_JSON
// secret was captured before Google Sign-In was enabled in the Firebase
// console), sign-in can still nominally succeed while never resolving to
// the same Firebase user/uid as the web app, so the app silently never
// shows any existing cloud data. Failing loudly here turns that into a
// clear, actionable CI error instead of a silent runtime data bug.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gsPath = join(root, 'android/app/google-services.json');
const capacitorConfigPath = join(root, 'capacitor.config.json');

const gs = JSON.parse(readFileSync(gsPath, 'utf8'));
const client = gs.client?.[0];
const oauthClients = client?.oauth_client || [];
const webClient = oauthClients.find(c => c.client_type === 3);

if (!webClient?.client_id) {
  console.error(
    '\nERROR: google-services.json has no "client_type": 3 (Web) OAuth client entry.\n' +
    'This means native Google Sign-In on Android will not reliably resolve to the\n' +
    'same Firebase user as the web app -- signed-in devices can silently never see\n' +
    'existing cloud data.\n\n' +
    'Fix: in the Firebase Console, confirm Google is enabled as a sign-in provider\n' +
    '(Authentication > Sign-in method) -- Firebase only auto-creates the project-\n' +
    'level Web OAuth client once that provider is enabled. Then re-download\n' +
    'google-services.json (Project Settings > General > your Android app) and\n' +
    'update the GOOGLE_SERVICES_JSON GitHub Actions secret with the new file.\n'
  );
  process.exit(1);
}

const capConfig = JSON.parse(readFileSync(capacitorConfigPath, 'utf8'));
capConfig.plugins = capConfig.plugins || {};
capConfig.plugins.FirebaseAuthentication = capConfig.plugins.FirebaseAuthentication || {};
capConfig.plugins.FirebaseAuthentication.serverClientId = webClient.client_id;

writeFileSync(capacitorConfigPath, JSON.stringify(capConfig, null, 2) + '\n');
console.log(`Injected serverClientId (${webClient.client_id}) into capacitor.config.json`);
