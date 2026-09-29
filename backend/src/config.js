const path = require('node:path');

const backendRoot = path.resolve(__dirname, '..');

function parsePort(value) {
  const port = Number(value || 3000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT deve ser um inteiro entre 1 e 65535.');
  }

  return port;
}

function parsePositiveInteger(value, variableName, defaultValue) {
  const parsedValue = Number(value || defaultValue);

  if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${variableName} deve ser um inteiro positivo.`);
  }

  return parsedValue;
}

const storageValue = process.env.STORAGE_DIR || 'storage';
const owner = (process.env.DEFAULT_DOCUMENT_OWNER || 'local-user').trim();

if (!owner) {
  throw new Error('DEFAULT_DOCUMENT_OWNER não pode ser vazio.');
}

module.exports = {
  port: parsePort(process.env.PORT),
  storageDirectory: path.resolve(backendRoot, storageValue),
  maxFileSize: parsePositiveInteger(
    process.env.MAX_FILE_SIZE_BYTES,
    'MAX_FILE_SIZE_BYTES',
    10485760,
  ),
  owner,
};