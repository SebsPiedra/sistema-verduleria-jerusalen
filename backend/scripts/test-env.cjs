const assert = require('node:assert/strict');

const url = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

assert.equal(
  process.env.ALLOW_INTEGRATION_TESTS,
  'true',
  'Las pruebas de integración requieren ALLOW_INTEGRATION_TESTS=true.'
);
assert.ok(url, 'Debe indicar TEST_DATABASE_URL para una rama aislada de Neon.');

const host = new URL(url).hostname;
assert.notEqual(
  host,
  'ep-withered-shape-axgdaj3x-pooler.c-4.us-east-2.aws.neon.tech',
  'Las pruebas de integración no pueden ejecutarse contra producción.'
);

process.env.DATABASE_URL = url;

