import { Link } from "react-router-dom";
import type { Item } from "../types";
import { getMediaUrl } from "../api/client";
import "./ItemListPanel.css";

interface ItemListPanelProps {
  items: Item[];
  selectedId?: string;
  onSelect?: (item: Item) => void;
}

export function ItemListPanel({ items, selectedId, onSelect }: ItemListPanelProps) {
  return (
    <aside className="item-panel">
      <h2>{items.length} items nearby</h2>
      <ul>
        {items.map((item) => (
          <li
            key={item.id}
            className={selectedId === item.id ? "selected" : ""}
            onClick={() => onSelect?.(item)}
          >
            {item.thumbnail && (
              <img src={getMediaUrl(item.thumbnail) || ""} alt="" />
            )}
            <div className="item-info">
              <Link to={`/items/${item.id}`}>{item.title}</Link>
              <span className="price">${item.price}</span>
              {item.distance_km != null && (
                <span className="distance">{item.distance_km} km</span>
              )}
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="empty">No items in this area. Try panning the map.</li>
        )}
      </ul>
    </aside>
  );
}
