const fs = require('node:fs/promises');
const path = require('node:path');

class DocumentRepository {
  constructor(storageDirectory) {
    this.storageDirectory = storageDirectory;
    this.documents = new Map();
  }

  create(document) {
    if (this.documents.has(document.id)) {
      throw new Error('O identificador do documento já está em uso.');
    }

    this.documents.set(document.id, document);
    return this.toPublicDocument(document);
  }

  findAll() {
    return [...this.documents.values()]
      .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
      .map((document) => this.toPublicDocument(document));
  }

  findById(id) {
    return this.documents.get(id) ?? null;
  }

  async findDownloadById(id) {
    const document = this.findById(id);

    if (!document) {
      return null;
    }

    const filePath = this.resolveStoragePath(document.storageName);

    try {
      const fileStats = await fs.lstat(filePath);

      if (fileStats.isSymbolicLink() || !fileStats.isFile()) {
        return null;
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }

      throw error;
    }

    return {
      document: this.toPublicDocument(document),
      filePath,
    };
  }

  async removeStoredFile(storageName) {
    const filePath = this.resolveStoragePath(storageName);
    await fs.rm(filePath, { force: true });
  }

  resolveStoragePath(storageName) {
    if (path.basename(storageName) !== storageName || storageName.includes('\\')) {
      throw new Error('Nome interno de armazenamento inválido.');
    }

    const filePath = path.resolve(this.storageDirectory, storageName);

    if (path.dirname(filePath) !== this.storageDirectory) {
      throw new Error('Caminho de armazenamento inválido.');
    }

    return filePath;
  }

  toPublicDocument(document) {
    const { id, originalName, size, uploadedAt, owner } = document;

    return { id, originalName, size, uploadedAt, owner };
  }
}

module.exports = DocumentRepository;