const path = require('path');
const { pathToFileURL } = require('url');
const root = path.resolve('frontend');
process.chdir(root);
require('dotenv').config({ path: path.join(root, '.env.local') });

async function main() {
  const service = await import(pathToFileURL(path.join(root, 'lib/agreements/service.js')).href);

  const measure = async (label, fn) => {
    const started = Date.now();
    const result = await fn();
    return { label, ms: Date.now() - started, extra: result };
  };

  const results = [];
  results.push(await measure('listAdminAgreements', async () => {
    const items = await service.listAdminAgreements();
    return { count: items.length };
  }));
  results.push(await measure('listAdminAgreements_cached', async () => {
    const items = await service.listAdminAgreements();
    return { count: items.length };
  }));
  results.push(await measure('syncPendingAgreementStatuses', async () => {
    const count = await service.syncPendingAgreementStatuses();
    return { count };
  }));
  results.push(await measure('recoverFailedInternalAgreementCompletions', async () => {
    const count = await service.recoverFailedInternalAgreementCompletions();
    return { count };
  }));
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
