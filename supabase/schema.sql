-- schema.sql - סכמת בסיס הנתונים וחוקי אבטחה (RLS) למערכת ניהול בית דין
-- קובץ זה מוגדר להקשחה ארגונית מלאה לקראת השקה (Production-Ready)

-- =========================================================================
-- 1. יצירת סוגי הנתונים (Enums)
-- =========================================================================
CREATE TYPE system_role_type AS ENUM ('secretariat', 'litigant');
CREATE TYPE case_status_type AS ENUM ('open', 'closed', 'pending');
CREATE TYPE party_role_type AS ENUM ('plaintiff', 'defendant');
CREATE TYPE hearing_status_type AS ENUM ('scheduled', 'postponed', 'completed');
CREATE TYPE document_type_type AS ENUM ('plaintiff', 'defendant', 'secretariat');
CREATE TYPE request_type_type AS ENUM ('postpone_hearing', 'submit_special_document', 'other');
CREATE TYPE request_status_type AS ENUM ('pending', 'approved', 'rejected');

-- =========================================================================
-- 2. יצירת הטבלאות
-- =========================================================================

-- א. טבלת פרופילים (משתמשי המערכת, מבוסס על auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT, -- כתובת מגורים
    system_role system_role_type DEFAULT 'litigant' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ב. טבלת הרכבי דיינים (ראשון עד חמישי)
CREATE TABLE public.panels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    day_of_week INT CHECK (day_of_week BETWEEN 1 AND 5) NOT NULL, -- 1 = ראשון, 5 = חמישי
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ג. טבלת תיקים משפטיים
CREATE TABLE public.cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    status case_status_type DEFAULT 'open' NOT NULL,
    panel_id UUID REFERENCES public.panels(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ד. טבלת משתתפים בתיקים (תובעים ונתבעים)
CREATE TABLE public.case_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    party_role party_role_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(case_id, user_id)
);

-- ה. טבלת דיונים
CREATE TABLE public.hearings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
    panel_id UUID REFERENCES public.panels(id) ON DELETE SET NULL NOT NULL,
    hearing_date DATE NOT NULL,
    hearing_time TIME NOT NULL,
    status hearing_status_type DEFAULT 'scheduled' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ו. טבלת מסמכי דיונים (כולל עמודת case_id למידור וסינון)
CREATE TABLE public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hearing_id UUID REFERENCES public.hearings(id) ON DELETE CASCADE NOT NULL,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL, -- שיוך ישיר לתיק לצורך אבטחה
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    file_path TEXT NOT NULL, -- נתיב ב-Storage Bucket
    file_name TEXT NOT NULL,
    document_type document_type_type NOT NULL,
    is_shared BOOLEAN DEFAULT FALSE NOT NULL, -- שיתוף מסמכי תובע/נתבע עם הצד השני
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ז. טבלת בקשות ופניות לקוחות
CREATE TABLE public.requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
    hearing_id UUID REFERENCES public.hearings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    request_type request_type_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status request_status_type DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ח. טבלת לוג תיעוד שינויים בלתי ניתן למחיקה (Immutable Audit Logs)
CREATE TABLE public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 3. יצירת אינדקסים לשיפור ביצועי שאילתות
-- =========================================================================
CREATE INDEX idx_cases_panel ON public.cases(panel_id);
CREATE INDEX idx_case_participants_user ON public.case_participants(user_id);
CREATE INDEX idx_case_participants_case ON public.case_participants(case_id);
CREATE INDEX idx_hearings_case ON public.hearings(case_id);
CREATE INDEX idx_hearings_panel ON public.hearings(panel_id);
CREATE INDEX idx_documents_hearing ON public.documents(hearing_id);
CREATE INDEX idx_documents_case ON public.documents(case_id);
CREATE INDEX idx_documents_uploader ON public.documents(uploaded_by);
CREATE INDEX idx_requests_case ON public.requests(case_id);
CREATE INDEX idx_requests_user ON public.requests(user_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);

-- =========================================================================
-- 4. הגדרות ROW LEVEL SECURITY (RLS)
-- =========================================================================

-- הפעלת RLS על כל הטבלאות
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 5. פונקציות עזר מאובטחות (SECURITY DEFINER)
-- =========================================================================

-- א. פונקציה לבדיקה האם המשתמש המחובר הוא חבר מזכירות
CREATE OR REPLACE FUNCTION public.is_secretariat()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND system_role = 'secretariat'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ב. פונקציה למניעת רקורסיה אינסופית: בודקת שיוך של משתמש לתיק תוך עקיפת RLS של טבלת הקשר
CREATE OR REPLACE FUNCTION public.check_case_access(target_case_id UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.case_participants
        WHERE case_participants.case_id = target_case_id 
          AND case_participants.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 6. פוליסות RLS (Security Policies)
-- =========================================================================

-- א. פוליסות עבור PROFILES
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Secretariat has full control over profiles" 
ON public.profiles FOR ALL TO authenticated USING (public.is_secretariat());

-- ב. פוליסות עבור PANELS
CREATE POLICY "Panels are viewable by authenticated users" 
ON public.panels FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only secretariat can modify panels" 
ON public.panels FOR ALL TO authenticated USING (public.is_secretariat());

-- ג. פוליסות עבור CASES (שימוש ב-check_case_access למניעת רקורסיה)
CREATE POLICY "Secretariat can view all cases" 
ON public.cases FOR SELECT TO authenticated USING (public.is_secretariat());

CREATE POLICY "Litigants can view cases they participate in" 
ON public.cases FOR SELECT TO authenticated USING (public.check_case_access(id));

CREATE POLICY "Only secretariat can modify cases" 
ON public.cases FOR ALL TO authenticated USING (public.is_secretariat());

-- ד. פוליסות עבור CASE_PARTICIPANTS
CREATE POLICY "Secretariat can view all case participants" 
ON public.case_participants FOR SELECT TO authenticated USING (public.is_secretariat());

CREATE POLICY "Users can view their own participant records" 
ON public.case_participants FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Only secretariat can modify case participants" 
ON public.case_participants FOR ALL TO authenticated USING (public.is_secretariat());

-- ה. פוליסות עבור HEARINGS
CREATE POLICY "Secretariat can view all hearings" 
ON public.hearings FOR SELECT TO authenticated USING (public.is_secretariat());

CREATE POLICY "Users can view hearings for their cases" 
ON public.hearings FOR SELECT TO authenticated USING (public.check_case_access(case_id));

CREATE POLICY "Only secretariat can modify hearings" 
ON public.hearings FOR ALL TO authenticated USING (public.is_secretariat());

-- ו. פוליסות עבור DOCUMENTS
CREATE POLICY "Secretariat can view all documents" 
ON public.documents FOR SELECT TO authenticated USING (public.is_secretariat());

CREATE POLICY "Users can view authorized documents in their cases" 
ON public.documents FOR SELECT TO authenticated USING (
    uploaded_by = auth.uid() -- מסמך שהם עצמם העלו
    OR 
    (
        (document_type = 'secretariat' OR is_shared = true) -- החלטת בי"ד או מסמך שהותר לשיתוף
        AND public.check_case_access(case_id) -- משתמש משויך לתיק
    )
);

CREATE POLICY "Secretariat can insert any document" 
ON public.documents FOR INSERT TO authenticated WITH CHECK (public.is_secretariat());

CREATE POLICY "Litigants can insert documents to hearings they participate in" 
ON public.documents FOR INSERT TO authenticated WITH CHECK (
    uploaded_by = auth.uid()
    AND public.check_case_access(case_id)
);

CREATE POLICY "Secretariat can update/delete any document" 
ON public.documents FOR ALL TO authenticated USING (public.is_secretariat());

-- ז. פוליסות עבור REQUESTS
CREATE POLICY "Secretariat can view all requests" 
ON public.requests FOR SELECT TO authenticated USING (public.is_secretariat());

CREATE POLICY "Users can view their own requests" 
ON public.requests FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own requests" 
ON public.requests FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() 
    AND public.check_case_access(case_id)
);

CREATE POLICY "Only secretariat can update/modify requests" 
ON public.requests FOR ALL TO authenticated USING (public.is_secretariat());

-- ח. פוליסות עבור AUDIT_LOGS
CREATE POLICY "Secretariat can view all audit logs" 
ON public.audit_logs FOR SELECT TO authenticated USING (public.is_secretariat());

-- חסימת עדכונים ומחיקות לחלוטין ברמת ה-RLS (אין פוליסת UPDATE/DELETE)
-- INSERT מותר רק למערכת (SECURITY DEFINER טריגרים) לכן לא מוגדר פוליסי כתיבה ציבורי

-- =========================================================================
-- 7. מנגנון הרשאה מיוחד ל-Supabase Storage Buckets (court-documents)
-- =========================================================================
-- יש להחיל פוליסות אלו על ה-Bucket 'court-documents' בלוח הבקרה של Supabase

-- שיתוף קריאה מאובטח על בסיס רשומת מסמך מאושר ב-DB
-- CREATE POLICY "Allow read only if document record exists in DB"
-- ON storage.objects FOR SELECT TO authenticated
-- USING (
--     bucket_id = 'court-documents'
--     AND EXISTS (
--         SELECT 1 FROM public.documents 
--         WHERE file_path = name
--     )
-- );

-- הרשאת העלאה מותנית בהיות המשתמש מחובר
-- CREATE POLICY "Allow upload for authenticated users"
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK (
--     bucket_id = 'court-documents'
--     AND auth.uid() IS NOT NULL
-- );

-- =========================================================================
-- 8. טריגרים (Triggers)
-- =========================================================================

-- א. מנגנון סנכרון אוטומטי ומאובטח בעת הרשמה (Auth to Profiles)
-- חסימת Privilege Escalation: תפקיד המשתמש החדש נקבע קשיח כ-litigant
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, phone, system_role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'משתמש חדש'),
        NEW.email,
        NEW.raw_user_meta_data->>'phone',
        'litigant'::system_role_type -- ערך קשיח ומאובטח בלבד
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ב. מנגנון לוג תיעוד שינויים אוטומטי (Audit Logging)
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    action_type TEXT;
    rec_id UUID;
    old_val JSONB := NULL;
    new_val JSONB := NULL;
BEGIN
    -- קבלת מזהה המשתמש המחובר שביצע את השינוי
    current_user_id := auth.uid();
    
    -- קביעת סוג הפעולה והמזהה
    IF (TG_OP = 'INSERT') THEN
        action_type := 'INSERT';
        rec_id := NEW.id;
        new_val := to_jsonb(NEW);
    ELSIF (TG_OP = 'UPDATE') THEN
        action_type := 'UPDATE';
        rec_id := NEW.id;
        old_val := to_jsonb(OLD);
        new_val := to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        action_type := 'DELETE';
        rec_id := OLD.id;
        old_val := to_jsonb(OLD);
    END IF;

    -- רישום לוג השינויים
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (current_user_id, action_type, TG_TABLE_NAME, rec_id, old_val, new_val);

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- החלת טריגר התיעוד על טבלאות המפתח
CREATE OR REPLACE TRIGGER audit_cases_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.cases
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

CREATE OR REPLACE TRIGGER audit_documents_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

CREATE OR REPLACE TRIGGER audit_requests_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.requests
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
