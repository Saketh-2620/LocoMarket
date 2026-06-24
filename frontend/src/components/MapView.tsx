import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { LatLngBounds } from "leaflet";
import { ItemMarker } from "./ItemMarker";
import type { Item } from "../types";
import type { MapBounds } from "../hooks/useMapItems";
import "leaflet/dist/leaflet.css";
import "./MapView.css";

const DEFAULT_CENTER: [number, number] = [40.7128, -74.006];
const DEFAULT_ZOOM = 13;

function boundsToMapBounds(bounds: LatLngBounds): MapBounds {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  return {
    west: sw.lng,
    south: sw.lat,
    east: ne.lng,
    north: ne.lat,
  };
}

function MapBoundsTracker({
  onBoundsChange,
  onDragging,
}: {
  onBoundsChange: (bounds: MapBounds) => void;
  onDragging: (dragging: boolean) => void;
}) {
  const map = useMap();
  const onBoundsChangeRef = useRef(onBoundsChange);
  const onDraggingRef = useRef(onDragging);

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
    onDraggingRef.current = onDragging;
  });

  const reportBounds = useCallback(() => {
    onBoundsChangeRef.current(boundsToMapBounds(map.getBounds()));
  }, [map]);

  useMapEvents({
    movestart: () => onDraggingRef.current(true),
    moveend: () => {
      onDraggingRef.current(false);
      reportBounds();
    },
    zoomend: reportBounds,
  });

  useEffect(() => {
    map.whenReady(() => reportBounds());
  }, [map, reportBounds]);

  return null;
}

function MapRecenter({ center }: { center: [number, number] | null | undefined }) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;
    map.setView(center, map.getZoom(), { animate: false });
  }, [center, map]);

  return null;
}

const pickIcon = L.divIcon({
  className: "price-pin",
  html: `<div class="price-pin-inner">📍</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface MapViewProps {
  items: Item[];
  isFetching?: boolean;
  onBoundsChange: (bounds: MapBounds) => void;
  center?: [number, number];
  pickMode?: boolean;
  pickedPosition?: [number, number] | null;
  onPick?: (lat: number, lng: number) => void;
}

export function MapView({
  items,
  isFetching,
  onBoundsChange,
  center,
  pickMode,
  pickedPosition,
  onPick,
}: MapViewProps) {
  const [dragging, setDragging] = useState(false);
  const initialCenter = center ?? DEFAULT_CENTER;

  return (
    <div className="map-wrapper">
      {isFetching && !dragging && <div className="map-loading">Updating...</div>}
      <MapContainer
        key={pickMode ? "pick-map" : "browse-map"}
        center={initialCenter}
        zoom={DEFAULT_ZOOM}
        className="map-container"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBoundsTracker onBoundsChange={onBoundsChange} onDragging={setDragging} />
        {pickMode && <MapRecenter center={pickedPosition} />}
        {items.map((item) => (
          <ItemMarker key={item.id} item={item} />
        ))}
        {pickMode && pickedPosition && (
          <Marker position={pickedPosition} icon={pickIcon} />
        )}
        {pickMode && <PickHandler onPick={onPick} />}
      </MapContainer>
    </div>
  );
}

function PickHandler({
  onPick,
}: {
  onPick?: (lat: number, lng: number) => void;
}) {
  const onPickRef = useRef(onPick);
  useEffect(() => {
    onPickRef.current = onPick;
  });

  useMapEvents({
    click(e) {
      onPickRef.current?.(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}
