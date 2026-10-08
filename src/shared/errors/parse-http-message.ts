const httpMessageTranslations: Record<string, string> = {
  'Validation failed (numeric string is expected)':
    'El identificador debe ser un número entero.',
};

export function parseHttpMessage(message: string): string {
  return httpMessageTranslations[message] ?? message;
}
