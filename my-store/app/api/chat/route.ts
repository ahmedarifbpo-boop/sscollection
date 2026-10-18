import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Messages lana
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) return NextResponse.json({ error: "Session ID required" }, { status: 400 });

    const conversation = await prisma.chatConversation.findUnique({
      where: { sessionId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    return NextResponse.json({ messages: conversation?.messages || [] });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST: Naya message save karna
export async function POST(request: Request) {
  try {
    const { sessionId, customerName, customerEmail, text } = await request.json();

    if (!sessionId || !customerName || !customerEmail || !text) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    let conversation = await prisma.chatConversation.findUnique({ where: { sessionId } });
    if (!conversation) {
      conversation = await prisma.chatConversation.create({
        data: { sessionId, customerName, customerPhone: customerEmail, status: "OPEN" },
      });
    }

    const message = await prisma.chatMessage.create({
      data: { conversationId: conversation.id, sender: "customer", text: text.trim() },
    });

    // Conversation ka time update karo taake admin panel mein top par aaye
    await prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}