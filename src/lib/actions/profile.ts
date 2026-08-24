"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { profileSchema } from "@/lib/validations/profile";

export type ProfileActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

const NOT_CONFIGURED_ERROR =
  "This site isn't connected to a backend yet — add Supabase credentials to .env.local (see README).";

export async function updateProfileAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  if (!isSupabaseConfigured()) {
    return { error: NOT_CONFIGURED_ERROR };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Base UI's Select can't use "" as a real item value, so the "not set"
  // options in the form use the sentinel "none" — translate it back here.
  const orNone = (v: FormDataEntryValue | null) =>
    v && v !== "none" ? v : undefined;

  const rankId = orNone(formData.get("rankId"));
  const region = orNone(formData.get("region"));
  const avatarFile = formData.get("avatar");

  const parsed = profileSchema.safeParse({
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    bio: formData.get("bio") || undefined,
    discordHandle: formData.get("discordHandle") || undefined,
    youtubeUrl: formData.get("youtubeUrl") || undefined,
    twitchUrl: formData.get("twitchUrl") || undefined,
    statlockerUrl: formData.get("statlockerUrl") || undefined,
    xUrl: formData.get("xUrl") || undefined,
    instagramUrl: formData.get("instagramUrl") || undefined,
    region,
    timezone: formData.get("timezone") || undefined,
    rankId,
    preferredHeroes: formData.getAll("preferredHeroes"),
    playstyleNote: formData.get("playstyleNote") || undefined,
    isLft: formData.get("isLft") === "on",
    avatar:
      avatarFile instanceof File && avatarFile.size > 0 ? avatarFile : undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { avatar, ...profileFields } = parsed.data;

  let avatarUrl: string | undefined;
  if (avatar) {
    const ext = avatar.name.split(".").pop() || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatar, { contentType: avatar.type, upsert: true });

    if (uploadError) {
      return { error: "Couldn't upload that image. Please try again." };
    }

    avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data
      .publicUrl;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username: profileFields.username,
      display_name: profileFields.displayName,
      bio: profileFields.bio || null,
      discord_handle: profileFields.discordHandle || null,
      youtube_url: profileFields.youtubeUrl || null,
      twitch_url: profileFields.twitchUrl || null,
      statlocker_url: profileFields.statlockerUrl || null,
      x_url: profileFields.xUrl || null,
      instagram_url: profileFields.instagramUrl || null,
      region: profileFields.region || null,
      timezone: profileFields.timezone || null,
      rank_id: profileFields.rankId ?? null,
      // Subrank picking was removed from the edit form (just "Rank" now) —
      // always null it out going forward rather than leave a stale value
      // nobody can update anymore.
      rank_subrank: null,
      preferred_heroes: profileFields.preferredHeroes,
      playstyle_note: profileFields.playstyleNote || null,
      is_lft: profileFields.isLft,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { fieldErrors: { username: ["That username is taken."] } };
    }
    return { error: "Couldn't save your profile. Please try again." };
  }

  redirect(`/profile/${profileFields.username}`);
}
