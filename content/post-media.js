const client = window.dalimgariSupabase;
const form = document.querySelector("[data-post-media-form]");
const list = document.querySelector("[data-post-media-list]");
const message = document.querySelector("[data-post-media-message]");
const adminOption = form?.querySelector("[data-admin-only]");

function setMessage(value) {
  if (message) message.textContent = value;
}

async function getUser() {
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  return data.user;
}

async function loadAlbums() {
  const select = form.elements.album;
  const { data, error } = await client
    .from("albums")
    .select("id, title")
    .order("title");

  if (error) throw error;
  select.replaceChildren(new Option("No Album", ""));
  (data || []).forEach((album) => select.add(new Option(album.title, album.id)));
}

async function loadPermissions() {
  const user = await getUser();
  if (!user) {
    setMessage("Login required to create a post.");
    form.querySelector("button[type=submit]").disabled = true;
    return false;
  }

  const { data, error } = await client
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (data?.is_admin) adminOption?.removeAttribute("hidden");
  else adminOption?.remove();

  return true;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function render(posts) {
  if (!posts.length) {
    list.innerHTML = "<p>No posts yet.</p>";
    return;
  }

  list.innerHTML = posts.map((post) => {
    const links = [
      post.image ? '<a href="' + escapeHtml(post.image) + '" target="_blank" rel="noopener">Image</a>' : "",
      post.video ? '<a href="' + escapeHtml(post.video) + '" target="_blank" rel="noopener">Video</a>' : "",
      post.media_link ? '<a href="' + escapeHtml(post.media_link) + '" target="_blank" rel="noopener">Media Link</a>' : ""
    ].filter(Boolean).join(" · ");

    return '<article class="post-media-card"><h3>' +
      escapeHtml(post.title) + "</h3>" +
      (post.description ? "<p>" + escapeHtml(post.description) + "</p>" : "") +
      (links ? "<p>" + links + "</p>" : "") +
      '<p class="post-media-meta">' + escapeHtml(post.visibility) + "</p></article>";
  }).join("");
}

async function loadPosts() {
  const { data, error } = await client
    .from("Post & Media")
    .select("id, title, description, image, video, media_link, visibility, album, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  render(data || []);
}

async function createPost(event) {
  event.preventDefault();

  const user = await getUser();
  if (!user) {
    setMessage("Login required to create a post.");
    return;
  }

  const data = new FormData(form);
  const payload = {
    user_id: user.id,
    title: data.get("title").trim(),
    description: data.get("description").trim() || null,
    image: data.get("image").trim() || null,
    video: data.get("video").trim() || null,
    media_link: data.get("media_link").trim() || null,
    visibility: data.get("visibility"),
    album: data.get("album") || null
  };

  const { error } = await client.from("Post & Media").insert(payload);
  if (error) {
    setMessage(error.message);
    return;
  }

  form.reset();
  form.elements.visibility.value = "public";
  setMessage("Post created successfully.");
  await loadPosts();
}

form?.addEventListener("submit", (event) => {
  createPost(event).catch((error) => setMessage(error.message));
});

(async function init() {
  try {
    if (!(await loadPermissions())) return;
    await loadAlbums();
    await loadPosts();
  } catch (error) {
    setMessage(error.message);
  }
})();