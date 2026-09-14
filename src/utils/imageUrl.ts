/**
 * Utility to process, detect, and normalize image URLs,
 * including auto-converting Google Drive share links to high-speed direct CDN image links.
 */

export function extractGoogleDriveId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  // Pattern 1: https://drive.google.com/file/d/{FILE_ID}/view...
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

  // Pattern 2: https://drive.google.com/open?id={FILE_ID} or ?id={FILE_ID}
  const idQueryMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idQueryMatch && idQueryMatch[1]) return idQueryMatch[1];

  // Pattern 3: https://lh3.googleusercontent.com/d/{FILE_ID}
  const lh3Match = url.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lh3Match && lh3Match[1]) return lh3Match[1];

  return null;
}

export function isGoogleDriveUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return Boolean(extractGoogleDriveId(url));
}

/**
 * Normalizes any image URL.
 * If given a Google Drive link, converts it to Google's fast direct CDN thumbnail format:
 * `https://lh3.googleusercontent.com/d/{FILE_ID}`
 * This bypasses Google Drive web-preview framing and CORS restrictions.
 */
export function normalizeImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  const driveId = extractGoogleDriveId(trimmed);
  if (driveId) {
    return `https://lh3.googleusercontent.com/d/${driveId}`;
  }
  return trimmed;
}
