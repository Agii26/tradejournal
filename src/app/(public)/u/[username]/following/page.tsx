import { FollowListView } from "@/components/follow-list";

export default async function FollowingPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { username } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  return <FollowListView username={username} kind="following" page={page} />;
}
