import { Request } from 'express';

/**
 * Get the base URL dynamically from the request or environment variable
 * Priority: Request object > BASE_URL env var > fallback
 */
export function getBaseUrl(req?: Request): string {
  // If request is provided, use it to build the URL dynamically
  if (req) {
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}`;
  }

  // Fallback to environment variable or default
  return process.env.BASE_URL || 'http://localhost:3001';
}

/**
 * Generate download URL for a file
 */
export function generateDownloadUrl(baseUrl: string, filePath: string): string {
  return `${baseUrl}${filePath}?download=true`;
}
