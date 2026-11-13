
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const ALLOWED_IMAGES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const ALLOWED_VIDEOS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Upload service is not configured" },
        { status: 500 }
      );
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(supabaseUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid Supabase URL configuration" },
        { status: 500 }
      );
    }

    if (
      parsedUrl.protocol !== "https:" &&
      parsedUrl.hostname !== "localhost"
    ) {
      return NextResponse.json(
        { error: "Invalid Supabase URL protocol" },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl.replace(/\/+$/, ""),
      supabaseKey
    );

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No valid file provided" },
        { status: 400 }
      );
    }

    const imageExtension = ALLOWED_IMAGES[file.type];
    const videoExtension = ALLOWED_VIDEOS[file.type];

    const isImage = Boolean(imageExtension);
    const isVideo = Boolean(videoExtension);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          error: "Only JPG, PNG, WEBP, GIF, MP4, WEBM and MOV files are allowed",
        },
        { status: 400 }
      );
    }

    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;

    if (file.size === 0 || file.size > maxSize) {
      return NextResponse.json(
        {
          error: isImage
            ? "Image must be between 1 byte and 5 MB"
            : "Video must be between 1 byte and 50 MB",
        },
        { status: 400 }
      );
    }

    const extension = imageExtension || videoExtension;
    const folder = isImage ? "images" : "videos";

    const filename = `${folder}/${Date.now()}-${randomUUID()}.${extension}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await supabase.storage
      .from("uploads")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: "3600",
      });

    if (error) {
      console.error("Supabase storage upload error:", error.message);

      return NextResponse.json(
        { error: "Supabase upload failed: " + error.message },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("uploads")
      .getPublicUrl(data.path);

    if (!publicUrlData?.publicUrl) {
      return NextResponse.json(
        { error: "Could not generate public file URL" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        url: publicUrlData.publicUrl,
        path: data.path,
        type: isImage ? "image" : "video",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload API error:", error);

    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
