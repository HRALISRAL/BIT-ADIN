// lib/utils/masking.ts - פונקציות עזר למסוך נתונים רגישים (PII)
export function maskPhone(phone?: string): string {
  if (!phone) return '';
  const cleaned = phone.trim();
  if (cleaned.length < 5) return cleaned;
  if (cleaned.includes('-')) {
    const parts = cleaned.split('-');
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      const maskedLast = lastPart.length > 4 
        ? '***' + lastPart.slice(-4) 
        : '***' + lastPart.slice(-2);
      return parts.slice(0, -1).join('-') + '-' + maskedLast;
    }
  }
  return cleaned.slice(0, 3) + '***' + cleaned.slice(-4);
}

export function maskName(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(' ');
  return parts.map((part) => {
    if (part.length <= 1) return part;
    if (part.length === 2) return part[0] + '*';
    return part[0] + '*'.repeat(part.length - 2) + part[part.length - 1];
  }).join(' ');
}
