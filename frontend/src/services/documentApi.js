async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, options);

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message || 'Não foi possível concluir a solicitação.');
  }

  return response;
}

export async function listDocuments(options) {
  const response = await request('/documents', options);
  const body = await response.json();
  return body.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

export async function downloadDocument(id) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`);
  const contentDisposition = response.headers.get('content-disposition') || '';
  const encodedName = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plainName = contentDisposition.match(/filename="?([^";]+)"?/i)?.[1];
  let filename = plainName || 'documento';

  if (encodedName) {
    try {
      filename = decodeURIComponent(encodedName);
    } catch {
      filename = plainName || 'documento';
    }
  }

  return {
    blob: await response.blob(),
    filename,
  };
}