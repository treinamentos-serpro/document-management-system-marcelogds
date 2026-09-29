function createDocumentController(documentService) {
  return {
    async upload(req, res) {
      if (!req.file) {
        return res.status(400).json({
          error: {
            code: 'FILE_REQUIRED',
            message: 'Envie um arquivo no campo "file".',
          },
        });
      }

      const document = await documentService.createDocument(req.file);
      return res.status(201).json(document);
    },

    list(req, res) {
      return res.status(200).json({
        documents: documentService.listDocuments(),
      });
    },

    async download(req, res, next) {
      const { document, filePath } = await documentService.getDocumentForDownload(req.params.id);

      res.download(
        filePath,
        document.originalName,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-Content-Type-Options': 'nosniff',
          },
        },
        (error) => {
          if (error) {
            next(error);
          }
        },
      );
    },
  };
}

module.exports = createDocumentController;