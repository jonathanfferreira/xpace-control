// Analytics utilities for GA4 and Meta Pixel

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    fbq?: (...args: any[]) => void;
  }
}

// GA4 Configuration
const GA4_ID = import.meta.env.VITE_GA4_ID || '';
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '';

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

// Initialize Meta Pixel
export const initMetaPixel = () => {
  if (!META_PIXEL_ID) {
    console.warn('META_PIXEL_ID not configured');
    return;
  }

  /* eslint-disable */
  (function (f: any, b: any, e: any, v: any) {
    let n: any, t: any, s: any;
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    if (s && s.parentNode) {
      s.parentNode.insertBefore(t, s);
    }
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  if (window.fbq) {
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }
};

// Event tracking functions
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  // GA4
  if (window.gtag) {
    window.gtag('event', eventName, params);
  }

  // Meta Pixel
  if (window.fbq) {
    window.fbq('trackCustom', eventName, params);
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

  // Meta Pixel specific event
  if (window.fbq) {
    window.fbq('track', 'CompleteRegistration');
  }
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

  // Meta Pixel specific event
  if (window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      value: amount,
      currency: 'BRL',
    });
  }
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
