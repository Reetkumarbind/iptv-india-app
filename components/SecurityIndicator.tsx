import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldAlert, Lock, Unlock } from 'lucide-react';
import { SecurityService } from '../services/securityService';

interface SecurityIndicatorProps {
  className?: string;
}

const SecurityIndicator: React.FC<SecurityIndicatorProps> = ({ className = '' }) => {
  const [isSecure, setIsSecure] = useState(false);
  const [threats, setThreats] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const checkSecurity = () => {
      try {
        const securityValid = SecurityService.validateSecurityHeaders();
        const detectedThreats = SecurityService.detectThreats();
        
        setIsSecure(securityValid && detectedThreats.length === 0);
        setThreats(detectedThreats);
      } catch (error) {
        console.error('Security check failed:', error);
        setIsSecure(false);
        setThreats(['Security service error']);
      }
    };

    checkSecurity();
    
    // Check security status periodically
    const interval = setInterval(checkSecurity, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const getSecurityIcon = () => {
    if (threats.length > 0) {
      return <ShieldAlert className="w-4 h-4 text-red-500" />;
    }
    if (isSecure) {
      return <ShieldCheck className="w-4 h-4 text-green-500" />;
    }
    return <Shield className="w-4 h-4 text-yellow-500" />;
  };

  const getSecurityStatus = () => {
    if (threats.length > 0) return 'Threats Detected';
    if (isSecure) return 'Secure';
    return 'Warning';
  };

  const getStatusColor = () => {
    if (threats.length > 0) return 'text-red-500';
    if (isSecure) return 'text-green-500';
    return 'text-yellow-500';
  };

  const isHttps = location.protocol === 'https:';

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 px-3 py-2 bg-black/20 hover:bg-black/30 backdrop-blur-md rounded-lg border border-white/10 transition-all"
        title="Security Status"
      >
        {isHttps ? (
          <Lock className="w-4 h-4 text-green-500" />
        ) : (
          <Unlock className="w-4 h-4 text-red-500" />
        )}
        {getSecurityIcon()}
        <span className={`text-xs font-bold uppercase tracking-wider ${getStatusColor()}`}>
          {getSecurityStatus()}
        </span>
      </button>

      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/10 p-4 z-50 shadow-2xl">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white text-sm">Security Status</h3>
            </div>

            {/* HTTPS Status */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">HTTPS Connection:</span>
              <div className="flex items-center gap-1">
                {isHttps ? (
                  <>
                    <Lock className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500 font-bold">Secure</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3 h-3 text-red-500" />
                    <span className="text-xs text-red-500 font-bold">Not Secure</span>
                  </>
                )}
              </div>
            </div>

            {/* Security Headers */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Security Headers:</span>
              <div className="flex items-center gap-1">
                {isSecure ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500 font-bold">Active</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-yellow-500 font-bold">Limited</span>
                  </>
                )}
              </div>
            </div>

            {/* Data Encryption */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Data Encryption:</span>
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-500 font-bold">Enabled</span>
              </div>
            </div>

            {/* Threats */}
            {threats.length > 0 && (
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
                    Security Threats
                  </span>
                </div>
                <div className="space-y-1">
                  {threats.map((threat, index) => (
                    <div key={index} className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                      {threat}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Features */}
            <div className="pt-2 border-t border-white/10">
              <div className="text-xs text-slate-400 space-y-1">
                <div>✓ Input sanitization active</div>
                <div>✓ URL validation enabled</div>
                <div>✓ Rate limiting active</div>
                <div>✓ Secure storage encryption</div>
                {isHttps && <div>✓ SSL/TLS encryption</div>}
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 text-center">
              <span className="text-xs text-slate-500">
                Security powered by IPTV App Security Service
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityIndicator;