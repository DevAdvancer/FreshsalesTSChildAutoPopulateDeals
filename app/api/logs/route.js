import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '../../../lib/db';
import Log from '../../../models/Log';

// Force this route to be dynamic so it doesn't cache the logs
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    
    if (mongoose.connection.readyState !== 1) {
      return NextResponse.json({ error: 'Database is not connected. Please whitelist your IP in MongoDB Atlas.' }, { status: 500 });
    }

    const logs = await Log.find().sort({ timestamp: -1 }).limit(100);
    return NextResponse.json(logs, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
