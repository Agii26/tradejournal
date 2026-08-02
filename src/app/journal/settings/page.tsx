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
    <div className="max-w-3xl">
      <h1 className="sr-only">Settings</h1>

      <ProfileHeaderUpload initialImage={settings.image} initialCoverImage={settings.coverImage} />

      <SettingsForm initial={settings} profileUrl={profileUrl} />
    </div>
  );
}
