"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFollow } from "@/lib/actions/profile";

export function FollowButton({
  username,
  initialFollowing,
  isLoggedIn,
}: {
  username: string;
  initialFollowing: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        onClick={() => router.push("/login")}
        className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-canvas hover:opacity-90 cursor-pointer"
      >
        Follow
      </button>
    );
  }

  function handleClick() {
    const optimistic = !following;
    setFollowing(optimistic);
    startTransition(async () => {
      try {
        const result = await toggleFollow(username);
        setFollowing(result.following);
      } catch {
        setFollowing(!optimistic);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`rounded-full px-4 py-1.5 text-sm font-medium cursor-pointer disabled:opacity-60 ${
        following
          ? "border border-hairline text-ink hover:border-error hover:text-error"
          : "bg-accent text-canvas hover:opacity-90"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
