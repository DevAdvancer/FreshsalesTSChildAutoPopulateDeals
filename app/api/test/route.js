import { NextResponse } from 'next/server';
import { processDealSync } from '../../../lib/sync';
import connectDB from '../../../lib/db';

export async function GET(request) {
  try {
    await connectDB();
    const testDealId = process.env.TEST_DEAL_ID;
    const result = await processDealSync(testDealId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
