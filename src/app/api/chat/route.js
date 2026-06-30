import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, sessionId } = body;

    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    // Call the production webhook (configurable via env variable)
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 
                       process.env.N8N_WEBHOOK_URL || 
                       'https://charansurebrec.qzz.io/webhook/5025032e-9143-4ed2-808e-11f56d04a4ea';

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        chatInput: message,
        sessionId: sessionId || 'default-session'
      })
    });


    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Webhook responded with status ${response.status}:`, errorText);
      return NextResponse.json(
        { error: `Webhook error: ${response.status}` },
        { status: response.status }
      );
    }
    
    // Next.js App Router route expects us to return the response from the webhook
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
