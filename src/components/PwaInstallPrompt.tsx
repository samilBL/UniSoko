'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function wasDismissed() {
  try {
    return localStorage.getItem('unisoko-pwa-dismissed') === 'true';
  } catch {
    return false;
  }
}

function rememberDismissal() {
  try {
    localStorage.setItem('unisoko-pwa-dismissed', 'true');
  } catch {
    return;
  }
}

export default function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }

    const platformIsIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const timer = window.setTimeout(() => {
      setIsIos(platformIsIos);
      setShowBanner(!standalone && platformIsIos && !wasDismissed());
    }, 0);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
      setShowBanner(!wasDismissed());
    };
    const onAppInstalled = () => setShowBanner(false);
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvent) {
      setShowIosHelp(true);
      return;
    }
    await installEvent.prompt();
    await installEvent.userChoice;
    setShowBanner(false);
    setInstallEvent(null);
  };

  if (!showBanner) return null;

  return (
    <aside className="fixed inset-x-3 bottom-3 z-60 mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/95 p-3 text-slate-900 shadow-2xl shadow-slate-950/20 backdrop-blur-xl sm:hidden" aria-label="Install UniSoko app">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white"><Download className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1"><p className="text-sm font-extrabold">Install UniSoko App</p><p className="text-[11px] text-slate-600">Quick access to campus deals from your home screen.</p></div>
        <button onClick={() => { rememberDismissal(); setShowBanner(false); }} aria-label="Dismiss install banner" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
      </div>
      <button onClick={() => void install()} className="mt-3 min-h-11 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700">{installEvent ? 'Install now' : 'Add to Home Screen'}</button>
      {showIosHelp && isIos && <p className="mt-2 text-center text-[11px] text-slate-600">In Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</p>}
    </aside>
  );
}
