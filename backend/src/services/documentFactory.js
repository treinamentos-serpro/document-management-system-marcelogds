const { randomUUID } = require('node:crypto');
const sanitizeDocumentName = require('./documentName');

function createDocumentMetadata(file, owner) {
  return {
    id: randomUUID(),
    originalName: sanitizeDocumentName(file.originalname),
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storageName: file.filename,
  };
}

module.exports = createDocumentMetadata;