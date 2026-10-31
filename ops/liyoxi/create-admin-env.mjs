import { mkdirSync, writeFileSync, chmodSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomBytes, scryptSync } from 'node:crypto';

const args = process.argv.slice(2);
const options = { env: '/etc/liyoxi/liyoxi.env', credentials: '/etc/liyoxi/admin-credentials.txt', user: 'liyoxi_admin' };
let rotate = false;
for (let index = 0; index < args.length; index += 1) {
  if (args[index] === '--rotate') { rotate = true; continue; }
  if (!['--env', '--credentials', '--user'].includes(args[index]) || !args[index + 1]) throw new Error('Invalid arguments');
  options[args[index].slice(2)] = args[++index];
}
if (!/^[a-zA-Z0-9_-]{1,64}$/.test(options.user)) throw new Error('Use an ASCII username with letters, digits, underscores or hyphens');
if (resolve(options.env) === resolve(options.credentials)) throw new Error('Environment and credential paths must differ');
if (!rotate && [options.env, options.credentials].some(existsSync)) throw new Error('Refusing to overwrite existing credentials or environment; use --rotate explicitly');
const password = randomBytes(24).toString('base64url');
const salt = randomBytes(16);
const hash = `scrypt$${salt.toString('hex')}$${scryptSync(password, salt, 64).toString('hex')}`;
for (const path of [options.env, options.credentials]) mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
const env = `NODE_ENV=production\nLIYOXI_PORT=8797\nLIYOXI_DB_PATH=/var/lib/liyoxi/enrollments.sqlite\nLIYOXI_ALLOWED_ORIGINS=https://myspace.byfire.ai\nLIYOXI_ADMIN_USER=${options.user}\nLIYOXI_ADMIN_PASSWORD_HASH=${hash}\n`;
const credentials = `URL: https://myspace.byfire.ai/liyoxi/admin/\nUsername: ${options.user}\nPassword: ${password}\n\nKeep this file private. Do not commit or paste it into chat/logs.\n`;
writeFileSync(options.credentials, credentials, { flag: rotate ? 'w' : 'wx', mode: 0o600 });
writeFileSync(options.env, env, { flag: rotate ? 'w' : 'wx', mode: 0o600 });
if (process.platform !== 'win32') { chmodSync(options.env, 0o600); chmodSync(options.credentials, 0o600); }
console.info('Admin credentials and service environment written to private files. No credentials printed.');
