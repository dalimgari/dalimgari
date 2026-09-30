export const content_status = Object.freeze({ draft: 'draft', published: 'published', archived: 'archived', scheduled: 'scheduled' })
export function is_published(status) { return status === content_status.published }
