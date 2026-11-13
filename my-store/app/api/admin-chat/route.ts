
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    const session = verifyAdminRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const conversations = await prisma.chatConversation.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Admin chat GET error:", error);

    return NextResponse.json(
      { error: "Failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = verifyAdminRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { conversationId, text } = await request.json();

    if (
      typeof conversationId !== "string" ||
      typeof text !== "string" ||
      !conversationId ||
      !text.trim()
    ) {
      return NextResponse.json(
        { error: "Missing" },
        { status: 400 }
      );
    }

    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        sender: "admin",
        text: text.trim(),
      },
    });

    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Admin chat POST error:", error);

    return NextResponse.json(
      { error: "Failed" },
      { status: 500 }
    );
  }
}
