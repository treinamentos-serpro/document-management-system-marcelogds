const { randomUUID } = require('node:crypto');

function createServiceError(statusCode, code, message) {
  return Object.assign(new Error(message), { statusCode, code });
}

class DocumentService {
  constructor(documentRepository, owner = process.env.DEFAULT_DOCUMENT_OWNER || 'local-user') {
    this.documentRepository = documentRepository;
    this.owner = owner;
  }

  async createDocument(file) {
    try {
      const originalName = file.originalname
        .replace(/\\/g, '/')
        .split('/')
        .pop()
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .trim();

      if (!originalName || originalName === '.' || originalName === '..') {
        throw createServiceError(400, 'INVALID_FILE_NAME', 'O nome do arquivo é inválido.');
      }

      return this.documentRepository.create({
        id: randomUUID(),
        originalName,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        owner: this.owner,
        storageName: file.filename,
      });
    } catch (error) {
      await this.documentRepository.removeStoredFile(file.filename).catch(() => {});
      throw error;
    }
  }

  listDocuments() {
    return this.documentRepository.findAll();
  }

  async getDocumentForDownload(id) {
    const download = await this.documentRepository.findDownloadById(id);

    if (!download) {
      throw createServiceError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
    }

    return download;
  }
}

module.exports = DocumentService;