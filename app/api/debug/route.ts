import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check auth session
    const { data: { user } } = await supabase.auth.getUser();
    
    // Query views that bypass RLS (if created by admin)
    const [profiles, hearings, panels, cases, participants] = await Promise.all([
      supabase.from('debug_profiles').select('*'),
      supabase.from('debug_hearings').select('*'),
      supabase.from('debug_panels').select('*'),
      supabase.from('debug_cases').select('*'),
      supabase.from('debug_case_participants').select('*')
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
      casesError: cases.error || null,
      participants: participants.data || [],
      participantsError: participants.error || null
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message || String(err)
    }, { status: 500 });
  }
}
