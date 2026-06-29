// app/dashboard/secretariat/page.tsx - לוח הבקרה של המזכירות בעיצוב תורני משופר עם לשוניות וניהול מורחב

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Scale, Calendar, FileText, CheckCircle2, XCircle, Clock, 
  Plus, Eye, Share2, ToggleLeft, ToggleRight, ArrowLeft,
  Users, Inbox, Download, Upload, AlertCircle, Search, Edit, FolderPlus, Settings, Mail
} from "lucide-react";
import { dbService } from "./../../../lib/services/dbService";
import { Panel, Case, Hearing, Document, ClientRequest, UserProfile, PartyRole, DocumentRequest } from "../../../types";
import { isMockMode, supabase } from "./../../../lib/supabase/client";

export default function SecretariatDashboard() {
  const router = useRouter();
  
  // נתוני המערכת
  const [panels, setPanels] = useState<Panel[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [courtName, setCourtName] = useState("בית הדין הרבני האזורי ירושלים");
  
  // לשונית פעילה (calendar | cases | panels | requests | clients)
  const [activeTab, setActiveTab] = useState<"calendar" | "cases" | "panels" | "requests" | "clients">("calendar");

  // מודל הוספת לקוח
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [clientFormName, setClientFormName] = useState("");
  const [clientFormEmail, setClientFormEmail] = useState("");
  const [clientFormPhone, setClientFormPhone] = useState("");
  const [clientFormAddress, setClientFormAddress] = useState("");
  const [clientError, setClientError] = useState("");
  const [clientSuccess, setClientSuccess] = useState("");

  // מודל שליחת הודעה
  const [showSendMessageModal, setShowSendMessageModal] = useState(false);
  const [msgRecipient, setMsgRecipient] = useState<UserProfile | null>(null);
  const [msgTitle, setMsgTitle] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [msgCaseId, setMsgCaseId] = useState("");
  const [msgError, setMsgError] = useState("");
  const [msgSuccess, setMsgSuccess] = useState("");

  // מצבי ממשק (Modals & State)
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState<Hearing | null>(null);
  const [hearingDocs, setHearingDocs] = useState<Document[]>([]);
  
  // חיפוש תיקים
  const [caseSearchQuery, setCaseSearchQuery] = useState("");

  // מודל יצירת תיק
  const [showCreateCaseModal, setShowCreateCaseModal] = useState(false);
  const [newCaseNumber, setNewCaseNumber] = useState("");
  const [newCaseTitle, setNewCaseTitle] = useState("");
  const [newCasePanelId, setNewCasePanelId] = useState("");
  const [newCasePName, setNewCasePName] = useState("");
  const [newCasePEmail, setNewCasePEmail] = useState("");
  const [newCasePPhone, setNewCasePPhone] = useState("");
  const [newCasePAddress, setNewCasePAddress] = useState("");
  const [newCaseDName, setNewCaseDName] = useState("");
  const [newCaseDEmail, setNewCaseDEmail] = useState("");
  const [newCaseDPhone, setNewCaseDPhone] = useState("");
  const [newCaseDAddress, setNewCaseDAddress] = useState("");
  const [createCaseError, setCreateCaseError] = useState("");
  const [createCaseSuccess, setCreateCaseSuccess] = useState("");
  const [newCaseFiles, setNewCaseFiles] = useState<File[]>([]);

  // מודל ניהול הרכבים
  const [showPanelModal, setShowPanelModal] = useState(false);
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null);
  const [panelFormName, setPanelFormName] = useState("");
  const [panelFormDay, setPanelFormDay] = useState(1);
  const [panelError, setPanelError] = useState("");
  const [panelSuccess, setPanelSuccess] = useState("");

  // דרישת מסמכים ומסמכי תיק
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showDocRequestModal, setShowDocRequestModal] = useState(false);
  const [docRequestCase, setDocRequestCase] = useState<Case | null>(null);
  const [docRequestTo, setDocRequestTo] = useState("");
  const [docRequestTitle, setDocRequestTitle] = useState("");
  const [docRequestDesc, setDocRequestDesc] = useState("");
  const [docRequestError, setDocRequestError] = useState("");
  const [docRequestSuccess, setDocRequestSuccess] = useState("");
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>([]);
  const [uploadFolderType, setUploadFolderType] = useState<'General' | 'Plaintiff_Docs' | 'Defendant_Docs'>('General');

  // הגדרות בית הדין
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsCourtName, setSettingsCourtName] = useState("");

  // מודל לוח שנה כללי לכל הדיונים
  const [showFullCalendarModal, setShowFullCalendarModal] = useState(false);
  const [calendarMonthDate, setCalendarMonthDate] = useState<Date>(new Date());

  // שדות טופס שיבוץ דיון
  const [scheduleCaseId, setScheduleCaseId] = useState("");
  const [schedulePanelId, setSchedulePanelId] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleSuccess, setScheduleSuccess] = useState("");

  // שדות העלאת קובץ
  const [uploadFileName, setUploadFileName] = useState("");
  const [selectedFileObject, setSelectedFileObject] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // טעינת נתונים
  const loadData = async () => {
    try {
      setLoading(true);
      const [pData, cData, hData, rData, profsData, docReqsData] = await Promise.all([
        dbService.getPanels(),
        dbService.getCases(),
        dbService.getHearings(),
        dbService.getClientRequests(),
        dbService.getProfiles(),
        dbService.getDocumentRequests()
      ]);
      setPanels(pData);
      setCases(cData);
      setHearings(hData);
      setRequests(rData);
      setProfiles(profsData);
      setDocumentRequests(docReqsData);
      setCourtName(dbService.getBetDinName());
      setSettingsCourtName(dbService.getBetDinName());
      
      if (cData.length > 0) setScheduleCaseId(cData[0].id);
      if (pData.length > 0) setSchedulePanelId(pData[0].id);
    } catch (err) {
      console.error("Error loading secretariat data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function verifySession() {
      if (isMockMode || !supabase) {
        const role = localStorage.getItem("current_user_role");
        if (role !== "secretariat") {
          router.push("/");
          return;
        }
        loadData();
      } else {
        try {
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error || !user) {
            console.error("No active auth user found in secretariat dashboard:", error);
            router.push("/");
            return;
          }
          let profile = await dbService.getProfile(user.id);
          if (!profile) {
            await new Promise(resolve => setTimeout(resolve, 800));
            profile = await dbService.getProfile(user.id);
          }
          if (!profile || profile.system_role !== "secretariat") {
            console.error("User does not have secretariat role:", profile);
            router.push("/");
            return;
          }
          // סנכרון ל-localStorage לטובת שאר חלקי הקליינט
          localStorage.setItem("current_user_id", user.id);
          localStorage.setItem("current_user_role", profile.system_role);
          loadData();
        } catch (err) {
          console.error("Session verification failed:", err);
          router.push("/");
        }
      }
    }
    verifySession();
  }, []);

  // משיכת מספר סידורי אוטומטי בעת פתיחת מודל יצירת תיק
  const handleOpenCreateCase = async () => {
    setShowCreateCaseModal(true);
    setCreateCaseError("");
    setCreateCaseSuccess("");
    setNewCasePName("");
    setNewCasePEmail("");
    setNewCasePPhone("");
    setNewCasePAddress("");
    setNewCaseDName("");
    setNewCaseDEmail("");
    setNewCaseDPhone("");
    setNewCaseDAddress("");
    try {
      const nextSerial = await dbService.getNextCaseSerialNumber();
      setNewCaseNumber(nextSerial);
      if (panels.length > 0) setNewCasePanelId(panels[0].id);
    } catch (err) {
      console.error("Failed to fetch next case number:", err);
    }
  };

  // שמירת תיק חדש
  const handleCreateCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateCaseError("");
    setCreateCaseSuccess("");

    if (!newCaseNumber.trim() || !newCaseTitle.trim() || !newCasePanelId || 
        !newCasePName.trim() || !newCasePEmail.trim()) {
      setCreateCaseError("נא למלא את שדות החובה (שם ומייל לתובע, מספר תיק ונושא).");
      return;
    }

    if (newCaseDEmail.trim() && !newCaseDName.trim()) {
      setCreateCaseError("נא למלא את שם הנתבע אם הזנת כתובת מייל עבורו.");
      return;
    }

    if (newCaseDEmail.trim() && newCasePEmail.trim().toLowerCase() === newCaseDEmail.trim().toLowerCase()) {
      setCreateCaseError("כתובת המייל של התובע והנתבע אינה יכולה להיות זהה.");
      return;
    }

    try {
      const createdCase = await dbService.createCase(
        newCaseNumber.trim(),
        newCaseTitle.trim(),
        newCasePanelId,
        {
          full_name: newCasePName.trim(),
          email: newCasePEmail.trim(),
          phone: newCasePPhone.trim(),
          address: newCasePAddress.trim()
        },
        newCaseDEmail.trim() ? {
          full_name: newCaseDName.trim(),
          email: newCaseDEmail.trim(),
          phone: newCaseDPhone.trim(),
          address: newCaseDAddress.trim()
        } : undefined
      );

      // העלאת מסמכים ראשוניים לתיק במידה ונבחרו
      if (newCaseFiles.length > 0) {
        const uploaderId = localStorage.getItem("current_user_id") || "";
        for (const file of newCaseFiles) {
          let filePath = "";
          if (isMockMode || !supabase) {
            filePath = `/mock/secretariat_case_upload_${Date.now()}_${file.name}`;
          } else {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
            const storagePath = `secretariat/${fileName}`;
            
            const { data: storageData, error: storageErr } = await supabase.storage
              .from('court-documents')
              .upload(storagePath, file);
              
            if (storageErr) throw storageErr;
            filePath = storagePath;
          }

          await dbService.uploadCaseDocument(
            createdCase.id,
            uploaderId,
            'secretariat',
            file.name,
            filePath
          );
        }
      }

      setCreateCaseSuccess("התיק נפתח ונרשם במערכת בהצלחה!");
      setNewCaseTitle("");
      setNewCasePName("");
      setNewCasePEmail("");
      setNewCasePPhone("");
      setNewCasePAddress("");
      setNewCaseDName("");
      setNewCaseDEmail("");
      setNewCaseDPhone("");
      setNewCaseDAddress("");
      setNewCaseFiles([]);
      await loadData();

      setTimeout(() => {
        setShowCreateCaseModal(false);
        setCreateCaseSuccess("");
      }, 1500);
    } catch (err: any) {
      setCreateCaseError(err.message || "שגיאה בפתיחת התיק.");
    }
  };

  const handleCreateClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError("");
    setClientSuccess("");

    if (!clientFormName.trim() || !clientFormEmail.trim()) {
      setClientError("נא למלא שם מלא וכתובת אימייל.");
      return;
    }

    try {
      await dbService.createProfile({
        full_name: clientFormName.trim(),
        email: clientFormEmail.trim(),
        phone: clientFormPhone.trim(),
        address: clientFormAddress.trim()
      });

      setClientSuccess("הלקוח נוסף למערכת בהצלחה!");
      setClientFormName("");
      setClientFormEmail("");
      setClientFormPhone("");
      setClientFormAddress("");
      
      await loadData();

      setTimeout(() => {
        setShowCreateClientModal(false);
        setClientSuccess("");
      }, 1500);
    } catch (err: any) {
      setClientError(err.message || "שגיאה בהוספת הלקוח.");
    }
  };

  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgError("");
    setMsgSuccess("");

    if (!msgRecipient) return;
    if (!msgTitle.trim() || !msgContent.trim()) {
      setMsgError("נא למלא נושא ותוכן הודעה.");
      return;
    }

    try {
      const senderId = localStorage.getItem("current_user_id") || "";
      if (!senderId) {
        setMsgError("לא נמצא מזהה שולח (המזכירות). התחבר מחדש.");
        return;
      }

      await dbService.sendMessage(
        senderId,
        msgRecipient.id,
        msgTitle.trim(),
        msgContent.trim(),
        msgCaseId ? msgCaseId : undefined
      );

      setMsgSuccess("ההודעה נשלחה בהצלחה!");
      setMsgTitle("");
      setMsgContent("");
      setMsgCaseId("");

      setTimeout(() => {
        setShowSendMessageModal(false);
        setMsgRecipient(null);
        setMsgSuccess("");
      }, 1500);
    } catch (err: any) {
      setMsgError(err.message || "שגיאה בשליחת ההודעה.");
    }
  };

  // פתיחת מודל הרכב (ליצירה או עריכה)
  const handleOpenPanelModal = (panel?: Panel) => {
    setPanelError("");
    setPanelSuccess("");
    if (panel) {
      setEditingPanelId(panel.id);
      setPanelFormName(panel.name);
      setPanelFormDay(panel.day_of_week);
    } else {
      setEditingPanelId(null);
      setPanelFormName("");
      setPanelFormDay(1);
    }
    setShowPanelModal(true);
  };

  // שמירת הרכב (חדש או ערוך)
  const handlePanelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPanelError("");
    setPanelSuccess("");

    if (!panelFormName.trim() || !panelFormDay) {
      setPanelError("נא למלא את כל השדות.");
      return;
    }

    try {
      if (editingPanelId) {
        await dbService.updatePanel(editingPanelId, panelFormName.trim(), panelFormDay);
        setPanelSuccess("הרכב הדיינים עודכן בהצלחה!");
      } else {
        await dbService.createPanel(panelFormName.trim(), panelFormDay);
        setPanelSuccess("הרכב דיינים חדש נוסף למערכת!");
      }

      await loadData();
      setTimeout(() => {
        setShowPanelModal(false);
        setPanelSuccess("");
      }, 1500);
    } catch (err: any) {
      setPanelError(err.message || "שגיאה בשמירת ההרכב.");
    }
  };

  // שמירת הגדרות בית הדין
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsCourtName.trim()) return;
    dbService.setBetDinName(settingsCourtName.trim());
    setCourtName(settingsCourtName.trim());
    setShowSettingsModal(false);
  };

  const handleOpenCaseDocs = async (caseItem: Case) => {
    setSelectedCase(caseItem);
    setSelectedHearing(null);
    setShowDocModal(true);
    try {
      const docs = await dbService.getCaseDocuments(caseItem.id);
      setHearingDocs(docs);
    } catch (err) {
      console.error("Error loading case documents:", err);
    }
  };

  const handleOpenDocRequest = (caseItem: Case) => {
    setDocRequestCase(caseItem);
    setDocRequestTitle("");
    setDocRequestDesc("");
    setDocRequestError("");
    setDocRequestSuccess("");
    const plaintiff = caseItem.participants?.find(p => p.party_role === 'plaintiff');
    if (plaintiff) {
      setDocRequestTo(plaintiff.user_id);
    } else {
      setDocRequestTo("");
    }
    setShowDocRequestModal(true);
  };

  const handleDocRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docRequestCase || !docRequestTo || !docRequestTitle.trim()) {
      setDocRequestError("אנא מלא את כל השדות החובה");
      return;
    }
    try {
      setDocRequestError("");
      setDocRequestSuccess("");
      await dbService.createDocumentRequest(
        docRequestCase.id,
        docRequestTo,
        docRequestTitle.trim(),
        docRequestDesc.trim() || undefined
      );
      setDocRequestSuccess("דרישת המסמך נשלחה בהצלחה והופיעה באזור האישי של המשתמש");
      setTimeout(() => {
        setShowDocRequestModal(false);
        loadData();
      }, 1500);
    } catch (err: any) {
      setDocRequestError("שגיאה בשליחת דרישת המסמך: " + err.message);
    }
  };

  const handleMoveDoc = async (docId: string, folderType: 'General' | 'Plaintiff_Docs' | 'Defendant_Docs') => {
    try {
      await dbService.moveDocument(docId, folderType);
      if (selectedCase) {
        const docs = await dbService.getCaseDocuments(selectedCase.id);
        setHearingDocs(docs);
      } else if (selectedHearing) {
        const docs = await dbService.getDocuments(selectedHearing.id, "sec-1", "secretariat");
        setHearingDocs(docs);
      }
    } catch (err) {
      console.error("Error moving document:", err);
    }
  };

  const handleOpenDocs = async (hearing: Hearing) => {
    setSelectedHearing(hearing);
    setSelectedCase(null);
    setShowDocModal(true);
    try {
      const docs = await dbService.getDocuments(hearing.id, "sec-1", "secretariat");
      setHearingDocs(docs);
    } catch (err) {
      console.error("Error loading documents:", err);
    }
  };

  const handleToggleShare = async (docId: string, currentShared: boolean) => {
    try {
      await dbService.toggleDocumentShare(docId, !currentShared);
      if (selectedHearing) {
        const docs = await dbService.getDocuments(selectedHearing.id, "sec-1", "secretariat");
        setHearingDocs(docs);
      }
    } catch (err) {
      console.error("Error toggling share:", err);
    }
  };

  const handleSecUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!selectedHearing && !selectedCase) || !uploadFileName.trim()) return;
    
    try {
      setUploading(true);
      
      const uId = (typeof window !== "undefined" && localStorage.getItem("current_user_id")) || "sec-1";
      let filePath = "";
      if (isMockMode || !supabase) {
        filePath = `/mock/sec_upload_${Date.now()}_${uploadFileName}`;
      } else {
        if (!selectedFileObject) {
          throw new Error("נא לבחור קובץ להעלאה מהמחשב.");
        }
        const fileExt = selectedFileObject.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const activeCaseId = selectedCase ? selectedCase.id : selectedHearing!.case_id;
        const storagePath = `cases/${activeCaseId}/${uploadFolderType}/${fileName}`;
        
        const { data: storageData, error: storageErr } = await supabase.storage
          .from('court-documents')
          .upload(storagePath, selectedFileObject);
          
        if (storageErr) throw storageErr;
        filePath = storagePath;
      }
      
      if (selectedHearing) {
        await dbService.uploadDocument(
          selectedHearing.id,
          uId,
          "secretariat",
          uploadFileName.trim(),
          filePath,
          uploadFolderType
        );
        const docs = await dbService.getDocuments(selectedHearing.id, uId, "secretariat");
        setHearingDocs(docs);
      } else if (selectedCase) {
        await dbService.uploadCaseDocument(
          selectedCase.id,
          uId,
          "secretariat",
          uploadFileName.trim(),
          filePath,
          uploadFolderType
        );
        const docs = await dbService.getCaseDocuments(selectedCase.id);
        setHearingDocs(docs);
      }
      
      setUploadFileName("");
      setSelectedFileObject(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Failed to upload document:", err);
      alert("שגיאה בהעלאת הקובץ: " + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  const handleRequestStatus = async (reqId: string, status: "approved" | "rejected") => {
    try {
      await dbService.updateRequestStatus(reqId, status);
      await loadData();
    } catch (err) {
      console.error("Failed to update request:", err);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError("");
    setScheduleSuccess("");

    if (!scheduleCaseId || !schedulePanelId || !scheduleDate || !scheduleTime) {
      setScheduleError("נא למלא את כל השדות.");
      return;
    }

    try {
      await dbService.scheduleHearing(scheduleCaseId, schedulePanelId, scheduleDate, scheduleTime);
      setScheduleSuccess("הדיון שובץ בהצלחה ביומן!");
      
      setScheduleDate("");
      setScheduleTime("");
      await loadData();
      
      setTimeout(() => {
        setShowScheduleModal(false);
        setScheduleSuccess("");
      }, 1500);
    } catch (err: any) {
      setScheduleError(err.message || "שגיאה בשיבוץ הדיון.");
    }
  };

  const isDateInCurrentWeek = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    
    // Get Sunday of current week
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get Saturday of current week (end of week)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return date >= startOfWeek && date <= endOfWeek;
  };

  const getHearingsByDay = (dayOfWeek: number) => {
    return hearings.filter(h => {
      const panel = panels.find(p => p.id === h.panel_id);
      return panel?.day_of_week === dayOfWeek && isDateInCurrentWeek(h.hearing_date);
    });
  };

  const hebrewMonths = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayIndex = firstDay.getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < startDayIndex; i++) {
      days.push(null);
    }
    for (let day = 1; day <= totalDays; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const getHearingsForDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const localDateStr = `${y}-${m}-${d}`;
    return hearings.filter(h => h.hearing_date === localDateStr);
  };

  // סינון תיקים דינמי לפי חיפוש (שם התיק, מספר סידורי או שם בעלי דין)
  const filteredCases = cases.filter(c => {
    const query = caseSearchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      c.case_number.toLowerCase().includes(query) ||
      c.title.toLowerCase().includes(query) ||
      c.participants?.some(p => p.full_name.toLowerCase().includes(query))
    );
  });

  const litigants = profiles.filter(p => p.system_role === 'litigant');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdfaf2] text-[#2d1e10]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#a27b18] border-t-transparent" />
          <span className="text-[#5c4a3c] font-bold">טוען את ממשק המזכירות...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfaf2] text-[#2d1e10] flex flex-col">
      
      {/* תפריט עליון (Navbar) */}
      <header className="parchment-panel border-b border-[#eadeca] px-6 py-4 sticky top-0 z-30 rounded-none bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8 text-[#8b5a2b]" />
            <div>
              <h1 className="text-xl font-black text-serif text-[#2d1e10]">{courtName}</h1>
              <p className="text-xs text-[#5c4a3c] font-medium">ממשק ניהול ומזכירות בית הדין</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2.5 rounded-xl bg-[#faf6ee] hover:bg-[#f3eedf] border border-[#eadeca] text-[#5c4a3c] transition-all cursor-pointer"
              title="הגדרות בית הדין"
            >
              <Settings className="h-4 w-4" />
            </button>
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
              <span>יציאה ומעבר משתמשים</span>
            </button>
          </div>
        </div>
      </header>

      {/* אזור תוכן ראשי */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        
        {/* קוביות סטטיסטיקה עליונות */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="parchment-panel p-6 border-[#eadeca] flex items-center justify-between">
            <div>
              <p className="text-xs text-[#5c4a3c] font-bold">תיקים פעילים בבית הדין</p>
              <h3 className="text-3xl font-black text-serif text-[#2d1e10] mt-1">{cases.filter(c => c.status !== 'closed').length}</h3>
            </div>
            <div className="p-3 bg-[#8b5a2b]/10 text-[#8b5a2b] rounded-xl"><FileText className="h-6 w-6" /></div>
          </div>
          
          <div 
            onClick={() => setShowFullCalendarModal(true)}
            className="parchment-panel p-6 border-[#eadeca] flex items-center justify-between cursor-pointer hover:border-[#cda851] hover:shadow-md transition-all group"
          >
            <div>
              <p className="text-xs text-[#5c4a3c] font-bold group-hover:text-[#a27b18] transition-colors">דיונים משובצים</p>
              <h3 className="text-3xl font-black text-serif text-[#2d1e10] mt-1">{hearings.length}</h3>
            </div>
            <div className="p-3 bg-[#a27b18]/10 text-[#a27b18] group-hover:bg-[#a27b18]/20 rounded-xl transition-all">
              <Calendar className="h-6 w-6" />
            </div>
          </div>

          <div className="parchment-panel p-6 border-[#eadeca] flex items-center justify-between">
            <div>
              <p className="text-xs text-[#5c4a3c] font-bold">פניות ממתינות לאישור</p>
              <h3 className="text-3xl font-black text-serif text-[#2d1e10] mt-1">{requests.filter(r => r.status === 'pending').length}</h3>
            </div>
            <div className="p-3 bg-amber-600/10 text-amber-800 rounded-xl"><Inbox className="h-6 w-6" /></div>
          </div>

          <div className="parchment-panel p-6 border-[#eadeca] flex items-center justify-between">
            <div>
              <p className="text-xs text-[#5c4a3c] font-bold">הרכבי דיינים קבועים</p>
              <h3 className="text-3xl font-black text-serif text-[#2d1e10] mt-1">{panels.length}</h3>
            </div>
            <div className="p-3 bg-emerald-700/10 text-emerald-800 rounded-xl"><Users className="h-6 w-6" /></div>
          </div>
        </section>

        {/* לשוניות ניווט (Tabs System) */}
        <section className="border-b border-[#eadeca] flex gap-4 text-sm font-bold pb-px">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer ${
              activeTab === "calendar" 
                ? "border-[#a27b18] text-[#a27b18]" 
                : "border-transparent text-[#5c4a3c] hover:text-[#2d1e10]"
            }`}
          >
            יומן ושיבוץ דיונים
          </button>
          
          <button
            onClick={() => setActiveTab("cases")}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer ${
              activeTab === "cases" 
                ? "border-[#a27b18] text-[#a27b18]" 
                : "border-transparent text-[#5c4a3c] hover:text-[#2d1e10]"
            }`}
          >
            ניהול תיקים
          </button>

          <button
            onClick={() => setActiveTab("panels")}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer ${
              activeTab === "panels" 
                ? "border-[#a27b18] text-[#a27b18]" 
                : "border-transparent text-[#5c4a3c] hover:text-[#2d1e10]"
            }`}
          >
            ניהול הרכבי דיינים
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "requests" 
                ? "border-[#a27b18] text-[#a27b18]" 
                : "border-transparent text-[#5c4a3c] hover:text-[#2d1e10]"
            }`}
          >
            <span>בקשות ופניות לקוחות</span>
            {requests.filter(r => r.status === 'pending').length > 0 && (
              <span className="bg-amber-600 text-white rounded-full px-2 py-0.5 text-[10px] font-bold">
                {requests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("clients")}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "clients" 
                ? "border-[#a27b18] text-[#a27b18]" 
                : "border-transparent text-[#5c4a3c] hover:text-[#2d1e10]"
            }`}
          >
            <span>ניהול לקוחות</span>
          </button>
        </section>

        {/* תוכן הלשונית: 1) יומן ושיבוץ */}
        {activeTab === "calendar" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-serif text-[#2d1e10]">יומן דיונים שבועי</h2>
                <p className="text-xs text-[#5c4a3c] font-medium">שיבוץ דיונים שבועי לפי ימי הפעילות של הרכבי הדיינים</p>
              </div>
              
              <button
                onClick={() => setShowScheduleModal(true)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl gold-button font-bold text-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>שיבוץ דיון חדש</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map((dayNum) => {
                const dayHearings = getHearingsByDay(dayNum);
                const panel = panels.find(p => p.day_of_week === dayNum);
                
                return (
                  <div key={dayNum} className="parchment-panel border-[#eadeca] flex flex-col min-h-[380px] torah-card">
                    <div className="p-4 border-b border-[#eadeca] bg-[#faf6ee]/60 rounded-t-2xl">
                      <span className="text-[10px] font-bold text-[#a27b18] uppercase tracking-wider block">
                        יום {dbService.getDayName(dayNum)}
                      </span>
                      <h4 className="text-sm font-bold text-[#2d1e10] truncate mt-0.5" title={panel?.name}>
                        {panel ? panel.name.split(" ")[0] + " " + panel.name.split(" ")[1] : "אין הרכב"}
                      </h4>
                      <p className="text-[10px] text-[#5c4a3c] font-medium truncate mt-0.5">
                        {panel ? panel.name.split("(")[1]?.replace(")", "") : "יום פנוי"}
                      </p>
                    </div>

                    <div className="p-3 flex-1 space-y-3 overflow-y-auto max-h-[400px]">
                      {dayHearings.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center py-8 text-center text-slate-400">
                          <Clock className="h-8 w-8 stroke-1 mb-2 text-slate-350" />
                          <span className="text-[11px] font-medium text-slate-455">אין דיונים</span>
                        </div>
                      ) : (
                        dayHearings.map(h => (
                          <div 
                            key={h.id} 
                            className="p-3 rounded-xl bg-white border border-[#eadeca] hover:border-[#cda851] transition-all text-xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#2d1e10]">{h.hearing_time}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                h.status === 'scheduled' ? 'bg-[#8b5a2b]/10 text-[#8b5a2b]' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {h.status === 'scheduled' ? 'מתוכנן' : 'הושלם'}
                              </span>
                            </div>
                            
                            <div>
                              <h5 className="font-bold text-[#2d1e10] line-clamp-1 text-serif">{h.case_title}</h5>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[10px] text-[#5c4a3c] font-bold">תיק:</span>
                                <span className="bg-[#8b5a2b]/5 px-2 py-0.5 text-[10px] font-black tracking-wider text-amber-800 border border-[#eadfcd] rounded-lg shadow-sm">
                                  {h.case_number}
                                </span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-[#faf6ee] flex items-center justify-between">
                              <button
                                onClick={() => handleOpenDocs(h)}
                                className="w-full inline-flex items-center justify-center gap-1 py-1 rounded bg-[#faf6ee] hover:bg-[#f3eedf] text-[10px] text-[#8b5a2b] font-bold border border-[#eadeca] transition-all cursor-pointer"
                              >
                                <FileText className="h-3 w-3" />
                                <span>ניהול מסמכים</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* לשונית: 2) ניהול תיקים עם איתור לפי שם ומספר סידורי */}
        {activeTab === "cases" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-serif text-[#2d1e10]">ניהול ואיתור תיקים משפטיים</h2>
                <p className="text-xs text-[#5c4a3c] font-medium">ניהול רשימת התיקים, הקצאת מספרים סידוריים ופתיחת תיקים חדשים</p>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {/* תיבת חיפוש תיקים */}
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b5a2b]" />
                  <input
                    type="text"
                    placeholder="חפש לפי שם תיק, מספר, תובע/נתבע..."
                    value={caseSearchQuery}
                    onChange={(e) => setCaseSearchQuery(e.target.value)}
                    className="bg-white border border-[#eadeca] rounded-xl pr-9 pl-4 py-2.5 text-xs text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] w-72 font-medium"
                  />
                </div>

                <button
                  onClick={handleOpenCreateCase}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gold-button font-bold text-xs hover:opacity-95 cursor-pointer shadow-sm"
                >
                  <FolderPlus className="h-4 w-4" />
                  <span>פתח תיק חדש</span>
                </button>
              </div>
            </div>

            {/* טבלת התיקים */}
            <div className="parchment-panel border-[#eadeca] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#faf6ee] text-[#2d1e10] font-bold border-b border-[#eadeca]">
                    <tr>
                      <th className="p-4 w-24">מספר סידורי</th>
                      <th className="p-4">שם התיק / נושא הדיון</th>
                      <th className="p-4">הרכב משויך</th>
                      <th className="p-4">צד תובע</th>
                      <th className="p-4">צד נתבע</th>
                      <th className="p-4">סטטוס</th>
                      <th className="p-4">תאריך פתיחה</th>
                      <th className="p-4 text-center">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#faf6ee]">
                    {filteredCases.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                          לא נמצאו תיקים העונים לחיפוש הנוכחי
                        </td>
                      </tr>
                    ) : (
                      filteredCases.map(c => {
                        const plaintiff = c.participants?.find(p => p.party_role === 'plaintiff');
                        const defendant = c.participants?.find(p => p.party_role === 'defendant');
                        return (
                          <tr key={c.id} className="hover:bg-[#faf6ee]/30 transition-all font-medium text-[#2d1e10]">
                            <td className="p-4">
                              <span className="bg-[#8b5a2b]/5 px-2.5 py-1 text-xs font-black tracking-wider text-amber-800 border border-[#eadfcd] rounded-lg shadow-sm">
                                {c.case_number}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-serif text-sm">{c.title}</td>
                            <td className="p-4 text-[#5c4a3c]">{c.panel_name}</td>
                            <td className="p-4 text-[#2d1e10]">
                              {plaintiff ? plaintiff.full_name : <span className="text-slate-400 italic">לא משויך</span>}
                            </td>
                            <td className="p-4 text-[#2d1e10]">
                              {defendant ? defendant.full_name : <span className="text-slate-400 italic">לא משויך</span>}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.status === 'open' ? 'bg-emerald-55/15 text-emerald-800 border border-emerald-200' :
                                c.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {c.status === 'open' ? 'פתוח' : c.status === 'pending' ? 'בהמתנה' : 'סגור'}
                              </span>
                            </td>
                            <td className="p-4 text-[#5c4a3c]">{new Date(c.created_at).toLocaleDateString('he-IL')}</td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleOpenCaseDocs(c)}
                                  className="px-2.5 py-1 rounded bg-[#faf6ee] border border-[#eadeca] text-[#8b5a2b] hover:bg-[#f3eedf] transition-all flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                                  title="ניהול תיקיות מסמכים"
                                >
                                  <FileText className="h-3 w-3 text-[#a27b18]" />
                                  <span>תיקיות מסמכים</span>
                                </button>
                                <button
                                  onClick={() => handleOpenDocRequest(c)}
                                  className="px-2.5 py-1 rounded bg-[#faf6ee] border border-[#eadeca] text-[#8b5a2b] hover:bg-[#f3eedf] transition-all flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                                  title="דרישת מסמכים מבעל דין"
                                >
                                  <Mail className="h-3 w-3 text-[#a27b18]" />
                                  <span>דרישת מסמך</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* לשונית: 3) ניהול הרכבי דיינים */}
        {activeTab === "panels" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-serif text-[#2d1e10]">ניהול הרכבי דיינים</h2>
                <p className="text-xs text-[#5c4a3c] font-medium">עריכת הרכבים, שינוי ימי פעילות, והוספת הרכבי דיינים חדשים למערכת</p>
              </div>

              <button
                onClick={() => handleOpenPanelModal()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gold-button font-bold text-xs hover:opacity-95 cursor-pointer shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>הוסף הרכב דיינים</span>
              </button>
            </div>

            {/* רשת כרטיסי הרכבים */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {panels.map(p => (
                <div key={p.id} className="parchment-panel p-6 border-[#eadeca] flex flex-col justify-between torah-card">
                  <div>
                    <span className="px-2.5 py-1 rounded bg-[#8b5a2b]/10 text-[#8b5a2b] font-bold text-[10px] uppercase">
                      פעיל ביום: {dbService.getDayName(p.day_of_week)}
                    </span>
                    <h3 className="text-base font-bold text-serif text-[#2d1e10] mt-3">{p.name}</h3>
                    <p className="text-xs text-[#5c4a3c] font-medium mt-1">
                      שיוך תיקים הפועלים בימי {dbService.getDayName(p.day_of_week)} ביומן
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#faf6ee] flex justify-end">
                    <button
                      onClick={() => handleOpenPanelModal(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#faf6ee] hover:bg-[#f3eedf] border border-[#eadeca] text-xs text-[#8b5a2b] font-bold transition-all cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>ערוך פרטי הרכב</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* לשונית: 4) בקשות ופניות */}
        {activeTab === "requests" && (
          <section className="glass-panel p-6 rounded-2xl border border-[#eadeca] bg-white space-y-4">
            <div className="border-b border-[#eadeca] pb-3">
              <h2 className="text-lg font-bold text-serif text-[#2d1e10]">פניות ובקשות מבעלי הדין</h2>
              <p className="text-xs text-[#5c4a3c] font-medium">בחינה ואישור של פניות שהוגשו על ידי התובעים והנתבעים</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#faf6ee] text-[#2d1e10] font-bold border-b border-[#eadeca]">
                  <tr>
                    <th className="p-4">תאריך הגשה</th>
                    <th className="p-4">מספר תיק</th>
                    <th className="p-4">מגיש הפנייה</th>
                    <th className="p-4">סוג הפנייה</th>
                    <th className="p-4">פירוט הבקשה</th>
                    <th className="p-4">סטטוס</th>
                    <th className="p-4 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#faf6ee]">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        אין פניות הממתינות לטיפול
                      </td>
                    </tr>
                  ) : (
                    requests.map(r => (
                      <tr key={r.id} className="hover:bg-[#faf6ee]/40 transition-all font-medium text-[#2d1e10]">
                        <td className="p-4 text-[#5c4a3c]">{new Date(r.created_at).toLocaleDateString('he-IL')}</td>
                        <td className="p-4 font-bold">{r.case_number}</td>
                        <td className="p-4 text-[#5c4a3c]">{r.user_name}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded bg-[#faf6ee] border border-[#eadeca] text-[#8b5a2b] font-bold text-[10px]">
                            {r.request_type === 'postpone_hearing' ? 'דחיית מועד' : 'חומר מיוחד'}
                          </span>
                        </td>
                        <td className="p-4 max-w-xs truncate" title={r.description}>
                          <strong className="text-[#2d1e10] block font-bold text-serif">{r.title}</strong>
                          <span className="text-[10px] text-[#5c4a3c] block mt-0.5">{r.description}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            r.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            r.status === 'approved' ? 'bg-emerald-550/15 text-emerald-800 border border-emerald-200' : 'bg-rose-550/15 text-rose-800 border border-rose-250'
                          }`}>
                            {r.status === 'pending' ? 'ממתין' :
                             r.status === 'approved' ? 'אושר' : 'נדחה'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {r.status === 'pending' ? (
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => handleRequestStatus(r.id, 'approved')}
                                className="p-1.5 rounded bg-emerald-55 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
                                title="אשר פנייה"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRequestStatus(r.id, 'rejected')}
                                className="p-1.5 rounded bg-rose-55 border border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                                title="דחה פנייה"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-normal">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* תוכן הלשונית: 5) ניהול לקוחות */}
        {activeTab === "clients" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-serif text-[#2d1e10]">ניהול ורישום לקוחות (בעלי דין)</h2>
                <p className="text-xs text-[#5c4a3c] font-medium">הוספת לקוחות חדשים למערכת וצפייה ברשומות קיימות</p>
              </div>
              <button
                onClick={() => setShowCreateClientModal(true)}
                className="px-4 py-2 rounded-xl gold-button text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>הוספת לקוח חדש</span>
              </button>
            </div>

            <div className="parchment-panel border border-[#eadeca] rounded-2xl overflow-hidden bg-white shadow-sm">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-[#faf6ee] text-[#8b5a2b] font-bold border-b border-[#eadeca]">
                    <th className="p-4">שם מלא</th>
                    <th className="p-4">כתובת אימייל (לחיבור גוגל)</th>
                    <th className="p-4">טלפון</th>
                    <th className="p-4">כתובת מגורים</th>
                    <th className="p-4">מזהה מערכת (UUID)</th>
                    <th className="p-4 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#faf6ee]">
                  {litigants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        אין לקוחות רשומים במערכת.
                      </td>
                    </tr>
                  ) : (
                    litigants.map(l => (
                      <tr key={l.id} className="hover:bg-[#faf6ee]/40 transition-all font-medium text-[#2d1e10]">
                        <td className="p-4 font-bold text-[#8b5a2b]">{l.full_name}</td>
                        <td className="p-4 font-mono select-all">{l.email}</td>
                        <td className="p-4 text-[#5c4a3c]">{l.phone || '—'}</td>
                        <td className="p-4 text-[#5c4a3c]">{l.address || '—'}</td>
                        <td className="p-4 text-[10px] font-mono text-slate-400 select-all">{l.id}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setMsgRecipient(l);
                                setShowSendMessageModal(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[#faf6ee] border border-[#eadeca] hover:bg-[#f3eedf] text-[#8b5a2b] font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Mail className="h-3 w-3" />
                              <span>הודעה</span>
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`האם אתה בטוח שברצונך למחוק את הלקוח ${l.full_name}?`)) {
                                  try {
                                    await dbService.deleteProfile(l.id);
                                    await loadData();
                                  } catch (err: any) {
                                    alert("שגיאה במחיקת הלקוח: " + err.message);
                                  }
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-600 hover:text-white text-rose-700 font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>מחק</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </main>

      {/* =========================================================================
          מודל הגדרות בית הדין (Bet Din Settings Modal)
          ========================================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="parchment-panel w-full max-w-md p-6 border-[#eadeca] shadow-2xl animate-in fade-in zoom-in duration-200 torah-card">
            <div className="flex items-center justify-between border-b border-[#eadeca] pb-3 mb-5">
              <h3 className="text-lg font-bold text-serif text-[#2d1e10] flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#8b5a2b]" />
                <span>הגדרות שם בית הדין</span>
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-[#5c4a3c] hover:text-[#2d1e10] text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[#2d1e10] mb-2">שם בית הדין (יופיע בכל דפי המערכת):</label>
                <input
                  type="text"
                  value={settingsCourtName}
                  onChange={(e) => setSettingsCourtName(e.target.value)}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-3.5 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] text-xs font-bold"
                  required
                />
              </div>

              <div className="pt-3 border-t border-[#eadeca] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#faf6ee] border border-[#eadeca] text-[#5c4a3c] hover:bg-[#f3eedf] cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl gold-button font-bold cursor-pointer"
                >
                  שמור הגדרות
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          מודל פתיחת תיק דיון חדש (Create Case Modal)
          ========================================================================= */}
      {showCreateCaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="parchment-panel w-full max-w-2xl p-6 border-[#eadeca] shadow-2xl animate-in fade-in zoom-in duration-200 torah-card max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#eadeca] pb-3 mb-5">
              <h3 className="text-lg font-bold text-serif text-[#2d1e10] flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-[#8b5a2b]" />
                <span>פתיחת תיק משפטי חדש</span>
              </h3>
              <button
                onClick={() => setShowCreateCaseModal(false)}
                className="text-[#5c4a3c] hover:text-[#2d1e10] text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCaseSubmit} className="space-y-4 text-xs font-semibold">
              
              <div className="grid grid-cols-3 gap-4 items-end">
                <div className="col-span-2">
                  <label className="block text-[#2d1e10] mb-1">שם התיק / נושא הסכסוך *:</label>
                  <input
                    type="text"
                    placeholder="לדוגמה: סכסוך ירושה, הפרת חוזה שכירות..."
                    value={newCaseTitle}
                    onChange={(e) => setNewCaseTitle(e.target.value)}
                    className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#2d1e10] mb-1">מספר סידורי *:</label>
                  <input
                    type="text"
                    value={newCaseNumber}
                    onChange={(e) => setNewCaseNumber(e.target.value)}
                    className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] font-bold text-center focus:outline-none focus:ring-1 focus:ring-[#cda851]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#2d1e10] mb-1">הרכב דיינים ברירת מחדל:</label>
                <select
                  value={newCasePanelId}
                  onChange={(e) => setNewCasePanelId(e.target.value)}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851]"
                >
                  {panels.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-[#eadeca] pt-4">
                {/* צד תובע */}
                <div className="space-y-3 p-4 rounded-xl bg-[#faf6ee]/40 border border-[#eadeca]/60">
                  <h4 className="font-bold text-[#8b5a2b] border-b border-[#eadeca] pb-1.5 text-xs text-serif">
                    פרטי צד תובע
                  </h4>
                  <div>
                    <label className="block text-[#2d1e10] mb-1">בחירת בעל דין קיים:</label>
                    <select
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        if (!selectedId) return;
                        const u = litigants.find(l => l.id === selectedId);
                        if (u) {
                          setNewCasePName(u.full_name);
                          setNewCasePEmail(u.email);
                          setNewCasePPhone(u.phone || "");
                          setNewCasePAddress(u.address || "");
                        }
                      }}
                      className="w-full bg-white border border-[#eadeca] rounded-lg px-2.5 py-1.5 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium text-xs mb-2"
                    >
                      <option value="">-- בחר תובע מהמערכת --</option>
                      {litigants.map(l => (
                        <option key={l.id} value={l.id}>{l.full_name} ({l.email})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#2d1e10] mb-1">שם מלא *:</label>
                    <input
                      type="text"
                      placeholder="שם התובע"
                      value={newCasePName}
                      onChange={(e) => setNewCasePName(e.target.value)}
                      className="w-full bg-white border border-[#eadeca] rounded-lg px-2.5 py-1.5 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#2d1e10] mb-1">טלפון:</label>
                    <input
                      type="text"
                      placeholder="לדוגמה: 050-1234567"
                      value={newCasePPhone}
                      onChange={(e) => setNewCasePPhone(e.target.value)}
                      className="w-full bg-white border border-[#eadeca] rounded-lg px-2.5 py-1.5 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[#2d1e10] mb-1">מייל *:</label>
                    <input
                      type="email"
                      placeholder="example@mail.com"
                      value={newCasePEmail}
                      onChange={(e) => setNewCasePEmail(e.target.value)}
                      className="w-full bg-white border border-[#eadeca] rounded-lg px-2.5 py-1.5 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#2d1e10] mb-1">כתובת מגורים:</label>
                    <input
                      type="text"
                      placeholder="רחוב, עיר"
                      value={newCasePAddress}
                      onChange={(e) => setNewCasePAddress(e.target.value)}
                      className="w-full bg-white border border-[#eadeca] rounded-lg px-2.5 py-1.5 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium text-xs"
                    />
                  </div>
                </div>

                {/* צד נתבע */}
                <div className="space-y-3 p-4 rounded-xl bg-[#faf6ee]/40 border border-[#eadeca]/60">
                  <h4 className="font-bold text-[#8b5a2b] border-b border-[#eadeca] pb-1.5 text-xs text-serif">
                    פרטי צד נתבע
                  </h4>
                  <div>
                    <label className="block text-[#2d1e10] mb-1">בחירת בעל דין קיים:</label>
                    <select
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        if (!selectedId) return;
                        const u = litigants.find(l => l.id === selectedId);
                        if (u) {
                          setNewCaseDName(u.full_name);
                          setNewCaseDEmail(u.email);
                          setNewCaseDPhone(u.phone || "");
                          setNewCaseDAddress(u.address || "");
                        }
                      }}
                      className="w-full bg-white border border-[#eadeca] rounded-lg px-2.5 py-1.5 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium text-xs mb-2"
                    >
                      <option value="">-- בחר נתבע מהמערכת --</option>
                      {litigants.map(l => (
                        <option key={l.id} value={l.id}>{l.full_name} ({l.email})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#2d1e10] mb-1">שם מלא:</label>
                    <input
                      type="text"
                      placeholder="שם הנתבע"
                      value={newCaseDName}
                      onChange={(e) => setNewCaseDName(e.target.value)}
                      className="w-full bg-white border border-[#eadeca] rounded-lg px-2.5 py-1.5 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[#2d1e10] mb-1">טלפון:</label>
                    <input
                      type="text"
                      placeholder="לדוגמה: 054-7654321"
                      value={newCaseDPhone}
                      onChange={(e) => setNewCaseDPhone(e.target.value)}
                      className="w-full bg-white border border-[#eadeca] rounded-lg px-2.5 py-1.5 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[#2d1e10] mb-1">מייל:</label>
                    <input
                      type="email"
                      placeholder="example@mail.com"
                      value={newCaseDEmail}
                      onChange={(e) => setNewCaseDEmail(e.target.value)}
                      className="w-full bg-white border border-[#eadeca] rounded-lg px-2.5 py-1.5 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[#2d1e10] mb-1">כתובת מגורים:</label>
                    <input
                      type="text"
                      placeholder="רחוב, עיר"
                      value={newCaseDAddress}
                      onChange={(e) => setNewCaseDAddress(e.target.value)}
                      className="w-full bg-white border border-[#eadeca] rounded-lg px-2.5 py-1.5 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium text-xs"
                    />
                  </div>
              </div>
            </div>

            {/* העלאת מסמכים ראשוניים לתיק */}
              <div className="border-t border-[#eadeca] pt-4">
                <label className="block text-[#2d1e10] mb-1">העלאת מסמכים ראשוניים לתיק (אופציונלי):</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setNewCaseFiles(Array.from(e.target.files));
                    }
                  }}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium"
                />
                {newCaseFiles.length > 0 && (
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">
                    נבחרו {newCaseFiles.length} קבצים: {newCaseFiles.map(f => f.name).join(", ")}
                  </p>
                )}
              </div>

              {/* שגיאות או הצלחה */}
              {createCaseError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{createCaseError}</span>
                </div>
              )}

              {createCaseSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>{createCaseSuccess}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#eadeca] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateCaseModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#faf6ee] border border-[#eadeca] text-[#5c4a3c] hover:bg-[#f3eedf] cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl gold-button font-bold cursor-pointer"
                >
                  פתח תיק
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          מודל ניהול/עריכת/הוספת הרכב דיינים (Panel Manage Modal)
          ========================================================================= */}
      {showPanelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="parchment-panel w-full max-w-md p-6 border-[#eadeca] shadow-2xl animate-in fade-in zoom-in duration-200 torah-card">
            
            <div className="flex items-center justify-between border-b border-[#eadeca] pb-3 mb-5">
              <h3 className="text-lg font-bold text-serif text-[#2d1e10] flex items-center gap-2">
                <Edit className="h-5 w-5 text-[#8b5a2b]" />
                <span>{editingPanelId ? "עריכת פרטי הרכב דיינים" : "הוספת הרכב דיינים חדש"}</span>
              </h3>
              <button
                onClick={() => setShowPanelModal(false)}
                className="text-[#5c4a3c] hover:text-[#2d1e10] text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePanelSubmit} className="space-y-4 text-xs font-semibold">
              
              <div>
                <label className="block text-[#2d1e10] mb-1">שם ההרכב (והרכב הדיינים):</label>
                <input
                  type="text"
                  placeholder="לדוגמה: הרכב ו' (הרב ישראלי והרב שפירא)"
                  value={panelFormName}
                  onChange={(e) => setPanelFormName(e.target.value)}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[#2d1e10] mb-1">יום פעילות קבוע בשבוע:</label>
                <select
                  value={panelFormDay}
                  onChange={(e) => setPanelFormDay(Number(e.target.value))}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851]"
                >
                  <option value={1}>יום ראשון</option>
                  <option value={2}>יום שני</option>
                  <option value={3}>יום שלישי</option>
                  <option value={4}>יום רביעי</option>
                  <option value={5}>יום חמישי</option>
                </select>
              </div>

              {/* שגיאות או הצלחה */}
              {panelError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{panelError}</span>
                </div>
              )}

              {panelSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>{panelSuccess}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#eadeca] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPanelModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#faf6ee] border border-[#eadeca] text-[#5c4a3c] hover:bg-[#f3eedf] cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl gold-button font-bold cursor-pointer"
                >
                  {editingPanelId ? "עדכן הרכב" : "שמור הרכב"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          מודל לוח שנה מלא (Full Calendar Modal)
          ========================================================================= */}
      {showFullCalendarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="parchment-panel w-full max-w-4xl p-6 border-[#eadeca] shadow-2xl animate-in fade-in zoom-in duration-200 torah-card max-h-[90vh] overflow-y-auto flex flex-col">
            
            <div className="flex items-center justify-between border-b border-[#eadeca] pb-3 mb-5">
              <h3 className="text-lg font-bold text-serif text-[#2d1e10] flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#8b5a2b]" />
                <span>לוח שנה מלא - כל הדיונים</span>
              </h3>
              <button
                onClick={() => setShowFullCalendarModal(false)}
                className="text-[#5c4a3c] hover:text-[#2d1e10] text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* בורר חודש ושנה */}
            <div className="flex items-center justify-between mb-6 bg-[#faf6ee]/60 border border-[#eadeca] p-3 rounded-2xl">
              <button
                onClick={() => {
                  const newDate = new Date(calendarMonthDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCalendarMonthDate(newDate);
                }}
                className="px-3 py-1.5 rounded-xl border border-[#eadeca] bg-white text-[#5c4a3c] hover:bg-[#faf6ee] text-xs font-bold cursor-pointer transition-colors"
              >
                ← חודש קודם
              </button>
              
              <span className="text-lg font-bold text-serif text-[#2d1e10]">
                {hebrewMonths[calendarMonthDate.getMonth()]} {calendarMonthDate.getFullYear()}
              </span>

              <button
                onClick={() => {
                  const newDate = new Date(calendarMonthDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setCalendarMonthDate(newDate);
                }}
                className="px-3 py-1.5 rounded-xl border border-[#eadeca] bg-white text-[#5c4a3c] hover:bg-[#faf6ee] text-xs font-bold cursor-pointer transition-colors"
              >
                חודש הבא →
              </button>
            </div>

            {/* גריד לוח שנה */}
            <div className="flex-1 overflow-x-auto">
              <div className="min-w-[600px]">
                {/* שמות הימים */}
                <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-[#8b5a2b] bg-[#faf6ee]/40 py-2 rounded-xl">
                  <div>ראשון</div>
                  <div>שני</div>
                  <div>שלישי</div>
                  <div>רביעי</div>
                  <div>חמישי</div>
                  <div className="text-slate-400">שישי</div>
                  <div className="text-slate-400">שבת</div>
                </div>

                {/* ימי החודש */}
                <div className="grid grid-cols-7 gap-2">
                  {getDaysInMonth(calendarMonthDate).map((day, idx) => {
                    if (!day) {
                      return (
                        <div key={`empty-${idx}`} className="min-h-[100px] bg-slate-50/20 rounded-xl border border-dashed border-slate-200/50"></div>
                      );
                    }

                    const dateHearings = getHearingsForDate(day);
                    const isToday = new Date().toDateString() === day.toDateString();
                    const isWeekend = day.getDay() === 5 || day.getDay() === 6;

                    return (
                      <div
                        key={day.toISOString()}
                        className={`relative group min-h-[100px] border p-2 rounded-xl flex flex-col justify-between transition-all ${
                          isToday 
                            ? 'bg-white border-[#cda851] shadow-md shadow-amber-600/5' 
                            : isWeekend
                              ? 'bg-slate-50/30 border-slate-100'
                              : 'bg-[#faf6ee]/30 border-[#eadeca] hover:bg-amber-50/20'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-bold ${isToday ? 'text-[#cda851] font-black' : isWeekend ? 'text-slate-400' : 'text-[#2d1e10]'}`}>
                            {day.getDate()}
                          </span>
                          {isToday && (
                            <span className="text-[8px] bg-[#cda851]/10 text-[#cda851] px-1 rounded-md font-bold">היום</span>
                          )}
                        </div>

                        <div className="flex-1 mt-1 space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                          {dateHearings.map(h => (
                            <div
                              key={h.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDocs(h);
                              }}
                              className="bg-[#8b5a2b]/10 hover:bg-[#8b5a2b]/20 text-[#8b5a2b] text-[9px] p-1 rounded font-bold truncate cursor-pointer transition-colors text-right"
                              title={`שעה: ${h.hearing_time} | ${h.case_title}`}
                            >
                              <span className="font-extrabold text-[8px] opacity-80 pl-1">{h.hearing_time}</span>
                              <span>{h.case_title}</span>
                            </div>
                          ))}
                        </div>

                        {/* חלונית צפה בעת ריחוף המציגה את כל הדיונים ביום זה בפירוט */}
                        {dateHearings.length > 0 && (
                          <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 w-64 bg-[#faf6ee] border-2 border-[#eadeca] rounded-2xl shadow-xl p-4 hidden group-hover:block z-30 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none text-right dir-rtl">
                            <div className="font-bold text-[#8b5a2b] border-b border-[#eadeca] pb-1 mb-2 text-xs">
                              הדיונים ביום {dbService.getDayName(day.getDay() + 1)} ({day.getDate()} ב{hebrewMonths[day.getMonth()]})
                            </div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                              {dateHearings.map(h => (
                                <div key={h.id} className="border-b border-[#eadeca]/50 pb-1.5 last:border-0 last:pb-0 text-[11px]">
                                  <div className="flex justify-between font-bold text-[#2d1e10]">
                                    <span>{h.hearing_time}</span>
                                    <span className="text-[#8b5a2b]">{h.case_number}</span>
                                  </div>
                                  <div className="font-medium text-slate-750 truncate">{h.case_title}</div>
                                  <div className="text-[10px] text-slate-500 truncate">{h.panel_name || 'ללא שיוך'}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#eadeca] flex justify-end mt-6">
              <button
                type="button"
                onClick={() => setShowFullCalendarModal(false)}
                className="px-5 py-2 rounded-xl bg-[#faf6ee] border border-[#eadeca] text-[#5c4a3c] hover:bg-[#f3eedf] cursor-pointer text-sm font-bold"
              >
                סגור
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          מודל שיבוץ דיון חדש (Schedule Hearing Modal)
          ========================================================================= */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="parchment-panel w-full max-w-lg p-6 border-[#eadeca] shadow-2xl animate-in fade-in zoom-in duration-200 torah-card">
            
            <div className="flex items-center justify-between border-b border-[#eadeca] pb-3 mb-5">
              <h3 className="text-lg font-bold text-serif text-[#2d1e10] flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#8b5a2b]" />
                <span>שיבוץ דיון חדש ביומן</span>
              </h3>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduleError("");
                  setScheduleSuccess("");
                }}
                className="text-[#5c4a3c] hover:text-[#2d1e10] text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs font-semibold">
              
              <div>
                <label className="block text-[#2d1e10] mb-1">בחר תיק דיון:</label>
                <select
                  value={scheduleCaseId}
                  onChange={(e) => setScheduleCaseId(e.target.value)}
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
                <label className="block text-[#2d1e10] mb-1">הרכב דיינים (ויום הפעילות שלו):</label>
                <select
                  value={schedulePanelId}
                  onChange={(e) => setSchedulePanelId(e.target.value)}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851]"
                >
                  {panels.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#2d1e10] mb-1">תאריך הדיון:</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851]"
                  />
                </div>
                <div>
                  <label className="block text-[#2d1e10] mb-1">שעת הדיון:</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851]"
                  />
                </div>
              </div>

              {/* הערת תזכורת חכמה */}
              {schedulePanelId && (
                <div className="p-3 rounded-xl bg-[#faf6ee] border border-[#eadeca]/80 text-[11px] text-[#5c4a3c] flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-[#a27b18] flex-shrink-0 mt-0.5" />
                  <span>
                    שים לב: ההרכב הנבחר פעיל ביום{" "}
                    <strong>
                      {dbService.getDayName(
                        panels.find(p => p.id === schedulePanelId)?.day_of_week || 1
                      )}
                    </strong>
                    . יש לשבץ את הדיון ביום זה בלבד.
                  </span>
                </div>
              )}

              {/* שגיאות או הצלחה */}
              {scheduleError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{scheduleError}</span>
                </div>
              )}

              {scheduleSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>{scheduleSuccess}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#eadeca] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#faf6ee] border border-[#eadeca] text-[#5c4a3c] hover:bg-[#f3eedf] cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl gold-button font-bold cursor-pointer"
                >
                  שמור שיבוץ
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          מודל ניהול חומרים ומסמכים (Documents Explorer Modal)
          ========================================================================= */}
      {showDocModal && (selectedHearing || selectedCase) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/45 backdrop-blur-sm">
          <div className="parchment-panel w-full max-w-4xl p-6 border-[#eadeca] shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] torah-card">
            
            <div className="flex items-center justify-between border-b border-[#eadeca] pb-3 mb-4 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-serif text-[#2d1e10]">
                  ניהול חומרי התיק: {selectedCase ? selectedCase.title : selectedHearing?.case_title}
                </h3>
                <p className="text-[11px] text-[#5c4a3c] mt-0.5 font-semibold">
                  תיק: {selectedCase ? selectedCase.case_number : selectedHearing?.case_number} | הרכב: {selectedCase ? selectedCase.panel_name : selectedHearing?.panel_name}
                  {selectedHearing && ` | תאריך דיון: ${selectedHearing.hearing_date}`}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDocModal(false);
                  setSelectedHearing(null);
                  setSelectedCase(null);
                  setHearingDocs([]);
                }}
                className="text-[#5c4a3c] hover:text-[#2d1e10] text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1 my-3 text-xs font-semibold">
              
              <div className="p-4 rounded-xl bg-[#faf6ee]/60 border border-[#eadeca] space-y-3">
                <h4 className="font-bold text-[#2d1e10] text-xs flex items-center gap-1.5">
                  <Upload className="h-4 w-4 text-[#8b5a2b]" />
                  <span>העלאת מסמך חדש לתיק</span>
                </h4>
                <form onSubmit={handleSecUpload} className="space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFileObject(e.target.files[0]);
                        if (!uploadFileName) {
                          setUploadFileName(e.target.files[0].name);
                        }
                      }
                    }}
                    className="hidden"
                    id="sec-file-upload"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#2d1e10] mb-1">כותרת או שם המסמך:</label>
                      <input
                        type="text"
                        placeholder="לדוגמה: יפוי כח תובע, כתב הגנה"
                        value={uploadFileName}
                        onChange={(e) => setUploadFileName(e.target.value)}
                        className="w-full bg-white border border-[#eadeca] rounded-lg px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] text-xs font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[#2d1e10] mb-1">העלה לתיקיית יעד:</label>
                      <select
                        value={uploadFolderType}
                        onChange={(e) => setUploadFolderType(e.target.value as any)}
                        className="w-full bg-white border border-[#eadeca] rounded-lg px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] text-xs font-medium"
                      >
                        <option value="General">כללי (General) - נגיש לכולם</option>
                        <option value="Plaintiff_Docs">מסמכי תובע (Plaintiff_Docs) - מוסתר מהנתבע</option>
                        <option value="Defendant_Docs">מסמכי נתבע (Defendant_Docs) - מוסתר מהתובע</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center pt-2">
                    <label
                      htmlFor="sec-file-upload"
                      className="flex-1 flex items-center justify-center border border-dashed border-[#eadeca] hover:border-[#cda851] rounded-lg p-2.5 bg-white cursor-pointer transition-all gap-1.5 text-[11px] font-bold text-[#5c4a3c] truncate"
                    >
                      <Upload className="h-3.5 w-3.5 text-[#8b5a2b]" />
                      <span className="truncate">
                        {selectedFileObject ? `קובץ: ${selectedFileObject.name}` : "בחר קובץ מהמחשב"}
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={uploading || !uploadFileName.trim() || (!isMockMode && !selectedFileObject)}
                      className="px-4 py-2.5 rounded-lg gold-button font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs flex-shrink-0"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{uploading ? 'מעלה...' : 'העלה לתיקייה'}</span>
                    </button>
                  </div>
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* תיקיית Plaintiff_Docs */}
                <div className="space-y-3 p-3 rounded-xl bg-amber-50/15 border border-[#eadeca]/80">
                  <h4 className="font-bold text-[#8b5a2b] border-b border-[#eadeca] pb-1.5 text-[12px] text-serif flex items-center justify-between">
                    <span>Plaintiff_Docs</span>
                    <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-black">תובע בלבד</span>
                  </h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {hearingDocs.filter(d => d.folder_type === 'Plaintiff_Docs').length === 0 ? (
                      <p className="text-slate-400 italic py-2 font-normal text-center">אין מסמכים</p>
                    ) : (
                      hearingDocs.filter(d => d.folder_type === 'Plaintiff_Docs').map(d => (
                        <div key={d.id} className="p-3 rounded-lg bg-white border border-[#eadeca] flex flex-col justify-between gap-3 shadow-sm">
                          <div>
                            <strong className="text-[#2d1e10] block truncate text-serif text-[11px]" title={d.file_name}>
                              {d.file_name}
                            </strong>
                            <span className="text-[9px] text-[#5c4a3c] block font-medium mt-0.5">הועלה ע"י: {d.uploader_name}</span>
                          </div>
                          
                          <div className="border-t border-[#faf6ee] pt-2 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-slate-400">העבר לתיקייה:</span>
                              <select
                                value={d.folder_type || 'Plaintiff_Docs'}
                                onChange={(e) => handleMoveDoc(d.id, e.target.value as any)}
                                className="bg-[#faf6ee] border border-[#eadeca] rounded px-1.5 py-0.5 text-[9px] font-bold text-[#8b5a2b] focus:outline-none cursor-pointer"
                              >
                                <option value="General">כללי</option>
                                <option value="Plaintiff_Docs">תובע</option>
                                <option value="Defendant_Docs">נתבע</option>
                              </select>
                            </div>
                            <a 
                              href={d.file_path} 
                              download 
                              className="w-full py-1 text-center rounded bg-[#faf6ee] border border-[#eadeca] hover:bg-[#f3eedf] text-[#8b5a2b] font-bold text-[9px] flex items-center justify-center gap-1"
                            >
                              <Download className="h-2.5 w-2.5" />
                              <span>הורדה</span>
                            </a>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* תיקיית Defendant_Docs */}
                <div className="space-y-3 p-3 rounded-xl bg-amber-50/15 border border-[#eadeca]/80">
                  <h4 className="font-bold text-[#8b5a2b] border-b border-[#eadeca] pb-1.5 text-[12px] text-serif flex items-center justify-between">
                    <span>Defendant_Docs</span>
                    <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-black">נתבע בלבד</span>
                  </h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {hearingDocs.filter(d => d.folder_type === 'Defendant_Docs').length === 0 ? (
                      <p className="text-slate-400 italic py-2 font-normal text-center">אין מסמכים</p>
                    ) : (
                      hearingDocs.filter(d => d.folder_type === 'Defendant_Docs').map(d => (
                        <div key={d.id} className="p-3 rounded-lg bg-white border border-[#eadeca] flex flex-col justify-between gap-3 shadow-sm">
                          <div>
                            <strong className="text-[#2d1e10] block truncate text-serif text-[11px]" title={d.file_name}>
                              {d.file_name}
                            </strong>
                            <span className="text-[9px] text-[#5c4a3c] block font-medium mt-0.5">הועלה ע"י: {d.uploader_name}</span>
                          </div>
                          
                          <div className="border-t border-[#faf6ee] pt-2 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-slate-400">העבר לתיקייה:</span>
                              <select
                                value={d.folder_type || 'Defendant_Docs'}
                                onChange={(e) => handleMoveDoc(d.id, e.target.value as any)}
                                className="bg-[#faf6ee] border border-[#eadeca] rounded px-1.5 py-0.5 text-[9px] font-bold text-[#8b5a2b] focus:outline-none cursor-pointer"
                              >
                                <option value="General">כללי</option>
                                <option value="Plaintiff_Docs">תובע</option>
                                <option value="Defendant_Docs">נתבע</option>
                              </select>
                            </div>
                            <a 
                              href={d.file_path} 
                              download 
                              className="w-full py-1 text-center rounded bg-[#faf6ee] border border-[#eadeca] hover:bg-[#f3eedf] text-[#8b5a2b] font-bold text-[9px] flex items-center justify-center gap-1"
                            >
                              <Download className="h-2.5 w-2.5" />
                              <span>הורדה</span>
                            </a>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* תיקיית General */}
                <div className="space-y-3 p-3 rounded-xl bg-amber-50/15 border border-[#eadeca]/80">
                  <h4 className="font-bold text-[#8b5a2b] border-b border-[#eadeca] pb-1.5 text-[12px] text-serif flex items-center justify-between">
                    <span>General</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-black">נגיש לכולם</span>
                  </h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {hearingDocs.filter(d => d.folder_type === 'General' || (!d.folder_type && d.document_type === 'secretariat')).length === 0 ? (
                      <p className="text-slate-400 italic py-2 font-normal text-center">אין מסמכים</p>
                    ) : (
                      hearingDocs.filter(d => d.folder_type === 'General' || (!d.folder_type && d.document_type === 'secretariat')).map(d => (
                        <div key={d.id} className="p-3 rounded-lg bg-white border border-[#eadeca] flex flex-col justify-between gap-3 shadow-sm">
                          <div>
                            <strong className="text-[#2d1e10] block truncate text-serif text-[11px]" title={d.file_name}>
                              {d.file_name}
                            </strong>
                            <span className="text-[9px] text-[#5c4a3c] block font-medium mt-0.5">הועלה ע"י: {d.uploader_name}</span>
                          </div>
                          
                          <div className="border-t border-[#faf6ee] pt-2 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-slate-400">העבר לתיקייה:</span>
                              <select
                                value={d.folder_type || 'General'}
                                onChange={(e) => handleMoveDoc(d.id, e.target.value as any)}
                                className="bg-[#faf6ee] border border-[#eadeca] rounded px-1.5 py-0.5 text-[9px] font-bold text-[#8b5a2b] focus:outline-none cursor-pointer"
                              >
                                <option value="General">כללי</option>
                                <option value="Plaintiff_Docs">תובע</option>
                                <option value="Defendant_Docs">נתבע</option>
                              </select>
                            </div>
                            <a 
                              href={d.file_path} 
                              download 
                              className="w-full py-1 text-center rounded bg-[#faf6ee] border border-[#eadeca] hover:bg-[#f3eedf] text-[#8b5a2b] font-bold text-[9px] flex items-center justify-center gap-1"
                            >
                              <Download className="h-2.5 w-2.5" />
                              <span>הורדה</span>
                            </a>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>

            <div className="pt-3 border-t border-[#eadeca] flex justify-end flex-shrink-0 animate-fade-in">
              <button
                type="button"
                onClick={() => {
                  setShowDocModal(false);
                  setSelectedHearing(null);
                  setSelectedCase(null);
                  setHearingDocs([]);
                }}
                className="px-4 py-2 rounded-xl bg-[#faf6ee] border border-[#eadeca] text-[#5c4a3c] hover:bg-[#f3eedf] cursor-pointer font-bold"
              >
                סגור
              </button>
            </div>

          </div>
        </div>
      )}
      {/* מודל הוספת לקוח חדש */}
      {showCreateClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="parchment-panel w-full max-w-md p-6 border-[#eadeca] shadow-2xl animate-in fade-in zoom-in duration-200 torah-card">
            
            <div className="flex items-center justify-between border-b border-[#eadeca] pb-3 mb-5">
              <h3 className="text-lg font-bold text-serif text-[#2d1e10] flex items-center gap-2">
                <Users className="h-5 w-5 text-[#8b5a2b]" />
                <span>הוספת בעל דין חדש</span>
              </h3>
              <button
                onClick={() => setShowCreateClientModal(false)}
                className="text-[#5c4a3c] hover:text-[#2d1e10] text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClientSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[#2d1e10] mb-1">שם מלא *:</label>
                <input
                  type="text"
                  placeholder="לדוגמה: אברהם כהן"
                  value={clientFormName}
                  onChange={(e) => setClientFormName(e.target.value)}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[#2d1e10] mb-1">כתובת אימייל * (ישמש לחיבור גוגל):</label>
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  value={clientFormEmail}
                  onChange={(e) => setClientFormEmail(e.target.value)}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[#2d1e10] mb-1">מספר טלפון:</label>
                <input
                  type="text"
                  placeholder="לדוגמה: 050-1234567"
                  value={clientFormPhone}
                  onChange={(e) => setClientFormPhone(e.target.value)}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium"
                />
              </div>

              <div>
                <label className="block text-[#2d1e10] mb-1">כתובת מגורים:</label>
                <input
                  type="text"
                  placeholder="רחוב, עיר"
                  value={clientFormAddress}
                  onChange={(e) => setClientFormAddress(e.target.value)}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium"
                />
              </div>

              {/* שגיאות או הצלחה */}
              {clientError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{clientError}</span>
                </div>
              )}

              {clientSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>{clientSuccess}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#eadeca] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateClientModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#faf6ee] border border-[#eadeca] text-[#5c4a3c] hover:bg-[#f3eedf] cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl gold-button font-bold cursor-pointer"
                >
                  הוסף לקוח
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* מודל שליחת הודעה אישית */}
      {showSendMessageModal && msgRecipient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="parchment-panel w-full max-w-md p-6 border-[#eadeca] shadow-2xl animate-in fade-in zoom-in duration-200 torah-card">
            
            <div className="flex items-center justify-between border-b border-[#eadeca] pb-3 mb-5">
              <h3 className="text-lg font-bold text-serif text-[#2d1e10] flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#8b5a2b]" />
                <span>שליחת הודעה אישית ל{msgRecipient.full_name}</span>
              </h3>
              <button
                onClick={() => {
                  setShowSendMessageModal(false);
                  setMsgRecipient(null);
                }}
                className="text-[#5c4a3c] hover:text-[#2d1e10] text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendMessageSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[#2d1e10] mb-1">נושא ההודעה *:</label>
                <input
                  type="text"
                  placeholder="לדוגמה: זימון דחוף או עדכון החלטה"
                  value={msgTitle}
                  onChange={(e) => setMsgTitle(e.target.value)}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[#2d1e10] mb-1">שיוך לתיק (אופציונלי):</label>
                <select
                  value={msgCaseId}
                  onChange={(e) => setMsgCaseId(e.target.value)}
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
                  placeholder="כתוב את תוכן ההודעה כאן..."
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-3 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium h-32 resize-none"
                  required
                />
              </div>

              {/* שגיאות או הצלחה */}
              {msgError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{msgError}</span>
                </div>
              )}

              {msgSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>{msgSuccess}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#eadeca] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSendMessageModal(false);
                    setMsgRecipient(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#faf6ee] border border-[#eadeca] text-[#5c4a3c] hover:bg-[#f3eedf] cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl gold-button font-bold cursor-pointer"
                >
                  שלח הודעה
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* מודל דרישת מסמכים */}
      {showDocRequestModal && docRequestCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="parchment-panel w-full max-w-md p-6 border-[#eadeca] shadow-2xl animate-in fade-in zoom-in duration-200 torah-card">
            
            <div className="flex items-center justify-between border-b border-[#eadeca] pb-3 mb-5">
              <h3 className="text-lg font-bold text-serif text-[#2d1e10] flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#8b5a2b]" />
                <span>דרישת מסמכים: תיק {docRequestCase.case_number}</span>
              </h3>
              <button
                onClick={() => setShowDocRequestModal(false)}
                className="text-[#5c4a3c] hover:text-[#2d1e10] text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDocRequestSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[#2d1e10] mb-1">בחר בעל דין (נמען הדרישה) *:</label>
                <select
                  value={docRequestTo}
                  onChange={(e) => setDocRequestTo(e.target.value)}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium"
                  required
                >
                  <option value="">בחר בעל דין...</option>
                  {docRequestCase.participants?.map(p => (
                    <option key={p.user_id} value={p.user_id}>
                      {p.full_name} ({p.party_role === 'plaintiff' ? 'תובע' : 'נתבע'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#2d1e10] mb-1">מהו המסמך הנדרש? *:</label>
                <input
                  type="text"
                  placeholder="לדוגמה: הגשת תצהיר עדים, העלאת יפוי כח חתום"
                  value={docRequestTitle}
                  onChange={(e) => setDocRequestTitle(e.target.value)}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[#2d1e10] mb-1">הנחיות או פירוט נוסף (אופציונלי):</label>
                <textarea
                  placeholder="כתוב הנחיות הגשה לבעל הדין (למשל: נא להגיש בקובץ PDF קריא עד תאריך...)"
                  value={docRequestDesc}
                  onChange={(e) => setDocRequestDesc(e.target.value)}
                  className="w-full bg-white border border-[#eadeca] rounded-xl px-3 py-3 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium h-24 resize-none"
                />
              </div>

              {/* שגיאות או הצלחה */}
              {docRequestError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{docRequestError}</span>
                </div>
              )}

              {docRequestSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>{docRequestSuccess}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#eadeca] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDocRequestModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#faf6ee] border border-[#eadeca] text-[#5c4a3c] hover:bg-[#f3eedf] cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl gold-button font-bold cursor-pointer"
                >
                  שלח דרישה
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
