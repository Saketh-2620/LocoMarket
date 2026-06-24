import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";
import { itemsApi } from "../api/endpoints";
import { MapView } from "../components/MapView";
import { useAuth } from "../context/AuthContext";
import "./CreateItemPage.css";

export function CreateItemPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("other");
  const [listingType, setListingType] = useState<"rent" | "sale">("sale");
  const [address, setAddress] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("listing_type", listingType);
      formData.append("address", address);

      if (position) {
        formData.append("lat", String(position[0]));
        formData.append("lng", String(position[1]));
      } else if (addressQuery) {
        formData.append("address_query", addressQuery);
      } else {
        throw new Error("Set a location by clicking the map or entering an address.");
      }

      photos.forEach((file) => formData.append("photos", file));
      return itemsApi.create(formData);
    },
    onSuccess: (res) => navigate(`/items/${res.data.id}`),
    onError: (err: Error) => setError(err.message || "Failed to create listing"),
  });

  const geocodeMutation = useMutation({
    mutationFn: () => itemsApi.geocode(addressQuery),
    onSuccess: (res) => {
      setPosition([res.data.lat, res.data.lng]);
      if (!address) setAddress(res.data.display_name);
    },
    onError: () => setError("Could not find that address."),
  });

  const handleBoundsChange = useCallback(() => {}, []);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="create-item-page">
      <h1>List an item</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          mutation.mutate();
        }}
      >
        <div className="form-grid">
          <div className="form-fields">
            <label>
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
              />
            </label>
            <label>
              Price
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </label>
            <label>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="electronics">Electronics</option>
                <option value="tools">Tools</option>
                <option value="furniture">Furniture</option>
                <option value="clothing">Clothing</option>
                <option value="sports">Sports</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              Listing type
              <select
                value={listingType}
                onChange={(e) => setListingType(e.target.value as "rent" | "sale")}
              >
                <option value="sale">Sale</option>
                <option value="rent">Rent</option>
              </select>
            </label>
            <label>
              Photos (up to 4)
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setPhotos(Array.from(e.target.files || []).slice(0, 4))}
              />
            </label>
            <div className="location-section">
              <h3>Location</h3>
              <label>
                Address (optional display)
                <input value={address} onChange={(e) => setAddress(e.target.value)} />
              </label>
              <div className="geocode-row">
                <input
                  placeholder="Search address to place pin..."
                  value={addressQuery}
                  onChange={(e) => setAddressQuery(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => geocodeMutation.mutate()}
                  disabled={!addressQuery}
                >
                  Find
                </button>
              </div>
              <p className="hint">Or click the map to drop a pin.</p>
              {position && (
                <p className="coords">
                  Pin: {position[0].toFixed(5)}, {position[1].toFixed(5)}
                </p>
              )}
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn-submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create listing"}
            </button>
          </div>
          <div className="form-map">
            <MapView
              items={[]}
              onBoundsChange={handleBoundsChange}
              pickMode
              pickedPosition={position}
              onPick={(lat, lng) => setPosition([lat, lng])}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
