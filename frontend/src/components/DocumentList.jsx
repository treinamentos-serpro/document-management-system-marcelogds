import DownloadButton from './DownloadButton.jsx';
import formatFileSize from '../utils/formatFileSize.js';

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function DocumentList({ documents, isLoading, error }) {
  if (isLoading && documents.length === 0) {
    return <p className="list-status" role="status">Carregando documentos...</p>;
  }

  if (error && documents.length === 0) {
    return <p className="list-status error-message" role="alert">{error}</p>;
  }

  if (documents.length === 0) {
    return <p className="empty-state">Nenhum documento enviado.</p>;
  }

  return (
    <div className="table-frame">
      {error && <p className="list-warning" role="alert">{error}</p>}
      <table className="document-table">
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Responsável</th>
            <th scope="col">Enviado em</th>
            <th scope="col">Tamanho</th>
            <th scope="col"><span className="visually-hidden">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td className="document-name" title={document.originalName}>
                {document.originalName}
              </td>
              <td>{document.owner}</td>
              <td>{formatDate(document.uploadedAt)}</td>
              <td className="size-cell">{formatFileSize(document.size)}</td>
              <td className="action-cell">
                <DownloadButton documentId={document.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}