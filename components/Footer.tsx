
import React from 'react';
import { Tv, ShieldCheck, ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#050505] border-t border-red-900/20 py-16 px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-10">
        
        {/* Brand Logo & Credit Section - Red and Black Combinations */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-600 rounded-lg text-black shadow-lg shadow-red-600/20">
              <Tv size={24} strokeWidth={3} />
            </div>
            <span className="text-xl font-black uppercase tracking-[0.3em] text-white">Free TV Chanal</span>
          </div>
          
          <a 
            href="https://streamofr.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-6 py-2.5 bg-red-600/10 border border-red-600/30 rounded-full transition-all hover:bg-red-600 hover:border-red-600 active:scale-95"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-red-500 group-hover:text-black transition-colors">Build by Pradip Nalwaya</span>
            <ExternalLink size={12} className="text-red-500 group-hover:text-black transition-colors" />
          </a>
        </div>
        
        {/* Disclaimer Area */}
        <div className="max-w-3xl text-center">
          <div className="flex items-center justify-center gap-2 text-red-500 mb-4">
            <ShieldCheck size={18} strokeWidth={2.5} />
            <span className="text-[11px] font-black uppercase tracking-[0.25em]">Legal Notice</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-medium px-4">
            Free TV Chanal is a neutral interface for accessing publicly available IPTV resources. 
            We do not host, broadcast, or store any media content on our servers. All streams are 
            aggregated from open sources on the internet and remain the intellectual property 
            of their respective copyright holders. This platform is intended solely for 
            personal entertainment and non-commercial educational use.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-white/5 w-full flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:items-start items-center gap-1">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              &copy; {new Date().getFullYear()} Premium Stream Interface
            </p>
            <p className="text-[8px] text-red-900 font-bold uppercase tracking-widest">
              Optimized for high performance
            </p>
          </div>
          
          <div className="flex items-center gap-8">
            <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest hover:text-red-500 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest hover:text-red-500 cursor-pointer transition-colors">Terms of Use</span>
            <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest hover:text-red-500 cursor-pointer transition-colors">DMCA Report</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
