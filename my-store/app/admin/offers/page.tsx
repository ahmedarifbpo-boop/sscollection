
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, Loader2, Video } from "lucide-react";

interface Offer {
  id: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  video?: string | null;
  ctaText: string;
  ctaLink: string;
}

export default function AdminOffersPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    image: "",
    video: "",
  });

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        const res = await fetch("/api/admin/session", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          router.replace("/admin/login");
          return;
        }

        if (active) setReady(true);
      } catch (error) {
        console.error("Session check failed:", error);
        router.replace("/admin/login");
      }
    };

    checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (ready) fetchOffers();
  }, [ready]);

  const fetchOffers = async () => {
    try {
      const res = await fetch("/api/offers", {
        credentials: "include",
      });

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch offers");
      }

      setOffers(data.offers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setForm((prev) => ({
        ...prev,
        image: type === "image" ? data.url : "",
        video: type === "video" ? data.url : "",
      }));
    } catch (err: any) {
      setError(`${type === "image" ? "Image" : "Video"} upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.image && !form.video) {
      setError("Please upload an image or video first");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create offer");
      }

      setForm({
        title: "",
        subtitle: "",
        image: "",
        video: "",
      });

      await fetchOffers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Delete this offer? Ye database se permanently delete ho jayega."
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/offers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!res.ok) throw new Error("Failed to delete");

      setOffers((prev) => prev.filter((o) => o.id !== id));
    } catch {
      alert("Failed to delete offer from database. Check if API route exists.");
    }
  };

  if (!ready || loading) {
    return (
      <div
        style={{
          padding: "60px 24px",
          textAlign: "center",
          color: "var(--text-muted)",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: "500",
            color: "var(--text-primary)",
            marginBottom: "4px",
          }}
        >
          Hero Slider Offers
        </h1>

        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Manage the banners shown at the top of your homepage.
        </p>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}
        className="admin-offers-grid"
      >
        <div className="dz-card" style={{ padding: "20px" }}>
          <h2
            style={{
              fontSize: "15px",
              fontWeight: "500",
              color: "var(--text-primary)",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={16} /> Add New Banner
          </h2>

          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  background: "#FEE",
                  color: "#E74C3C",
                  padding: "10px",
                  borderRadius: "3px",
                  marginBottom: "12px",
                  fontSize: "12px",
                }}
              >
                {error}
              </div>
            )}

            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "500",
                color: "var(--text-secondary)",
                marginBottom: "8px",
              }}
            >
              Banner Image or Video *
            </label>

            {(form.image || form.video) ? (
              <div
                style={{
                  padding: "12px",
                  border: "1px solid var(--border)",
                  borderRadius: "3px",
                  background: "var(--bg-alt)",
                  marginBottom: "16px",
                }}
              >
                {form.image ? (
                  <img
                    src={form.image}
                    alt="Banner preview"
                    style={{
                      width: "100%",
                      maxHeight: "150px",
                      objectFit: "contain",
                      borderRadius: "3px",
                    }}
                  />
                ) : (
                  <video
                    src={form.video}
                    controls
                    playsInline
                    style={{
                      width: "100%",
                      maxHeight: "180px",
                      borderRadius: "3px",
                      background: "#000",
                    }}
                  />
                )}

                <p
                  style={{
                    fontSize: "12px",
                    color: "#10B981",
                    fontWeight: "500",
                    margin: "10px 0",
                  }}
                >
                  ✓ {form.image ? "Image" : "Video"} Uploaded
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({ ...p, image: "", video: "" }))
                  }
                  style={{
                    fontSize: "11px",
                    color: "#E74C3C",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Remove / Change Media
                </button>
              </div>
            ) : (
              <div
                style={{
                  border: "2px dashed var(--border-strong)",
                  borderRadius: "3px",
                  padding: "20px",
                  textAlign: "center",
                  background: "var(--bg-alt)",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "24px",
                    flexWrap: "wrap",
                  }}
                >
                  <label
                    htmlFor="offer-image"
                    style={{
                      cursor: uploading ? "wait" : "pointer",
                      display: "inline-flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Upload
                      size={24}
                      style={{
                        color: "var(--accent)",
                        marginBottom: "8px",
                      }}
                    />
                    <span style={{ fontSize: "13px", color: "var(--accent)" }}>
                      Upload Image
                    </span>
                  </label>

                  <label
                    htmlFor="offer-video"
                    style={{
                      cursor: uploading ? "wait" : "pointer",
                      display: "inline-flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Video
                      size={24}
                      style={{
                        color: "var(--accent)",
                        marginBottom: "8px",
                      }}
                    />
                    <span style={{ fontSize: "13px", color: "var(--accent)" }}>
                      Upload Video
                    </span>
                  </label>
                </div>

                {uploading && (
                  <div
                    style={{
                      marginTop: "12px",
                      color: "var(--accent)",
                      fontSize: "12px",
                    }}
                  >
                    <Loader2
                      size={16}
                      className="animate-spin"
                      style={{ display: "inline", marginRight: "6px" }}
                    />
                    Uploading...
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleMediaUpload(e, "image")}
                  disabled={uploading}
                  style={{ display: "none" }}
                  id="offer-image"
                />

                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={(e) => handleMediaUpload(e, "video")}
                  disabled={uploading}
                  style={{ display: "none" }}
                  id="offer-video"
                />

                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "12px",
                  }}
                >
                  Select either one image or one video for each banner.
                </p>
              </div>
            )}

            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "500",
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Title *
            </label>

            <input
              type="text"
              required
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              placeholder="e.g. Mega Sale is Live!"
              className="dz-input"
              style={{ marginBottom: "12px" }}
            />

            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "500",
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Subtitle (optional)
            </label>

            <input
              type="text"
              value={form.subtitle}
              onChange={(e) =>
                setForm({ ...form, subtitle: e.target.value })
              }
              placeholder="e.g. Up to 70% OFF"
              className="dz-input"
              style={{ marginBottom: "16px" }}
            />

            <button
              type="submit"
              disabled={saving || uploading || (!form.image && !form.video)}
              className="dz-btn-primary"
              style={{
                width: "100%",
                padding: "12px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {saving ? "Adding Banner..." : "Add Banner"}
            </button>
          </form>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {offers.length === 0 ? (
            <div
              className="dz-card"
              style={{
                padding: "40px",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              No banners yet.
            </div>
          ) : (
            offers.map((offer) => (
              <div
                key={offer.id}
                className="dz-card"
                style={{
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                {offer.video ? (
                  <video
                    src={offer.video}
                    muted
                    playsInline
                    style={{
                      width: "120px",
                      height: "60px",
                      objectFit: "cover",
                      borderRadius: "3px",
                      background: "#000",
                    }}
                  />
                ) : offer.image ? (
                  <img
                    src={offer.image}
                    alt={offer.title}
                    style={{
                      width: "120px",
                      height: "60px",
                      objectFit: "cover",
                      borderRadius: "3px",
                      background: "#eee",
                    }}
                  />
                ) : null}

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "var(--text-primary)",
                      marginBottom: "4px",
                    }}
                  >
                    {offer.title}
                  </div>

                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {offer.subtitle || "No subtitle"}
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--accent)",
                      marginTop: "4px",
                    }}
                  >
                    {offer.video ? "Video Banner" : "Image Banner"}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(offer.id)}
                  style={{
                    padding: "8px",
                    color: "#EF4444",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 900px) {
          .admin-offers-grid {
            grid-template-columns: 400px 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
