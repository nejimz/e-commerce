import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

type Flash = { success?: string; error?: string };

export function StoreToast({ flash }: { flash: Flash }) {
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (flash.success) {
            setNotice({ type: 'success', text: flash.success });
        } else if (flash.error) {
            setNotice({ type: 'error', text: flash.error });
        }
    }, [flash.success, flash.error]);

    useEffect(() => {
        if (!notice || notice.type === 'error') {
            return;
        }
        const timer = window.setTimeout(() => setNotice(null), 4000);

        return () => window.clearTimeout(timer);
    }, [notice]);

    if (!notice) {
        return null;
    }

    return (
        <div
            role={notice.type === 'error' ? 'alert' : 'status'}
            className={cn(
                'fixed z-50 mx-4 max-w-sm rounded-[var(--shop-radius-card)] px-4 py-3 text-sm shadow-[var(--shop-shadow-e3)]',
                'top-20 left-1/2 w-[calc(100%-2rem)] -translate-x-1/2 md:top-auto md:bottom-6 md:left-auto md:right-6 md:w-auto md:translate-x-0',
                notice.type === 'error'
                    ? 'bg-[var(--shop-danger)] text-white'
                    : 'bg-[var(--shop-text)] text-white',
            )}
        >
            <div className="flex items-start gap-3">
                <p className="flex-1">{notice.text}</p>
                <button type="button" className="shrink-0 rounded p-1 opacity-80 hover:opacity-100" onClick={() => setNotice(null)} aria-label="Dismiss">
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
