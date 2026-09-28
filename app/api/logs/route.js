import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '../../../lib/db';
import Log from '../../../models/Log';

// Force this route to be dynamic so it doesn't cache the logs
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 250;

export async function GET(request) {
  try {
    await connectDB();
    
    if (mongoose.connection.readyState !== 1) {
      return NextResponse.json({ error: 'Database is not connected. Please whitelist your IP in MongoDB Atlas.' }, { status: 500 });
    }

    const cursor = new URL(request.url).searchParams.get('cursor');
    let query = {};
    if (cursor) {
      let position;
      try {
        position = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
      } catch {
        return NextResponse.json({ error: 'Invalid log cursor.' }, { status: 400 });
      }
      if (!position || typeof position.timestamp !== 'string' || typeof position.id !== 'string') {
        return NextResponse.json({ error: 'Invalid log cursor.' }, { status: 400 });
      }
      const timestamp = new Date(position.timestamp);
      if (Number.isNaN(timestamp.getTime()) || !mongoose.isValidObjectId(position.id)) {
        return NextResponse.json({ error: 'Invalid log cursor.' }, { status: 400 });
      }
      query = {
        $or: [
          { timestamp: { $lt: timestamp } },
          { timestamp, _id: { $lt: new mongoose.Types.ObjectId(position.id) } },
        ],
      };
    }

    const page = await Log.find(query).sort({ timestamp: -1, _id: -1 }).limit(PAGE_SIZE + 1).lean();
    const hasMore = page.length > PAGE_SIZE;
    const logs = page.slice(0, PAGE_SIZE);
    const last = logs.at(-1);
    const nextCursor = hasMore && last
      ? Buffer.from(JSON.stringify({ timestamp: last.timestamp, id: String(last._id) })).toString('base64url')
      : null;
    return NextResponse.json(logs, {
      status: 200,
      headers: { 'Cache-Control': 'no-store', 'X-Next-Cursor': nextCursor ?? '' },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
