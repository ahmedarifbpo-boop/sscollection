import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const conversations = await prisma.chatConversation.findMany({
      orderBy: { updatedAt: "desc" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    return NextResponse.json({ conversations });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { conversationId, text } = await request.json();
    if (!conversationId || !text) return NextResponse.json({ error: "Missing" }, { status: 400 });

    const message = await prisma.chatMessage.create({
      data: { conversationId, sender: "admin", text: text.trim() },
    });

    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}