const client = window.dalimgariSupabase;
const page = document.querySelector('[data-page="profile"]');

if (!client || !page) {
  throw new Error("Profile dependencies are unavailable.");
}

const state = {
  user: null,
  profile: null,
  isAdmin: false,
  roleName: "Visitor",
  tabs: [],
  activeTab: "overview",
  permissions: [],
  roles: [],
  selected: {}
};

const $ = (selector, root = page) => root.querySelector(selector);
const $$ = (selector, root = page) => [...root.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function message(value = "") {
  const output = $("[data-profile-message]");
  if (output) output.textContent = value;
}

function roleKey() {
  return state.isAdmin ? "admin" : (state.user ? "member" : "visitor");
}

function selectedValue(form, name) {
  return String(form.elements[name]?.value ?? "").trim();
}

async function getUser() {
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  return data.user;
}

async function loadIdentity() {
  state.user = await getUser();

  if (!state.user) {
    state.profile = null;
    state.isAdmin = false;
    state.roleName = "Visitor";
    return;
  }

  const { data, error } = await client
    .from("profiles")
    .select("id, display_name, email, phone_number, avatar_url, is_admin, is_active, is_verified, created_at")
    .eq("id", state.user.id)
    .maybeSingle();

  if (error) throw error;

  state.profile = data;
  state.isAdmin = Boolean(data?.is_admin);
  state.roleName = state.isAdmin ? "Admin" : "Member";
}

async function loadTabs() {
  const { data, error } = await client
    .from("profile_tabs")
    .select("key, label, sort_order, visitor_visible, member_visible, admin_visible")
    .order("sort_order");

  if (error) throw error;

  const visibilityField = roleKey() + "_visible";
  state.tabs = (data || []).filter((tab) => tab[visibilityField]);

  if (!state.tabs.some((tab) => tab.key === state.activeTab)) {
    state.activeTab = state.tabs[0]?.key || "overview";
  }

  renderTabs();
  showTab(state.activeTab);
}

function renderTabs() {
  const nav = $("[data-profile-tabs]");
  nav.innerHTML = state.tabs.map((tab) =>
    '<button type="button" class="profile-tab' +
    (tab.key === state.activeTab ? ' is-active' : '') +
    '" data-profile-tab="' + escapeHtml(tab.key) + '">' +
    escapeHtml(tab.label) + "</button>"
  ).join("");
}

function showTab(key) {
  if (!state.tabs.some((tab) => tab.key === key)) return;

  state.activeTab = key;
  $$("[data-profile-tab]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.profileTab === key);
  });
  $$("[data-profile-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.profilePanel !== key;
  });

  const loaders = {
    overview: loadOverview,
    photo: loadPhotos,
    video: loadVideos,
    album: loadAlbums,
    about: loadAbout,
    customize: loadCustomize,
    user: loadUsers,
    role: loadRoles,
    permission: loadPermissions,
    settings: loadSettings
  };

  loaders[key]?.().catch((error) => message(error.message));
}

function renderIdentity() {
  const name = state.profile?.display_name || state.user?.email || "Visitor";
  const avatar = state.profile?.avatar_url || "";

  $("[data-profile-name]").textContent = name;
  $("[data-profile-role]").textContent = state.roleName;

  [$("[data-profile-avatar]"), $("[data-overview-avatar]")].forEach((element) => {
    if (!element) return;
    element.style.backgroundImage = avatar ? "url(\"" + avatar.replace(/"/g, "%22") + "\")" : "";
  });

  $("[data-overview-name]").textContent = name;
  $("[data-overview-role]").textContent = state.roleName;
}

async function loadOverview() {
  renderIdentity();
}

function resetForm(form) {
  form.reset();
  const id = form.elements.id;
  if (id) id.value = "";
}

async function loadAlbumOptions(select, includeEmpty = true) {
  const { data, error } = await client
    .from("Album")
    .select("id, name")
    .order("name");

  if (error) throw error;

  select.replaceChildren();
  if (includeEmpty) select.add(new Option("No Album", ""));
  (data || []).forEach((album) => select.add(new Option(album.name, album.id)));
}

function mediaOwnerFilter(query) {
  if (!state.user) return query.eq("id", "00000000-0000-0000-0000-000000000000");
  return query.eq("user_id", state.user.id);
}

async function loadPhotos() {
  const form = $("[data-photo-form]");
  await loadAlbumOptions(form.elements.album);

  const query = client
    .from("Media")
    .select("id,title,media_url,thumbnail_url,visibility,album_id,created_at")
    .eq("media_type", "image")
    .not("media_url", "is", null)
    .order("created_at", { ascending: false });

  const { data, error } = await mediaOwnerFilter(query);
  if (error) throw error;

  const list = $("[data-photo-list]");
  list.innerHTML = (data || []).length
    ? data.map((item) =>
        '<button type="button" class="ui-record ui-record-button" data-photo-id="' + item.id + '">' +
          '<img src="' + escapeHtml(item.thumbnail_url || item.media_url) + '" alt="" style="width:72px;height:54px;object-fit:cover;border-radius:var(--radius);">' +
          '<span class="ui-record-title">' + escapeHtml(item.title || "Photo") + '</span>' +
          '<span class="ui-record-meta">' + escapeHtml(item.visibility) + '</span>' +
        '</button>'
      ).join("")
    : "<p>No photos yet.</p>";
}

function fillPhoto(item) {
  const form = $("[data-photo-form]");
  form.elements.id.value = item.id;
  form.elements.image.value = item.media_url || "";
  form.elements.visibility.value = item.visibility || "public";
  form.elements.album.value = item.album_id || "";
  $("[data-photo-delete]").hidden = false;
  $("[data-photo-profile]").hidden = false;
}

async function savePhoto(event) {
  event.preventDefault();
  if (!state.user) return message("Login required.");

  const form = event.currentTarget;
  const id = selectedValue(form, "id");
  const image = selectedValue(form, "image");
  const payload = {
    user_id: state.user.id,
    title: "Photo",
    description: null,
    media_type: "image",
    media_url: image,
    thumbnail_url: null,
    album_id: selectedValue(form, "album") || null,
    visibility: selectedValue(form, "visibility") || "public"
  };

  const query = id
    ? client.from("Media").update(payload).eq("id", id)
    : client.from("Media").insert(payload);

  const { error } = await query;
  if (error) throw error;

  resetForm(form);
  $("[data-photo-delete]").hidden = true;
  $("[data-photo-profile]").hidden = true;
  message(id ? "Photo updated." : "Photo added.");
  await loadPhotos();
}

async function deletePhoto() {
  const id = selectedValue($("[data-photo-form]"), "id");
  if (!id) return;
  if (!confirm("Delete this photo?")) return;

  const { error } = await client.from("Media").delete().eq("id", id);
  if (error) throw error;

  resetForm($("[data-photo-form]"));
  $("[data-photo-delete]").hidden = true;
  $("[data-photo-profile]").hidden = true;
  message("Photo deleted.");
  await loadPhotos();
}

async function setProfilePhoto() {
  const form = $("[data-photo-form]");
  const image = selectedValue(form, "image");
  if (!image || !state.user) return;

  const { error } = await client.from("profiles")
    .update({ avatar_url: image })
    .eq("id", state.user.id);

  if (error) throw error;

  state.profile.avatar_url = image;
  renderIdentity();
  message("Profile photo updated.");
}

async function loadVideos() {
  const query = client
    .from("Media")
    .select("id,title,description,media_url,thumbnail_url,visibility,album_id,created_at")
    .eq("media_type", "video")
    .not("media_url", "is", null)
    .order("created_at", { ascending: false });

  const { data, error } = await mediaOwnerFilter(query);
  if (error) throw error;

  const list = $("[data-video-list]");
  list.innerHTML = (data || []).length
    ? data.map((item) =>
        '<button type="button" class="ui-record ui-record-button ui-media-item" data-video-id="' + item.id + '">' +
          '<video src="' + escapeHtml(item.media_url) + '" muted preload="metadata" playsinline></video>' +
          '<span class="ui-record-title">' + escapeHtml(item.title || "Video") + '</span>' +
          '<span class="ui-record-meta">' + escapeHtml(item.description || "") + '</span>' +
          '<span class="ui-record-meta">' + escapeHtml(item.visibility) + '</span>' +
        '</button>'
      ).join("")
    : "<p>No videos yet.</p>";
}

function fillVideo(item) {
  const form = $("[data-video-form]");
  form.elements.id.value = item.id;
  form.elements.title.value = item.title || "";
  form.elements.description.value = item.description || "";
  form.elements.video.value = item.media_url || "";
  form.elements.visibility.value = item.visibility || "public";
  form.elements.album.value = item.album_id || "";
  $("[data-video-delete]").hidden = false;
}

async function saveVideo(event) {
  event.preventDefault();
  if (!state.user) return message("Login required.");

  const form = event.currentTarget;
  const id = selectedValue(form, "id");
  const payload = {
    user_id: state.user.id,
    title: selectedValue(form, "title"),
    description: selectedValue(form, "description") || null,
    media_type: "video",
    media_url: selectedValue(form, "video"),
    thumbnail_url: null,
    album_id: selectedValue(form, "album") || null,
    visibility: selectedValue(form, "visibility") || "public"
  };

  const query = id
    ? client.from("Media").update(payload).eq("id", id)
    : client.from("Media").insert(payload);

  const { error } = await query;
  if (error) throw error;

  resetForm(form);
  $("[data-video-delete]").hidden = true;
  message(id ? "Video updated." : "Video added.");
  await loadVideos();
}

async function deleteVideo() {
  const id = selectedValue($("[data-video-form]"), "id");
  if (!id) return;
  if (!confirm("Delete this video?")) return;

  const { error } = await client.from("Media").delete().eq("id", id);
  if (error) throw error;

  resetForm($("[data-video-form]"));
  $("[data-video-delete]").hidden = true;
  message("Video deleted.");
  await loadVideos();
}

async function loadAlbums() {
  const { data, error } = await client
    .from("Album")
    .select("id,name,description,visibility,created_at")
    .eq("user_id", state.user?.id || "00000000-0000-0000-0000-000000000000")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const list = $("[data-album-list]");
  list.innerHTML = (data || []).length
    ? data.map((item) =>
        '<button type="button" class="ui-record ui-record-button" data-album-id="' + item.id + '">' +
          '<span class="ui-record-title">' + escapeHtml(item.name) + '</span>' +
          '<span class="ui-record-meta">' + escapeHtml(item.description || "") + '</span>' +
        '</button>'
      ).join("")
    : "<p>No albums yet.</p>";
}

function fillAlbum(item) {
  const form = $("[data-album-form]");
  form.elements.id.value = item.id;
  form.elements.title.value = item.name || "";
  form.elements.description.value = item.description || "";
  loadAlbumMedia(item.id).catch((error) => message(error.message));
  $("[data-album-delete]").hidden = false;
}

async function saveAlbum(event) {
  event.preventDefault();
  if (!state.user) return message("Login required.");

  const form = event.currentTarget;
  const id = selectedValue(form, "id");
  const payload = {
    name: selectedValue(form, "title"),
    description: selectedValue(form, "description") || null,
    user_id: state.user.id
  };

  const query = id
    ? client.from("Album").update(payload).eq("id", id).eq("user_id", state.user.id)
    : client.from("Album").insert(payload);

  const { error } = await query;
  if (error) throw error;

  resetForm(form);
  $("[data-album-delete]").hidden = true;
  message(id ? "Album updated." : "Album added.");
  await loadAlbums();
}

async function loadAlbumMedia(albumId) {
  const list = $("[data-album-media-list]");
  if (!list) return;
  const { data, error } = await client
    .from("Media")
    .select("id,title,media_type,media_url,thumbnail_url,visibility,album_id,created_at")
    .eq("album_id", albumId)
    .eq("user_id", state.user?.id || "00000000-0000-0000-0000-000000000000")
    .order("created_at", { ascending: false });
  if (error) throw error;
  list.innerHTML = (data || []).length
    ? data.map((item) =>
      '<div class="ui-record">' +
        '<span class="ui-record-title">' + escapeHtml(item.title || item.media_type) + '</span>' +
        '<span class="ui-record-meta">' + escapeHtml(item.media_type) + '</span>' +
        '<button class="ui-button" type="button" data-album-remove-media="' + item.id + '">Remove</button>' +
      '</div>'
    ).join("")
    : "<p>No media in this album.</p>";
}

async function loadAvailableAlbumMedia(albumId) {
  const list = $("[data-album-available-list]");
  if (!list) return;
  const { data, error } = await client
    .from("Media")
    .select("id,title,media_type,album_id,created_at")
    .eq("user_id", state.user?.id || "00000000-0000-0000-0000-000000000000")
    .neq("album_id", albumId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  list.innerHTML = (data || []).length
    ? data.map((item) =>
      '<label class="ui-check"><input type="checkbox" value="' + item.id + '" data-album-available-media> ' +
      escapeHtml(item.title || item.media_type) + ' (' + escapeHtml(item.media_type) + ')</label>'
    ).join("")
    : "<p>No other uploaded media available.</p>";
}

async function addSelectedMediaToAlbum() {
  const albumId = selectedValue($("[data-album-form]"), "id");
  if (!albumId) return message("Select an album first.");
  const ids = $("[data-album-available-media]:checked").map((input) => input.value);
  if (!ids.length) return message("Select media first.");
  const { error } = await client
    .from("Media")
    .update({ album_id: albumId })
    .in("id", ids)
    .eq("user_id", state.user.id);
  if (error) throw error;
  message("Selected media added to album.");
  await loadAlbumMedia(albumId);
  await loadAvailableAlbumMedia(albumId);
}

async function removeMediaFromAlbum(id) {
  const albumId = selectedValue($("[data-album-form]"), "id");
  if (!albumId) return;
  const { error } = await client
    .from("Media")
    .update({ album_id: null })
    .eq("id", id)
    .eq("album_id", albumId)
    .eq("user_id", state.user.id);
  if (error) throw error;
  message("Media removed from album.");
  await loadAlbumMedia(albumId);
  await loadAvailableAlbumMedia(albumId);
}

async function deleteAlbum() {
  const id = selectedValue($("[data-album-form]"), "id");
  if (!id) return;
  if (!confirm("Delete this album?")) return;

  const { error } = await client.from("Album").delete().eq("id", id).eq("user_id", state.user.id);
  if (error) throw error;

  resetForm($("[data-album-form]"));
  $("[data-album-delete]").hidden = true;
  message("Album deleted.");
  await loadAlbums();
}

async function loadAbout() {
  if (!state.user || !state.profile) {
    $("[data-about-form]").reset();
    $("[data-about-status]").textContent = "Visitor";
    $("[data-about-role]").textContent = "Visitor";
    $("[data-about-joined]").textContent = "—";
    return;
  }

  const form = $("[data-about-form]");
  form.elements.name.value = state.profile.display_name || "";
  form.elements.phone.value = state.profile.phone_number || state.user.phone || "";
  form.elements.email.value = state.profile.email || state.user.email || "";

  $("[data-about-status]").textContent = state.profile.is_active ? "Active" : "Suspended";
  $("[data-about-role]").textContent = state.roleName;
  $("[data-about-joined]").textContent = new Date(state.profile.created_at).toLocaleDateString();
}

async function saveAbout(event) {
  event.preventDefault();
  if (!state.user) return message("Login required.");

  const form = event.currentTarget;
  const name = selectedValue(form, "name");
  const phone = selectedValue(form, "phone");
  const email = selectedValue(form, "email");

  const { error: profileError } = await client.from("profiles")
    .update({ display_name: name, phone_number: phone, email })
    .eq("id", state.user.id);

  if (profileError) throw profileError;

  const authPayload = {};
  if (email) authPayload.email = email;
  if (phone) authPayload.phone = phone;
  if (Object.keys(authPayload).length) {
    const { error: authError } = await client.auth.updateUser(authPayload);
    if (authError) throw authError;
  }

  state.profile.display_name = name;
  state.profile.phone_number = phone;
  state.profile.email = email;
  renderIdentity();
  message("Profile information updated.");
}

async function loadCustomize() {
  if (!state.isAdmin) return;

  const { data, error } = await client
    .from("profile_tabs")
    .select("key,label,sort_order,visitor_visible,member_visible,admin_visible")
    .order("sort_order");

  if (error) throw error;

  $("[data-customize-list]").innerHTML = (data || []).map((tab) =>
    '<div class="ui-record" data-customize-item="' + escapeHtml(tab.key) + '">' +
      '<div class="ui-form">' +
        '<label>Tab Name<input name="label" value="' + escapeHtml(tab.label) + '" maxlength="80"></label>' +
        '<label>Order<input name="sort_order" type="number" value="' + tab.sort_order + '"></label>' +
        '<div class="ui-check-grid">' +
          '<label class="ui-check"><input type="checkbox" name="visitor_visible" ' + (tab.visitor_visible ? "checked" : "") + '> Visitor</label>' +
          '<label class="ui-check"><input type="checkbox" name="member_visible" ' + (tab.member_visible ? "checked" : "") + '> Member</label>' +
          '<label class="ui-check"><input type="checkbox" name="admin_visible" ' + (tab.admin_visible ? "checked" : "") + '> Admin</label>' +
        '</div>' +
      '</div>' +
    '</div>'
  ).join("");
}

async function saveCustomize(event) {
  event.preventDefault();
  if (!state.isAdmin) return;

  const items = $$("[data-customize-item]");
  for (const item of items) {
    const payload = {
      label: item.querySelector('[name="label"]').value.trim(),
      sort_order: Number(item.querySelector('[name="sort_order"]').value) || 0,
      visitor_visible: item.querySelector('[name="visitor_visible"]').checked,
      member_visible: item.querySelector('[name="member_visible"]').checked,
      admin_visible: item.querySelector('[name="admin_visible"]').checked
    };
    const { error } = await client.from("profile_tabs").update(payload).eq("key", item.dataset.customizeItem);
    if (error) throw error;
  }

  message("Profile tabs updated.");
  await loadTabs();
}

async function loadUsers() {
  if (!state.isAdmin) return;

  const [{ data, error }, { data: authData, error: authError }] = await Promise.all([
    client.from("profiles").select("id,display_name,email,is_admin,is_active,is_verified,created_at").order("created_at", { ascending: false }),
    client.functions.invoke("admin-user-management", { body: { action: "list_users" } })
  ]);

  if (error) throw error;
  if (authError) throw authError;

  const authUsers = authData?.users || [];
  const merged = (data || []).map((item) => ({
    ...item,
    blocked: Boolean(authUsers.find((user) => user.id === item.id)?.banned_until)
  }));

  const list = $("[data-user-list]");
  list.innerHTML = merged.map((item) =>
    '<button type="button" class="ui-record ui-record-button" data-user-id="' + item.id + '">' +
      '<span class="ui-record-title">' + escapeHtml(item.display_name || item.email || "User") + '</span>' +
      '<span class="ui-record-meta">' + escapeHtml(item.email || "") + '</span>' +
      '<span class="ui-record-meta">' + (item.is_active ? "Active" : "Suspended") + " · " + (item.is_admin ? "Admin" : "Member") + " · " + (item.blocked ? "Blocked" : "Unblocked") + '</span>' +
    '</button>'
  ).join("") || "<p>No users found.</p>";
}

async function fillUser(item) {
  const form = $("[data-user-form]");
  const { count, error } = await client
    .from("Media")
    .select("id", { count: "exact", head: true })
    .eq("user_id", item.id);

  if (error) throw error;

  form.elements.id.value = item.id;
  form.elements.name.value = item.display_name || "";
  form.elements.member_since.value = item.created_at ? new Date(item.created_at).toLocaleDateString() : "—";
  form.elements.activity.value = String(count ?? 0) + " Media item(s)";
  form.elements.is_active.value = String(Boolean(item.is_active));
  form.elements.account_type.value = item.is_admin ? "Admin" : "Member";
  form.elements.verified.value = String(Boolean(item.is_verified));
  form.elements.blocked.value = String(Boolean(item.blocked));
  $("[data-user-delete]").hidden = false;
}

async function saveUser(event) {
  event.preventDefault();
  if (!state.isAdmin) return;

  const form = event.currentTarget;
  const id = selectedValue(form, "id");
  if (!id) return message("Select a user first.");

  const action = {
    action: "update_user",
    user_id: id,
    display_name: selectedValue(form, "name"),
    is_active: selectedValue(form, "is_active") === "true",
    is_admin: selectedValue(form, "account_type") === "Admin",
    is_verified: selectedValue(form, "verified") === "true"
  };

  const { data, error } = await client.functions.invoke("admin-user-management", { body: action });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.message || "User update failed.");

  const { data: blockData, error: blockError } = await client.functions.invoke("admin-user-management", {
    body: {
      action: "set_block",
      user_id: id,
      blocked: selectedValue(form, "blocked") === "true"
    }
  });
  if (blockError) throw blockError;
  if (!blockData?.ok) throw new Error(blockData?.message || "Block status update failed.");

  message("User updated.");
  await loadUsers();
}

async function deleteUser() {
  if (!state.isAdmin) return;
  const id = selectedValue($("[data-user-form]"), "id");
  if (!id) return;
  if (id === state.user.id) return message("Use Settings to delete your own account.");
  if (!confirm("Delete this user account?")) return;

  const { data, error } = await client.functions.invoke("admin-user-management", {
    body: { action: "delete_user", user_id: id }
  });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.message || "User deletion failed.");

  resetForm($("[data-user-form]"));
  $("[data-user-delete]").hidden = true;
  message("User deleted.");
  await loadUsers();
}

async function loadPermissions() {
  if (!state.isAdmin) return;

  const { data, error } = await client
    .from("permissions")
    .select("id,key,description")
    .order("key");

  if (error) throw error;
  state.permissions = data || [];

  $("[data-permission-list]").innerHTML = state.permissions.map((item) =>
    '<button type="button" class="ui-record ui-record-button" data-permission-id="' + item.id + '">' +
      '<span class="ui-record-title">' + escapeHtml(item.key) + '</span>' +
      '<span class="ui-record-meta">' + escapeHtml(item.description || "") + '</span>' +
    '</button>'
  ).join("") || "<p>No permissions found.</p>";

  renderRolePermissionChecks();
}

function renderRolePermissionChecks(selected = []) {
  $("[data-role-permissions]").innerHTML = state.permissions.map((item) =>
    '<label class="ui-check"><input type="checkbox" value="' + item.id + '" ' +
    (selected.includes(item.id) ? "checked" : "") + '> ' + escapeHtml(item.key) + '</label>'
  ).join("");
}

function fillPermission(item) {
  const form = $("[data-permission-form]");
  form.elements.id.value = item.id;
  form.elements.key.value = item.key || "";
  form.elements.description.value = item.description || "";
  $("[data-permission-delete]").hidden = false;
}

async function savePermission(event) {
  event.preventDefault();
  if (!state.isAdmin) return;

  const form = event.currentTarget;
  const id = selectedValue(form, "id");
  const payload = {
    key: selectedValue(form, "key"),
    description: selectedValue(form, "description") || null
  };

  const query = id
    ? client.from("permissions").update(payload).eq("id", id)
    : client.from("permissions").insert(payload);

  const { error } = await query;
  if (error) throw error;

  resetForm(form);
  $("[data-permission-delete]").hidden = true;
  message(id ? "Permission updated." : "Permission created.");
  await loadPermissions();
  await loadRoles();
}

async function deletePermission() {
  const id = selectedValue($("[data-permission-form]"), "id");
  if (!id) return;
  if (!confirm("Delete this permission?")) return;

  const { error } = await client.from("permissions").delete().eq("id", id);
  if (error) throw error;

  resetForm($("[data-permission-form]"));
  $("[data-permission-delete]").hidden = true;
  message("Permission deleted.");
  await loadPermissions();
  await loadRoles();
}

async function loadRoles() {
  if (!state.isAdmin) return;
  const currentRole = $("[data-current-role]");
  if (currentRole) currentRole.textContent = state.roleName;

  const { data, error } = await client
    .from("roles")
    .select("id,name,description,created_at")
    .order("name");

  if (error) throw error;
  state.roles = data || [];

  $("[data-role-list]").innerHTML = state.roles.map((item) =>
    '<button type="button" class="ui-record ui-record-button" data-role-id="' + item.id + '">' +
      '<span class="ui-record-title">' + escapeHtml(item.name) + '</span>' +
      '<span class="ui-record-meta">' + escapeHtml(item.description || "") + '</span>' +
    '</button>'
  ).join("") || "<p>No roles found.</p>";

  if (!state.permissions.length) await loadPermissions();
}

async function fillRole(item) {
  const form = $("[data-role-form]");
  form.elements.id.value = item.id;
  form.elements.name.value = item.name || "";
  form.elements.description.value = item.description || "";

  const { data, error } = await client
    .from("role_permissions")
    .select("permission_id")
    .eq("role_id", item.id);

  if (error) throw error;

  renderRolePermissionChecks((data || []).map((row) => row.permission_id));
  $("[data-role-delete]").hidden = item.name.toLowerCase() === "admin";
}

async function saveRole(event) {
  event.preventDefault();
  if (!state.isAdmin) return;

  const form = event.currentTarget;
  const id = selectedValue(form, "id");
  const payload = {
    name: selectedValue(form, "name"),
    description: selectedValue(form, "description") || null
  };

  let roleId = id;
  if (id) {
    const { error } = await client.from("roles").update(payload).eq("id", id);
    if (error) throw error;
  } else {
    const { data, error } = await client.from("roles").insert(payload).select("id").single();
    if (error) throw error;
    roleId = data.id;
  }

  const { error: clearError } = await client.from("role_permissions").delete().eq("role_id", roleId);
  if (clearError) throw clearError;

  const permissionIds = $$("[data-role-permissions] input:checked").map((input) => input.value);
  if (permissionIds.length) {
    const { error } = await client.from("role_permissions").insert(
      permissionIds.map((permission_id) => ({ role_id: roleId, permission_id }))
    );
    if (error) throw error;
  }

  resetForm(form);
  renderRolePermissionChecks([]);
  $("[data-role-delete]").hidden = true;
  message(id ? "Role updated." : "Role created.");
  await loadRoles();
}

async function deleteRole() {
  const id = selectedValue($("[data-role-form]"), "id");
  if (!id) return;
  if (!confirm("Delete this role?")) return;

  const role = state.roles.find((item) => item.id === id);
  if (role?.name.toLowerCase() === "admin") return message("The Admin role cannot be deleted.");

  const { error } = await client.from("roles").delete().eq("id", id);
  if (error) throw error;

  resetForm($("[data-role-form]"));
  renderRolePermissionChecks([]);
  $("[data-role-delete]").hidden = true;
  message("Role deleted.");
  await loadRoles();
}

function loadSettings() {
  const mode = localStorage.getItem("dalimgari-theme-mode") || "day";
  const theme = localStorage.getItem("dalimgari-theme") || "default";
  const font = localStorage.getItem("dalimgari-font") || "system";

  $("[data-setting-theme-mode]").value = mode;
  $("[data-setting-theme]").value = theme;
  $("[data-setting-font]").value = font;
  applyAppearance(mode, theme, font);
}

function applyAppearance(mode, theme, font) {
  document.documentElement.dataset.themeMode = mode;
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.font = font;
}

function saveSettings() {
  const mode = $("[data-setting-theme-mode]").value;
  const theme = $("[data-setting-theme]").value;
  const font = $("[data-setting-font]").value;

  localStorage.setItem("dalimgari-theme-mode", mode);
  localStorage.setItem("dalimgari-theme", theme);
  localStorage.setItem("dalimgari-font", font);
  applyAppearance(mode, theme, font);
  message("Settings saved.");
}

async function deactivateAccount() {
  if (!state.user) return message("Login required.");
  if (!confirm("Deactivate your account?")) return;

  const { error } = await client.from("profiles")
    .update({ is_active: false })
    .eq("id", state.user.id);

  if (error) throw error;

  await client.auth.signOut();
  window.location.hash = "#content/home.html";
  window.location.reload();
}

async function deleteOwnAccount() {
  if (!state.user) return message("Login required.");
  if (!confirm("Delete your account permanently? This cannot be undone.")) return;

  const { data, error } = await client.functions.invoke("admin-user-management", {
    body: { action: "delete_user", user_id: state.user.id, self_delete: true }
  });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.message || "Account deletion failed.");

  await client.auth.signOut();
  window.location.hash = "#content/home.html";
  window.location.reload();
}

function wireEvents() {
  page.addEventListener("click", async (event) => {
    const tab = event.target.closest("[data-profile-tab]");
    if (tab) return showTab(tab.dataset.profileTab);

    const photo = event.target.closest("[data-photo-id]");
    if (photo) {
      const { data, error } = await client.from("Post & Media").select("*").eq("id", photo.dataset.photoId).single();
      if (error) return message(error.message);
      return fillPhoto(data);
    }

    const video = event.target.closest("[data-video-id]");
    if (video) {
      const { data, error } = await client.from("Post & Media").select("*").eq("id", video.dataset.videoId).single();
      if (error) return message(error.message);
      return fillVideo(data);
    }

    const album = event.target.closest("[data-album-id]");
    if (album) {
      const { data, error } = await client.from("Album").select("*").eq("id", album.dataset.albumId).single();
      if (error) return message(error.message);
      fillAlbum(data);
      return loadAvailableAlbumMedia(data.id).catch((error) => message(error.message));
    }

    const user = event.target.closest("[data-user-id]");
    if (user) {
      const { data, error } = await client.from("profiles").select("*").eq("id", user.dataset.userId).single();
      if (error) return message(error.message);
      const authUsers = (await client.functions.invoke("admin-user-management", { body: { action: "list_users" } })).data?.users || [];
      data.blocked = Boolean(authUsers.find((entry) => entry.id === data.id)?.banned_until);
      return fillUser(data).catch((fillError) => message(fillError.message));
    }

    const role = event.target.closest("[data-role-id]");
    if (role) {
      const item = state.roles.find((entry) => entry.id === role.dataset.roleId);
      if (item) return fillRole(item).catch((error) => message(error.message));
    }

    const permission = event.target.closest("[data-permission-id]");
    if (permission) {
      const item = state.permissions.find((entry) => entry.id === permission.dataset.permissionId);
      if (item) return fillPermission(item);
    }

    if (event.target.closest("[data-photo-reset]")) {
      resetForm($("[data-photo-form]"));
      $("[data-photo-delete]").hidden = true;
      $("[data-photo-profile]").hidden = true;
    }
    if (event.target.closest("[data-video-reset]")) {
      resetForm($("[data-video-form]"));
      $("[data-video-delete]").hidden = true;
    }
    if (event.target.closest("[data-album-reset]")) {
      resetForm($("[data-album-form]"));
      $("[data-album-delete]").hidden = true;
    }
    if (event.target.closest("[data-role-reset]")) {
      resetForm($("[data-role-form]"));
      renderRolePermissionChecks([]);
      $("[data-role-delete]").hidden = true;
    }
    if (event.target.closest("[data-permission-reset]")) {
      resetForm($("[data-permission-form]"));
      $("[data-permission-delete]").hidden = true;
    }
  });

  page.addEventListener("submit", (event) => {
    const handlers = [
      ["[data-photo-form]", savePhoto],
      ["[data-video-form]", saveVideo],
      ["[data-album-form]", saveAlbum],
      ["[data-about-form]", saveAbout],
      ["[data-customize-form]", saveCustomize],
      ["[data-user-form]", saveUser],
      ["[data-role-form]", saveRole],
      ["[data-permission-form]", savePermission]
    ];

    const match = handlers.find(([selector]) => event.target.matches(selector));
    if (match) match[1](event).catch((error) => message(error.message));
  });

  $("[data-photo-delete]")?.addEventListener("click", () => deletePhoto().catch((error) => message(error.message)));
  $("[data-photo-profile]")?.addEventListener("click", () => setProfilePhoto().catch((error) => message(error.message)));
  $("[data-video-delete]")?.addEventListener("click", () => deleteVideo().catch((error) => message(error.message)));
  $("[data-album-delete]")?.addEventListener("click", () => deleteAlbum().catch((error) => message(error.message)));
  $("[data-album-add-media]")?.addEventListener("click", () => addSelectedMediaToAlbum().catch((error) => message(error.message)));
  page.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-album-remove-media]");
    if (remove) removeMediaFromAlbum(remove.dataset.albumRemoveMedia).catch((error) => message(error.message));
  });
  $("[data-user-delete]")?.addEventListener("click", () => deleteUser().catch((error) => message(error.message)));
  $("[data-role-delete]")?.addEventListener("click", () => deleteRole().catch((error) => message(error.message)));
  $("[data-permission-delete]")?.addEventListener("click", () => deletePermission().catch((error) => message(error.message)));
  $("[data-settings-save]")?.addEventListener("click", saveSettings);
  $("[data-deactivate]")?.addEventListener("click", () => deactivateAccount().catch((error) => message(error.message)));
  $("[data-delete-account]")?.addEventListener("click", () => deleteOwnAccount().catch((error) => message(error.message)));
}

async function init() {
  try {
    await loadIdentity();
    renderIdentity();
    wireEvents();
    await loadTabs();
    if (state.isAdmin) {
      await loadPermissions();
      await loadRoles();
    }
  } catch (error) {
    message(error.message);
  }
}

init();
