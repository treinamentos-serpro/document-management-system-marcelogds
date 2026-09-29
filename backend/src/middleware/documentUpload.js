const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const multer = require('multer');
const config = require('../config');

fs.mkdirSync(config.storageDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: config.storageDirectory,
  filename: (req, file, callback) => callback(null, randomUUID()),
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSize,
    files: 1,
    fields: 0,
  },
});

module.exports = { upload };