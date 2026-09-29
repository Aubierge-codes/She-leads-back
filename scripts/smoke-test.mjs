// End-to-end smoke test for a RUNNING backend. Verifies the security model:
// what is public, what needs login, roles, password changes and soft deletes.
//
//   API_URL=http://localhost:4000 ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/smoke-test.mjs
//
// It creates a few clearly-named "SMOKE-TEST" records and removes them again
// (soft-deletes, plus the temporary team member is removed). Safe to run on a
// real database, but prefer a staging copy. It never leaves your admin
// password changed: it changes it and immediately changes it back.

const API = process.env.API_URL ?? 'http://localhost:4000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (an existing ADMIN account).');
  process.exit(2);
}

let passed = 0;
let failed = 0;
const stamp = Date.now();

function check(name, ok, detail = '') {
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name} ${detail}`);
  }
}

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  return { status: res.status, data };
}

async function login(email, password) {
  const r = await call('POST', '/auth/login', { body: { email, password } });
  return r.status === 200 ? r.data.accessToken : null;
}

console.log(`\nSmoke test against ${API}\n`);

console.log('1. Public site data (no login)');
for (const p of ['/', '/public/summary', '/public/reach', '/public/impact']) {
  const r = await call('GET', p);
  check(`GET ${p} is open`, r.status === 200, `got ${r.status}`);
}
const summary = (await call('GET', '/public/summary')).data;
check(
  'public summary exposes only the 4 safe fields',
  summary && Object.keys(summary).sort().join() ===
    ['communitiesCount', 'participantsCount', 'schoolsCount', 'totalWasteWeightKg'].sort().join(),
  JSON.stringify(summary),
);

console.log('\n2. Internal data is locked without login');
for (const p of [
  '/dashboard/summary', '/dashboard/recent-activity', '/participants', '/schools', '/communities',
  '/cleanup/events', '/inventory', '/clubs', '/reports', '/users', '/donations', '/donations/stats',
  '/newsletter', '/partnerships', '/analytics/waste-by-type', '/analytics/participants-by-status',
]) {
  const r = await call('GET', p);
  check(`GET ${p} -> 401`, r.status === 401, `got ${r.status}`);
}
check('forged token rejected', (await call('GET', '/participants', { token: 'not.a.token' })).status === 401);

console.log('\n3. Public forms still accept submissions');
const n = await call('POST', '/newsletter', { body: { email: `smoke-${stamp}@example.com` } });
check('newsletter signup works', n.status === 201, `got ${n.status}`);
const n2 = await call('POST', '/newsletter', { body: { email: `smoke-${stamp}@example.com` } });
check('newsletter signup is idempotent (no error on repeat)', n2.status === 201, `got ${n2.status}`);
const pi = await call('POST', '/partnerships', {
  body: { organizationName: 'SMOKE-TEST Org', contactName: 'Smoke Test', email: `smoke-p-${stamp}@example.com` },
});
check('partnership inquiry works', pi.status === 201, `got ${pi.status}`);
const dn = await call('POST', '/donations', {
  body: { amount: 5, donorName: 'SMOKE-TEST', donorEmail: `smoke-d-${stamp}@example.com` },
});
check('donation pledge works', dn.status === 201, `got ${dn.status}`);

console.log('\n4. Input validation');
check('bad email rejected', (await call('POST', '/newsletter', { body: { email: 'nope' } })).status === 400);
check(
  'unknown fields rejected',
  (await call('POST', '/newsletter', { body: { email: 'a@b.co', admin: true } })).status === 400,
);
check('negative donation rejected', (await call('POST', '/donations', {
  body: { amount: -5, donorName: 'x', donorEmail: 'x@example.com' },
})).status === 400);

console.log('\n5. Login');
check('wrong password -> 401', (await call('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: 'wrong-password' } })).status === 401);
check('unknown user -> 401', (await call('POST', '/auth/login', { body: { email: 'nobody@example.com', password: 'whatever123' } })).status === 401);
const token = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
check('admin can log in', !!token);
if (!token) {
  console.log('\nCannot continue without an admin login.');
  process.exit(1);
}

console.log('\n6. Logged-in access and data hygiene');
for (const p of ['/dashboard/summary', '/participants', '/schools', '/communities', '/reports', '/donations', '/newsletter', '/partnerships']) {
  const r = await call('GET', p, { token });
  check(`GET ${p} with token -> 200`, r.status === 200, `got ${r.status}`);
}
const users = await call('GET', '/users', { token });
check('admin can list users', users.status === 200);
check('user list never contains password hashes', !JSON.stringify(users.data).includes('"password"'));
const reports = await call('GET', '/reports', { token });
check('reports never leak password hashes', !JSON.stringify(reports.data).includes('"password"'));

console.log('\n7. Change password (and restore it)');
const temp = `Tmp-${stamp}-pw!`;
check('wrong current password -> 400 (not 401)', (await call('PATCH', '/auth/password', {
  token, body: { currentPassword: 'definitely-wrong', newPassword: temp },
})).status === 400);
check('too-short new password rejected', (await call('PATCH', '/auth/password', {
  token, body: { currentPassword: ADMIN_PASSWORD, newPassword: 'short' },
})).status === 400);
const ch = await call('PATCH', '/auth/password', { token, body: { currentPassword: ADMIN_PASSWORD, newPassword: temp } });
check('password change works', ch.status === 200, `got ${ch.status}`);
check('old password stops working', (await login(ADMIN_EMAIL, ADMIN_PASSWORD)) === null);
const token2 = await login(ADMIN_EMAIL, temp);
check('new password works', !!token2);
const back = await call('PATCH', '/auth/password', { token: token2, body: { currentPassword: temp, newPassword: ADMIN_PASSWORD } });
check('password restored to original', back.status === 200, `got ${back.status}`);
check('original password works again', !!(await login(ADMIN_EMAIL, ADMIN_PASSWORD)));

console.log('\n8. Roles and removing access');
const mgrEmail = `smoke-manager-${stamp}@example.com`;
const mgrPass = `Mgr-${stamp}-pw!`;
const created = await call('POST', '/users', { token, body: { name: 'SMOKE-TEST Manager', email: mgrEmail, password: mgrPass, role: 'MANAGER' } });
check('admin can add a manager', created.status === 201, `got ${created.status}`);
const mgrToken = await login(mgrEmail, mgrPass);
check('manager can log in', !!mgrToken);
check('manager can use the dashboard', (await call('GET', '/participants', { token: mgrToken })).status === 200);
check('manager CANNOT list users -> 403', (await call('GET', '/users', { token: mgrToken })).status === 403);
check('manager CANNOT add users -> 403', (await call('POST', '/users', {
  token: mgrToken, body: { name: 'x', email: `x-${stamp}@example.com`, password: 'Password123!', role: 'ADMIN' },
})).status === 403);
const removed = await call('DELETE', `/users/${created.data?.id}`, { token });
check('admin can remove the manager', removed.status === 200, `got ${removed.status}`);
check('removed manager cannot log in', (await login(mgrEmail, mgrPass)) === null);
check('removed manager\'s existing token stops working', (await call('GET', '/participants', { token: mgrToken })).status === 401);

console.log('\n9. Deleted records disappear everywhere');
const before = (await call('GET', '/public/summary')).data.communitiesCount;
const c = await call('POST', '/communities', { token, body: { name: `SMOKE-TEST Community ${stamp}`, state: 'Test' } });
check('can create a community', c.status === 201, `got ${c.status}`);
const mid = (await call('GET', '/public/summary')).data.communitiesCount;
check('public count went up by 1', mid === before + 1, `${before} -> ${mid}`);
const del = await call('DELETE', `/communities/${c.data?.id}`, { token });
check('can delete the community', del.status === 200, `got ${del.status}`);
const after = (await call('GET', '/public/summary')).data.communitiesCount;
check('public count back to original (deleted rows not counted)', after === before, `${before} -> ${after}`);
const list = (await call('GET', '/communities', { token })).data ?? [];
check('deleted community absent from the dashboard list', !list.some((x) => x.id === c.data?.id));
const dash = (await call('GET', '/dashboard/summary', { token })).data;
check('dashboard count matches public count', dash?.communitiesCount === after, `${dash?.communitiesCount} vs ${after}`);

console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
console.log('Leftover test rows you may want to purge from a real database:');
console.log('  newsletter/partnership/donation entries containing "smoke" or "SMOKE-TEST".\n');
process.exit(failed ? 1 : 0);
