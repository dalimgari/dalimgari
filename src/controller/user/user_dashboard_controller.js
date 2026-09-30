import { get_current_user_profile } from './user_profile_controller'
import { get_user_permissions } from './user_permission_controller'

export async function load_user_dashboard() {
  const [profile, permissions] = await Promise.all([get_current_user_profile(), get_user_permissions()])
  return { profile, permissions }
}
