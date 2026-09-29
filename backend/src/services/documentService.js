const createDocumentMetadata = require('./documentFactory');

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
      return this.documentRepository.create(createDocumentMetadata(file, this.owner));
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