import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    publishableKeyLength: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.length || 0,
    hasSecretKey: !!process.env.CLERK_SECRET_KEY,
    secretKeyLength: process.env.CLERK_SECRET_KEY?.length || 0,
    signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    nodeEnv: process.env.NODE_ENV,
    nextPublicN8nWebhookUrl: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || null,
    n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || null
  });
}

