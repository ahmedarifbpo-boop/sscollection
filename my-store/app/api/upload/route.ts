import { NextResponse } from "next/server";

export async function POST(request: Request) {
  return NextResponse.json(
    { error: "Image upload filhaal available nahi hai. Hum jald isko theek karenge." },
    { status: 503 }
  );
}