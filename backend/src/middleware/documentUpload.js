const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');

const backendRoot = path.resolve(__dirname, '../..');
const configuredStorageDirectory = process.env.STORAGE_DIR || 'storage';
const storageDirectory = path.resolve(backendRoot, configuredStorageDirectory);
const maxFileSize = Number(process.env.MAX_FILE_SIZE_BYTES || 10485760);

if (!Number.isSafeInteger(maxFileSize) || maxFileSize <= 0) {
  throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
}

fs.mkdirSync(storageDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: storageDirectory,
  filename: (req, file, callback) => callback(null, randomUUID()),
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
    files: 1,
    fields: 0,
  },
});

module.exports = { upload, storageDirectory };