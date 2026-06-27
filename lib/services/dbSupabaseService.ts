// lib/services/dbSupabaseService.ts - ביצוע שאילתות ישירות מול Supabase (מתאים לריצה בקליינט ובשרת)
import { SupabaseClient } from '@supabase/supabase-js';
import { 
  UserProfile, 
  Panel, 
  Case, 
  Hearing, 
  Document, 
  ClientRequest,
  DocumentType,
  PartyRole
} from '../../types';

export const dbSupabaseService = {
  async getProfiles(supabase: SupabaseClient): Promise<UserProfile[]> {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data;
  },

  async getProfile(supabase: SupabaseClient, userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    return data;
  },

  async getPanels(supabase: SupabaseClient): Promise<Panel[]> {
    const { data, error } = await supabase.from('panels').select('*').order('day_of_week');
    if (error) throw error;
    return data;
  },

  async getCases(supabase: SupabaseClient): Promise<Case[]> {
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        panels (name),
        case_participants (
          user_id,
          party_role,
          profiles (full_name, email, phone, address)
        )
      `);
    if (error) throw error;

    return data.map((c: any) => ({
      id: c.id,
      case_number: c.case_number,
      title: c.title,
      status: c.status,
      panel_id: c.panel_id,
      created_at: c.created_at,
      panel_name: c.panels?.name || 'ללא שיוך הרכב',
      participants: c.case_participants?.map((cp: any) => ({
        user_id: cp.user_id,
        full_name: cp.profiles?.full_name || 'משתמש לא ידוע',
        party_role: cp.party_role as PartyRole,
        email: cp.profiles?.email || '',
        phone: cp.profiles?.phone,
        address: cp.profiles?.address
      }))
    }));
  },

  async createCase(
    supabase: SupabaseClient,
    caseNumber: string,
    title: string,
    panelId: string,
    plaintiff?: { full_name: string; email: string; phone: string; address: string },
    defendant?: { full_name: string; email: string; phone: string; address: string }
  ): Promise<Case> {
    const genUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    // 1. יצירה או עדכון של פרופיל התובע
    let plaintiffId: string | null = null;
    if (plaintiff && plaintiff.email) {
      const { data: pExisting } = await supabase.from('profiles').select('id').eq('email', plaintiff.email).maybeSingle();
      if (pExisting) {
        plaintiffId = pExisting.id;
        await supabase.from('profiles').update({ full_name: plaintiff.full_name, phone: plaintiff.phone, address: plaintiff.address }).eq('id', plaintiffId);
      } else {
        const pUUID = genUUID();
        const { data: pNew, error: pErr } = await supabase.from('profiles').insert({
          id: pUUID,
          full_name: plaintiff.full_name,
          email: plaintiff.email,
          phone: plaintiff.phone,
          address: plaintiff.address,
          system_role: 'litigant'
        }).select().single();
        if (pErr) throw pErr;
        plaintiffId = pNew.id;
      }
    }

    // 2. יצירה או עדכון של פרופיל הנתבע
    let defendantId: string | null = null;
    if (defendant && defendant.email) {
      const { data: dExisting } = await supabase.from('profiles').select('id').eq('email', defendant.email).maybeSingle();
      if (dExisting) {
        defendantId = dExisting.id;
        await supabase.from('profiles').update({ full_name: defendant.full_name, phone: defendant.phone, address: defendant.address }).eq('id', defendantId);
      } else {
        const dUUID = genUUID();
        const { data: dNew, error: dErr } = await supabase.from('profiles').insert({
          id: dUUID,
          full_name: defendant.full_name,
          email: defendant.email,
          phone: defendant.phone,
          address: defendant.address,
          system_role: 'litigant'
        }).select().single();
        if (dErr) throw dErr;
        defendantId = dNew.id;
      }
    }

    // 3. יצירת התיק
    const { data: newCase, error: caseErr } = await supabase
      .from('cases')
      .insert({ case_number: caseNumber, title, panel_id: panelId, status: 'open' })
      .select()
      .single();
    if (caseErr) throw caseErr;

    // 4. קישור המשתתפים לתיק
    const participantsToInsert = [];
    if (plaintiffId) {
      participantsToInsert.push({ case_id: newCase.id, user_id: plaintiffId, party_role: 'plaintiff' });
    }
    if (defendantId) {
      participantsToInsert.push({ case_id: newCase.id, user_id: defendantId, party_role: 'defendant' });
    }

    if (participantsToInsert.length > 0) {
      const { error: partErr } = await supabase.from('case_participants').insert(participantsToInsert);
      if (partErr) throw partErr;
    }

    return newCase;
  },

  async getHearings(supabase: SupabaseClient, userId?: string): Promise<Hearing[]> {
    let query = supabase.from('hearings').select(`
      *,
      cases (title, case_number),
      panels (name)
    `);

    if (userId) {
      const { data: userCases } = await supabase
        .from('case_participants')
        .select('case_id')
        .eq('user_id', userId);
      
      const caseIds = userCases?.map((uc: any) => uc.case_id) || [];
      query = query.in('case_id', caseIds);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map((h: any) => ({
      id: h.id,
      case_id: h.case_id,
      panel_id: h.panel_id,
      hearing_date: h.hearing_date,
      hearing_time: h.hearing_time,
      status: h.status,
      created_at: h.created_at,
      case_title: h.cases?.title || 'תיק לא ידוע',
      case_number: h.cases?.case_number || '00000',
      panel_name: h.panels?.name || 'ללא שיוך'
    })).sort((a: any, b: any) => new Date(`${a.hearing_date}T${a.hearing_time}`).getTime() - new Date(`${b.hearing_date}T${b.hearing_time}`).getTime());
  },

  async scheduleHearing(supabase: SupabaseClient, caseId: string, panelId: string, dateStr: string, timeStr: string): Promise<Hearing> {
    const panels = await this.getPanels(supabase);
    const targetPanel = panels.find(p => p.id === panelId);
    if (!targetPanel) throw new Error('הרכב הדיינים לא נמצא.');

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay() + 1;
    
    if (dayOfWeek < 1 || dayOfWeek > 5 || dayOfWeek !== targetPanel.day_of_week) {
      throw new Error(`שגיאת שיבוץ: הרכב דיינים זה פעיל בימי ${targetPanel.name} בלבד.`);
    }

    const { data, error } = await supabase
      .from('hearings')
      .insert({ case_id: caseId, panel_id: panelId, hearing_date: dateStr, hearing_time: timeStr, status: 'scheduled' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getDocuments(supabase: SupabaseClient, hearingId: string, userId: string, userRole: 'secretariat' | 'litigant'): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        profiles (full_name)
      `)
      .eq('hearing_id', hearingId);
    if (error) throw error;

    return data.map((d: any) => {
      let resolvedPath = d.file_path;
      if (d.file_path && !d.file_path.startsWith('http') && !d.file_path.startsWith('/mock')) {
        const { data: urlData } = supabase.storage
          .from('court-documents')
          .getPublicUrl(d.file_path);
        resolvedPath = urlData?.publicUrl || d.file_path;
      }
      return {
        id: d.id,
        hearing_id: d.hearing_id,
        case_id: d.case_id,
        uploaded_by: d.uploaded_by,
        file_path: resolvedPath,
        file_name: d.file_name,
        document_type: d.document_type,
        is_shared: d.is_shared,
        created_at: d.created_at,
        uploader_name: d.profiles?.full_name || 'משתמש לא ידוע'
      };
    });
  },

  async uploadDocument(supabase: SupabaseClient, hearingId: string, userId: string, documentType: DocumentType, fileName: string, fileBlobMockUrl?: string): Promise<Document> {
    // 1. שליפת הדיון כדי לדעת את ה-case_id המקושר
    const { data: hearingData, error: hErr } = await supabase
      .from('hearings')
      .select('case_id')
      .eq('id', hearingId)
      .single();
    if (hErr || !hearingData) throw new Error("Hearing not found");

    // 2. שמירת רשומת המסמך בבסיס הנתונים
    const { data, error } = await supabase
      .from('documents')
      .insert({
        hearing_id: hearingId,
        case_id: hearingData.case_id, // שימוש ב-case_id החדש
        uploaded_by: userId,
        file_path: fileBlobMockUrl || '', 
        file_name: fileName,
        document_type: documentType,
        is_shared: false
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async toggleDocumentShare(supabase: SupabaseClient, documentId: string, isShared: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('documents')
      .update({ is_shared: isShared })
      .eq('id', documentId);
    if (error) throw error;
    return true;
  },

  async getClientRequests(supabase: SupabaseClient): Promise<ClientRequest[]> {
    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        cases (case_number),
        profiles (full_name)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return data.map((r: any) => ({
      id: r.id,
      case_id: r.case_id,
      hearing_id: r.hearing_id,
      user_id: r.user_id,
      request_type: r.request_type,
      title: r.title,
      description: r.description,
      status: r.status,
      created_at: r.created_at,
      user_name: r.profiles?.full_name || 'משתמש לא ידוע',
      case_number: r.cases?.case_number || '00000'
    }));
  },

  async submitClientRequest(
    supabase: SupabaseClient, 
    caseId: string, 
    hearingId: string | undefined, 
    userId: string, 
    requestType: any, 
    title: string, 
    description: string
  ): Promise<ClientRequest> {
    const { data, error } = await supabase
      .from('requests')
      .insert({
        case_id: caseId,
        hearing_id: hearingId || null,
        user_id: userId,
        request_type: requestType,
        title,
        description,
        status: 'pending'
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateRequestStatus(supabase: SupabaseClient, requestId: string, status: 'approved' | 'rejected'): Promise<boolean> {
    const { error } = await supabase
      .from('requests')
      .update({ status })
      .eq('id', requestId);
    if (error) throw error;
    return true;
  },

  async updatePanel(supabase: SupabaseClient, panelId: string, name: string, dayOfWeek: number): Promise<boolean> {
    const { error } = await supabase
      .from('panels')
      .update({ name, day_of_week: dayOfWeek })
      .eq('id', panelId);
    if (error) throw error;
    return true;
  },

  async createPanel(supabase: SupabaseClient, name: string, dayOfWeek: number): Promise<Panel> {
    const { data, error } = await supabase
      .from('panels')
      .insert({ name, day_of_week: dayOfWeek })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getNextCaseSerialNumber(supabase: SupabaseClient): Promise<string> {
    const { count, error } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    
    const countNum = count || 0;
    const nextNum = 1000 + countNum + 1;
    const year = new Date().getFullYear().toString().slice(-2);
    return `${nextNum}/${year}`;
  },

  async createProfile(
    supabase: SupabaseClient,
    profile: { full_name: string; email: string; phone?: string; address?: string }
  ): Promise<UserProfile> {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', profile.email)
      .maybeSingle();

    if (existing) {
      throw new Error("משתמש עם כתובת מייל זו כבר קיים במערכת.");
    }

    const genUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert({
        id: genUUID(),
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone || '',
        address: profile.address || '',
        system_role: 'litigant'
      })
      .select()
      .single();

    if (error) throw error;
    return newProfile;
  }
};
