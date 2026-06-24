import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { chatApi, itemsApi } from "../api/endpoints";
import { getMediaUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./ItemDetailPage.css";

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: item, isLoading, error } = useQuery({
    queryKey: ["item", id],
    queryFn: async () => {
      const { data } = await itemsApi.get(id!);
      return data;
    },
    enabled: !!id,
  });

  const chatMutation = useMutation({
    mutationFn: () => chatApi.createRoom(id!),
    onSuccess: (res) => navigate(`/chat/${res.data.id}`),
  });

  const markSoldMutation = useMutation({
    mutationFn: () => itemsApi.markSold(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item", id] });
      queryClient.invalidateQueries({ queryKey: ["my-items"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => itemsApi.remove(id!),
    onSuccess: () => navigate("/my-listings"),
  });

  if (isLoading) return <div className="item-detail-page">Loading...</div>;
  if (error || !item) return <div className="item-detail-page">Item not found.</div>;

  const isOwner = user?.id === item.seller_id;
  const canChat = isAuthenticated && !isOwner && item.is_active;

  return (
    <div className="item-detail-page">
      <Link to="/" className="back-link">
        &larr; Back to map
      </Link>
      <div className="item-detail-grid">
        <div className="item-images">
          {(item.images?.length ? item.images : item.thumbnail ? [{ image: item.thumbnail }] : []).map(
            (img, i) => (
              <img key={i} src={getMediaUrl(img.image) || ""} alt={item.title} />
            )
          )}
        </div>
        <div className="item-meta">
          <span className={`status ${item.is_active ? "active" : "sold"}`}>
            {item.is_active ? item.listing_type : "Sold"}
          </span>
          <h1>{item.title}</h1>
          <p className="price">${item.price}</p>
          <p className="seller">Listed by {item.seller_name}</p>
          {item.address && <p className="address">{item.address}</p>}
          {item.distance_km != null && (
            <p className="distance">{item.distance_km} km away</p>
          )}
          <p className="description">{item.description}</p>

          <div className="actions">
            {canChat && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => chatMutation.mutate()}
                disabled={chatMutation.isPending}
              >
                Chat with seller
              </button>
            )}
            {!isAuthenticated && item.is_active && (
              <Link to="/login" className="btn-primary">
                Log in to chat
              </Link>
            )}
            {isOwner && item.is_active && (
              <>
                <button
                  type="button"
                  className="btn-sold"
                  onClick={() => {
                    if (confirm("Mark this item as sold?")) markSoldMutation.mutate();
                  }}
                  disabled={markSoldMutation.isPending}
                >
                  Mark as sold
                </button>
                <p className="seller-hint">
                  Agree on terms via chat, then mark the item sold when the deal is done.
                </p>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => {
                    if (confirm("Remove this listing?")) deleteMutation.mutate();
                  }}
                >
                  Remove listing
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
