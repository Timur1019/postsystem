const DEFAULT_MAX_BYTES = 512 * 1024;

/**
 * @param {File} file
 * @param {number} [maxBytes]
 * @returns {Promise<string>} data URL
 */
export function readImageDataUrl(file, maxBytes = DEFAULT_MAX_BYTES) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) {
      reject(new Error('NOT_IMAGE'));
      return;
    }
    if (file.size > maxBytes) {
      reject(new Error('TOO_LARGE'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('READ_FAILED'));
    reader.readAsDataURL(file);
  });
}
