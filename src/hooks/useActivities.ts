import { useState, useEffect } from "react";
import { loadActivities } from "../lib/activities";
import type { Activity } from "../types";

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActivities()
      .then(setActivities)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return { activities, loading, error };
}
