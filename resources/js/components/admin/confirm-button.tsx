import { AdminButton } from '@/components/admin/admin-button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ReactNode, useState } from 'react';

export function ConfirmButton({
    recordName,
    description,
    confirmLabel,
    onConfirm,
    children,
}: {
    recordName: string;
    description?: string;
    confirmLabel?: string;
    onConfirm: () => void;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <AdminButton
                variant="danger"
                className="h-auto px-2 py-1"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen(true);
                }}
            >
                {children}
            </AdminButton>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-[var(--shop-surface)] text-[var(--shop-text)]">
                    <DialogHeader>
                        <DialogTitle>Remove {recordName}?</DialogTitle>
                        <DialogDescription className="text-[var(--shop-text-muted)]">
                            {description ?? `This will permanently remove ${recordName}.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <AdminButton variant="secondary" onClick={() => setOpen(false)}>
                            Cancel
                        </AdminButton>
                        <AdminButton
                            variant="danger"
                            className="bg-[var(--shop-danger)] text-white hover:opacity-90"
                            onClick={() => {
                                onConfirm();
                                setOpen(false);
                            }}
                        >
                            {confirmLabel ?? `Remove ${recordName}`}
                        </AdminButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
