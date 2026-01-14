// Security Service for IPTV App
export class SecurityService {
  private static readonly ENCRYPTION_KEY = 'iptv-app-security-key-2024';
  
  // Content Security Policy
  static getCSPHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for React dev
        "style-src 'self' 'unsafe-inline'", // Required for styled components
        "img-src 'self' data: https: http:", // Allow images from external sources
        "media-src 'self' https: http: blob:", // Allow video streams
        "connect-src 'self' https: http: ws: wss:", // Allow API calls and websockets
        "font-src 'self' data:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'"
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
    };
  }

  // Input Sanitization
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .slice(0, 1000); // Limit length
  }

  // URL Validation
  static isValidStreamUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const allowedProtocols = ['http:', 'https:', 'rtmp:', 'rtmps:'];
      
      // Check protocol
      if (!allowedProtocols.includes(parsedUrl.protocol)) {
        return false;
      }
      
      // For development, allow most HTTPS/HTTP URLs
      // In production, you should whitelist specific domains
      return true;
    } catch {
      return false;
    }
  }

  // Rate Limiting
  private static requestCounts = new Map<string, { count: number; resetTime: number }>();
  
  static checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const key = identifier;
    const current = this.requestCounts.get(key);
    
    if (!current || now > current.resetTime) {
      this.requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (current.count >= maxRequests) {
      return false;
    }
    
    current.count++;
    return true;
  }

  // Simple encryption for localStorage (not cryptographically secure, just obfuscation)
  static encryptData(data: string): string {
    try {
      const encoded = btoa(data);
      return encoded.split('').reverse().join('');
    } catch {
      return data;
    }
  }

  static decryptData(encryptedData: string): string {
    try {
      const reversed = encryptedData.split('').reverse().join('');
      return atob(reversed);
    } catch {
      return encryptedData;
    }
  }

  // Secure localStorage wrapper
  static setSecureItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      const encrypted = this.encryptData(serialized);
      localStorage.setItem(`secure_${key}`, encrypted);
    } catch (error) {
      console.error('Failed to store secure item:', error);
    }
  }

  static getSecureItem<T>(key: string, defaultValue: T): T {
    try {
      const encrypted = localStorage.getItem(`secure_${key}`);
      if (!encrypted) return defaultValue;
      
      const decrypted = this.decryptData(encrypted);
      return JSON.parse(decrypted);
    } catch {
      return defaultValue;
    }
  }

  // Security headers validation
  static validateSecurityHeaders(): boolean {
    // Check if running over HTTPS in production
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.warn('⚠️ App should be served over HTTPS in production');
      return false;
    }
    
    return true;
  }

  // Detect potential security threats
  static detectThreats(): string[] {
    const threats: string[] = [];
    
    // Check for suspicious URL parameters
    const params = new URLSearchParams(location.search);
    for (const [key, value] of params) {
      if (value.includes('<script') || value.includes('javascript:')) {
        threats.push('Suspicious URL parameter detected');
        break;
      }
    }
    
    // Check for console tampering attempts
    if (typeof console.clear !== 'function') {
      threats.push('Console tampering detected');
    }
    
    // Check for common XSS patterns in DOM
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.src && !script.src.startsWith(location.origin) && !script.src.startsWith('https://')) {
        threats.push('Untrusted script source detected');
      }
    });
    
    return threats;
  }

  // Initialize security measures
  static initialize(): void {
    // Validate security headers
    this.validateSecurityHeaders();
    
    // Detect threats
    const threats = this.detectThreats();
    if (threats.length > 0) {
      console.warn('🚨 Security threats detected:', threats);
    }
    
    // Disable right-click in production (optional)
    if (process.env.NODE_ENV === 'production') {
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });
      
      // Disable F12, Ctrl+Shift+I, etc.
      document.addEventListener('keydown', (e) => {
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'C') ||
          (e.ctrlKey && e.key === 'U')
        ) {
          e.preventDefault();
        }
      });
    }
    
    console.log('🔒 Security service initialized');
  }
}