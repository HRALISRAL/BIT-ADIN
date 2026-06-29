// app/actions.ts - פעולות בצד השרת (Next.js Server Actions) עם אימות קלט באמצעות Zod
"use server"

import { z } from 'zod';
import { createClient } from '../lib/supabase/server';
import { dbSupabaseService } from '../lib/services/dbSupabaseService';
import { DocumentType } from '../types';

// =========================================================================
// פונקציית עזר לטיפול מאובטח בשגיאות (מונעת ערפול של Next.js בייצור)
// =========================================================================
async function safeAction<T>(fn: () => Promise<T>): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const res = await fn();
    return { success: true, data: res };
  } catch (err: any) {
    console.error("Server Action Error:", err);
    return { success: false, error: err.message || String(err) };
  }
}

// =========================================================================
// סכמות אימות קלט (Zod Schemas)
// =========================================================================

const litigantSchema = z.object({
  full_name: z.string().min(1, "שם מלא הוא שדה חובה"),
  email: z.string().email("כתובת אימייל לא תקינה"),
  phone: z.string().optional().default(''),
  address: z.string().optional().default('')
});

const createCaseSchema = z.object({
  caseNumber: z.string().min(1, "מספר תיק הוא שדה חובה"),
  title: z.string().min(1, "כותרת התיק היא שדה חובה"),
  panelId: z.string().uuid("הרכב דיינים לא תקין"),
  plaintiff: litigantSchema,
  defendant: litigantSchema.optional()
});

const scheduleHearingSchema = z.object({
  caseId: z.string().uuid("מזהה תיק לא תקין"),
  panelId: z.string().uuid("מזהה הרכב לא תקין"),
  dateStr: z.string(),
  timeStr: z.string()
});

const toggleDocumentShareSchema = z.object({
  documentId: z.string().uuid("מזהה מסמך לא תקין"),
  isShared: z.boolean()
});

const uploadDocumentSchema = z.object({
  hearingId: z.string().uuid("דיון לא תקין"),
  userId: z.string().uuid("משתמש לא תקין"),
  documentType: z.enum(['plaintiff', 'defendant', 'secretariat']),
  fileName: z.string(),
  fileBlobMockUrl: z.string().optional(),
  folderType: z.enum(['General', 'Plaintiff_Docs', 'Defendant_Docs']).optional().default('General')
});

const updateRequestStatusSchema = z.object({
  requestId: z.string().uuid("בקשה לא תקינה"),
  status: z.enum(['approved', 'rejected'] as const)
});

const panelSchema = z.object({
  name: z.string().min(1, "שם ההרכב הוא שדה חובה"),
  dayOfWeek: z.number().int().min(1).max(5)
});

const updatePanelSchema = panelSchema.extend({
  panelId: z.string().uuid("הרכב לא תקין")
});

const submitClientRequestSchema = z.object({
  caseId: z.string().uuid("תיק לא תקין"),
  hearingId: z.string().uuid().optional(),
  userId: z.string().uuid("משתמש לא תקין"),
  requestType: z.enum(['postpone_hearing', 'submit_special_document', 'other'] as const),
  title: z.string().min(1, "נושא הבקשה הוא שדה חובה"),
  description: z.string().min(1, "פירוט הבקשה הוא שדה חובה")
});

const createProfileSchema = z.object({
  full_name: z.string().min(1, "שם מלא הוא שדה חובה"),
  email: z.string().email("כתובת אימייל לא תקינה"),
  phone: z.string().optional().default(''),
  address: z.string().optional().default('')
});

const sendMessageSchema = z.object({
  senderId: z.string().uuid("שולח לא תקין"),
  recipientId: z.string().uuid("מקבל לא תקין"),
  title: z.string().min(1, "נושא הודעה הוא שדה חובה"),
  content: z.string().min(1, "תוכן הודעה הוא שדה חובה"),
  caseId: z.string().uuid().optional()
});

const deleteProfileSchema = z.object({
  userId: z.string().uuid("מזהה משתמש לא תקין")
});

const createDocumentRequestSchema = z.object({
  caseId: z.string().uuid("מזהה תיק לא תקין"),
  requestedTo: z.string().uuid("מזהה משתמש לא תקין"),
  title: z.string().min(1, "כותרת הבקשה היא שדה חובה"),
  description: z.string().optional()
});

const updateDocumentRequestStatusSchema = z.object({
  requestId: z.string().uuid("מזהה בקשה לא תקין"),
  status: z.enum(['pending', 'completed'])
});

const moveDocumentSchema = z.object({
  documentId: z.string().uuid("מזהה מסמך לא תקין"),
  folderType: z.enum(['General', 'Plaintiff_Docs', 'Defendant_Docs'])
});

const uploadCaseDocumentSchema = z.object({
  caseId: z.string().uuid(),
  userId: z.string().uuid(),
  documentType: z.enum(['plaintiff', 'defendant', 'secretariat']),
  fileName: z.string(),
  filePath: z.string(),
  folderType: z.enum(['General', 'Plaintiff_Docs', 'Defendant_Docs']).optional().default('General')
});

// =========================================================================
// מימוש ה-Server Actions
// =========================================================================

export async function createCaseAction(data: z.infer<typeof createCaseSchema>) {
  return safeAction(async () => {
    const validated = createCaseSchema.parse(data);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    
    return await dbSupabaseService.createCase(
      supabase,
      validated.caseNumber,
      validated.title,
      validated.panelId,
      validated.plaintiff,
      validated.defendant
    );
  });
}

export async function scheduleHearingAction(data: z.infer<typeof scheduleHearingSchema>) {
  return safeAction(async () => {
    const validated = scheduleHearingSchema.parse(data);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    return await dbSupabaseService.scheduleHearing(
      supabase,
      validated.caseId,
      validated.panelId,
      validated.dateStr,
      validated.timeStr
    );
  });
}

export async function toggleDocumentShareAction(data: z.infer<typeof toggleDocumentShareSchema>) {
  return safeAction(async () => {
    const validated = toggleDocumentShareSchema.parse(data);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    return await dbSupabaseService.toggleDocumentShare(
      supabase,
      validated.documentId,
      validated.isShared
    );
  });
}

export async function uploadDocumentAction(data: z.infer<typeof uploadDocumentSchema>) {
  return safeAction(async () => {
    const validated = uploadDocumentSchema.parse(data);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    return await dbSupabaseService.uploadDocument(
      supabase,
      validated.hearingId,
      validated.userId,
      validated.documentType as any,
      validated.fileName,
      validated.fileBlobMockUrl,
      validated.folderType
    );
  });
}

export async function uploadCaseDocumentAction(data: z.infer<typeof uploadCaseDocumentSchema>) {
  return safeAction(async () => {
    const validated = uploadCaseDocumentSchema.parse(data);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    return await dbSupabaseService.uploadCaseDocument(
      supabase,
      validated.caseId,
      validated.userId,
      validated.documentType as any,
      validated.fileName,
      validated.filePath,
      validated.folderType
    );
  });
}

export async function updateRequestStatusAction(data: z.infer<typeof updateRequestStatusSchema>) {
  return safeAction(async () => {
    const validated = updateRequestStatusSchema.parse(data);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    return await dbSupabaseService.updateRequestStatus(
      supabase,
      validated.requestId,
      validated.status
    );
  });
}

export async function createPanelAction(data: z.infer<typeof panelSchema>) {
  return safeAction(async () => {
    const validated = panelSchema.parse(data);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    return await dbSupabaseService.createPanel(
      supabase,
      validated.name,
      validated.dayOfWeek
    );
  });
}

export async function updatePanelAction(data: z.infer<typeof updatePanelSchema>) {
  return safeAction(async () => {
    const validated = updatePanelSchema.parse(data);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    return await dbSupabaseService.updatePanel(
      supabase,
      validated.panelId,
      validated.name,
      validated.dayOfWeek
    );
  });
}

export async function submitClientRequestAction(data: z.infer<typeof submitClientRequestSchema>) {
  return safeAction(async () => {
    const validated = submitClientRequestSchema.parse(data);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    return await dbSupabaseService.submitClientRequest(
      supabase,
      validated.caseId,
      validated.hearingId,
      validated.userId,
      validated.requestType,
      validated.title,
      validated.description
    );
  });
}

export async function createProfileAction(data: z.infer<typeof createProfileSchema>) {
  return safeAction(async () => {
    const validated = createProfileSchema.parse(data);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    return await dbSupabaseService.createProfile(supabase, validated);
  });
}

export async function sendMessageAction(data: z.infer<typeof sendMessageSchema>) {
  return safeAction(async () => {
    const validated = sendMessageSchema.parse(data);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    return await dbSupabaseService.sendMessage(
      supabase,
      validated.senderId,
      validated.recipientId,
      validated.title,
      validated.content,
      validated.caseId
    );
  });
}

export async function deleteProfileAction(data: z.infer<typeof deleteProfileSchema>) {
  return safeAction(async () => {
    const validated = deleteProfileSchema.parse(data);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    return await dbSupabaseService.deleteProfile(supabase, validated.userId);
  });
}

export async function createDocumentRequestAction(data: z.infer<typeof createDocumentRequestSchema>) {
  return safeAction(async () => {
    const validated = createDocumentRequestSchema.parse(data);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    return await dbSupabaseService.createDocumentRequest(
      supabase,
      validated.caseId,
      validated.requestedTo,
      validated.title,
      validated.description
    );
  });
}

export async function updateDocumentRequestStatusAction(data: z.infer<typeof updateDocumentRequestStatusSchema>) {
  return safeAction(async () => {
    const validated = updateDocumentRequestStatusSchema.parse(data);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    return await dbSupabaseService.updateDocumentRequestStatus(
      supabase,
      validated.requestId,
      validated.status
    );
  });
}

export async function moveDocumentAction(data: z.infer<typeof moveDocumentSchema>) {
  return safeAction(async () => {
    const validated = moveDocumentSchema.parse(data);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    return await dbSupabaseService.moveDocument(
      supabase,
      validated.documentId,
      validated.folderType
    );
  });
}
