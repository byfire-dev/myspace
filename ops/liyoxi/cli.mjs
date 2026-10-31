import { createWriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';
import { once } from 'node:events';
import { DEFAULT_DB_PATH, openStore, csvRows } from './storage.mjs';

const [command, ...args] = process.argv.slice(2);
const options = {};
for (let index = 0; index < args.length; index += 2) {
  if (!['--db', '--output', '--id'].includes(args[index]) || !args[index + 1]) throw new Error('Invalid CLI arguments');
  options[args[index].slice(2)] = args[index + 1];
}
if (!['export', 'delete'].includes(command) || (command === 'export' && !options.output) || (command === 'delete' && !/^[a-f0-9-]{36}$/i.test(options.id || ''))) {
  console.error('Usage: node cli.mjs export --output /secure/enrollments.csv [--db PATH]\n       node cli.mjs delete --id REGISTRATION_UUID [--db PATH]');
  process.exitCode = 1;
} else {
  let store;
  try {
    store = openStore(options.db || process.env.LIYOXI_DB_PATH || DEFAULT_DB_PATH, { readOnly: command === 'export' });
    if (command === 'delete') {
      console.info(JSON.stringify({ deleted: Number(store.delete(options.id)), registrationId: options.id }));
    } else {
      const output = createWriteStream(options.output, { flags: 'wx', mode: 0o600 });
      const completion = finished(output);
      // Attach rejection immediately so a filesystem error cannot become an unhandled rejection.
      completion.catch(() => {});
      for (const row of csvRows(store)) if (!output.write(row)) await once(output, 'drain');
      output.end(); await completion;
      console.info('CSV export written to the requested file. Keep it private.');
    }
  } catch (error) {
    console.error(JSON.stringify({ event: 'liyoxi_cli_failed', code: error?.code || 'OPERATION_FAILED' }));
    process.exitCode = 1;
  } finally { store?.close(); }
}
