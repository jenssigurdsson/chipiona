import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { Activity, Language } from "../types";
import { t } from "../i18n";

// Fix Leaflet default icon paths broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Category → colour mapping
const CATEGORY_COLOR: Record<string, string> = {
  beach:      "#1A5C6B",
  sightseeing:"#E8732A",
  walking:    "#2d5a27",
  restaurant: "#C4522A",
  sports:     "#8b4513",
  explore:    "#6a0dad",
  other:      "#888",
};

function categoryIcon(category: string) {
  const color = CATEGORY_COLOR[category] ?? "#888";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 24 14 24S28 24.5 28 14C28 6.27 21.73 0 14 0z"
      fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="14" cy="14" r="5" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -38],
  });
}

// Fit bounds to activities with coords
function FitBounds({ activities }: { activities: Activity[] }) {
  const map = useMap();
  useEffect(() => {
    const points = activities.filter((a) => a.lat && a.lng) as (Activity & {
      lat: number;
      lng: number;
    })[];
    if (points.length > 1) {
      map.fitBounds(points.map((a) => [a.lat, a.lng]), { padding: [40, 40] });
    }
  }, [activities, map]);
  return null;
}

interface Props {
  activities: Activity[];
  lang: Language;
  onSelect: (a: Activity) => void;
}

// Chipiona centre
const CHIPIONA: [number, number] = [36.7333, -6.4167];

export function MapView({ activities, lang, onSelect }: Props) {
  const tr = t(lang);
  const mapped = activities.filter((a) => a.lat && a.lng);
  const unmapped = activities.filter((a) => !a.lat || !a.lng);

  const getName = (a: Activity) =>
    lang === "is" ? a.name_is : lang === "es" ? a.name_es : a.name_en;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <MapContainer
        center={CHIPIONA}
        zoom={14}
        style={{ flex: 1, minHeight: 0 }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds activities={mapped} />
        {mapped.map((a) => (
          <Marker
            key={a.id}
            position={[a.lat!, a.lng!]}
            icon={categoryIcon(a.category)}
          >
            <Popup>
              <strong style={{ fontFamily: "Nunito, sans-serif", fontSize: 14 }}>
                {getName(a)}
              </strong>
              <br />
              <button
                onClick={() => onSelect(a)}
                style={{
                  marginTop: 6,
                  padding: "4px 12px",
                  background: "#E8732A",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "Nunito, sans-serif",
                }}
              >
                {tr.ui.add_to_itinerary.replace("Bæta við", "Sjá")}
              </button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {unmapped.length > 0 && (
        <div
          style={{
            padding: "10px 16px",
            background: "#FDF6EC",
            borderTop: "1px solid #D4B896",
            fontSize: 12,
            color: "#888",
          }}
        >
          {unmapped.length} activities vantar hnit — keyra pipeline aftur með Google Places lykil
        </div>
      )}
    </div>
  );
}
