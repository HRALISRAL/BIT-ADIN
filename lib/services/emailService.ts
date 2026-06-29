import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn("⚠️ Warning: RESEND_API_KEY is not set. Email notifications will be skipped.");
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Default sender email (if they configure custom domain, they can update this. 
// Resend allows sending to the account owner using onboarding@resend.dev by default).
const FROM_EMAIL = 'בית הדין <onboarding@resend.dev>';

export const emailService = {
  /**
   * Send notification about a scheduled hearing to plaintiff and defendant
   */
  async sendHearingNotification(
    toEmails: string[],
    caseNumber: string,
    caseTitle: string,
    dateStr: string,
    timeStr: string,
    panelName: string
  ) {
    if (!resend) return;

    try {
      // Clean up emails (remove empty/null values)
      const recipients = toEmails.filter(email => !!email);
      if (recipients.length === 0) return;

      const date = new Date(dateStr);
      const formattedDate = date.toLocaleDateString('he-IL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: recipients,
        subject: `בית הדין: נקבע דיון בתיק ${caseNumber} - ${caseTitle}`,
        html: `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: right; background-color: #faf6ee; padding: 25px; border-radius: 16px; border: 2px solid #eadeca; max-width: 600px; margin: 0 auto; color: #2d1e10;">
            <div style="border-bottom: 2px solid #eadeca; padding-bottom: 15px; margin-bottom: 20px; text-align: center;">
              <h1 style="color: #8b5a2b; font-family: Georgia, serif; margin: 0; font-size: 24px;">בית הדין הגבוה</h1>
            </div>
            
            <h2 style="color: #8b5a2b; font-size: 20px; margin-top: 0;">שלום רב,</h2>
            <p style="font-size: 15px; line-height: 1.6;">ברצוננו לעדכן כי נקבע דיון חדש במערכת בתיק שלך:</p>
            
            <div style="background-color: #ffffff; border: 1px solid #eadeca; border-radius: 12px; padding: 15px; margin: 20px 0; font-size: 15px; line-height: 1.8;">
              <strong>מספר תיק:</strong> ${caseNumber}<br />
              <strong>שם התיק:</strong> ${caseTitle}<br />
              <strong>הרכב הדיינים:</strong> ${panelName}<br />
              <strong>תאריך הדיון:</strong> ${formattedDate}<br />
              <strong>שעת הדיון:</strong> ${timeStr}
            </div>
            
            <p style="font-size: 15px; line-height: 1.6;">אנא היערכו בהתאם והגיעו במועד שנקבע. ניתן לצפות בפרטי התיק המלאים ולהעלות מסמכים רלוונטיים באזור האישי שלך באתר בית הדין.</p>
            
            <div style="border-top: 1px solid #eadeca; padding-top: 15px; margin-top: 25px; font-size: 12px; color: #7c6a5c; text-align: center;">
              הודעה זו נשלחה אליך באופן אוטומטי ממערכת בית הדין. נא לא להשיב למייל זה.
            </div>
          </div>
        `
      });

      if (error) {
        console.error("Failed to send hearing email via Resend:", error);
      } else {
        console.log("Hearing email sent successfully:", data);
      }
    } catch (err) {
      console.error("Error in sendHearingNotification:", err);
    }
  },

  /**
   * Send notification about a document request to the litigant
   */
  async sendDocumentRequestNotification(
    toEmail: string,
    caseNumber: string,
    caseTitle: string,
    requestTitle: string,
    requestDescription: string
  ) {
    if (!resend || !toEmail) return;

    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: toEmail,
        subject: `בית הדין: נדרש מסמך בתיק ${caseNumber}`,
        html: `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: right; background-color: #faf6ee; padding: 25px; border-radius: 16px; border: 2px solid #eadeca; max-width: 600px; margin: 0 auto; color: #2d1e10;">
            <div style="border-bottom: 2px solid #eadeca; padding-bottom: 15px; margin-bottom: 20px; text-align: center;">
              <h1 style="color: #8b5a2b; font-family: Georgia, serif; margin: 0; font-size: 24px;">בית הדין הגבוה</h1>
            </div>
            
            <h2 style="color: #8b5a2b; font-size: 20px; margin-top: 0;">שלום רב,</h2>
            <p style="font-size: 15px; line-height: 1.6;">ברצוננו לעדכן כי נדרש מסמך חדש בתיק מספר <strong>${caseNumber}</strong> המנוהל בבית הדין.</p>
            
            <div style="background-color: #ffffff; border: 1px solid #eadeca; border-radius: 12px; padding: 15px; margin: 20px 0; font-size: 15px; line-height: 1.8;">
              <strong style="color: #8b5a2b; font-size: 16px;">פרטי הדרישה:</strong><br />
              <strong>שם המסמך הנדרש:</strong> ${requestTitle}<br />
              ${requestDescription ? `<strong>תיאור/הנחיות:</strong> ${requestDescription}<br />` : ''}
            </div>
            
            <p style="font-size: 15px; line-height: 1.6;">להעלאת המסמך, אנא היכנס לאזור האישי שלך באתר בית הדין והעלה אותו ישירות תחת כרטיס הדרישה המתאים.</p>
            
            <div style="border-top: 1px solid #eadeca; padding-top: 15px; margin-top: 25px; font-size: 12px; color: #7c6a5c; text-align: center;">
              הודעה זו נשלחה אליך באופן אוטומטי ממערכת בית הדין. נא לא להשיב למייל זה.
            </div>
          </div>
        `
      });

      if (error) {
        console.error("Failed to send document request email via Resend:", error);
      } else {
        console.log("Document request email sent successfully:", data);
      }
    } catch (err) {
      console.error("Error in sendDocumentRequestNotification:", err);
    }
  },

  /**
   * Send notification to the secretariat when a client uploads a document
   */
  async sendDocumentUploadedNotification(
    secretariatEmail: string,
    caseNumber: string,
    caseTitle: string,
    uploaderName: string,
    fileName: string
  ) {
    if (!resend || !secretariatEmail) return;

    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: secretariatEmail,
        subject: `בית הדין: הוגש מסמך חדש בתיק ${caseNumber} על ידי ${uploaderName}`,
        html: `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: right; background-color: #faf6ee; padding: 25px; border-radius: 16px; border: 2px solid #eadeca; max-width: 600px; margin: 0 auto; color: #2d1e10;">
            <div style="border-bottom: 2px solid #eadeca; padding-bottom: 15px; margin-bottom: 20px; text-align: center;">
              <h1 style="color: #8b5a2b; font-family: Georgia, serif; margin: 0; font-size: 24px;">בית הדין הגבוה</h1>
            </div>
            
            <h2 style="color: #8b5a2b; font-size: 20px; margin-top: 0;">שלום למזכירות,</h2>
            <p style="font-size: 15px; line-height: 1.6;">ברצוננו לעדכן כי בעל דין הגיש מסמך חדש בתיק מספר <strong>${caseNumber}</strong> (${caseTitle}):</p>
            
            <div style="background-color: #ffffff; border: 1px solid #eadeca; border-radius: 12px; padding: 15px; margin: 20px 0; font-size: 15px; line-height: 1.8;">
              <strong>שם המגיש:</strong> ${uploaderName}<br />
              <strong>שם הקובץ שהועלה:</strong> ${fileName}
            </div>
            
            <p style="font-size: 15px; line-height: 1.6;">לצפייה במסמך ובפרטי התיק, אנא היכנסו ללוח הבקרה של המזכירות.</p>
            
            <div style="border-top: 1px solid #eadeca; padding-top: 15px; margin-top: 25px; font-size: 12px; color: #7c6a5c; text-align: center;">
              הודעה זו נשלחה באופן אוטומטי ממערכת בית הדין. נא לא להשיב למייל זה.
            </div>
          </div>
        `
      });

      if (error) {
        console.error("Failed to send document uploaded email via Resend:", error);
      } else {
        console.log("Document uploaded email sent successfully:", data);
      }
    } catch (err) {
      console.error("Error in sendDocumentUploadedNotification:", err);
    }
  }
};
