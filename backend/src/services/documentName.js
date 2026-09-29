function createInvalidNameError() {
  return Object.assign(
    new Error('O nome do arquivo é inválido.'),
    { statusCode: 400, code: 'INVALID_FILE_NAME' },
  );
}

function sanitizeDocumentName(originalName) {
  const sanitizedName = originalName
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/g, '')
    .normalize('NFC')
    .trim();

  if (!sanitizedName || sanitizedName === '.' || sanitizedName === '..' || sanitizedName.length > 255) {
    throw createInvalidNameError();
  }

  return sanitizedName;
}

module.exports = sanitizeDocumentName;