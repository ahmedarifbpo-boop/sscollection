"use client";

import { useState, useEffect, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Upload,
  Loader2,
  X,
  Video,
} from "lucide-react";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<
    { id: string; name: string }[]
  >([]);

  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    salePrice: "",
    stock: "",
  });

  const uploading = uploadingImages || uploadingVideo;

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        const sessionRes = await fetch("/api/admin/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!sessionRes.ok) {
          router.replace("/admin/login");
          return;
        }

        const sessionData = await sessionRes.json();

        if (!sessionData.authenticated) {
          router.replace("/admin/login");
          return;
        }

        const [prodRes, catRes] = await Promise.all([
          fetch(`/api/products/${id}`, {
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/categories", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        if (!active) return;

        if (prodRes.status === 401 || catRes.status === 401) {
          router.replace("/admin/login");
          return;
        }

        if (prodRes.status === 404) {
          setError("Product not found");
          return;
        }

        if (!prodRes.ok || !catRes.ok) {
          throw new Error("Failed to load product data");
        }

        const prodData = await prodRes.json();
        const catData = await catRes.json();

        if (!active) return;

        setCategories(catData.categories || []);

        const p = prodData.product;

        if (!p) {
          setError("Product not found");
          return;
        }

        setForm({
          name: p.name || "",
          description: p.description || "",
          category: p.category || "",
          price: p.price != null ? String(p.price) : "",
          salePrice:
            p.salePrice != null ? String(p.salePrice) : "",
          stock: p.stock != null ? String(p.stock) : "",
        });

        // Purane products ke liye fallback: p.image
        const existingImages =
          Array.isArray(p.images) && p.images.filter(Boolean).length
            ? p.images.filter(Boolean)
            : p.image
              ? [p.image]
              : [];

        setImages(existingImages);
        setVideo(p.video || "");
      } catch {
        if (active) {
          setError("Failed to load product");
        }
      } finally {
        if (active) {
          setLoading(false);
          setReady(true);
        }
      }
    }

    fetchData();

    return () => {
      active = false;
    };
  }, [id, router]);

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Multiple image upload
  const handleImagesUpload = async (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingImages(true);
    setError("");

    const uploadedImages: string[] = [];

    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} is not a valid image`);
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} exceeds the 5 MB limit`);
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        const data = await res.json();

        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }

        if (!res.ok || !data.url) {
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }

        uploadedImages.push(data.url);
      }

      setImages((prev) => [...prev, ...uploadedImages]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Image upload failed"
      );
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

  // Video upload
  const handleVideoUpload = async (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    setError("");

    try {
      if (!file.type.startsWith("video/")) {
        throw new Error("Please select a valid video file");
      }

      if (file.size > 50 * 1024 * 1024) {
        throw new Error("Video size must not exceed 50 MB");
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Video upload failed");
      }

      setVideo(data.url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Video upload failed"
      );
    } finally {
      setUploadingVideo(false);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Save changes
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (images.length === 0) {
      setError("Please keep at least one product image");
      return;
    }

    if (uploading) {
      setError("Please wait for uploads to finish");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          price: Number(form.price),
          salePrice: form.salePrice ? Number(form.salePrice) : null,
          stock: Number(form.stock),

          // First image is the main product image
          image: images[0] || "",
          images,
          video: video || null,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to update product");
      }

      router.push("/admin/products");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update product"
      );
      setSaving(false);
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

  if (error === "Product not found") {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "20px",
            color: "var(--text-primary)",
            marginBottom: "12px",
          }}
        >
          Product not found
        </h1>

        <Link
          href="/admin/products"
          className="dz-btn-primary"
          style={{ display: "inline-block", textDecoration: "none" }}
        >
          Back to Products
        </Link>
      </div>
    );
  }

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: "500",
    color: "var(--text-secondary)",
    marginBottom: "6px",
  } as const;

  return (
    <div>
      <Link
        href="/admin/products"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "var(--text-secondary)",
          fontSize: "13px",
          marginBottom: "20px",
          textDecoration: "none",
        }}
      >
        <ArrowLeft size={16} />
        Back to Products
      </Link>

      <h1
        style={{
          fontSize: "22px",
          fontWeight: "500",
          color: "var(--text-primary)",
          marginBottom: "24px",
        }}
      >
        Edit Product
      </h1>

      <form
        onSubmit={handleSubmit}
        className="dz-card"
        style={{ padding: "24px", maxWidth: "800px" }}
      >
        {error && (
          <div
            style={{
              background: "#FEE",
              color: "#E74C3C",
              padding: "12px",
              borderRadius: "3px",
              marginBottom: "16px",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Product Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="dz-input"
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Description *</label>
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="dz-input"
            style={{ resize: "none" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Category *</label>
          <select
            required
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className="dz-input"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div>
            <label style={labelStyle}>Price (Rs.) *</label>
            <input
              type="number"
              required
              min="0"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              className="dz-input"
            />
          </div>

          <div>
            <label style={labelStyle}>Sale Price (optional)</label>
            <input
              type="number"
              min="0"
              value={form.salePrice}
              onChange={(e) => update("salePrice", e.target.value)}
              className="dz-input"
            />
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={labelStyle}>Stock Quantity *</label>
          <input
            type="number"
            required
            min="0"
            value={form.stock}
            onChange={(e) => update("stock", e.target.value)}
            className="dz-input"
          />
        </div>

        {/* MULTIPLE PRODUCT IMAGES */}
        <div style={{ marginBottom: "28px" }}>
          <label style={labelStyle}>Product Images *</label>

          {images.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              {images.map((src, index) => (
                <div
                  key={`${src}-${index}`}
                  style={{
                    position: "relative",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    padding: "8px",
                    background: "var(--bg-alt)",
                  }}
                >
                  <img
                    src={src}
                    alt={`Product image ${index + 1}`}
                    style={{
                      width: "100%",
                      height: "120px",
                      objectFit: "contain",
                      borderRadius: "3px",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    title="Remove image"
                    style={{
                      position: "absolute",
                      top: "5px",
                      right: "5px",
                      width: "26px",
                      height: "26px",
                      border: "none",
                      borderRadius: "50%",
                      background: "#E74C3C",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X size={15} />
                  </button>

                  <p
                    style={{
                      fontSize: "11px",
                      textAlign: "center",
                      color:
                        index === 0
                          ? "#10B981"
                          : "var(--text-secondary)",
                      marginTop: "6px",
                    }}
                  >
                    {index === 0 ? "Main Image" : `Image ${index + 1}`}
                  </p>
                </div>
              ))}
            </div>
          )}

          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleImagesUpload}
            disabled={uploading}
            style={{ display: "none" }}
          />

          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading}
            className="dz-btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              opacity: uploading ? 0.6 : 1,
            }}
          >
            {uploadingImages ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Uploading Images...
              </>
            ) : (
              <>
                <Upload size={16} />
                Add More Images
              </>
            )}
          </button>

          <p
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              marginTop: "8px",
            }}
          >
            You can select multiple images. Maximum 5 MB per image.
            First image will be the main product image.
          </p>
        </div>

        {/* PRODUCT VIDEO */}
        <div style={{ marginBottom: "28px" }}>
          <label style={labelStyle}>Product Video (optional)</label>

          {video ? (
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "4px",
                padding: "12px",
                background: "var(--bg-alt)",
                marginBottom: "12px",
              }}
            >
              <video
                src={video}
                controls
                style={{
                  width: "100%",
                  maxHeight: "280px",
                  borderRadius: "4px",
                  background: "#000",
                }}
              />

              <button
                type="button"
                onClick={() => setVideo("")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  marginTop: "10px",
                  fontSize: "12px",
                  color: "#E74C3C",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <X size={14} />
                Remove Video
              </button>
            </div>
          ) : (
            <div
              style={{
                border: "2px dashed var(--border-strong)",
                borderRadius: "4px",
                padding: "24px",
                textAlign: "center",
                background: "var(--bg-alt)",
                marginBottom: "12px",
              }}
            >
              <Video
                size={30}
                style={{
                  color: "var(--text-muted)",
                  marginBottom: "8px",
                }}
              />
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                }}
              >
                No product video uploaded
              </p>
            </div>
          )}

          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleVideoUpload}
            disabled={uploading}
            style={{ display: "none" }}
          />

          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploading}
            className="dz-btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              opacity: uploading ? 0.6 : 1,
            }}
          >
            {uploadingVideo ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Uploading Video...
              </>
            ) : (
              <>
                <Upload size={16} />
                {video ? "Replace Video" : "Upload Video"}
              </>
            )}
          </button>

          <p
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              marginTop: "8px",
            }}
          >
            MP4, WebM or MOV. Maximum 50 MB.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving || uploading}
          className="dz-btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 24px",
            opacity: saving || uploading ? 0.6 : 1,
          }}
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {saving ? "Updating..." : "Update Product"}
        </button>
      </form>
    </div>
  );
}