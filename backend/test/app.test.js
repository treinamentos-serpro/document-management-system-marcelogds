const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');

const storageDirectory = path.join(os.tmpdir(), `dms-test-${process.pid}`);
process.env.STORAGE_DIR = storageDirectory;
process.env.DEFAULT_DOCUMENT_OWNER = 'test-user';
process.env.MAX_FILE_SIZE_BYTES = '32';

const app = require('../src/app');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem e download de documentos', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const emptyList = await fetch(`${baseUrl}/documents`);
  assert.equal(emptyList.status, 200);
  assert.deepEqual(await emptyList.json(), { documents: [] });

  const missingFile = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: new FormData(),
  });
  assert.equal(missingFile.status, 400);

  const form = new FormData();
  form.append('file', new Blob(['hello']), '../hello.txt');
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: form,
  });

  assert.equal(uploadResponse.status, 201);
  const createdDocument = await uploadResponse.json();
  assert.equal(createdDocument.originalName, 'hello.txt');
  assert.equal(createdDocument.size, 5);
  assert.equal(createdDocument.owner, 'test-user');
  assert.ok(createdDocument.id);
  assert.ok(createdDocument.uploadedAt);
  assert.equal(Object.hasOwn(createdDocument, 'storageName'), false);

  const listResponse = await fetch(`${baseUrl}/documents`);
  const listedDocuments = await listResponse.json();
  assert.deepEqual(listedDocuments.documents, [createdDocument]);

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${createdDocument.id}/download`,
  );
  assert.equal(downloadResponse.status, 200);
  assert.equal(downloadResponse.headers.get('content-type'), 'application/octet-stream');
  assert.equal(downloadResponse.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(downloadResponse.headers.get('content-disposition').includes('hello.txt'), true);
  assert.equal(await downloadResponse.text(), 'hello');

  const missingDocument = await fetch(`${baseUrl}/documents/not-found/download`);
  assert.equal(missingDocument.status, 404);

  const largeForm = new FormData();
  largeForm.append('file', new Blob(['x'.repeat(33)]), 'large.txt');
  const largeUpload = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: largeForm,
  });
  assert.equal(largeUpload.status, 413);
});

after(async () => {
  await fs.rm(storageDirectory, { recursive: true, force: true });
});
