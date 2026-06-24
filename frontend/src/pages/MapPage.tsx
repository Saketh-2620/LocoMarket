import { useCallback, useMemo, useState } from "react";
import { MapView } from "../components/MapView";
import { ItemListPanel } from "../components/ItemListPanel";
import { useDebouncedValue } from "../hooks/useDebounce";
import { useMapItems, type MapBounds } from "../hooks/useMapItems";
import "./MapPage.css";

function boundsEqual(a: MapBounds | null, b: MapBounds): boolean {
  if (!a) return false;
  const eps = 1e-6;
  return (
    Math.abs(a.west - b.west) < eps &&
    Math.abs(a.south - b.south) < eps &&
    Math.abs(a.east - b.east) < eps &&
    Math.abs(a.north - b.north) < eps
  );
}

export function MapPage() {
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [listingType, setListingType] = useState("");

  const debouncedBounds = useDebouncedValue(bounds, 400);
  const debouncedSearch = useDebouncedValue(search, 400);

  const filters = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      category: category || undefined,
      listing_type: listingType || undefined,
      lat: debouncedBounds
        ? (debouncedBounds.south + debouncedBounds.north) / 2
        : undefined,
      lng: debouncedBounds
        ? (debouncedBounds.west + debouncedBounds.east) / 2
        : undefined,
    }),
    [debouncedSearch, category, listingType, debouncedBounds]
  );

  const { data: items = [], isFetching } = useMapItems(debouncedBounds, filters);

  const handleBoundsChange = useCallback((b: MapBounds) => {
    setBounds((prev) => (boundsEqual(prev, b) ? prev : b));
  }, []);

  return (
    <div className="map-page">
      <div className="map-sidebar">
        <div className="search-bar">
          <input
            type="search"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            <option value="electronics">Electronics</option>
            <option value="tools">Tools</option>
            <option value="furniture">Furniture</option>
            <option value="clothing">Clothing</option>
            <option value="sports">Sports</option>
            <option value="other">Other</option>
          </select>
          <select
            value={listingType}
            onChange={(e) => setListingType(e.target.value)}
          >
            <option value="">Rent or Sale</option>
            <option value="rent">Rent</option>
            <option value="sale">Sale</option>
          </select>
        </div>
        <ItemListPanel items={items} />
      </div>
      <MapView
        items={items}
        isFetching={isFetching}
        onBoundsChange={handleBoundsChange}
      />
    </div>
  );
}
