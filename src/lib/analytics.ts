// Analytics utilities for GA4

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// GA4 Configuration
const GA4_ID = import.meta.env.VITE_GA4_ID || '';

// Initialize GA4
export const initGA4 = () => {
  if (!GA4_ID) {
    console.warn('GA4_ID not configured');
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA4_ID);
};

// Event tracking functions
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  // GA4
  if (window.gtag) {
    window.gtag('event', eventName, params);
  }

  // Console log for development
  console.log(`Analytics Event: ${eventName}`, params);
};

// Specific event tracking functions
export const trackSignupCompleted = (userId: string, email: string) => {
  trackEvent('signup_completed', {
    user_id: userId,
    email,
    method: 'email',
  });
};

export const trackClassCreated = (classId: string, className: string) => {
  trackEvent('class_created', {
    class_id: classId,
    class_name: className,
  });
};

export const trackQRRead = (type: 'attendance' | 'event', entityId: string) => {
  trackEvent('qr_read', {
    qr_type: type,
    entity_id: entityId,
  });
};

export const trackPaymentGenerated = (amount: number, studentId: string) => {
  trackEvent('payment_generated', {
    value: amount,
    currency: 'BRL',
    student_id: studentId,
  });
};

export const trackReportExport = (reportType: string) => {
  trackEvent('report_export', {
    report_type: reportType,
  });
};

export const trackPageView = (path: string, title: string) => {
  trackEvent('page_view', {
    page_path: path,
    page_title: title,
  });
};
