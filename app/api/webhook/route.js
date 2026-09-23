import { after, NextResponse } from 'next/server';
import { processDealSync } from '../../../lib/sync';
import { saveLog } from '../../../lib/logger';

export const maxDuration = 60;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
    const dealId = body?.deal?.id || body?.id || body?.deal_id;
    
    if (!dealId) {
      after(() => saveLog({ status: 'ERROR', message: 'Webhook triggered but no Deal ID found in payload.', payload: body }));
      return NextResponse.json({ success: false, error: 'Deal ID not found in webhook payload.' }, { status: 400 });
    }

    after(async () => {
      try {
        await saveLog({ dealId, status: 'INFO', message: 'Webhook triggered.', payload: body });
        await processDealSync(dealId);
      } catch (error) {
        const message = error.message || 'Internal Server Error';
        await saveLog({ dealId, status: 'ERROR', message: `Webhook sync error: ${message}`, payload: error.response?.data || null });
      }
    });

    return NextResponse.json({ accepted: true, dealId }, { status: 202 });
  } catch (error) {
    after(() => saveLog({ status: 'ERROR', message: `Webhook error: ${error.message || 'Internal Server Error'}` }));
    return NextResponse.json({ success: false, error: 'Invalid webhook payload.' }, { status: 400 });
  }
}

// Handle GET requests (in case someone visits the webhook URL in their browser)
export async function GET() {
  return NextResponse.json({ 
    message: "Webhook endpoint is active! Please configure Freshsales to send a POST request with the Deal ID." 
  }, { status: 200 });
}

// Handle OPTIONS requests (for CORS / Preflight checks)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
