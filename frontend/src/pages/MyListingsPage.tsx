import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import { itemsApi } from "../api/endpoints";
import { getMediaUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./MyListingsPage.css";

export function MyListingsPage() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<"active" | "sold">("active");
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["my-items", tab],
    queryFn: async () => {
      const { data } = await itemsApi.mine(tab);
      return data;
    },
    enabled: isAuthenticated,
  });

  const markSoldMutation = useMutation({
    mutationFn: (id: string) => itemsApi.markSold(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-items"] });
    },
  });

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="my-listings-page">
      <h1>My Listings</h1>
      <div className="tabs">
        <button
          type="button"
          className={tab === "active" ? "active" : ""}
          onClick={() => setTab("active")}
        >
          Active
        </button>
        <button
          type="button"
          className={tab === "sold" ? "active" : ""}
          onClick={() => setTab("sold")}
        >
          Sold
        </button>
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p className="empty">
          No {tab} listings.{" "}
          <Link to="/items/new">Create your first listing</Link>
        </p>
      ) : (
        <ul className="listings-grid">
          {items.map((item) => (
            <li key={item.id} className="listing-card">
              {item.thumbnail && (
                <img src={getMediaUrl(item.thumbnail) || ""} alt={item.title} />
              )}
              <div className="card-body">
                <Link to={`/items/${item.id}`}>{item.title}</Link>
                <span className="price">${item.price}</span>
                {tab === "active" && (
                  <button
                    type="button"
                    className="btn-sold"
                    onClick={() => {
                      if (confirm("Mark as sold?")) markSoldMutation.mutate(item.id);
                    }}
                  >
                    Mark as sold
                  </button>
                )}
                {tab === "sold" && item.sold_at && (
                  <span className="sold-date">
                    Sold {new Date(item.sold_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
