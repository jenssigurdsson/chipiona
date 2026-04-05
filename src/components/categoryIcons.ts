import {
  Globe, UtensilsCrossed, Waves, Landmark,
  Footprints, PersonStanding, Compass, Sparkles,
} from "lucide-react";
import type { Category } from "../types";

type CatKey = Category | "all";

export const CATEGORY_ICONS: Record<CatKey, React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>> = {
  all:         Globe,
  restaurant:  UtensilsCrossed,
  beach:       Waves,
  sightseeing: Landmark,
  walking:     Footprints,
  sports:      PersonStanding,
  explore:     Compass,
  other:       Sparkles,
};

export const CATEGORY_COLOR: Record<CatKey, string> = {
  all:         "#1A5C6B",
  restaurant:  "#C4522A",
  beach:       "#1A5C6B",
  sightseeing: "#E8732A",
  walking:     "#2d5a27",
  sports:      "#8b4513",
  explore:     "#6a0dad",
  other:       "#888",
};
