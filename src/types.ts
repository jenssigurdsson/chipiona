export type Category =
  | "walking"
  | "sightseeing"
  | "restaurant"
  | "explore"
  | "sports"
  | "beach"
  | "other";

export type PriceRange = "free" | "€" | "€€" | "€€€";
export type BestTime = "morning" | "afternoon" | "evening" | "any";
export type Language = "en" | "is" | "es";

export interface Activity {
  id: string;
  name: string;
  name_en: string;
  name_is: string;
  name_es: string;
  category: Category;
  description_es: string;
  description_en: string;
  description_is: string;
  tags: string[];
  address: string | null;
  lat: number | null;
  lng: number | null;
  price_range: PriceRange | null;
  equipment_rental: boolean;
  best_time: BestTime | null;
  sources: string[];
  source_urls: (string | null)[];
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_id: string;
  is_favorite: boolean;
  is_visited: boolean;
  note: string | null;
  created_at: string;
}

export interface ItineraryDay {
  id: string;
  user_id: string;
  day_label: string;
  activity_ids: string[];
  created_at: string;
}
