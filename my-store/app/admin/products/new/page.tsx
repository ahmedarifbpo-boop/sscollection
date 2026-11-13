
"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Upload,
  Loader2,
  X,
  Image as ImageIcon,
  Video,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

export default function AddProductPage() {
  const router = useRouter();

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [ready, setReady] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    salePrice: "",
    stock: "",
  });

  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState("");

  useEffect(() => {
    const admin = localStorage.getItem("ss-admin");

    if (!admin) {
      router.push("/admin/login");
      return;
    }

    async function fetchCats() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Categories load nahi ho sakin");
        }

        const categoryList = data.categories || [];
        setCategories(categoryList);

        if (categoryList.length > 0) {
          setForm((prev) => ({
            ...prev,
            category: categoryList[0].name,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setReady(true);
      }
    }

    fetchCats();
  }, [router]);

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Upload multiple images
  const handleImageUpload = async (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    setUploadingImages(true);
    setError("");
    setUploadMessage("");

    let uploadedCount = 0;

    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} image file nahi hai`);
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} 5 MB se bari hai`);
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || `${file.name} upload nahi hui`);
        }

        if (!data.url) {
          throw new Error("Image URL receive nahi hui");
        }

        setImages((prev) => [...prev, data.url]);
        uploadedCount++;
        setUploadMessage(`${uploadedCount} image(s) uploaded`);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Image upload failed";

      setError(message);

      if (uploadedCount > 0) {
        setUploadMessage(`${uploadedCount} image(s) successfully uploaded`);
      }
    } finally {
      setUploadingImages(false);

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  // Upload optional video
  const handleVideoUpload = async (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setUploadingVideo(true);
    setError("");

    try {
      if (!file.type.startsWith("video/")) {
        throw new Error("Please select a valid video");
      }

      if (file.size > 50 * 1024 * 1024) {
        throw new Error("Video 50 MB se bari nahi honi chahiye");
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Video upload failed");
      }

      setVideo(data.url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Video upload failed"
      );
    } finally {
      setUploadingVideo(false);

      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setVideo("");
  };

  // Save product
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError("Product name enter karo");
      return;
    }

    if (!form.description.trim()) {
      setError("Product description enter karo");
      return;
    }

    if (!form.category) {
      setError("Product category select karo");
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      setError("Valid product price enter karo");
      return;
    }

    if (
      form.salePrice &&
      Number(form.salePrice) < 0
    ) {
      setError("Sale price valid enter karo");
      return;
    }

    if (
      form.salePrice &&
      Number(form.salePrice) > Number(form.price)
    ) {
      setError("Sale price original price se zyada nahi ho sakti");
      return;
    }

    if (form.stock === "" || Number(form.stock) < 0) {
      setError("Valid stock quantity enter karo");
      return;
    }

    if (uploadingImages || uploadingVideo) {
      setError("Pehle uploads complete hone do");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category,
          price: Number(form.price),
          salePrice: form.salePrice
            ? Number(form.salePrice)
            : null,
          stock: Number(form.stock),
          images,
          image: images[0] || "",
          video: video || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Product create nahi ho saka");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Product save nahi ho saka"
      );
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    background: "var(--background)",
    color: "var(--text-primary)",
    fontSize: "14px",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--text-primary)",
    marginBottom: "7px",
  };

  if (!ready) {
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
          fontWeight: 500,
          color: "var(--text-primary)",
          marginBottom: "24px",
        }}
      >
        Add New Product
      </h1>

      <form
        onSubmit={handleSubmit}
        className="dz-card"
        style={{
          padding: "24px",
          maxWidth: "800px",
        }}
      >
        {error && (
          <div
            style={{
              background: "#FEE",
              color: "#E74C3C",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "16px",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        {/* Product Name */}
        <div style={{ marginBottom: "18px" }}>
          <label style={labelStyle}>Product Name *</label>
          <input
            style={inputStyle}
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Enter product name"
            required
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: "18px" }}>
          <label style={labelStyle}>Description *</label>
          <textarea
            style={{
              ...inputStyle,
              minHeight: "110px",
              resize: "vertical",
            }}
            value={form.description}
            onChange={(e) =>
              update("description", e.target.value)
            }
            placeholder="Enter product description"
            required
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: "18px" }}>
          <label style={labelStyle}>Category *</label>
          <select
            style={inputStyle}
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price and Sale Price */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "18px",
          }}
        >
          <div>
            <label style={labelStyle}>Price (Rs.) *</label>
            <input
              style={inputStyle}
              type="number"
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              placeholder="Product price"
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Sale Price (Rs.)</label>
            <input
              style={inputStyle}
              type="number"
              min="0"
              step="0.01"
              value={form.salePrice}
              onChange={(e) =>
                update("salePrice", e.target.value)
              }
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Stock */}
        <div style={{ marginBottom: "24px" }}>
          <label style={labelStyle}>Stock Quantity *</label>
          <input
            style={inputStyle}
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={(e) => update("stock", e.target.value)}
            placeholder="Available stock"
            required
          />
        </div>

        {/* Multiple Images */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "22px",
            marginBottom: "24px",
          }}
        >
          <label style={labelStyle}>
            <ImageIcon
              size={16}
              style={{
                display: "inline",
                verticalAlign: "middle",
                marginRight: "6px",
              }}
            />
            Product Images (Optional)
          </label>

          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginBottom: "12px",
            }}
          >
            Multiple images select kar sakte hain. JPG, PNG, WEBP
            aur GIF supported hain. Maximum 5 MB per image.
          </p>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleImageUpload}
            disabled={uploadingImages || saving}
            style={{ display: "none" }}
          />

          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploadingImages || saving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "11px 16px",
              border: "1px dashed var(--border)",
              borderRadius: "6px",
              background: "var(--background)",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            {uploadingImages ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {uploadingImages ? "Uploading Images..." : "Select Images"}
          </button>

          {uploadMessage && (
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                marginTop: "10px",
              }}
            >
              {uploadMessage}
            </p>
          )}

          {images.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(110px, 1fr))",
                gap: "12px",
                marginTop: "18px",
              }}
            >
              {images.map((src, index) => (
                <div
                  key={`${src}-${index}`}
                  style={{
                    position: "relative",
                    border: "1px solid var(--border)",
                    borderRadius: "7px",
                    overflow: "hidden",
                    background: "var(--background)",
                  }}
                >
                  <img
                    src={src}
                    alt={`Product image ${index + 1}`}
                    style={{
                      width: "100%",
                      height: "115px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    disabled={saving}
                    aria-label="Remove image"
                    style={{
                      position: "absolute",
                      top: "5px",
                      right: "5px",
                      width: "25px",
                      height: "25px",
                      border: "none",
                      borderRadius: "50%",
                      background: "#E74C3C",
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X size={14} />
                  </button>

                  <div
                    style={{
                      padding: "6px",
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                      textAlign: "center",
                    }}
                  >
                    Image {index + 1}
                    {index === 0 ? " (Main)" : ""}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "12px",
            }}
          >
            Uploaded images: {images.length}
          </p>
        </div>

        {/* Optional Video */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "22px",
            marginBottom: "28px",
          }}
        >
          <label style={labelStyle}>
            <Video
              size={16}
              style={{
                display: "inline",
                verticalAlign: "middle",
                marginRight: "6px",
              }}
            />
            Product Video (Optional)
          </label>

          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginBottom: "12px",
            }}
          >
            MP4, WEBM ya MOV. Maximum 50 MB.
          </p>

          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleVideoUpload}
            disabled={uploadingVideo || saving}
            style={{ display: "none" }}
          />

          {!video ? (
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploadingVideo || saving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "11px 16px",
                border: "1px dashed var(--border)",
                borderRadius: "6px",
                background: "var(--background)",
                color: "var(--text-primary)",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              {uploadingVideo ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {uploadingVideo ? "Uploading Video..." : "Select Video"}
            </button>
          ) : (
            <div
              style={{
                maxWidth: "350px",
                border: "1px solid var(--border)",
                borderRadius: "7px",
                padding: "10px",
              }}
            >
              <video
                src={video}
                controls
                style={{
                  width: "100%",
                  maxHeight: "220px",
                  borderRadius: "5px",
                }}
              />

              <button
                type="button"
                onClick={removeVideo}
                disabled={saving}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  marginTop: "10px",
                  padding: "7px 10px",
                  border: "none",
                  borderRadius: "5px",
                  background: "#FEE",
                  color: "#E74C3C",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                <X size={14} />
                Remove Video
              </button>
            </div>
          )}
        </div>

        {/* Save */}
        <button
          type="submit"
          disabled={saving || uploadingImages || uploadingVideo}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "9px",
            padding: "13px 22px",
            border: "none",
            borderRadius: "6px",
            background: "#2563EB",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            opacity:
              saving || uploadingImages || uploadingVideo ? 0.6 : 1,
          }}
        >
          {saving ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Save size={17} />
          )}
          {saving ? "Saving Product..." : "Save Product"}
        </button>
      </form>
    </div>
  );
}
