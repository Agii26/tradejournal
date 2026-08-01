import { headers } from "next/headers";
import { getUserSettings } from "@/lib/actions/profile";
import { SettingsForm } from "@/components/settings-form";
import { ProfileHeaderUpload } from "@/components/profile-header-upload";

export default async function SettingsPage() {
  const settings = await getUserSettings();
  const host = (await headers()).get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const profileUrl = settings.username ? `${protocol}://${host}/u/${settings.username}` : null;

  return (
    <div className="max-w-xl">
      <h1 className="mb-2 font-display text-3xl text-ink">Settings</h1>
      <p className="mb-8 text-sm text-muted">
        Your public profile — pick a username and choose whether it&rsquo;s searchable.
      </p>

      <ProfileHeaderUpload initialImage={settings.image} initialCoverImage={settings.coverImage} />

      <SettingsForm initial={settings} profileUrl={profileUrl} />
    </div>
  );
}
