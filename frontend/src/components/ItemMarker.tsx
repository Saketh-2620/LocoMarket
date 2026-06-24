import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Item } from "../types";
import { getMediaUrl } from "../api/client";

function formatPrice(price: string, listingType: string) {
  const num = parseFloat(price);
  const formatted = Number.isInteger(num) ? `$${num}` : `$${num.toFixed(2)}`;
  return listingType === "rent" ? `${formatted}/day` : formatted;
}

export function ItemMarker({ item }: { item: Item }) {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "price-pin",
        html: `<div class="price-pin-inner">${formatPrice(item.price, item.listing_type)}</div>`,
        iconSize: [60, 28],
        iconAnchor: [30, 14],
      }),
    [item.price, item.listing_type]
  );

  return (
    <Marker position={[item.lat, item.lng]} icon={icon}>
      <Popup>
        <div className="item-popup">
          {item.thumbnail && (
            <img src={getMediaUrl(item.thumbnail) || ""} alt={item.title} />
          )}
          <h3>{item.title}</h3>
          <p className="price">{formatPrice(item.price, item.listing_type)}</p>
          {item.distance_km != null && (
            <p className="distance">{item.distance_km} km away</p>
          )}
          <Link to={`/items/${item.id}`}>View details</Link>
        </div>
      </Popup>
    </Marker>
  );
}
