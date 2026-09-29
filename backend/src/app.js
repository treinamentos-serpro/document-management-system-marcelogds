// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const config = require('./config');
const DocumentRepository = require('./repositories/documentRepository');
const DocumentService = require('./services/documentService');
const createDocumentController = require('./controllers/documentController');
const createDocumentRoutes = require('./routes/documentRoutes');
const { upload } = require('./middleware/documentUpload');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.disable('x-powered-by');

const documentRepository = new DocumentRepository(config.storageDirectory);
const documentService = new DocumentService(documentRepository, config.owner);
const documentController = createDocumentController(documentService);

app.use(express.json());
app.use(createDocumentRoutes({ documentController, upload }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`DMS backend ouvindo na porta ${config.port}`);
  });
}

module.exports = app;
