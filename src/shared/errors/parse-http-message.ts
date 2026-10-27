const httpMessageTranslations: Record<string, string> = {
  'Validation failed (numeric string is expected)':
    'El identificador debe ser un número entero.',
  'File too large': 'El archivo supera el tamaño máximo de 2 MB.',
  'Unexpected field': 'Debes enviar el archivo Excel en el campo archivo.',
  'Unexpected file field': 'Debes enviar el archivo Excel en el campo archivo.',
};

export function parseHttpMessage(message: string): string {
  return httpMessageTranslations[message] ?? message;
}
