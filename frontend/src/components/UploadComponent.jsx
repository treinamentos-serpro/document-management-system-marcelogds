import { useId, useRef, useState } from 'react';
import formatFileSize from '../utils/formatFileSize.js';

export default function UploadComponent({ onUpload }) {
  const inputId = useId();
  const formRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file || isUploading) {
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      await onUpload(file);
      setFile(null);
      formRef.current?.reset();
      setSuccess('Documento enviado.');
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form ref={formRef} className="upload-form" onSubmit={handleSubmit}>
      <div className="file-field">
        <label htmlFor={inputId}>Arquivo</label>
        <input
          id={inputId}
          name="file"
          type="file"
          onChange={(event) => {
            setFile(event.target.files?.[0] || null);
            setError('');
            setSuccess('');
          }}
        />
        {file && (
          <p className="selected-file" title={file.name}>
            <span>{file.name}</span>
            <span>{formatFileSize(file.size)}</span>
          </p>
        )}
      </div>
      <button className="primary-button" type="submit" disabled={!file || isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar arquivo'}
      </button>
      {error && <p className="form-message error-message" role="alert">{error}</p>}
      {success && <p className="form-message success-message" role="status">{success}</p>}
    </form>
  );
}