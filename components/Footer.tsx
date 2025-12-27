
import React from 'react';
import { Tv, ShieldCheck } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-950 border-t border-white/5 py-12 px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 opacity-40 grayscale">
          <Tv size={20} />
          <span className="text-sm font-black uppercase tracking-widest">Free TV Chanal</span>
        </div>
        
        <div className="max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-blue-500/50 mb-3">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Legal Disclaimer</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            This application does not host, provide, archive, store, or distribute media of any kind. 
            It acts purely as an interface to access publicly available IPTV links found on the internet. 
            All content remains the property of their respective owners. This service is intended for 
            personal entertainment and educational purposes only. Users are encouraged to support official broadcasters.
          </p>
        </div>

        <div className="pt-6 border-t border-white/5 w-full flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Premium Stream Interface
          </p>
          <div className="flex gap-6">
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest hover:text-blue-500 cursor-pointer transition">Privacy</span>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest hover:text-blue-500 cursor-pointer transition">Terms</span>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest hover:text-blue-500 cursor-pointer transition">DMCA</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
