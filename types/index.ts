// types/index.ts - הגדרת טיפוסי הנתונים (TypeScript interfaces) למערכת

export type SystemRole = 'secretariat' | 'litigant';
export type CaseStatus = 'open' | 'closed' | 'pending';
export type PartyRole = 'plaintiff' | 'defendant';
export type HearingStatus = 'scheduled' | 'postponed' | 'completed';
export type DocumentType = 'plaintiff' | 'defendant' | 'secretariat';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string; // כתובת מגורים
  system_role: SystemRole;
  created_at: string;
}

export interface Panel {
  id: string;
  name: string;
  day_of_week: number; // 1 = ראשון, 5 = חמישי
  created_at: string;
}

export interface Case {
  id: string;
  case_number: string;
  title: string;
  status: CaseStatus;
  panel_id?: string;
  created_at: string;
  
  // שדות עזר להצגה
  panel_name?: string;
  participants?: {
    user_id: string;
    full_name: string;
    party_role: PartyRole;
    email: string;
    phone?: string;
    address?: string;
  }[];
}

export interface CaseParticipant {
  id: string;
  case_id: string;
  user_id: string;
  party_role: PartyRole;
  created_at: string;
}

export interface Hearing {
  id: string;
  case_id: string;
  panel_id: string;
  hearing_date: string; // YYYY-MM-DD
  hearing_time: string; // HH:MM
  status: HearingStatus;
  created_at: string;
  
  // שדות מורחבים לצורך תצוגה
  case_title?: string;
  case_number?: string;
  panel_name?: string;
}

export interface Document {
  id: string;
  hearing_id?: string | null;
  case_id: string;
  uploaded_by: string;
  file_path: string; // נתיב פיזי ב-Storage או Mock URL
  file_name: string;
  document_type: DocumentType;
  folder_type?: 'General' | 'Plaintiff_Docs' | 'Defendant_Docs'; // תיקיית האחסון בתוך התיק
  is_shared: boolean;
  created_at: string;
  
  // שדות מורחבים לצורך תצוגה
  uploader_name?: string;
}

// בקשות של משתמשים שהמזכירות צריכה לאשר (למשל בקשה לדחיית דיון או הוספת חומר)
export interface ClientRequest {
  id: string;
  case_id: string;
  hearing_id?: string;
  user_id: string;
  request_type: 'postpone_hearing' | 'submit_special_document' | 'other';
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  
  // שדות הרחבה
  user_name?: string;
  case_number?: string;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  case_id?: string;
  title: string;
  content: string;
  created_at: string;
  
  // שדות תצוגה מורחבים
  sender_name?: string;
  recipient_name?: string;
  case_number?: string;
}

export interface DocumentRequest {
  id: string;
  case_id: string;
  requested_to: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  created_at: string;

  // שדות הרחבה לתצוגה
  case_number?: string;
  case_title?: string;
  requested_to_name?: string;
}
