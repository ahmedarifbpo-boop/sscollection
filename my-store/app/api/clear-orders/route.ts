import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    // Delete order items first (foreign key constraint)
    await prisma.orderItem.deleteMany({});
    // Phir orders delete karo
    await prisma.order.deleteMany({});
    // Chats bhi delete kar do taake dashboard clean ho jaye
    await prisma.chatMessage.deleteMany({});
    await prisma.chatConversation.deleteMany({});

    return NextResponse.json({ success: true, message: "All orders and chats deleted" });
  } catch (error) {
    console.error("Clear error:", error);
    return NextResponse.json({ error: "Failed to clear data" }, { status: 500 });
  }
}