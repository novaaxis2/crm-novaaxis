import { NextResponse } from 'next/server';

import { getWhatsAppDefaultTargetNumber, getWhatsAppOperationalStatus } from '@/lib/whatsapp/env';

export async function GET() {
  const status = getWhatsAppOperationalStatus();
  const defaultTarget = getWhatsAppDefaultTargetNumber();

  return NextResponse.json({
    ...status,
    defaultTarget,
  });
}
