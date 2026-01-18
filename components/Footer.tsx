
import React from 'react';
import { Tv, ShieldCheck, ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#020617] border-t border-white/5 py-24 px-8 mt-24">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col items-center mb-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6 mb-12">
            <div className="w-16 h-16 glass rounded-[2rem] flex items-center justify-center text-primary shadow-2xl shadow-primary/20 border-white/10 group hover:rotate-12 transition-transform duration-500">
              <Tv size={28} strokeWidth={3} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2">REET TV</h2>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">ELITE BROADCAST ENGINE</p>
            </div>
          </div>

          <a
            href="https://reetkumarbind-portfolio.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 p-2 pr-6 glass rounded-full border-white/5 hover:bg-white/5 transition-all hover:scale-105 active:scale-95"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 p-0.5">
              <img
                src="https://reetkumarbind5.github.io/Profile/profile.png"
                alt="Reet Kumar Bind"
                className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <div>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] block">Architected By</span>
              <span className="text-[11px] font-black text-white uppercase tracking-widest group-hover:text-primary transition-colors">REET KUMAR BIND</span>
            </div>
            <ExternalLink size={14} className="text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
          </a>
        </div>

        {/* Legal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pt-16 border-t border-white/5">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary mb-6">
              <ShieldCheck size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Security & Legal</span>
            </div>
            <p className="text-xs font-medium text-text-muted leading-loose uppercase tracking-wide">
              REET TV operates as a neutral aggregation interface. We do not host nor transmit any media content.
              All broadcast signals are sourced from open-directory protocols globally.
            </p>
          </div>

          <div className="space-y-6">
            <div className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-6">Engine Protocols</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 glass rounded-2xl border-white/5">
                <div className="text-white text-[10px] font-black mb-1 uppercase">HLS V3</div>
                <div className="text-text-muted text-[8px] font-bold uppercase tracking-widest">Optimized Engine</div>
              </div>
              <div className="p-4 glass rounded-2xl border-white/5">
                <div className="text-white text-[10px] font-black mb-1 uppercase">M3U8</div>
                <div className="text-text-muted text-[8px] font-bold uppercase tracking-widest">Global Playlist</div>
              </div>
            </div>
          </div>

          <div className="space-y-6 flex flex-col lg:items-end">
            <div className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-6">Access Layer</div>
            <div className="flex flex-wrap lg:justify-end gap-x-8 gap-y-4">
              {['Legal Notice', 'Privacy Protocal', 'DMCA Layer', 'Terms of Service'].map(link => (
                <a key={link} href="#" className="text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-primary transition-colors whitespace-nowrap">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* System Bar */}
        <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em]">
              &copy; {new Date().getFullYear()} CORE VERSION 5.2.0
            </span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">All Systems Nominal</span>
            </div>
          </div>

          <div className="text-[9px] font-black text-text-muted uppercase tracking-[0.4em]">
            Optimized for Neural-X Fast-Pass Technology
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
