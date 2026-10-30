import { useState, useEffect } from "react";
import { ShoppingBag, CheckCircle2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { SocialProofNotification } from "@shared/socialProofPopups";

export default function SocialProofPopup() {
  const feedQuery = trpc.socialProofPopups.getFeed.useQuery();
  const data = feedQuery.data;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!data || !data.config.enabled || !data.notifications || data.notifications.length === 0) {
      return;
    }

    const intervalMs = (data.config.displayIntervalSeconds || 8) * 1000;

    const timer = setInterval(() => {
      // Show popup for 4 seconds then hide
      setIsVisible(true);
      setTimeout(() => {
        setIsVisible(false);
        setCurrentIndex((prev) => (prev + 1) % data.notifications.length);
      }, 4000);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [data]);

  if (!data || !data.config.enabled || !data.notifications || data.notifications.length === 0) {
    return null;
  }

  const currentNotif: SocialProofNotification = data.notifications[currentIndex];

  if (!isVisible || !currentNotif) return null;

  return (
    <div className="fixed z-40 bottom-5 left-5 max-w-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {currentNotif.productImageUrl ? (
        <img
          src={currentNotif.productImageUrl}
          alt={currentNotif.productTitle}
          className="w-12 h-12 rounded-lg object-cover border border-slate-100 shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
          <ShoppingBag className="w-6 h-6" />
        </div>
      )}

      <div className="flex-1 min-w-0 text-xs">
        <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100 truncate">
          <span>{currentNotif.customerName}</span>
          <span className="text-[10px] text-slate-400 font-normal">({currentNotif.city})</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
          A acheté <strong className="text-slate-800 dark:text-slate-100">{currentNotif.productTitle}</strong>
        </p>
        <span className="text-[10px] text-indigo-600 font-semibold block mt-0.5">
          {currentNotif.timeAgo} • <CheckCircle2 className="w-2.5 h-2.5 inline text-emerald-500" /> Achat Vérifié
        </span>
      </div>

      <button
        onClick={() => setIsVisible(false)}
        className="text-slate-400 hover:text-slate-600 p-1"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
