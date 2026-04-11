import { NextRequest, NextResponse } from 'next/server';

import { getConversationById, getMessagesByConversation, markConversationRead } from '@/lib/whatsapp/store';

interface ParamsContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: ParamsContext) {
  const { id } = await context.params;

  const conversation = getConversationById(id);
  if (!conversation) {
    return NextResponse.json(
      {
        error: 'Conversation not found.',
      },
      { status: 404 },
    );
  }

  const messages = getMessagesByConversation(id);
  const updatedConversation = markConversationRead(id) ?? conversation;

  return NextResponse.json(
    {
      conversation: updatedConversation,
      messages,
    },
    { status: 200 },
  );
}

