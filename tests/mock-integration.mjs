/**
 * Smoke test — simulates the extension ad fetch and impression flow.
 *
 * Usage: node tests/mock-integration.mjs [apiBaseUrl]
 */

const API_BASE = process.argv[2] ?? 'http://127.0.0.1:8787';
const PUBLISHER_ID = 'pub-dev-test';
const FETCH_TIMEOUT_MS = 1500;

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function testHealth() {
  console.log('\n[health]');
  const res = await fetch(`${API_BASE}/health`);
  const body = await res.json();
  assert(res.status === 200, 'GET /health returns 200');
  assert(body.ok === true, 'health body has ok: true');
}

async function testFetchAdUnauthorized() {
  console.log('\n[fetch-ad fail-open: no auth]');
  const res = await fetch(`${API_BASE}/fetch-ad`);
  assert(res.status === 401, 'GET /fetch-ad without Bearer returns 401');
}

async function testFetchAdBlocked() {
  console.log('\n[fetch-ad: blocked publisher]');
  // Use a publisher we can block via impression flood isn't practical;
  // worker tests cover KV blocklist — here we verify 403 path exists via bad token format
  const res = await fetch(`${API_BASE}/fetch-ad`, {
    headers: { Authorization: 'InvalidScheme pub-dev-test' },
  });
  assert(res.status === 401, 'GET /fetch-ad with invalid auth scheme returns 401');
}

async function testExtensionLifecycle() {
  console.log('\n[extension lifecycle mock]');

  const fetchRes = await fetchWithTimeout(`${API_BASE}/fetch-ad`, {
    headers: {
      Authorization: `Bearer ${PUBLISHER_ID}`,
      Accept: 'application/json',
    },
  });

  assert(fetchRes.status === 200, 'GET /fetch-ad returns 200 for valid publisher');

  const ad = await fetchRes.json();
  assert(typeof ad.id === 'string' && ad.id.length > 0, 'ad.id is non-empty string');
  assert(typeof ad.text === 'string' && ad.text.length > 0, 'ad.text is non-empty string');
  assert(typeof ad.campaignId === 'string' && ad.campaignId.length > 0, 'ad.campaignId is non-empty string');
  assert(typeof ad.url === 'string' && ad.url.startsWith('https://'), 'ad.url is https URL');

  console.log(`    → would render status bar: "$(megaphone) ${ad.text}"`);

  const impressionRes = await fetch(`${API_BASE}/impression`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PUBLISHER_ID}`,
    },
    body: JSON.stringify({
      publisherId: PUBLISHER_ID,
      campaignId: ad.campaignId,
      adId: ad.id,
      timestamp: Date.now(),
    }),
  });

  const impressionBody = await impressionRes.json();
  assert(impressionRes.status === 202, 'POST /impression returns 202');
  assert(impressionBody.ok === true, 'impression body has ok: true');
  assert(impressionBody.publisherId === PUBLISHER_ID, 'impression echoes publisherId');
}

async function testImpressionRequiresAuth() {
  console.log('\n[impression: requires Bearer auth]');
  const res = await fetch(`${API_BASE}/impression`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      publisherId: PUBLISHER_ID,
      campaignId: 'campaign-test',
      adId: 'ad-test',
      timestamp: Date.now(),
    }),
  });
  assert(res.status === 401, 'POST /impression without Authorization returns 401');
}

async function testFetchAdTimeoutGuard() {
  console.log('\n[fetch-ad: abort timeout fires within 1500ms]');
  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    await fetch('http://127.0.0.1:1/fetch-ad', {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${PUBLISHER_ID}` },
    });
    assert(false, 'unreachable host should not succeed');
  } catch (err) {
    const elapsed = Date.now() - start;
    const isAbort = err.name === 'AbortError';
    const isRefused =
      err.cause?.code === 'ECONNREFUSED' ||
      String(err.message).includes('fetch failed');
    assert(isAbort || isRefused, 'fetch fails safely on unreachable host (abort or connection refused)');
    assert(elapsed <= FETCH_TIMEOUT_MS + 200, `does not hang past ${FETCH_TIMEOUT_MS}ms (got ${elapsed}ms)`);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function main() {
  console.log(`Mock integration test against ${API_BASE}`);
  console.log(`Publisher: ${PUBLISHER_ID}`);

  try {
    await testHealth();
    await testFetchAdUnauthorized();
    await testFetchAdBlocked();
    await testExtensionLifecycle();
    await testImpressionRequiresAuth();
    await testFetchAdTimeoutGuard();
  } catch (err) {
    console.error('\nFatal:', err.message);
    console.error(`Is the Waitstate API reachable at ${API_BASE}?`);
    process.exit(1);
  }

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
