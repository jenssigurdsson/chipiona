import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { UserActivity } from "../types";

export function useUserData(userId: string | null) {
  const [userActivities, setUserActivities] = useState<Record<string, UserActivity>>({});

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("user_activities")
      .select("*")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, UserActivity> = {};
        for (const row of data) map[row.activity_id] = row as UserActivity;
        setUserActivities(map);
      });
  }, [userId]);

  async function toggleFavorite(activityId: string) {
    if (!userId) return;
    const existing = userActivities[activityId];
    const next = !existing?.is_favorite;
    await upsert(userId, activityId, { is_favorite: next });
    setUserActivities((prev) => ({
      ...prev,
      [activityId]: { ...prev[activityId], activity_id: activityId, user_id: userId, is_favorite: next, is_visited: prev[activityId]?.is_visited ?? false, note: prev[activityId]?.note ?? null, id: prev[activityId]?.id ?? "", created_at: prev[activityId]?.created_at ?? "" },
    }));
  }

  async function toggleVisited(activityId: string) {
    if (!userId) return;
    const existing = userActivities[activityId];
    const next = !existing?.is_visited;
    await upsert(userId, activityId, { is_visited: next });
    setUserActivities((prev) => ({
      ...prev,
      [activityId]: { ...prev[activityId], activity_id: activityId, user_id: userId, is_favorite: prev[activityId]?.is_favorite ?? false, is_visited: next, note: prev[activityId]?.note ?? null, id: prev[activityId]?.id ?? "", created_at: prev[activityId]?.created_at ?? "" },
    }));
  }

  async function saveNote(activityId: string, note: string) {
    if (!userId) return;
    await upsert(userId, activityId, { note });
    setUserActivities((prev) => ({
      ...prev,
      [activityId]: { ...prev[activityId], note },
    }));
  }

  return { userActivities, toggleFavorite, toggleVisited, saveNote };
}

async function upsert(
  userId: string,
  activityId: string,
  data: Partial<UserActivity>
) {
  await supabase.from("user_activities").upsert(
    { user_id: userId, activity_id: activityId, ...data },
    { onConflict: "user_id,activity_id" }
  );
}
