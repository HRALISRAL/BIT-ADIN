import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check auth session
    const { data: { user } } = await supabase.auth.getUser();
    
    const [profiles, hearings, panels, cases] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('hearings').select('*'),
      supabase.from('panels').select('*'),
      supabase.from('cases').select('*')
    ]);

    return NextResponse.json({
      isAuthenticated: !!user,
      userEmail: user?.email || null,
      userId: user?.id || null,
      profiles: profiles.data || [],
      profilesError: profiles.error || null,
      hearings: hearings.data || [],
      hearingsError: hearings.error || null,
      panels: panels.data || [],
      panelsError: panels.error || null,
      cases: cases.data || [],
      casesError: cases.error || null
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message || String(err)
    }, { status: 500 });
  }
}
