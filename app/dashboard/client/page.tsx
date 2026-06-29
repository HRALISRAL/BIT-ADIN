// app/dashboard/client/page.tsx - אזור אישי מאובטח לתובעים ונתבעים בעיצוב תורני מסורתי

"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Scale, Calendar, FileText, Upload, Plus, AlertCircle, 
  CheckCircle2, Clock, ShieldCheck, ArrowLeft, Send, Download, HelpCircle, Mail
} from "lucide-react";
import { dbService } from "./../../../lib/services/dbService";
import { UserProfile, Case, Hearing, Document, ClientRequest, DocumentType, DirectMessage, DocumentRequest } from "../../../types";
import { isMockMode, supabase } from "./../../../lib/supabase/client";

function ClientDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdQuery = searchParams.get("userId");
  
  // נתוני המשתמש
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [myRequests, setMyRequests] = useState<ClientRequest[]>([]);
  const [myMessages, setMyMessages] = useState<DirectMessage[]>([]);

  // דיון פעיל נבחר לצפייה במסמכים
  const [activeHearing, setActiveHearing] = useState<Hearing | null>(null);
  const [activeHearingDocs, setActiveHearingDocs] = useState<Document[]>([]);
  const [userRoleInActiveCase, setUserRoleInActiveCase] = useState<'plaintiff' | 'defendant' | null>(null);
  const [myDocRequests, setMyDocRequests] = useState<DocumentRequest[]>([]);
  const [activeDocRequest, setActiveDocRequest] = useState<DocumentRequest | null>(null);
  const [showUploadRequestModal, setShowUploadRequestModal] = useState(false);

  // מודלים ומצבי טפסים
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [uploadFileSelectorName, setUploadFileSelectorName] = useState("");
  const [selectedFileObject, setSelectedFileObject] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // שדות טופס שליחת הודעה למזכירות
  const [showSendMessageToSecModal, setShowSendMessageToSecModal] = useState(false);
  const [secMsgTitle, setSecMsgTitle] = useState("");
  const [secMsgContent, setSecMsgContent] = useState("");
  const [secMsgSuccess, setSecMsgSuccess] = useState("");
  const [secMsgError, setSecMsgError] = useState("");
  const [selectedSecCaseId, setSelectedSecCaseId] = useState("");

  // שדות טופס בקשה
  const [reqCaseId, setReqCaseId] = useState("");
  const [reqType, setReqType] = useState<'postpone_hearing' | 'submit_special_document'>('postpone_hearing');
  const [reqTitle, setReqTitle] = useState("");
  const [reqDesc, setReqDesc] = useState("");
  const [reqError, setReqError] = useState("");
  const [reqSuccess, setReqSuccess] = useState("");

  // מודל צפייה בהודעה
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<DirectMessage | null>(null);

  const loadClientData = async (uid: string) => {
    try {
      setLoading(true);
      
      let profile = await dbService.getProfile(uid);
      if (!profile) {
        await new Promise(resolve => setTimeout(resolve, 800));
        profile = await dbService.getProfile(uid);
      }
      if (!profile) {
        router.push("/");
        return;
      }
      setCurrentUser(profile);

      const [allCases, userHearings, allRequests, userMessages, docReqs] = await Promise.all([
        dbService.getCases(),
        dbService.getHearings(uid),
        dbService.getClientRequests(),
        dbService.getMessages(uid),
        dbService.getDocumentRequests(uid)
      ]);

      const myAssociatedCases = allCases.filter(c => 
        c.participants?.some(p => p.user_id === uid)
      );
      setCases(myAssociatedCases);
      setHearings(userHearings);

      const userRequests = allRequests.filter(r => r.user_id === uid);
      setMyRequests(userRequests);
      setMyMessages(userMessages);
      setMyDocRequests(docReqs);

      if (userHearings.length > 0) {
        handleSelectHearing(userHearings[0], myAssociatedCases, uid);
      }
    } catch (err) {
      console.error("Error loading client workspace:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function initClientSession() {
      let uid = userIdQuery;
      
      if (!uid && typeof window !== "undefined") {
        uid = localStorage.getItem("current_user_id");
      }
      
      if (!uid && !isMockMode && supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            uid = user.id;
            localStorage.setItem("current_user_id", user.id);
          }
        } catch (err) {
          console.error("Failed to fetch user session:", err);
        }
      }
      
      if (!uid) {
        router.push("/");
        return;
      }
      
      loadClientData(uid);
    }
    
    initClientSession();
  }, [userIdQuery]);

  const handleSelectHearing = async (hearing: Hearing, currentCases: Case[], uid: string) => {
    setActiveHearing(hearing);
    
    const associatedCase = currentCases.find(c => c.id === hearing.case_id);
    const participant = associatedCase?.participants?.find(p => p.user_id === uid);
    const role = participant?.party_role || null;
    setUserRoleInActiveCase(role);

    try {
      const docs = await dbService.getDocuments(hearing.id, uid, "litigant");
      setActiveHearingDocs(docs);
    } catch (err) {
      console.error("Error loading documents for hearing:", err);
    }
  };

  const handleOpenDocRequestUpload = (req: DocumentRequest) => {
    setActiveDocRequest(req);
    setUploadFileSelectorName("");
    setSelectedFileObject(null);
    setShowUploadRequestModal(true);
  };

  const handleUploadDocRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDocRequest || !currentUser || !uploadFileSelectorName.trim()) return;

    try {
      setUploading(true);
      const caseItem = cases.find(c => c.id === activeDocRequest.case_id);
      if (!caseItem) throw new Error("התיק לא נמצא במערכת.");

      const participant = caseItem.participants?.find(p => p.user_id === currentUser.id);
      const role = participant?.party_role;
      if (!role) throw new Error("אינך משויך לתיק זה כבעל דין.");

      const folderType = role === 'plaintiff' ? 'Plaintiff_Docs' : 'Defendant_Docs';
      const docType = role as DocumentType;

      let filePath = "";
      if (isMockMode || !supabase) {
        filePath = `/mock/client_upload_${Date.now()}_${uploadFileSelectorName}`;
      } else {
        if (!selectedFileObject) {
          throw new Error("נא לבחור קובץ להעלאה מהמחשב.");
        }
        const fileExt = selectedFileObject.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const storagePath = `cases/${activeDocRequest.case_id}/${folderType}/${fileName}`;
        
        const { data: storageData, error: storageErr } = await supabase.storage
          .from('court-documents')
          .upload(storagePath, selectedFileObject);
          
        if (storageErr) throw storageErr;
        filePath = storagePath;
      }
      
      await dbService.uploadCaseDocument(
        activeDocRequest.case_id,
        currentUser.id,
        docType,
        uploadFileSelectorName.trim(),
        filePath,
        folderType
      );

      await dbService.updateDocumentRequestStatus(activeDocRequest.id, 'completed');

      setUploadFileSelectorName("");
      setSelectedFileObject(null);
      setShowUploadRequestModal(false);
      setActiveDocRequest(null);
      loadClientData(currentUser.id);
      alert("הקובץ הועלה בהצלחה לתיקיית " + folderType + " ודרישת המסמך סומנה כהושלמה!");
    } catch (err: any) {
      console.error("Failed to upload file for request:", err);
      alert("שגיאה בהעלאת הקובץ: " + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  const handleUploadDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHearing || !currentUser || !userRoleInActiveCase || !uploadFileSelectorName.trim()) return;

    try {
      setUploading(true);
      
      let filePath = "";
      if (isMockMode || !supabase) {
        filePath = `/mock/client_upload_${Date.now()}_${uploadFileSelectorName}`;
      } else {
        if (!selectedFileObject) {
          throw new Error("נא לבחור קובץ להעלאה מהמחשב.");
        }
        const fileExt = selectedFileObject.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const storagePath = `${currentUser.id}/${fileName}`;
        
        const { data: storageData, error: storageErr } = await supabase.storage
          .from('court-documents')
          .upload(storagePath, selectedFileObject);
          
        if (storageErr) throw storageErr;
        filePath = storagePath;
      }
      
      await dbService.uploadDocument(
        activeHearing.id,
        currentUser.id,
        userRoleInActiveCase as DocumentType,
        uploadFileSelectorName.trim(),
        filePath
      );

      setUploadFileSelectorName("");
      setSelectedFileObject(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      const docs = await dbService.getDocuments(activeHearing.id, currentUser.id, "litigant");
      setActiveHearingDocs(docs);
    } catch (err: any) {
      console.error("Failed to upload file:", err);
      alert("שגיאה בהעלאת הקובץ: " + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessageToSecSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecMsgError("");
    setSecMsgSuccess("");

    if (!secMsgTitle.trim() || !secMsgContent.trim()) {
      setSecMsgError("נא למלא נושא ותוכן הודעה.");
      return;
    }

    try {
      setUploading(true);
      
      let recipientId = "";
      if (isMockMode || !supabase) {
        recipientId = "sec-1";
      } else {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('system_role', 'secretariat')
          .limit(1);
        
        if (!data || data.length === 0) {
          throw new Error("לא נמצא משתמש מזכירות פעיל במערכת למשלוח ההודעה.");
        }
        recipientId = data[0].id;
      }

      await dbService.sendMessage(
        currentUser!.id,
        recipientId,
        secMsgTitle.trim(),
        secMsgContent.trim(),
        selectedSecCaseId ? selectedSecCaseId : undefined
      );

      setSecMsgSuccess("ההודעה נשלחה למזכירות בהצלחה!");
      setSecMsgTitle("");
      setSecMsgContent("");
      setSelectedSecCaseId("");

      setTimeout(() => {
        setShowSendMessageToSecModal(false);
        setSecMsgSuccess("");
        if (currentUser) loadClientData(currentUser.id);
      }, 1500);
    } catch (err: any) {
      console.error("Failed to send message to secretariat:", err);
      setSecMsgError(err.message || "שגיאה בשליחת ההודעה.");
    } finally {
      setUploading(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqError("");
    setReqSuccess("");

    if (!reqCaseId || !reqTitle || !reqDesc) {
      setReqError("אנא מלא את כל שדות החובה.");
      return;
    }

    try {
      if (!currentUser) return;
      await dbService.submitClientRequest(
        reqCaseId,
        activeHearing?.id,
        currentUser.id,
        reqType,
        reqTitle,
        reqDesc
      );

      setReqSuccess("הבקשה הוגשה למזכירות בהצלחה ותיבחן בקרוב!");
      setReqTitle("");
      setReqDesc("");

      const allRequests = await dbService.getClientRequests();
      setMyRequests(allRequests.filter(r => r.user_id === currentUser.id));

      setTimeout(() => {
        setShowRequestModal(false);
        setReqSuccess("");
      }, 1500);
    } catch (err) {
      console.error("Failed to submit request:", err);
      setReqError("שגיאה בהגשת הפנייה.");
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdfaf2] text-[#2d1e10]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#a27b18] border-t-transparent" />
          <span className="text-[#5c4a3c] font-bold">טוען את אזור הלקוח האישי...</span>
        </div>
      </div>
    );
  }

  const nextHearing = hearings[0] || null;

  return (
    <div className="min-h-screen bg-[#fdfaf2] text-[#2d1e10] flex flex-col">
      
      {/* תפריט עליון */}
      <header className="parchment-panel border-b border-[#eadeca] px-6 py-4 sticky top-0 z-30 rounded-none bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8 text-[#8b5a2b]" />
            <div>
              <h1 className="text-lg font-black text-serif text-[#2d1e10]">אזור אישי - בעלי דין</h1>
              <p className="text-xs text-[#5c4a3c] font-medium">שלום, {currentUser.full_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={async () => {
                localStorage.clear();
                if (!isMockMode && supabase) {
                  await supabase.auth.signOut();
                }
                router.push("/");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#faf6ee] border border-[#eadeca] text-[#5c4a3c] hover:bg-[#f3eedf] transition-all cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>יציאה ומעבר משתמש</span>
            </button>
          </div>
        </div>
      </header>

      {/* גוף הדף */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">

        {/* ווידג'ט דרישות מסמכים פתוחות - יוצג בראש הדף אם יש דרישות פתוחות */}
        {myDocRequests.filter(r => r.status === 'pending').length > 0 && (
          <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-serif text-amber-900 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-amber-700 animate-pulse" />
                  <span>ממתינות לך דרישות מסמכים פתוחות מבית הדין</span>
                </h3>
                <p className="text-xs text-amber-800 font-semibold mt-1">
                  המזכירות דורשת ממך להעלות מסמכים מסוימים כדי להמשיך בטיפול בתיק שלך. נא לפעול בהקדם.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myDocRequests.filter(r => r.status === 'pending').map(req => (
                <div key={req.id} className="p-4 rounded-xl bg-white border border-amber-100 flex flex-col justify-between gap-3 text-xs font-semibold shadow-sm hover:border-amber-300 transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[9px] font-bold">דרישת מסמך</span>
                      <span className="text-[10px] text-slate-400 font-medium">תיק: {req.case_number}</span>
                    </div>
                    <h4 className="font-bold text-[#2d1e10] text-sm mt-2 text-serif">{req.title}</h4>
                    {req.description && (
                      <p className="text-[#5c4a3c] text-[11px] font-normal mt-1.5 line-clamp-2">
                        {req.description}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenDocRequestUpload(req)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl gold-button font-bold text-xs cursor-pointer shadow-sm mt-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>העלה מסמכים לתיק {req.case_number}</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 1. כרטיס דיון קרוב והגשת בקשות מהירה */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* א. הדיון הקרוב שלי */}
          <div className="parchment-panel p-6 border-[#eadeca] flex flex-col justify-between torah-card">
            <div>
              <span className="px-3 py-1 rounded-full bg-[#8b5a2b]/10 text-[#8b5a2b] font-bold text-[10px] uppercase tracking-wider">
                הדיון הקרוב ביותר ביומן
              </span>
              
              {nextHearing ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <h2 className="text-xl font-black text-serif text-[#2d1e10] truncate" title={nextHearing.case_title}>{nextHearing.case_title}</h2>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-[#5c4a3c] font-bold">תיק:</span>
                      <span className="bg-[#8b5a2b]/5 px-2.5 py-1 text-xs font-black tracking-wider text-amber-800 border border-[#eadfcd] rounded-lg shadow-sm">
                        {nextHearing.case_number}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#faf6ee]/50 border border-[#eadeca] text-[10px] font-bold">
                    <div>
                      <span className="text-[#5c4a3c] block">תאריך דיון</span>
                      <strong className="text-[#2d1e10] block mt-0.5">
                        {new Date(nextHearing.hearing_date).toLocaleDateString('he-IL', { weekday: 'short', month: 'numeric', day: 'numeric' })}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#5c4a3c] block">שעת התחלה</span>
                      <strong className="text-[#2d1e10] block mt-0.5">{nextHearing.hearing_time}</strong>
                    </div>
                    <div>
                      <span className="text-[#5c4a3c] block">הרכב דיינים</span>
                      <strong className="text-[#2d1e10] block mt-0.5 truncate" title={nextHearing.panel_name}>
                        {nextHearing.panel_name?.split(" ")[0]} {nextHearing.panel_name?.split(" ")[1]}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <Calendar className="h-10 w-10 text-slate-350 stroke-1 mx-auto mb-2" />
                  <p className="text-xs font-medium">אין דיונים משובצים עבורך ביומן.</p>
                </div>
              )}
            </div>

            {nextHearing && (
              <div className="mt-6 pt-4 border-t border-[#eadeca] flex items-center gap-2 text-[10px] text-[#5c4a3c] font-bold">
                <ShieldCheck className="h-4 w-4 text-emerald-700 flex-shrink-0" />
                <span>נא להגיע לאולם כ-15 דקות לפני הזמן.</span>
              </div>
            )}
          </div>

          {/* ב. כלי הגשת פניות מהירה */}
          <div className="parchment-panel p-6 border-[#eadeca] flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-serif text-[#2d1e10]">פניות למזכירות בית הדין</h3>
              <p className="text-xs text-[#5c4a3c] font-medium mt-1">הגשת בקשות לדחיית מועדים או הגשת חומרים מיוחדים.</p>
              
              <div className="mt-4 space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {myRequests.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 font-normal">טרם הגשת בקשות למזכירות.</p>
                ) : (
                  myRequests.slice(0, 3).map(r => (
                    <div key={r.id} className="p-2.5 rounded-lg bg-white border border-[#eadeca] flex items-center justify-between text-[11px] font-medium">
                      <div className="truncate pl-2">
                        <strong className="text-[#2d1e10] block truncate font-bold text-serif" title={r.title}>{r.title}</strong>
                        <span className="text-[10px] text-[#5c4a3c] block mt-0.5">
                          {r.request_type === 'postpone_hearing' ? 'בקשת דחייה' : 'הגשת חומר'}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        r.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-250' :
                        r.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-250'
                      }`}>
                        {r.status === 'pending' ? 'ממתין' :
                         r.status === 'approved' ? 'אושר' : 'נדחה'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => {
                if (cases.length > 0) {
                  setReqCaseId(cases[0].id);
                  setShowRequestModal(true);
                }
              }}
              disabled={cases.length === 0}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-[#eadeca] text-[#5c4a3c] hover:bg-[#faf6ee] hover:text-[#2d1e10] font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>הגש בקשה/פנייה חדשה</span>
            </button>
          </div>

          {/* ג. הודעות מהמזכירות */}
          <div className="parchment-panel p-6 border-[#eadeca] flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-serif text-[#2d1e10] flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#8b5a2b]" />
                <span>הודעות ועדכונים מהמזכירות</span>
              </h3>
              <p className="text-xs text-[#5c4a3c] font-medium mt-1">הודעות אישיות שנשלחו אליך מבית הדין.</p>
              
              <div className="mt-4 space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {myMessages.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 font-normal">אין הודעות חדשות עבורך.</p>
                ) : (
                  myMessages.map(m => (
                    <div 
                      key={m.id} 
                      onClick={() => {
                        setSelectedMsg(m);
                        setShowMsgModal(true);
                      }}
                      className="p-2.5 rounded-lg bg-white border border-[#eadeca] hover:border-[#cda851] transition-all flex items-center justify-between text-[11px] font-medium cursor-pointer"
                    >
                      <div className="truncate pl-2">
                        <strong className="text-[#2d1e10] block truncate font-bold text-serif" title={m.title}>{m.title}</strong>
                        <span className="text-[10px] text-[#5c4a3c] block mt-0.5">
                          {m.case_number ? `תיק ${m.case_number}` : 'הודעה כללית'}
                        </span>
                      </div>
                      <span className="text-[9px] text-[#8b5a2b] font-bold flex-shrink-0">
                        {new Date(m.created_at).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setShowSendMessageToSecModal(true)}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#eadeca] text-[#8b5a2b] hover:bg-[#faf6ee] font-bold text-xs transition-all cursor-pointer"
            >
              <Mail className="h-4 w-4" />
              <span>שלח הודעה חדשה למזכירות</span>
            </button>

            <div className="mt-6 pt-4 border-t border-[#eadeca] text-[10px] text-slate-450 font-normal">
              סה"כ הודעות במערכת: {myMessages.length}
            </div>
          </div>

        </section>

        {/* 2. אזור ניהול חומרים מאובטח (הפרדה קשיחה - Plaintiff/Defendant Isolated Folders) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* א. רשימת הדיונים שלי (לבחירת תיק) */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-serif text-[#2d1e10]">רשימת הדיונים והתיקים שלי</h3>
            <div className="space-y-3">
              {hearings.map(h => {
                const isSelected = activeHearing?.id === h.id;
                const associatedCase = cases.find(c => c.id === h.case_id);
                const participant = associatedCase?.participants?.find(p => p.user_id === currentUser.id);
                
                return (
                  <div
                    key={h.id}
                    onClick={() => handleSelectHearing(h, cases, currentUser.id)}
                    className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-white border-[#cda851] shadow-md shadow-amber-600/5' 
                        : 'parchment-panel border-[#eadeca] hover:border-[#cda851]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="bg-[#8b5a2b]/5 px-2 py-0.5 text-[9px] font-black tracking-wider text-amber-800 border border-[#eadfcd] rounded-lg shadow-sm">
                        {h.case_number}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        participant?.party_role === 'plaintiff' ? 'bg-[#8b5a2b]/15 text-[#8b5a2b]' : 'bg-indigo-750/15 text-indigo-800'
                      }`}>
                        {participant?.party_role === 'plaintiff' ? 'תובע' : 'נתבע'}
                      </span>
                    </div>
                    
                    <h4 className="text-sm font-bold text-[#2d1e10] mt-2 line-clamp-1 text-serif">{h.case_title}</h4>
                    
                    <div className="mt-3 flex items-center justify-between text-xs text-[#5c4a3c] font-medium pt-2 border-t border-[#faf6ee]">
                      <span>{h.hearing_date}</span>
                      <span>שעת דיון: {h.hearing_time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ב. כספת הקבצים המופרדת (Isolated Document Vault) */}
          <div className="lg:col-span-2 parchment-panel p-6 border-[#eadeca] space-y-6">
            
            {activeHearing ? (
              <>
                <div className="border-b border-[#eadeca] pb-4">
                  <h3 className="text-lg font-bold text-serif text-[#2d1e10] flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#8b5a2b]" />
                    <span>תיקיית מסמכים מאובטחת לדיון</span>
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs text-[#5c4a3c] font-bold">דיון בתיק:</span>
                    <span className="bg-[#8b5a2b]/5 px-2 py-0.5 text-[11px] font-black tracking-wider text-amber-800 border border-[#eadfcd] rounded-lg shadow-sm">
                      {activeHearing.case_number}
                    </span>
                    <span className="text-xs text-[#5c4a3c] font-bold mr-2">תפקידך בתיק:</span>
                    <strong className={`text-xs ${
                      userRoleInActiveCase === 'plaintiff' ? 'text-[#a27b18]' : 'text-indigo-800'
                    }`}>{userRoleInActiveCase === 'plaintiff' ? 'תובע' : 'נתבע'}</strong>
                  </div>
                </div>

                {/* 1) מנגנון העלאת מסמך לדיון */}
                <div className="p-4 rounded-xl bg-[#faf6ee]/60 border border-[#eadeca] space-y-4">
                  <div>
                    <h4 className="font-bold text-[#2d1e10] text-xs flex items-center gap-1.5">
                      <Upload className="h-4 w-4 text-[#8b5a2b]" />
                      <span>העלאת מסמך חדש לתיק הדיון</span>
                    </h4>
                    <p className="text-[10px] text-[#5c4a3c] font-medium mt-1">
                      מסמך זה יישמר בתיקיית ה{userRoleInActiveCase === 'plaintiff' ? 'תובע' : 'נתבע'} הפרטית שלך.
                      סגל המזכירות בלבד מורשה לצפות בו. צד הנגד חסום לצפייה במסמך זה, אלא אם המזכירות תאשר שיתוף ידני.
                    </p>
                  </div>

                  <form onSubmit={handleUploadDocumentSubmit} className="space-y-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFileObject(e.target.files[0]);
                          if (!uploadFileSelectorName) {
                            setUploadFileSelectorName(e.target.files[0].name);
                          }
                        }
                      }}
                      className="hidden"
                      id="client-file-upload"
                    />

                    <div className="flex flex-col gap-3">
                      <input
                        type="text"
                        placeholder="כותרת המסמך (לדוגמה: נימוקים נוספים לתביעה)"
                        value={uploadFileSelectorName}
                        onChange={(e) => setUploadFileSelectorName(e.target.value)}
                        className="w-full bg-white border border-[#eadeca] rounded-lg px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] text-xs font-medium"
                        required
                      />

                      <div className="flex gap-2 items-center">
                        <label
                          htmlFor="client-file-upload"
                          className="flex-1 flex items-center justify-center border border-dashed border-[#eadeca] hover:border-[#cda851] rounded-lg p-2.5 bg-white cursor-pointer transition-all gap-1.5 text-[11px] font-bold text-[#5c4a3c] truncate"
                        >
                          <Upload className="h-3.5 w-3.5 text-[#8b5a2b]" />
                          <span className="truncate">
                            {selectedFileObject ? `קובץ: ${selectedFileObject.name}` : "בחר קובץ מהמחשב"}
                          </span>
                        </label>

                        <button
                          type="submit"
                          disabled={uploading || !uploadFileSelectorName.trim() || (!isMockMode && !selectedFileObject)}
                          className="px-5 py-2.5 rounded-lg gold-button font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 text-xs flex-shrink-0"
                        >
                          <span>{uploading ? 'מעלה...' : 'העלה מסמך'}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* 2) תצוגת מסמכים מבוססת הרשאות */}
                <div className="space-y-4 text-xs font-semibold">
                  
                  {/* א. המסמכים שלי (בלעדי לי) */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-[#8b5a2b] border-b border-[#eadeca] pb-1.5 flex items-center gap-1 text-[11px] uppercase tracking-wider text-serif">
                      <FileText className="h-3.5 w-3.5" />
                      <span>מסמכים שהועלו על ידך (תיקייה פרטית)</span>
                    </h4>
                    
                    {activeHearingDocs.filter(d => d.uploaded_by === currentUser.id).length === 0 ? (
                      <p className="text-slate-400 italic py-2 font-normal">טרם העלית מסמכים לדיון זה.</p>
                    ) : (
                      <div className="space-y-2">
                        {activeHearingDocs.filter(d => d.uploaded_by === currentUser.id).map(d => (
                          <div key={d.id} className="p-3 rounded-lg bg-white border border-[#eadeca] flex items-center justify-between gap-3">
                            <div>
                              <strong className="text-[#2d1e10] block text-serif">{d.file_name}</strong>
                              <span className="text-[10px] text-[#5c4a3c] font-medium">
                                הועלה בתאריך: {new Date(d.created_at).toLocaleDateString('he-IL')} | שיתוף: {
                                  d.is_shared 
                                    ? <span className="text-emerald-700 font-bold">משותף עם הצד השני</span> 
                                    : <span className="text-slate-500 font-normal">חסוי לצד השני</span>
                                }
                              </span>
                            </div>
                            <a 
                              href={d.file_path} 
                              download 
                              className="p-2 rounded bg-[#faf6ee] border border-[#eadeca] hover:bg-[#f3eedf] text-[#8b5a2b] transition-all"
                              title="הורד מסמך"
                            >
                              <Download className="h-4.5 w-4.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ב. מסמכים משותפים מהצד השני (חסימה מלאה למעט מאושרים) */}
                  <div className="space-y-2 pt-2">
                    <h4 className="font-bold text-[#8b5a2b] border-b border-[#eadeca] pb-1.5 flex items-center gap-1 text-[11px] uppercase tracking-wider text-serif">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>חומרים משותפים מצד הנגד (באישור המזכירות בלבד)</span>
                    </h4>

                    {activeHearingDocs.filter(d => d.uploaded_by !== currentUser.id && d.document_type !== 'secretariat').length === 0 ? (
                      <div className="p-3 rounded-lg bg-[#faf6ee]/60 border border-[#eadeca] text-[#5c4a3c] flex items-center gap-2 font-medium">
                        <AlertCircle className="h-4 w-4 text-[#a27b18]" />
                        <span>אין מסמכים משותפים מצד הנגד. (חסימת הפרדה קשיחה פעילה)</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {activeHearingDocs.filter(d => d.uploaded_by !== currentUser.id && d.document_type !== 'secretariat').map(d => (
                          <div key={d.id} className="p-3 rounded-lg bg-white border border-[#eadeca] flex items-center justify-between gap-3">
                            <div>
                              <strong className="text-[#2d1e10] block text-serif">{d.file_name}</strong>
                              <span className="text-[10px] text-[#5c4a3c] font-medium">
                                הועלה על ידי צד הנגד | אושר לשיתוף בתיק
                              </span>
                            </div>
                            <a 
                              href={d.file_path} 
                              download 
                              className="p-2 rounded bg-[#faf6ee] border border-[#eadeca] hover:bg-[#f3eedf] text-[#8b5a2b] transition-all"
                              title="הורד מסמך"
                            >
                              <Download className="h-4.5 w-4.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ג. פרוטוקולים והחלטות בית הדין */}
                  <div className="space-y-2 pt-2">
                    <h4 className="font-bold text-[#8b5a2b] border-b border-[#eadeca] pb-1.5 flex items-center gap-1 text-[11px] uppercase tracking-wider text-serif">
                      <Scale className="h-3.5 w-3.5" />
                      <span>החלטות ופרוטוקולים של בית הדין</span>
                    </h4>

                    {activeHearingDocs.filter(d => d.document_type === 'secretariat').length === 0 ? (
                      <p className="text-slate-400 italic py-2 font-normal">טרם ניתנו החלטות/פרוטוקולים בתיק זה.</p>
                    ) : (
                      <div className="space-y-2">
                        {activeHearingDocs.filter(d => d.document_type === 'secretariat').map(d => (
                          <div key={d.id} className="p-3 rounded-lg bg-white border border-[#eadeca] flex items-center justify-between gap-3">
                            <div>
                              <strong className="text-[#2d1e10] block text-serif">{d.file_name}</strong>
                              <span className="text-[10px] text-[#5c4a3c] font-medium">
                                החלטה רשמית של בית הדין האזורי
                              </span>
                            </div>
                            <a 
                              href={d.file_path} 
                              download 
                              className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold hover:bg-emerald-600 hover:text-white transition-all"
                              title="הורד החלטה"
                            >
                              <Download className="h-4.5 w-4.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center">
                <FileText className="h-12 w-12 text-slate-350 mb-3 stroke-1" />
                <p className="text-sm">אנא בחר דיון מהרשימה כדי לצפות בתיקיית המסמכים שלו.</p>
              </div>
            )}

          </div>
        </section>

      </main>

      {/* =========================================================================
          מודל הגשת פנייה חדשה (Client Request Modal)
          ========================================================================= */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="parchment-panel w-full max-w-lg p-6 border-[#eadeca] shadow-2xl animate-in fade-in zoom-in duration-200 torah-card">
            
            <div className="flex items-center justify-between border-b border-[#eadeca] pb-3 mb-5">
              <h3 className="text-lg font-bold text-serif text-[#2d1e10] flex items-center gap-2">
                <Send className="h-5 w-5 text-[#8b5a2b]" />
                <span>הגשת פנייה חדשה למזכירות</span>
              </h3>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setReqError("");
                  setReqSuccess("");
                }}
                className="text-[#5c4a3c] hover:text-[#2d1e10] transition-all text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs font-semibold">
              
              <div>
                <label className="block text-[#2d1e10] mb-1">עבור תיק משפטי:</label>
                <select
                  value={reqCaseId}
                  onChange={(e) => setReqCaseId(e.target.value)}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851]"
                >
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#2d1e10] mb-1">סוג הפנייה:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReqType('postpone_hearing')}
                    className={`py-2 px-3 rounded-lg font-bold border transition-all text-center ${
                      reqType === 'postpone_hearing' 
                        ? 'bg-[#8b5a2b]/10 border-[#8b5a2b] text-[#8b5a2b]' 
                        : 'bg-white border-[#eadeca] text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    בקשה לדחיית דיון
                  </button>
                  <button
                    type="button"
                    onClick={() => setReqType('submit_special_document')}
                    className={`py-2 px-3 rounded-lg font-bold border transition-all text-center ${
                      reqType === 'submit_special_document' 
                        ? 'bg-[#8b5a2b]/10 border-[#8b5a2b] text-[#8b5a2b]' 
                        : 'bg-white border-[#eadeca] text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    הגשת מסמך מיוחד
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#2d1e10] mb-1">נושא הפנייה (כותרת):</label>
                <input
                  type="text"
                  placeholder="לדוגמה: בקשה לדחיית מועד הדיון עקב נסיבות משפחתיות"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[#2d1e10] mb-1">פירוט ונימוקי הבקשה:</label>
                <textarea
                  placeholder="נא לפרט את סיבת הפנייה וצרף מסמכים רלוונטיים באזור ניהול המסמכים במידת הצורך..."
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  rows={4}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium"
                  required
                />
              </div>

              {/* שגיאות או הצלחה */}
              {reqError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{reqError}</span>
                </div>
              )}

              {reqSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>{reqSuccess}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#eadeca] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#faf6ee] border border-[#eadeca] text-[#5c4a3c] hover:bg-[#f3eedf] cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl gold-button font-bold cursor-pointer"
                >
                  שלח פנייה
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* מודל העלאת מסמך בהתאמה לדרישת המזכירות */}
      {showUploadRequestModal && activeDocRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="parchment-panel w-full max-w-md p-6 border-[#eadeca] shadow-2xl animate-in fade-in zoom-in duration-200 torah-card">
            
            <div className="flex items-center justify-between border-b border-[#eadeca] pb-3 mb-5">
              <h3 className="text-lg font-bold text-serif text-[#2d1e10] flex items-center gap-2">
                <Upload className="h-5 w-5 text-[#8b5a2b]" />
                <span>העלאת מסמכים עבור תיק {activeDocRequest.case_number}</span>
              </h3>
              <button
                onClick={() => {
                  setShowUploadRequestModal(false);
                  setActiveDocRequest(null);
                }}
                className="text-[#5c4a3c] hover:text-[#2d1e10] text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/20 border border-amber-250/70 text-[11.5px] text-amber-800 font-bold mb-4 flex items-start gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-amber-800 flex-shrink-0 mt-0.5" />
              <div>
                <span>אתה מעלה מסמכים עבור תיק זה בתור </span>
                <strong className="underline">
                  {cases.find(c => c.id === activeDocRequest.case_id)?.participants?.find(p => p.user_id === currentUser?.id)?.party_role === 'plaintiff' ? 'תובע' : 'נתבע'}
                </strong>
                <span>. המסמך יישמר אוטומטית בתיקייה הרלוונטית לך בתיק.</span>
              </div>
            </div>

            <form onSubmit={handleUploadDocRequestSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[#2d1e10] mb-1">דרישת המקור:</label>
                <div className="p-2.5 rounded-lg bg-[#faf6ee] border border-[#eadeca] text-[#5c4a3c] font-medium text-[11px]">
                  {activeDocRequest.title}
                </div>
              </div>

              <div>
                <label className="block text-[#2d1e10] mb-1">כותרת או שם המסמך להעלאה *:</label>
                <input
                  type="text"
                  placeholder="לדוגמה: תצהיר עדות מטעמי"
                  value={uploadFileSelectorName}
                  onChange={(e) => setUploadFileSelectorName(e.target.value)}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium"
                  required
                />
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFileObject(e.target.files[0]);
                    if (!uploadFileSelectorName) {
                      setUploadFileSelectorName(e.target.files[0].name);
                    }
                  }
                }}
                className="hidden"
                id="request-file-upload"
              />

              <div>
                <label className="block text-[#2d1e10] mb-1">בחר קובץ להעלאה *:</label>
                <label
                  htmlFor="request-file-upload"
                  className="flex items-center justify-center border border-dashed border-[#eadeca] hover:border-[#cda851] rounded-xl p-4 bg-white cursor-pointer transition-all gap-1.5 font-bold text-[#5c4a3c]"
                >
                  <Upload className="h-4 w-4 text-[#8b5a2b]" />
                  <span>
                    {selectedFileObject ? `קובץ: ${selectedFileObject.name}` : "בחר קובץ מהמחשב (PDF/תמונות)"}
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-[#eadeca] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadRequestModal(false);
                    setActiveDocRequest(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#faf6ee] border border-[#eadeca] text-[#5c4a3c] hover:bg-[#f3eedf] cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFileSelectorName.trim() || (!isMockMode && !selectedFileObject)}
                  className="px-5 py-2 rounded-xl gold-button font-bold cursor-pointer disabled:opacity-50"
                >
                  {uploading ? 'מעלה...' : 'העלה מסמך'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* מודל שליחת הודעה חדשה למזכירות */}
      {showSendMessageToSecModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="parchment-panel w-full max-w-md p-6 border-[#eadeca] shadow-2xl animate-in fade-in zoom-in duration-200 torah-card">
            
            <div className="flex items-center justify-between border-b border-[#eadeca] pb-3 mb-5">
              <h3 className="text-lg font-bold text-serif text-[#2d1e10] flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#8b5a2b]" />
                <span>שליחת הודעה למזכירות בית הדין</span>
              </h3>
              <button
                onClick={() => {
                  setShowSendMessageToSecModal(false);
                  setSecMsgError("");
                  setSecMsgSuccess("");
                }}
                className="text-[#5c4a3c] hover:text-[#2d1e10] text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendMessageToSecSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[#2d1e10] mb-1">נושא ההודעה *:</label>
                <input
                  type="text"
                  placeholder="לדוגמה: בקשה לבירור מועד דיון או הגשת חסר"
                  value={secMsgTitle}
                  onChange={(e) => setSecMsgTitle(e.target.value)}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[#2d1e10] mb-1">שיוך לתיק (אופציונלי):</label>
                <select
                  value={selectedSecCaseId}
                  onChange={(e) => setSelectedSecCaseId(e.target.value)}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium"
                >
                  <option value="">ללא שיוך לתיק ספציפי</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>
                      תיק מספר {c.case_number} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#2d1e10] mb-1">תוכן ההודעה *:</label>
                <textarea
                  placeholder="כתוב את הודעתך למזכירות כאן..."
                  value={secMsgContent}
                  onChange={(e) => setSecMsgContent(e.target.value)}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-3 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium h-32 resize-none"
                  required
                />
              </div>

              {/* שגיאות או הצלחה */}
              {secMsgError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{secMsgError}</span>
                </div>
              )}

              {secMsgSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>{secMsgSuccess}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#eadeca] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSendMessageToSecModal(false);
                    setSecMsgError("");
                    setSecMsgSuccess("");
                  }}
                  className="px-4 py-2 rounded-xl bg-[#faf6ee] border border-[#eadeca] text-[#5c4a3c] hover:bg-[#f3eedf] cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl gold-button font-bold cursor-pointer"
                >
                  {uploading ? 'שולח...' : 'שלח הודעה'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* מודל צפייה בהודעה אישית */}
      {showMsgModal && selectedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="parchment-panel w-full max-w-md p-6 border-[#eadeca] shadow-2xl animate-in fade-in zoom-in duration-200 torah-card">
            
            <div className="flex items-center justify-between border-b border-[#eadeca] pb-3 mb-5">
              <h3 className="text-lg font-bold text-serif text-[#2d1e10] flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#8b5a2b]" />
                <span>הודעה מ{selectedMsg.sender_name || 'מזכירות בית הדין'}</span>
              </h3>
              <button
                onClick={() => {
                  setShowMsgModal(false);
                  setSelectedMsg(null);
                }}
                className="text-[#5c4a3c] hover:text-[#2d1e10] text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div>
                <span className="text-[#5c4a3c] block text-[10px]">נושא ההודעה:</span>
                <strong className="text-[#2d1e10] text-sm block mt-0.5 text-serif">{selectedMsg.title}</strong>
              </div>

              {selectedMsg.case_number && (
                <div>
                  <span className="text-[#5c4a3c] block text-[10px]">שיוך לתיק:</span>
                  <span className="bg-[#8b5a2b]/5 px-2 py-0.5 text-[11px] font-black tracking-wider text-amber-800 border border-[#eadfcd] rounded-lg shadow-sm inline-block mt-1">
                    {selectedMsg.case_number}
                  </span>
                </div>
              )}

              <div>
                <span className="text-[#5c4a3c] block text-[10px]">נשלח בתאריך:</span>
                <span className="text-[#2d1e10] block mt-0.5">{new Date(selectedMsg.created_at).toLocaleDateString('he-IL')}</span>
              </div>

              <div>
                <span className="text-[#5c4a3c] block text-[10px] mb-1">תוכן ההודעה:</span>
                <div className="p-3 bg-[#faf6ee]/50 border border-[#eadeca] rounded-xl text-[#2d1e10] font-medium whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {selectedMsg.content}
                </div>
              </div>

              <div className="pt-3 border-t border-[#eadeca] flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowMsgModal(false);
                    setSelectedMsg(null);
                  }}
                  className="px-5 py-2 rounded-xl gold-button font-bold cursor-pointer"
                >
                  סגור הודעה
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ClientDashboard() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#fdfaf2] text-[#2d1e10]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#a27b18] border-t-transparent" />
          <span className="text-[#5c4a3c] font-bold">טוען את אזור הלקוח האישי...</span>
        </div>
      </div>
    }>
      <ClientDashboardContent />
    </Suspense>
  );
}
