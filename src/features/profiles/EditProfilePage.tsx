import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";

export function EditProfilePage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!supabase) {
        if (active) { setError("Supabase configuration পাওয়া যায়নি।"); setLoading(false); }
        return;
      }
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) { navigate("/login", { replace: true }); return; }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name,phone,date_of_birth,bio,avatar_url")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!active) return;
      setUserId(data.user.id);
      setFullName(profile?.full_name ?? String(data.user.user_metadata?.full_name ?? ""));
      setPhone(profile?.phone ?? "");
      setDateOfBirth(profile?.date_of_birth ?? "");
      setBio(profile?.bio ?? "");
      setAvatarUrl(profile?.avatar_url ?? null);
      if (profileError) setError("প্রোফাইল তথ্য পড়া যায়নি। সংরক্ষণ করলে database policy অনুমতি দিতে হবে।");
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [navigate]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !userId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (avatarFile && (!avatarFile.type.match(/^image\\/(jpeg|png|webp)$/i) || avatarFile.size > 5 * 1024 * 1024)) {
        throw new Error("Avatar অবশ্যই JPEG, PNG বা WebP হতে হবে এবং ৫ MB-এর মধ্যে হতে হবে।");
      }
      if (avatarFile) {
        const extension = avatarFile.type === "image/png" ? "png" : avatarFile.type === "image/webp" ? "webp" : "jpg";
        uploadedPath = userId + "/avatar-" + crypto.randomUUID() + "." + extension;
        const { error: uploadError } = await supabase.storage.from("profile-pictures").upload(uploadedPath, avatarFile, {
          contentType: avatarFile.type,
          cacheControl: "3600",
          upsert: false,
        });
        if (uploadError) throw uploadError;
        setAvatarUrl(supabase.storage.from("profile-pictures").getPublicUrl(uploadedPath).data.publicUrl);
      }
      const payload = {
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        date_of_birth: dateOfBirth || null,
        bio: bio.trim() || null,
        ...(uploadedPath ? { avatar_url: supabase.storage.from("profile-pictures").getPublicUrl(uploadedPath).data.publicUrl } : {}),
      };
      const { data: existing, error: readError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();
      if (readError) throw readError;
      const profileResult = existing
        ? await supabase.from("profiles").update(payload).eq("id", userId)
        : await supabase.from("profiles").insert({ id: userId, ...payload });
      if (profileResult.error) throw profileResult.error;
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });
      if (metadataError) throw metadataError;
      setAvatarFile(null);
      setMessage("প্রোফাইল সংরক্ষণ হয়েছে।");
    } catch {
      if (uploadedPath && supabase) await supabase.storage.from("profile-pictures").remove([uploadedPath]);
      setError("প্রোফাইল সংরক্ষণ করা যায়নি। RLS policy এবং profiles table schema যাচাই করুন।");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p role="status">প্রোফাইল লোড হচ্ছে…</p>;

  return (
    <section className="auth-card" aria-labelledby="edit-profile-title">
      <h1 id="edit-profile-title">প্রোফাইল সম্পাদনা</h1>
      {avatarUrl ? <img className="profile-avatar-image" src={avatarUrl} alt="প্রোফাইল ছবি" /> : null}
      <form onSubmit={(event) => void save(event)}>
        <label htmlFor="profile-avatar">প্রোফাইল ছবি (JPEG/PNG/WebP, সর্বোচ্চ ৫ MB)</label>
        <input id="profile-avatar" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)} />
        <label htmlFor="profile-full-name">পূর্ণ নাম</label>
        <input id="profile-full-name" autoComplete="name" maxLength={120} value={fullName} onChange={(event) => setFullName(event.target.value)} />
        <label htmlFor="profile-phone">ফোন</label>
        <input id="profile-phone" type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} />
        <label htmlFor="profile-dob">জন্মতারিখ</label>
        <input id="profile-dob" type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} />
        <label htmlFor="profile-bio">পরিচিতি</label>
        <textarea id="profile-bio" rows={5} maxLength={2000} value={bio} onChange={(event) => setBio(event.target.value)} />
        <button type="submit" disabled={saving}>{saving ? "সংরক্ষণ হচ্ছে…" : "পরিবর্তন সংরক্ষণ"}</button>
      </form>
      {message ? <p role="status">{message}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      <Link to="/profile">প্রোফাইলে ফিরুন</Link>
    </section>
  );
}
