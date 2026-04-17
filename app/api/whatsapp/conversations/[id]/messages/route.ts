import { NextRequest, NextResponse } from 'next/server';

import { getConversationById, getMessagesByConversation, markConversationRead } from '@/lib/whatsapp/repository';

interface ParamsContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: ParamsContext) {
  const { id } = await context.params;

  const conversation = await getConversationById(id);
  if (!conversation) {
    return NextResponse.json(
      {
        error: 'Conversation not found.',
      },
      { status: 404 },
    );
  }

  const messages = await getMessagesByConversation(id);
  const updatedConversation = (await markConversationRead(id)) ?? conversation;

  return NextResponse.json(
    {
      conversation: updatedConversation,
      messages,
    },
    { status: 200 },
  );
}

