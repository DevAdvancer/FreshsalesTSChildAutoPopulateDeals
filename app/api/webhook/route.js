import { NextResponse } from 'next/server';
import { processDealSync } from '../../../lib/sync';
import { saveLog } from '../../../lib/logger';
import connectDB from '../../../lib/db';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const dealId = body?.deal?.id || body?.id || body?.deal_id;
    
    if (!dealId) {
      await saveLog({ status: 'ERROR', message: 'Webhook triggered but no Deal ID found in payload.', payload: body });
      return NextResponse.json({ success: false, error: 'Deal ID not found in webhook payload.' }, { status: 400 });
    }

    await saveLog({ dealId, status: 'INFO', message: 'Webhook triggered.', payload: body });

    const result = await processDealSync(dealId);
    return NextResponse.json(result, { status: 200 });
    
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Internal Server Error';
    await saveLog({ status: 'ERROR', message: `Webhook error: ${message}` });
    return NextResponse.json({ success: false, error: message }, { status });
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
