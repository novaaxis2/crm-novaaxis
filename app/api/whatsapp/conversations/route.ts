import { NextRequest, NextResponse } from 'next/server';

import { getWhatsAppUserProfilePhotoUrl } from '@/lib/whatsapp/cloud-api';
import { listConversations, upsertContactProfile } from '@/lib/whatsapp/repository';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const refreshProfiles = ['1', 'true', 'yes'].includes((searchParams.get('refreshProfiles') || '').toLowerCase());

  let conversations = await listConversations();

  if (refreshProfiles && conversations.length > 0) {
    let updated = false;

    for (const conversation of conversations) {
      const avatarUrl = await getWhatsAppUserProfilePhotoUrl(conversation.phone);
      if (!avatarUrl) {
        continue;
      }

      if (conversation.avatarUrl === avatarUrl) {
        continue;
      }

      await upsertContactProfile({
        phone: conversation.phone,
        name: conversation.name,
        avatarUrl,
      });
      updated = true;
    }

    if (updated) {
      conversations = await listConversations();
    }
  }

  return NextResponse.json({ conversations });
}
