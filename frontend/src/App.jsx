import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments, uploadDocument } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  async function refreshDocuments() {
    setIsLoading(true);
    setLoadError('');

    try {
      setDocuments(await listDocuments());
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    listDocuments()
      .then((result) => {
        if (isMounted) {
          setDocuments(result);
          setLoadError('');
        }
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(error.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleUpload(file) {
    const createdDocument = await uploadDocument(file);
    setDocuments((currentDocuments) => [
      createdDocument,
      ...currentDocuments.filter((document) => document.id !== createdDocument.id),
    ]);
    setLoadError('');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="/" aria-label="DMS, página inicial">
            <span className="brand-mark" aria-hidden="true">D</span>
            <span>DMS <span className="brand-divider">/</span> Documentos</span>
          </a>
          <span className="storage-indicator">
            <span className="storage-dot" aria-hidden="true" />
            Armazenamento local
          </span>
        </div>
      </header>

      <main className="workspace">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Arquivo digital</p>
            <h1>Seus documentos</h1>
          </div>
          <div className="document-count" aria-live="polite">
            <strong>{documents.length.toString().padStart(2, '0')}</strong>
            <span>{documents.length === 1 ? 'documento' : 'documentos'}</span>
          </div>
        </div>

        <section className="upload-panel" aria-labelledby="upload-heading">
          <div className="panel-heading">
            <span className="section-index">01</span>
            <h2 id="upload-heading">Adicionar documento</h2>
          </div>
          <UploadComponent onUpload={handleUpload} />
        </section>

        <section className="documents-section" aria-labelledby="documents-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Biblioteca</p>
              <h2 id="documents-heading">Documentos enviados</h2>
            </div>
            <button
              className="refresh-button"
              type="button"
              onClick={refreshDocuments}
              disabled={isLoading}
            >
              Atualizar lista
            </button>
          </div>

          <DocumentList
            documents={documents}
            isLoading={isLoading}
            error={loadError}
          />
        </section>
      </main>
      <footer className="page-footer">DMS <span>·</span> Gestão de documentos</footer>
    </div>
  );
}