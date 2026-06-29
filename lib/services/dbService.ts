// lib/services/dbService.ts - שירות ניהול נתונים מאוחד (Facade) המנתב בין Mock ל-Real Supabase
import { isMockMode, supabase } from '../supabase/client';
import { dbMockService } from './dbMockService';
import { dbSupabaseService } from './dbSupabaseService';
import { 
  createCaseAction,
  scheduleHearingAction,
  toggleDocumentShareAction,
  uploadDocumentAction,
  updateRequestStatusAction,
  createPanelAction,
  updatePanelAction,
  submitClientRequestAction,
  createProfileAction,
  sendMessageAction,
  uploadCaseDocumentAction,
  deleteProfileAction,
  createDocumentRequestAction,
  updateDocumentRequestStatusAction,
  moveDocumentAction
} from '../../app/actions';
import { 
  UserProfile, 
  Panel, 
  Case, 
  Hearing, 
  Document, 
  ClientRequest,
  DocumentType,
  DirectMessage,
  DocumentRequest
} from '../../types';

export const dbService = {
  // -----------------------------------------------------------------------
  // פרופילים ואימות (Profiles)
  // -----------------------------------------------------------------------
  async getProfiles(): Promise<UserProfile[]> {
    if (isMockMode || !supabase) {
      return dbMockService.getProfiles();
    }
    return dbSupabaseService.getProfiles(supabase);
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    if (isMockMode || !supabase) {
      return dbMockService.getProfile(userId);
    }
    return dbSupabaseService.getProfile(supabase, userId);
  },

  // -----------------------------------------------------------------------
  // הרכבי דיינים (Panels)
  // -----------------------------------------------------------------------
  async getPanels(): Promise<Panel[]> {
    if (isMockMode || !supabase) {
      return dbMockService.getPanels();
    }
    return dbSupabaseService.getPanels(supabase);
  },

  // -----------------------------------------------------------------------
  // תיקים (Cases)
  // -----------------------------------------------------------------------
  async getCases(): Promise<Case[]> {
    if (isMockMode || !supabase) {
      return dbMockService.getCases();
    }
    return dbSupabaseService.getCases(supabase);
  },

  async createCase(
    caseNumber: string,
    title: string,
    panelId: string,
    plaintiff?: { full_name: string; email: string; phone: string; address: string },
    defendant?: { full_name: string; email: string; phone: string; address: string }
  ): Promise<Case> {
    if (isMockMode || !supabase) {
      return dbMockService.createCase(caseNumber, title, panelId, plaintiff, defendant);
    }
    // קריאה בצד השרת להרצת ה-Server Action המאובטח
    return createCaseAction({ caseNumber, title, panelId, plaintiff, defendant });
  },

  // -----------------------------------------------------------------------
  // דיונים (Hearings)
  // -----------------------------------------------------------------------
  async getHearings(userId?: string): Promise<Hearing[]> {
    if (isMockMode || !supabase) {
      return dbMockService.getHearings(userId);
    }
    return dbSupabaseService.getHearings(supabase, userId);
  },

  async scheduleHearing(caseId: string, panelId: string, dateStr: string, timeStr: string): Promise<Hearing> {
    if (isMockMode || !supabase) {
      return dbMockService.scheduleHearing(caseId, panelId, dateStr, timeStr);
    }
    return scheduleHearingAction({ caseId, panelId, dateStr, timeStr });
  },

  getDayName(dayNum: number): string {
    return dbMockService.getDayName(dayNum);
  },

  // -----------------------------------------------------------------------
  // מסמכים (Documents)
  // -----------------------------------------------------------------------
  async getDocuments(hearingId: string, userId: string, userRole: 'secretariat' | 'litigant'): Promise<Document[]> {
    if (isMockMode || !supabase) {
      return dbMockService.getDocuments(hearingId, userId, userRole);
    }
    return dbSupabaseService.getDocuments(supabase, hearingId, userId, userRole);
  },

  async getCaseDocuments(caseId: string): Promise<Document[]> {
    if (isMockMode || !supabase) {
      return dbMockService.getCaseDocuments(caseId);
    }
    return dbSupabaseService.getCaseDocuments(supabase, caseId);
  },

  async uploadDocument(
    hearingId: string, 
    userId: string, 
    documentType: DocumentType, 
    fileName: string, 
    fileBlobMockUrl?: string,
    folderType?: 'General' | 'Plaintiff_Docs' | 'Defendant_Docs'
  ): Promise<Document> {
    if (isMockMode || !supabase) {
      return dbMockService.uploadDocument(hearingId, userId, documentType, fileName, fileBlobMockUrl, folderType);
    }
    return uploadDocumentAction({ hearingId, userId, documentType, fileName, fileBlobMockUrl, folderType: folderType || 'General' });
  },

  async toggleDocumentShare(documentId: string, isShared: boolean): Promise<boolean> {
    if (isMockMode || !supabase) {
      return dbMockService.toggleDocumentShare(documentId, isShared);
    }
    return toggleDocumentShareAction({ documentId, isShared });
  },

  // -----------------------------------------------------------------------
  // פניות ובקשות (Client Requests)
  // -----------------------------------------------------------------------
  async getClientRequests(): Promise<ClientRequest[]> {
    if (isMockMode || !supabase) {
      return dbMockService.getClientRequests();
    }
    return dbSupabaseService.getClientRequests(supabase);
  },

  async submitClientRequest(caseId: string, hearingId: string | undefined, userId: string, requestType: any, title: string, description: string): Promise<ClientRequest> {
    if (isMockMode || !supabase) {
      return dbMockService.submitClientRequest(caseId, hearingId, userId, requestType, title, description);
    }
    return submitClientRequestAction({ caseId, hearingId, userId, requestType, title, description });
  },

  async updateRequestStatus(requestId: string, status: 'approved' | 'rejected'): Promise<boolean> {
    if (isMockMode || !supabase) {
      return dbMockService.updateRequestStatus(requestId, status);
    }
    return updateRequestStatusAction({ requestId, status });
  },

  async updatePanel(panelId: string, name: string, dayOfWeek: number): Promise<boolean> {
    if (isMockMode || !supabase) {
      return dbMockService.updatePanel(panelId, name, dayOfWeek);
    }
    return updatePanelAction({ panelId, name, dayOfWeek });
  },

  async createPanel(name: string, dayOfWeek: number): Promise<Panel> {
    if (isMockMode || !supabase) {
      return dbMockService.createPanel(name, dayOfWeek);
    }
    return createPanelAction({ name, dayOfWeek });
  },

  async getNextCaseSerialNumber(): Promise<string> {
    if (isMockMode || !supabase) {
      return dbMockService.getNextCaseSerialNumber();
    }
    return dbSupabaseService.getNextCaseSerialNumber(supabase);
  },

  getBetDinName(): string {
    return dbMockService.getBetDinName();
  },

  setBetDinName(name: string): void {
    dbMockService.setBetDinName(name);
  },

  async createProfile(profile: { full_name: string; email: string; phone?: string; address?: string }): Promise<UserProfile> {
    if (isMockMode || !supabase) {
      return dbMockService.createProfile(profile);
    }
    return createProfileAction({
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone || '',
      address: profile.address || ''
    });
  },

  async getMessages(userId: string): Promise<DirectMessage[]> {
    if (isMockMode || !supabase) {
      return dbMockService.getMessages(userId);
    }
    return dbSupabaseService.getMessages(supabase, userId);
  },

  async sendMessage(senderId: string, recipientId: string, title: string, content: string, caseId?: string): Promise<DirectMessage> {
    if (isMockMode || !supabase) {
      return dbMockService.sendMessage(senderId, recipientId, title, content, caseId);
    }
    return sendMessageAction({ senderId, recipientId, title, content, caseId });
  },

  async uploadCaseDocument(
    caseId: string, 
    userId: string, 
    documentType: DocumentType, 
    fileName: string, 
    filePath: string,
    folderType?: 'General' | 'Plaintiff_Docs' | 'Defendant_Docs'
  ): Promise<Document> {
    if (isMockMode || !supabase) {
      return dbMockService.uploadCaseDocument(caseId, userId, documentType, fileName, filePath, folderType);
    }
    return uploadCaseDocumentAction({ caseId, userId, documentType, fileName, filePath, folderType: folderType || 'General' });
  },

  async deleteProfile(userId: string): Promise<boolean> {
    if (isMockMode || !supabase) {
      return dbMockService.deleteProfile(userId);
    }
    return deleteProfileAction({ userId });
  },

  async getDocumentRequests(userId?: string): Promise<DocumentRequest[]> {
    if (isMockMode || !supabase) {
      return dbMockService.getDocumentRequests(userId);
    }
    return dbSupabaseService.getDocumentRequests(supabase, userId);
  },

  async createDocumentRequest(caseId: string, requestedTo: string, title: string, description?: string): Promise<DocumentRequest> {
    if (isMockMode || !supabase) {
      return dbMockService.createDocumentRequest(caseId, requestedTo, title, description);
    }
    return createDocumentRequestAction({ caseId, requestedTo, title, description });
  },

  async updateDocumentRequestStatus(requestId: string, status: 'pending' | 'completed'): Promise<boolean> {
    if (isMockMode || !supabase) {
      return dbMockService.updateDocumentRequestStatus(requestId, status);
    }
    return updateDocumentRequestStatusAction({ requestId, status });
  },

  async moveDocument(documentId: string, folderType: 'General' | 'Plaintiff_Docs' | 'Defendant_Docs'): Promise<boolean> {
    if (isMockMode || !supabase) {
      return dbMockService.moveDocument(documentId, folderType);
    }
    return moveDocumentAction({ documentId, folderType });
  }
};
