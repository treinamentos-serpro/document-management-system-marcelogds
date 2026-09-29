const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { spawnSync } = require('node:child_process');
const DocumentRepository = require('../src/repositories/documentRepository');

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
  assert.equal(emptyList.headers.get('x-powered-by'), null);
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

  const longNameForm = new FormData();
  longNameForm.append('file', new Blob(['x']), `${'a'.repeat(256)}.txt`);
  const longNameUpload = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: longNameForm,
  });
  assert.equal(longNameUpload.status, 400);
});

test('não disponibiliza symlinks nem arquivos ausentes para download', async () => {
  const repository = new DocumentRepository(storageDirectory);
  const symlinkName = 'symlink-document';
  const missingName = 'missing-document';

  await fs.symlink('/etc/hosts', path.join(storageDirectory, symlinkName));
  repository.create({
    id: 'symlink-id',
    originalName: 'hosts.txt',
    size: 1,
    uploadedAt: new Date().toISOString(),
    owner: 'test-user',
    storageName: symlinkName,
  });
  repository.create({
    id: 'missing-id',
    originalName: 'missing.txt',
    size: 1,
    uploadedAt: new Date().toISOString(),
    owner: 'test-user',
    storageName: missingName,
  });

  assert.equal(await repository.findDownloadById('symlink-id'), null);
  assert.equal(await repository.findDownloadById('missing-id'), null);
});

test('rejeita porta inválida na configuração', () => {
  const result = spawnSync(process.execPath, ['-e', "require('./src/config')"], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: 'invalid-port' },
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /PORT deve ser um inteiro/);
});

after(async () => {
  await fs.rm(storageDirectory, { recursive: true, force: true });
});
