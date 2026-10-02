import { supabase } from '../lib/supabase'

const MEDIA_BUCKET = 'media'

export async function getDatabaseStorageInfo() {
  if (!supabase) throw new Error('Supabase is not configured')
  const [{ data: media, error: mediaError }, { count: albums, error: albumsError }, { count: pages, error: pagesError }, { count: posts, error: postsError }, { data: storageObjects, error: storageError }] = await Promise.all([
    supabase.from('media').select('media_id,file_name,media_type,mime_type,file_size,storage_path,media_url,is_visible,created_at').order('created_at', { ascending: false }),
    supabase.from('albums').select('album_id', { count: 'exact', head: true }),
    supabase.from('pages').select('page_id', { count: 'exact', head: true }),
    supabase.from('posts').select('post_id', { count: 'exact', head: true }),
    supabase.storage.from(MEDIA_BUCKET).list('', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' }}),
  ])
  if (mediaError) throw mediaError; if (albumsError) throw albumsError; if (pagesError) throw pagesError; if (postsError) throw postsError; if (storageError) throw storageError
  const mediaRows = media || []; const storageRows = storageObjects || []
  const uploadedMedia = mediaRows.filter(item => item.storage_path); const externalMedia = mediaRows.filter(item => item.media_url && !item.storage_path)
  const databaseBytes = mediaRows.reduce((sum, item) => sum + Number(item.file_size || 0), 0)
  const storageBytes = storageRows.reduce((sum, item) => sum + Number(item.metadata?.size || 0), 0)
  return { refreshedAt: new Date().toISOString(), database: { media: mediaRows.length, uploadedMedia: uploadedMedia.length, externalMedia: externalMedia.length, albums: albums ?? 0, pages: pages ?? 0, posts: posts ?? 0, mediaBytes: databaseBytes }, storage: { bucket: MEDIA_BUCKET, objects: storageRows.length, bytes: storageBytes, objectsList: storageRows } }
}