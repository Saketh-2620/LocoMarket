import { useQuery } from "@tanstack/react-query";
import { itemsApi } from "../api/endpoints";

export interface MapBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export function useMapItems(
  bounds: MapBounds | null,
  filters: { q?: string; category?: string; listing_type?: string; lat?: number; lng?: number }
) {
  const bbox = bounds
    ? `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`
    : undefined;

  return useQuery({
    queryKey: [
      "items",
      bbox,
      filters.q,
      filters.category,
      filters.listing_type,
      filters.lat,
      filters.lng,
    ],
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = {
        bbox,
        q: filters.q || undefined,
        category: filters.category || undefined,
        listing_type: filters.listing_type || undefined,
        lat: filters.lat,
        lng: filters.lng,
      };
      const { data } = await itemsApi.list(params);
      return data;
    },
    enabled: !!bbox,
    placeholderData: (prev) => prev,
  });
}
