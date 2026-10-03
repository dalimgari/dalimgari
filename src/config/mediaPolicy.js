export const MEDIA_POLICY = Object.freeze({
  bucket: 'media',
  maxSizeBytes: 50 * 1024 * 1024,
  maxSizeLabel: '50 MB',
  allowedMimeTypes: Object.freeze([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ]),
  allowedMimePattern: /^(image\/(jpeg|png|gif|webp|avif)|video\/(mp4|webm|ogg)|audio\/(mpeg|wav|ogg|mp4)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation)|text\/(plain|csv))$/i,
  storagePath: Object.freeze({
    maxLength: 500,
    userObject: (userId, fileName) => userId + '/' + crypto.randomUUID() + '-' + fileName,
  }),
})

export function isAllowedMediaType(mimeType) {
  return MEDIA_POLICY.allowedMimePattern.test(String(mimeType || ''))
}
