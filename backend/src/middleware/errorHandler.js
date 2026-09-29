const multer = require('multer');

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = error.statusCode || 500;
  let code = statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : error.code || 'BAD_REQUEST';
  let message = statusCode >= 500 ? 'Ocorreu um erro interno.' : error.message;

  if (error instanceof multer.MulterError) {
    statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    code = error.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD';
    message = error.code === 'LIMIT_FILE_SIZE'
      ? 'O arquivo excede o tamanho máximo permitido.'
      : 'A requisição de upload é inválida.';
  }

  return res.status(statusCode).json({
    error: { code, message },
  });
}

module.exports = errorHandler;