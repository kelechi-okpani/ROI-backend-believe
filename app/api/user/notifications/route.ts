import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth'; // Your auth helper
import { getUserNotifications } from '@/lib/notifications';

export async function GET(req: Request) {
  try {
    const session = await auth(req);
    if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const notifications = await getUserNotifications(session.id);
    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}