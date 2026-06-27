// app/dashboard/secretariat/page.tsx - לוח הבקרה של המזכירות בעיצוב תורני משופר עם לשוניות וניהול מורחב

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Scale, Calendar, FileText, CheckCircle2, XCircle, Clock, 
  Plus, Eye, Share2, ToggleLeft, ToggleRight, ArrowLeft,
  Users, Inbox, Download, Upload, AlertCircle, Search, Edit, FolderPlus, Settings
} from "lucide-react";
import { dbService } from "./../../../lib/services/dbService";
import { Panel, Case, Hearing, Document, ClientRequest, UserProfile, PartyRole } from "../../../types";
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
  
  // לשונית פעילה (calendar | cases | panels | requests | settings)
  const [activeTab, setActiveTab] = useState<"calendar" | "cases" | "panels" | "requests">("calendar");

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

  // מודל ניהול הרכבים
  const [showPanelModal, setShowPanelModal] = useState(false);
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null);
  const [panelFormName, setPanelFormName] = useState("");
  const [panelFormDay, setPanelFormDay] = useState(1);
  const [panelError, setPanelError] = useState("");
  const [panelSuccess, setPanelSuccess] = useState("");

  // הגדרות בית הדין
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsCourtName, setSettingsCourtName] = useState("");

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
      const [pData, cData, hData, rData, profsData] = await Promise.all([
        dbService.getPanels(),
        dbService.getCases(),
        dbService.getHearings(),
        dbService.getClientRequests(),
        dbService.getProfiles()
      ]);
      setPanels(pData);
      setCases(cData);
      setHearings(hData);
      setRequests(rData);
      setProfiles(profsData);
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
          const profile = await dbService.getProfile(user.id);
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
        !newCasePName.trim() || !newCasePEmail.trim() || 
        !newCaseDName.trim() || !newCaseDEmail.trim()) {
      setCreateCaseError("נא למלא את כל שדות החובה (שם ומייל לתובע ולנתבע, מספר תיק ונושא).");
      return;
    }

    if (newCasePEmail.trim().toLowerCase() === newCaseDEmail.trim().toLowerCase()) {
      setCreateCaseError("כתובת המייל של התובע והנתבע אינה יכולה להיות זהה.");
      return;
    }

    try {
      await dbService.createCase(
        newCaseNumber.trim(),
        newCaseTitle.trim(),
        newCasePanelId,
        {
          full_name: newCasePName.trim(),
          email: newCasePEmail.trim(),
          phone: newCasePPhone.trim(),
          address: newCasePAddress.trim()
        },
        {
          full_name: newCaseDName.trim(),
          email: newCaseDEmail.trim(),
          phone: newCaseDPhone.trim(),
          address: newCaseDAddress.trim()
        }
      );

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
      await loadData();

      setTimeout(() => {
        setShowCreateCaseModal(false);
        setCreateCaseSuccess("");
      }, 1500);
    } catch (err: any) {
      setCreateCaseError(err.message || "שגיאה בפתיחת התיק.");
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

  const handleOpenDocs = async (hearing: Hearing) => {
    setSelectedHearing(hearing);
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
    if (!selectedHearing || !uploadFileName.trim()) return;
    
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
        const storagePath = `${uId}/${fileName}`;
        
        const { data: storageData, error: storageErr } = await supabase.storage
          .from('court-documents')
          .upload(storagePath, selectedFileObject);
          
        if (storageErr) throw storageErr;
        filePath = storagePath;
      }
      
      await dbService.uploadDocument(
        selectedHearing.id,
        uId,
        "secretariat",
        uploadFileName.trim(),
        filePath
      );
      setUploadFileName("");
      setSelectedFileObject(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      const docs = await dbService.getDocuments(selectedHearing.id, uId, "secretariat");
      setHearingDocs(docs);
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

  const getHearingsByDay = (dayOfWeek: number) => {
    return hearings.filter(h => {
      const panel = panels.find(p => p.id === h.panel_id);
      return panel?.day_of_week === dayOfWeek;
    });
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
          
          <div className="parchment-panel p-6 border-[#eadeca] flex items-center justify-between">
            <div>
              <p className="text-xs text-[#5c4a3c] font-bold">דיונים משובצים השבוע</p>
              <h3 className="text-3xl font-black text-serif text-[#2d1e10] mt-1">{hearings.length}</h3>
            </div>
            <div className="p-3 bg-[#a27b18]/10 text-[#a27b18] rounded-xl"><Calendar className="h-6 w-6" /></div>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#faf6ee]">
                    {filteredCases.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
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
                    <label className="block text-[#2d1e10] mb-1">שם מלא *:</label>
                    <input
                      type="text"
                      placeholder="שם הנתבע"
                      value={newCaseDName}
                      onChange={(e) => setNewCaseDName(e.target.value)}
                      className="w-full bg-white border border-[#eadeca] rounded-lg px-2.5 py-1.5 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium text-xs"
                      required
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
                    <label className="block text-[#2d1e10] mb-1">מייל *:</label>
                    <input
                      type="email"
                      placeholder="example@mail.com"
                      value={newCaseDEmail}
                      onChange={(e) => setNewCaseDEmail(e.target.value)}
                      className="w-full bg-white border border-[#eadeca] rounded-lg px-2.5 py-1.5 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] font-medium text-xs"
                      required
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
      {showDocModal && selectedHearing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/45 backdrop-blur-sm">
          <div className="parchment-panel w-full max-w-3xl p-6 border-[#eadeca] shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh] torah-card">
            
            <div className="flex items-center justify-between border-b border-[#eadeca] pb-3 mb-4 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-serif text-[#2d1e10]">
                  ניהול חומרי הדיון: {selectedHearing.case_title}
                </h3>
                <p className="text-[11px] text-[#5c4a3c] mt-0.5 font-semibold">
                  תיק: {selectedHearing.case_number} | הרכב: {selectedHearing.panel_name} | תאריך: {selectedHearing.hearing_date}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDocModal(false);
                  setSelectedHearing(null);
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
                  <span>העלאת החלטה / פרוטוקול בית הדין</span>
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

                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="שם או כותרת המסמך (לדוגמה: פרוטוקול דיון מיום 14.6)"
                      value={uploadFileName}
                      onChange={(e) => setUploadFileName(e.target.value)}
                      className="w-full bg-white border border-[#eadeca] rounded-lg px-3 py-2 text-[#2d1e10] focus:outline-none focus:ring-1 focus:ring-[#cda851] text-xs font-medium"
                      required
                    />

                    <div className="flex gap-2 items-center">
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
                        <span>{uploading ? 'מעלה...' : 'העלה'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-3">
                  <h4 className="font-bold text-[#8b5a2b] border-b border-[#eadeca] pb-1.5 text-[11px] uppercase tracking-wider text-serif">
                    תיקיית מסמכי תובע
                  </h4>
                  <div className="space-y-2">
                    {hearingDocs.filter(d => d.document_type === 'plaintiff').length === 0 ? (
                      <p className="text-slate-400 italic py-2 font-normal">לא הועלו מסמכים</p>
                    ) : (
                      hearingDocs.filter(d => d.document_type === 'plaintiff').map(d => (
                        <div key={d.id} className="p-3 rounded-lg bg-white border border-[#eadeca] flex flex-col justify-between gap-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <strong className="text-[#2d1e10] block truncate text-serif" title={d.file_name}>
                                {d.file_name}
                              </strong>
                              <span className="text-[10px] text-[#5c4a3c] font-medium">הועלה ע"י: {d.uploader_name}</span>
                            </div>
                            <a 
                              href={d.file_path} 
                              download 
                              className="text-slate-500 hover:text-slate-900 p-1"
                              title="הורד קובץ"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </div>

                          <div className="pt-2 border-t border-[#faf6ee] flex items-center justify-between text-[10px]">
                            <span className="text-[#5c4a3c] font-bold">שיתוף עם צד נתבע:</span>
                            <button
                              onClick={() => handleToggleShare(d.id, d.is_shared)}
                              className="flex items-center gap-1 text-[#8b5a2b] hover:text-[#a27b18] font-bold transition-all cursor-pointer"
                            >
                              {d.is_shared ? (
                                <>
                                  <ToggleRight className="h-6 w-6 text-[#a27b18]" />
                                  <span>משותף</span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="h-6 w-6 text-slate-300" />
                                  <span className="text-slate-450">חסום</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-[#8b5a2b] border-b border-[#eadeca] pb-1.5 text-[11px] uppercase tracking-wider text-serif">
                    תיקיית מסמכי נתבע
                  </h4>
                  <div className="space-y-2">
                    {hearingDocs.filter(d => d.document_type === 'defendant').length === 0 ? (
                      <p className="text-slate-400 italic py-2 font-normal">לא הועלו מסמכים</p>
                    ) : (
                      hearingDocs.filter(d => d.document_type === 'defendant').map(d => (
                        <div key={d.id} className="p-3 rounded-lg bg-white border border-[#eadeca] flex flex-col justify-between gap-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <strong className="text-[#2d1e10] block truncate text-serif" title={d.file_name}>
                                {d.file_name}
                              </strong>
                              <span className="text-[10px] text-[#5c4a3c] font-medium">הועלה ע"י: {d.uploader_name}</span>
                            </div>
                            <a 
                              href={d.file_path} 
                              download 
                              className="text-slate-500 hover:text-slate-900 p-1"
                              title="הורד קובץ"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </div>

                          <div className="pt-2 border-t border-[#faf6ee] flex items-center justify-between text-[10px]">
                            <span className="text-[#5c4a3c] font-bold">שיתוף עם צד תובע:</span>
                            <button
                              onClick={() => handleToggleShare(d.id, d.is_shared)}
                              className="flex items-center gap-1 text-[#8b5a2b] hover:text-[#a27b18] font-bold transition-all cursor-pointer"
                            >
                              {d.is_shared ? (
                                <>
                                  <ToggleRight className="h-6 w-6 text-[#a27b18]" />
                                  <span>משותף</span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="h-6 w-6 text-slate-300" />
                                  <span className="text-slate-450">חסום</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-[#8b5a2b] border-b border-[#eadeca] pb-1.5 text-[11px] uppercase tracking-wider text-serif">
                  החלטות ופרוטוקולים (משותף לשני הצדדים אוטומטית)
                </h4>
                <div className="space-y-2">
                  {hearingDocs.filter(d => d.document_type === 'secretariat').length === 0 ? (
                    <p className="text-slate-400 italic py-2 font-normal">טרם הועלו החלטות</p>
                  ) : (
                    hearingDocs.filter(d => d.document_type === 'secretariat').map(d => (
                      <div key={d.id} className="p-3 rounded-lg bg-white border border-[#eadeca] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#a27b18]" />
                          <div>
                            <strong className="text-[#2d1e10] block text-serif">{d.file_name}</strong>
                            <span className="text-[10px] text-[#5c4a3c] font-medium">הועלה בתאריך: {new Date(d.created_at).toLocaleDateString('he-IL')}</span>
                          </div>
                        </div>
                        <a 
                          href={d.file_path} 
                          download 
                          className="px-3 py-1.5 rounded bg-[#faf6ee] border border-[#eadeca] hover:bg-[#f3eedf] text-[#8b5a2b] font-bold transition-all flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          <span>הורדה</span>
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            <div className="pt-3 border-t border-[#eadeca] flex justify-end flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowDocModal(false);
                  setSelectedHearing(null);
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

    </div>
  );
}
