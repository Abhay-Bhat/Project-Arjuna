// Copies the static web app into www/ for Capacitor's webDir.
// Android-build-only step — never part of normal web development.
import { cpSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const www = join(root, 'www');

if (existsSync(www)) rmSync(www, { recursive: true, force: true });

cpSync(join(root, 'index.html'), join(www, 'index.html'));
cpSync(join(root, 'js'), join(www, 'js'), { recursive: true });
cpSync(join(root, 'css'), join(www, 'css'), { recursive: true });
cpSync(join(root, 'assets'), join(www, 'assets'), { recursive: true });

console.log('www/ populated from index.html, js/, css/, assets/');
