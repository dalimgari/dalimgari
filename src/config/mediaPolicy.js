export const MEDIA_POLICY = Object.freeze({
  bucket: 'media',
  maxSizeBytes: 50 * 1024 * 1024,
  maxSizeLabel: '50 MB',
  allowedMimePattern: /^(image\/(jpeg|png|gif|webp|avif)|video\/(mp4|webm|ogg)|audio\/(mpeg|wav|ogg|mp4)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation)|text\/(plain|csv))$/i,
  storagePath: Object.freeze({
    maxLength: 500,
  }),
})

export function isAllowedMediaType(mimeType) {
  return MEDIA_POLICY.allowedMimePattern.test(String(mimeType || ''))
}
