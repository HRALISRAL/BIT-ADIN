// lib/services/dbMockService.ts - מימוש סימולציה מקומית (LocalStorage) עבור הנתונים
import { 
  UserProfile, 
  Panel, 
  Case, 
  Hearing, 
  Document, 
  ClientRequest,
  DocumentType,
  HearingStatus,
  CaseStatus,
  PartyRole,
  DirectMessage,
  DocumentRequest
} from '../../types';

// =========================================================================
// נתונים ראשוניים למצב הדמיה (Mock Seed Data)
// =========================================================================

const INITIAL_PROFILES: UserProfile[] = [
  { id: 'sec-1', full_name: 'דינה לוי (מזכירה ראשית)', email: 'dina@court.gov.il', phone: '050-1234567', system_role: 'secretariat', created_at: new Date().toISOString() },
  { id: 'plaintiff-1', full_name: 'יוסי כהן (תובע)', email: 'yossi@gmail.com', phone: '052-7654321', system_role: 'litigant', created_at: new Date().toISOString() },
  { id: 'defendant-1', full_name: 'דניאל מזרחי (נתבע)', email: 'daniel@gmail.com', phone: '054-1112223', system_role: 'litigant', created_at: new Date().toISOString() },
  { id: 'plaintiff-2', full_name: 'שרה גולדשטיין (תובעת)', email: 'sarah@gmail.com', phone: '053-9998887', system_role: 'litigant', created_at: new Date().toISOString() },
  { id: 'defendant-2', full_name: 'משה אהרוני (נתבע)', email: 'moshe@gmail.com', phone: '058-4445556', system_role: 'litigant', created_at: new Date().toISOString() },
];

const INITIAL_PANELS: Panel[] = [
  { id: 'panel-1', name: 'הרכב א\' (אב"ד הרב שפירא) - יום ראשון', day_of_week: 1, created_at: new Date().toISOString() },
  { id: 'panel-2', name: 'הרכב ב\' (אב"ד הרב אלון) - יום שני', day_of_week: 2, created_at: new Date().toISOString() },
  { id: 'panel-3', name: 'הרכב ג\' (אב"ד הרב פרידמן) - יום שלישי', day_of_week: 3, created_at: new Date().toISOString() },
  { id: 'panel-4', name: 'הרכב ד\' (אב"ד הרב ישראלי) - יום רביעי', day_of_week: 4, created_at: new Date().toISOString() },
  { id: 'panel-5', name: 'הרכב ה\' (אב"ד הרב לוין) - יום חמישי', day_of_week: 5, created_at: new Date().toISOString() },
];

const INITIAL_CASES: Case[] = [
  { id: 'case-1', case_number: '45902-12-25', title: 'סכסוך שכנים - בית משותף ברחוב הרצל', status: 'open', panel_id: 'panel-1', created_at: new Date().toISOString() },
  { id: 'case-2', case_number: '11244-01-26', title: 'תביעת נזיקין - פגיעה ברכוש פרטי', status: 'open', panel_id: 'panel-2', created_at: new Date().toISOString() },
  { id: 'case-3', case_number: '88320-04-26', title: 'סכסוך עסקי - הפרת חוזה שותפות מסחרית', status: 'pending', panel_id: 'panel-3', created_at: new Date().toISOString() },
];

const INITIAL_PARTICIPANTS = [
  { id: 'cp-1', case_id: 'case-1', user_id: 'plaintiff-1', party_role: 'plaintiff' },
  { id: 'cp-2', case_id: 'case-1', user_id: 'defendant-1', party_role: 'defendant' },
  { id: 'cp-3', case_id: 'case-2', user_id: 'plaintiff-2', party_role: 'plaintiff' },
  { id: 'cp-4', case_id: 'case-2', user_id: 'defendant-2', party_role: 'defendant' },
  { id: 'cp-5', case_id: 'case-3', user_id: 'plaintiff-1', party_role: 'plaintiff' },
  { id: 'cp-6', case_id: 'case-3', user_id: 'defendant-2', party_role: 'defendant' },
];

const INITIAL_HEARINGS: Hearing[] = [
  { id: 'hearing-1', case_id: 'case-1', panel_id: 'panel-1', hearing_date: '2026-06-14', hearing_time: '09:00', status: 'scheduled', created_at: new Date().toISOString() },
  { id: 'hearing-2', case_id: 'case-2', panel_id: 'panel-2', hearing_date: '2026-06-15', hearing_time: '11:30', status: 'scheduled', created_at: new Date().toISOString() },
  { id: 'hearing-3', case_id: 'case-3', panel_id: 'panel-3', hearing_date: '2026-06-16', hearing_time: '10:00', status: 'scheduled', created_at: new Date().toISOString() },
];

const INITIAL_DOCUMENTS: Document[] = [
  { id: 'doc-1', hearing_id: 'hearing-1', case_id: 'case-1', uploaded_by: 'plaintiff-1', file_path: '/mock/claims_1.pdf', file_name: 'כתב_תביעה_מתוקן.pdf', document_type: 'plaintiff', is_shared: true, created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'doc-2', hearing_id: 'hearing-1', case_id: 'case-1', uploaded_by: 'plaintiff-1', file_path: '/mock/secret_1.pdf', file_name: 'תצלומי_נזקים_רטיבות.pdf', document_type: 'plaintiff', is_shared: false, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'doc-3', hearing_id: 'hearing-1', case_id: 'case-1', uploaded_by: 'defendant-1', file_path: '/mock/defense_1.pdf', file_name: 'כתב_הגנה_חתום.pdf', document_type: 'defendant', is_shared: false, created_at: new Date(Date.now() - 86400000).toISOString() },
];

const INITIAL_REQUESTS: ClientRequest[] = [
  { id: 'req-1', case_id: 'case-1', hearing_id: 'hearing-1', user_id: 'plaintiff-1', request_type: 'postpone_hearing', title: 'בקשה לדחיית מועד הדיון', description: 'עקב טיפול רפואי דחוף, אבקש לדחות את מועד הדיון בעשרה ימים.', status: 'pending', created_at: new Date(Date.now() - 3600000 * 5).toISOString() },
  { id: 'req-2', case_id: 'case-2', user_id: 'defendant-2', request_type: 'submit_special_document', title: 'בקשה להגשת חוות דעת מומחה באיחור', description: 'חוות הדעת הסופית של המהנדס התקבלה רק אתמול עקב עיכוב במעבדה.', status: 'approved', created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
];

// =========================================================================
// פונקציות עזר לניהול זיכרון מקומי
// =========================================================================

const getLocalData = <T>(key: string, initialData: T): T => {
  if (typeof window === 'undefined') return initialData;
  const data = localStorage.getItem(`court_${key}`);
  if (!data) {
    localStorage.setItem(`court_${key}`, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(data);
};

const setLocalData = <T>(key: string, data: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`court_${key}`, JSON.stringify(data));
  }
};

// =========================================================================
// שירות ה-Mock
// =========================================================================

export const dbMockService = {
  async getProfiles(): Promise<UserProfile[]> {
    return getLocalData('profiles', INITIAL_PROFILES);
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    const profiles = await this.getProfiles();
    return profiles.find(p => p.id === userId) || null;
  },

  async getPanels(): Promise<Panel[]> {
    return getLocalData('panels', INITIAL_PANELS);
  },

  async getCases(): Promise<Case[]> {
    const cases = getLocalData<Case[]>('cases', INITIAL_CASES);
    const panels = getLocalData<Panel[]>('panels', INITIAL_PANELS);
    const participants = getLocalData<any[]>('participants', INITIAL_PARTICIPANTS);
    const profiles = getLocalData<UserProfile[]>('profiles', INITIAL_PROFILES);

    return cases.map(c => {
      const panel = panels.find(p => p.id === c.panel_id);
      const caseParts = participants
        .filter(p => p.case_id === c.id)
        .map(p => {
          const profile = profiles.find(prof => prof.id === p.user_id);
          return {
            user_id: p.user_id,
            full_name: profile?.full_name || 'משתמש לא ידוע',
            party_role: p.party_role as PartyRole,
            email: profile?.email || '',
            phone: profile?.phone,
            address: profile?.address
          };
        });

      return {
        ...c,
        panel_name: panel?.name || 'ללא שיוך הרכב',
        participants: caseParts
      };
    });
  },

  async createCase(
    caseNumber: string,
    title: string,
    panelId: string,
    plaintiff?: { full_name: string; email: string; phone: string; address: string },
    defendant?: { full_name: string; email: string; phone: string; address: string }
  ): Promise<Case> {
    const cases = getLocalData<Case[]>('cases', INITIAL_CASES);
    const profiles = getLocalData<UserProfile[]>('profiles', INITIAL_PROFILES);
    const allParts = getLocalData<any[]>('participants', INITIAL_PARTICIPANTS);

    const findOrCreateProfile = (details: { full_name: string; email: string; phone: string; address: string }): UserProfile => {
      let profile = profiles.find(p => p.email.toLowerCase() === details.email.toLowerCase() || (details.phone && p.phone === details.phone));
      if (!profile) {
        profile = {
          id: `litigant-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          full_name: details.full_name,
          email: details.email,
          phone: details.phone,
          address: details.address,
          system_role: 'litigant',
          created_at: new Date().toISOString()
        };
        profiles.push(profile);
      } else {
        profile.full_name = details.full_name;
        if (details.phone) profile.phone = details.phone;
        if (details.address) profile.address = details.address;
      }
      return profile;
    };

    let pProfile = null;
    if (plaintiff && plaintiff.email) {
      pProfile = findOrCreateProfile(plaintiff);
    }
    let dProfile = null;
    if (defendant && defendant.email) {
      dProfile = findOrCreateProfile(defendant);
    }
    setLocalData('profiles', profiles);

    const newCase: Case = {
      id: `case-${Date.now()}`,
      case_number: caseNumber,
      title,
      status: 'open',
      panel_id: panelId,
      created_at: new Date().toISOString()
    };
    cases.push(newCase);
    setLocalData('cases', cases);

    if (pProfile) {
      allParts.push({
        id: `cp-${Date.now()}-p`,
        case_id: newCase.id,
        user_id: pProfile.id,
        party_role: 'plaintiff'
      });
    }
    if (dProfile) {
      allParts.push({
        id: `cp-${Date.now()}-d`,
        case_id: newCase.id,
        user_id: dProfile.id,
        party_role: 'defendant'
      });
    }
    setLocalData('participants', allParts);

    return newCase;
  },

  async getHearings(userId?: string): Promise<Hearing[]> {
    const hearings = getLocalData<Hearing[]>('hearings', INITIAL_HEARINGS);
    const cases = getLocalData<Case[]>('cases', INITIAL_CASES);
    const panels = getLocalData<Panel[]>('panels', INITIAL_PANELS);
    const participants = getLocalData<any[]>('participants', INITIAL_PARTICIPANTS);

    let filteredHearings = hearings;
    if (userId) {
      const userCaseIds = participants
        .filter(p => p.user_id === userId)
        .map(p => p.case_id);
      filteredHearings = hearings.filter(h => userCaseIds.includes(h.case_id));
    }

    return filteredHearings.map(h => {
      const c = cases.find(caseItem => caseItem.id === h.case_id);
      const panel = panels.find(p => p.id === h.panel_id);
      return {
        ...h,
        case_title: c?.title || 'תיק לא ידוע',
        case_number: c?.case_number || '00000',
        panel_name: panel?.name || 'ללא שיוך'
      };
    }).sort((a: any, b: any) => new Date(`${a.hearing_date}T${a.hearing_time}`).getTime() - new Date(`${b.hearing_date}T${b.hearing_time}`).getTime());
  },

  async scheduleHearing(caseId: string, panelId: string, dateStr: string, timeStr: string): Promise<Hearing> {
    const panels = await this.getPanels();
    const targetPanel = panels.find(p => p.id === panelId);
    if (!targetPanel) throw new Error('הרכב הדיינים לא נמצא.');

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay() + 1;
    
    if (dayOfWeek < 1 || dayOfWeek > 5 || dayOfWeek !== targetPanel.day_of_week) {
      throw new Error(`שגיאת שיבוץ: הרכב דיינים זה פעיל בימי ${this.getDayName(targetPanel.day_of_week)} בלבד. התאריך שנבחר הוא יום ${this.getDayName(dayOfWeek)}.`);
    }

    const hearings = getLocalData<Hearing[]>('hearings', INITIAL_HEARINGS);
    const newHearing: Hearing = {
      id: `hearing-${Date.now()}`,
      case_id: caseId,
      panel_id: panelId,
      hearing_date: dateStr,
      hearing_time: timeStr,
      status: 'scheduled',
      created_at: new Date().toISOString()
    };
    hearings.push(newHearing);
    setLocalData('hearings', hearings);

    // שלח הודעה אוטומטית לכל המעורבים בתיק (Mock)
    try {
      const mockSenderId = (typeof window !== 'undefined' && localStorage.getItem("current_user_id")) || 'mock-secretariat-id';
      const participants = getLocalData<any[]>('participants', INITIAL_PARTICIPANTS);
      const cases = getLocalData<Case[]>('cases', INITIAL_CASES);
      const caseObj = cases.find(c => c.id === caseId);
      const caseNumStr = caseObj ? caseObj.case_number : '';
      const caseParts = participants.filter(p => p.case_id === caseId);

      for (const p of caseParts) {
        if (p.user_id !== mockSenderId) {
          await this.sendMessage(
            mockSenderId,
            p.user_id,
            `נקבע מועד דיון חדש בתיק ${caseNumStr}`,
            `שלום רב,\n\nהרינו לעדכן כי נקבע דיון בתיק מספר ${caseNumStr} מול הרכב הדיינים '${targetPanel.name}'.\nהדיון יתקיים ביום ובשעה המפורטים מטה:\n\nתאריך: ${dateStr}\nשעה: ${timeStr}.\n\nבברכה,\nמזכירות בית הדין.`,
            caseId
          );
        }
      }
    } catch (msgErr) {
      console.error('Failed to send automated hearing messages (Mock):', msgErr);
    }

    return newHearing;
  },

  getDayName(dayNum: number): string {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days[dayNum - 1] || 'לא ידוע';
  },

  async getDocuments(hearingId: string, userId: string, userRole: 'secretariat' | 'litigant'): Promise<Document[]> {
    const allDocs = getLocalData<Document[]>('documents', INITIAL_DOCUMENTS);
    const profiles = getLocalData<UserProfile[]>('profiles', INITIAL_PROFILES);
    const participants = getLocalData<any[]>('participants', INITIAL_PARTICIPANTS);
    const hearings = getLocalData<Hearing[]>('hearings', INITIAL_HEARINGS);

    const hearing = hearings.find(h => h.id === hearingId);
    if (!hearing) return [];

    const docList = allDocs.filter(d => d.hearing_id === hearingId);

    let authorizedDocs = docList;
    if (userRole === 'litigant') {
      const isUserParticipant = participants.some(p => p.case_id === hearing.case_id && p.user_id === userId);
      if (!isUserParticipant) {
        return [];
      }
      
      authorizedDocs = docList.filter(d => 
        d.uploaded_by === userId || d.is_shared === true
      );
    }

    return authorizedDocs.map(d => {
      const uploader = profiles.find(p => p.id === d.uploaded_by);
      return {
        ...d,
        folder_type: d.folder_type || (d.document_type === 'plaintiff' ? 'Plaintiff_Docs' : d.document_type === 'defendant' ? 'Defendant_Docs' : 'General'),
        uploader_name: uploader?.full_name || 'משתמש לא ידוע'
      };
    });
  },

  async getCaseDocuments(caseId: string): Promise<Document[]> {
    const allDocs = getLocalData<Document[]>('documents', INITIAL_DOCUMENTS);
    const profiles = getLocalData<UserProfile[]>('profiles', INITIAL_PROFILES);
    const docList = allDocs.filter(d => d.case_id === caseId);

    return docList.map(d => {
      const uploader = profiles.find(p => p.id === d.uploaded_by);
      return {
        ...d,
        folder_type: d.folder_type || (d.document_type === 'plaintiff' ? 'Plaintiff_Docs' : d.document_type === 'defendant' ? 'Defendant_Docs' : 'General'),
        uploader_name: uploader?.full_name || 'משתמש לא ידוע'
      };
    });
  },

  async uploadDocument(
    hearingId: string, 
    userId: string, 
    documentType: DocumentType, 
    fileName: string, 
    fileBlobMockUrl?: string,
    folderType?: 'General' | 'Plaintiff_Docs' | 'Defendant_Docs'
  ): Promise<Document> {
    const allDocs = getLocalData<Document[]>('documents', INITIAL_DOCUMENTS);
    const hearings = getLocalData<Hearing[]>('hearings', INITIAL_HEARINGS);
    
    const hearing = hearings.find(h => h.id === hearingId);
    if (!hearing) throw new Error("Hearing not found");

    const finalFolderType = folderType || (
      documentType === 'plaintiff' ? 'Plaintiff_Docs' :
      documentType === 'defendant' ? 'Defendant_Docs' : 'General'
    );

    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      hearing_id: hearingId,
      case_id: hearing.case_id,
      uploaded_by: userId,
      file_path: fileBlobMockUrl || `/mock/uploaded_${Date.now()}_${fileName}`,
      file_name: fileName,
      document_type: documentType,
      folder_type: finalFolderType,
      is_shared: finalFolderType === 'General',
      created_at: new Date().toISOString()
    };
    allDocs.push(newDoc);
    setLocalData('documents', allDocs);
    return newDoc;
  },

  async uploadCaseDocument(
    caseId: string,
    userId: string,
    documentType: DocumentType,
    fileName: string,
    filePath: string,
    folderType?: 'General' | 'Plaintiff_Docs' | 'Defendant_Docs'
  ): Promise<Document> {
    const documents = getLocalData<Document[]>('documents', INITIAL_DOCUMENTS);
    
    const finalFolderType = folderType || (
      documentType === 'plaintiff' ? 'Plaintiff_Docs' :
      documentType === 'defendant' ? 'Defendant_Docs' : 'General'
    );

    const newDoc: Document = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      hearing_id: null,
      case_id: caseId,
      uploaded_by: userId,
      file_path: filePath,
      file_name: fileName,
      document_type: documentType,
      folder_type: finalFolderType,
      is_shared: finalFolderType === 'General',
      created_at: new Date().toISOString()
    };
    documents.push(newDoc);
    setLocalData('documents', documents);
    return newDoc;
  },

  async toggleDocumentShare(documentId: string, isShared: boolean): Promise<boolean> {
    const allDocs = getLocalData<Document[]>('documents', INITIAL_DOCUMENTS);
    const docIndex = allDocs.findIndex(d => d.id === documentId);
    if (docIndex > -1) {
      allDocs[docIndex].is_shared = isShared;
      setLocalData('documents', allDocs);
      return true;
    }
    return false;
  },

  async getClientRequests(): Promise<ClientRequest[]> {
    const reqs = getLocalData<ClientRequest[]>('requests', INITIAL_REQUESTS);
    const cases = getLocalData<Case[]>('cases', INITIAL_CASES);
    const profiles = getLocalData<UserProfile[]>('profiles', INITIAL_PROFILES);

    return reqs.map(r => {
      const c = cases.find(caseItem => caseItem.id === r.case_id);
      const user = profiles.find(p => p.id === r.user_id);
      return {
        ...r,
        user_name: user?.full_name || 'משתמש לא ידוע',
        case_number: c?.case_number || '00000'
      };
    }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async submitClientRequest(caseId: string, hearingId: string | undefined, userId: string, requestType: any, title: string, description: string): Promise<ClientRequest> {
    const reqs = getLocalData<ClientRequest[]>('requests', INITIAL_REQUESTS);
    const newReq: ClientRequest = {
      id: `req-${Date.now()}`,
      case_id: caseId,
      hearing_id: hearingId,
      user_id: userId,
      request_type: requestType,
      title,
      description,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    reqs.push(newReq);
    setLocalData('requests', reqs);
    return newReq;
  },

  async updateRequestStatus(requestId: string, status: 'approved' | 'rejected'): Promise<boolean> {
    const reqs = getLocalData<ClientRequest[]>('requests', INITIAL_REQUESTS);
    const index = reqs.findIndex(r => r.id === requestId);
    if (index > -1) {
      reqs[index].status = status;
      setLocalData('requests', reqs);
      return true;
    }
    return false;
  },

  async updatePanel(panelId: string, name: string, dayOfWeek: number): Promise<boolean> {
    const panels = getLocalData<Panel[]>('panels', INITIAL_PANELS);
    const index = panels.findIndex(p => p.id === panelId);
    if (index > -1) {
      panels[index].name = name;
      panels[index].day_of_week = dayOfWeek;
      setLocalData('panels', panels);
      return true;
    }
    return false;
  },

  async createPanel(name: string, dayOfWeek: number): Promise<Panel> {
    const panels = getLocalData<Panel[]>('panels', INITIAL_PANELS);
    const newPanel: Panel = {
      id: `panel-${Date.now()}`,
      name,
      day_of_week: dayOfWeek,
      created_at: new Date().toISOString()
    };
    panels.push(newPanel);
    setLocalData('panels', panels);
    return newPanel;
  },

  async getNextCaseSerialNumber(): Promise<string> {
    const cases = await this.getCases();
    const count = cases.length;
    const nextNum = 1000 + count + 1;
    const year = new Date().getFullYear().toString().slice(-2);
    return `${nextNum}/${year}`;
  },

  getBetDinName(): string {
    if (typeof window === 'undefined') return 'בית הדין הרבני האזורי';
    return localStorage.getItem('court_name') || 'בית הדין הרבני האזורי ירושלים';
  },

  setBetDinName(name: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('court_name', name);
    }
  },

  async createProfile(profile: { full_name: string; email: string; phone?: string; address?: string }): Promise<UserProfile> {
    const profiles = getLocalData<UserProfile[]>('profiles', INITIAL_PROFILES);
    const existing = profiles.find(p => p.email.toLowerCase() === profile.email.toLowerCase());
    if (existing) {
      throw new Error("משתמש עם כתובת מייל זו כבר קיים במערכת.");
    }

    const newProfile: UserProfile = {
      id: `litigant-${Date.now()}`,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone || '',
      address: profile.address || '',
      system_role: 'litigant',
      created_at: new Date().toISOString()
    };
    profiles.push(newProfile);
    setLocalData('profiles', profiles);
    return newProfile;
  },

  async getMessages(userId: string): Promise<DirectMessage[]> {
    const messages = getLocalData<DirectMessage[]>('messages', []);
    const profiles = getLocalData<UserProfile[]>('profiles', INITIAL_PROFILES);
    const cases = getLocalData<Case[]>('cases', INITIAL_CASES);

    return messages
      .filter(m => m.sender_id === userId || m.recipient_id === userId)
      .map(m => {
        const sender = profiles.find(p => p.id === m.sender_id);
        const recipient = profiles.find(p => p.id === m.recipient_id);
        const c = cases.find(caseItem => caseItem.id === m.case_id);
        return {
          ...m,
          sender_name: sender?.full_name || 'משתמש לא ידוע',
          recipient_name: recipient?.full_name || 'משתמש לא ידוע',
          case_number: c?.case_number
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async sendMessage(
    senderId: string,
    recipientId: string,
    title: string,
    content: string,
    caseId?: string
  ): Promise<DirectMessage> {
    const messages = getLocalData<DirectMessage[]>('messages', []);
    const newMsg: DirectMessage = {
      id: `msg-${Date.now()}`,
      sender_id: senderId,
      recipient_id: recipientId,
      case_id: caseId,
      title,
      content,
      created_at: new Date().toISOString()
    };
    messages.push(newMsg);
    setLocalData('messages', messages);
    return newMsg;
  },

  async deleteProfile(userId: string): Promise<boolean> {
    const profiles = getLocalData<UserProfile[]>('profiles', INITIAL_PROFILES);
    const filtered = profiles.filter(p => p.id !== userId);
    setLocalData('profiles', filtered);
    return true;
  },

  async getDocumentRequests(userId?: string): Promise<DocumentRequest[]> {
    const reqs = getLocalData<DocumentRequest[]>('document_requests', []);
    const cases = getLocalData<Case[]>('cases', INITIAL_CASES);
    const profiles = getLocalData<UserProfile[]>('profiles', INITIAL_PROFILES);

    let filtered = reqs;
    if (userId) {
      filtered = reqs.filter(r => r.requested_to === userId);
    }

    return filtered.map(r => {
      const c = cases.find(caseItem => caseItem.id === r.case_id);
      const p = profiles.find(profileItem => profileItem.id === r.requested_to);
      return {
        ...r,
        case_number: c?.case_number || '—',
        case_title: c?.title || '—',
        requested_to_name: p?.full_name || '—'
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createDocumentRequest(
    caseId: string,
    requestedTo: string,
    title: string,
    description?: string
  ): Promise<DocumentRequest> {
    const reqs = getLocalData<DocumentRequest[]>('document_requests', []);
    const newReq: DocumentRequest = {
      id: `dreq-${Date.now()}`,
      case_id: caseId,
      requested_to: requestedTo,
      title,
      description,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    reqs.push(newReq);
    setLocalData('document_requests', reqs);
    return newReq;
  },

  async updateDocumentRequestStatus(
    requestId: string,
    status: 'pending' | 'completed'
  ): Promise<boolean> {
    const reqs = getLocalData<DocumentRequest[]>('document_requests', []);
    const idx = reqs.findIndex(r => r.id === requestId);
    if (idx !== -1) {
      reqs[idx].status = status;
      setLocalData('document_requests', reqs);
      return true;
    }
    return false;
  },

  async moveDocument(
    documentId: string,
    folderType: 'General' | 'Plaintiff_Docs' | 'Defendant_Docs'
  ): Promise<boolean> {
    const docs = getLocalData<Document[]>('documents', INITIAL_DOCUMENTS);
    const idx = docs.findIndex(d => d.id === documentId);
    if (idx !== -1) {
      docs[idx].folder_type = folderType;
      docs[idx].is_shared = folderType === 'General';
      setLocalData('documents', docs);
      return true;
    }
    return false;
  }
};
