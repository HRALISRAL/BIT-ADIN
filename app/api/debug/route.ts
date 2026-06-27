// app/api/debug/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not Set',
    nodeEnv: process.env.NODE_ENV || 'Not Set',
  });
}
