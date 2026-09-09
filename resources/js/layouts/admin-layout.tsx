import { adminBtnClass } from '@/components/admin/admin-button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    FolderTree,
    LayoutDashboard,
    LogOut,
    MapPin,
    Menu,
    Package,
    PanelLeft,
    PanelLeftClose,
    Settings,
    ShoppingBag,
    Store,
    Tag,
    TicketPercent,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { PropsWithChildren, useEffect, useState } from 'react';

type AdminShared = {
    name: string;
    auth: { user: { name: string; email: string; role?: string } | null };
    flash: { success?: string; error?: string };
};

type NavItem = { href: string; label: string; icon: LucideIcon };

const STORAGE_KEY = 'admin-sidebar-collapsed';

const operations: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/customers', label: 'Customers', icon: Users },
];

const storeNav: NavItem[] = [
    { href: '/admin/categories', label: 'Categories', icon: FolderTree },
    { href: '/admin/brands', label: 'Brands', icon: Tag },
    { href: '/admin/coupons', label: 'Promos', icon: TicketPercent },
    { href: '/admin/areas', label: 'Shipping', icon: MapPin },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
];

function isActive(url: string, href: string) {
    if (href === '/admin') {
        return url === '/admin' || url === '/admin/';
    }
    return url === href || url.startsWith(`${href}/`);
}

function NavLinks({
    items,
    url,
    collapsed,
    onNavigate,
}: {
    items: NavItem[];
    url: string;
    collapsed: boolean;
    onNavigate?: () => void;
}) {
    return (
        <ul className="flex flex-col gap-0.5">
            {items.map((item) => {
                const active = isActive(url, item.href);
                const link = (
                    <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                            'flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors',
                            collapsed && 'lg:justify-center lg:px-0',
                            active
                                ? 'bg-[var(--shop-bg)] font-medium text-[var(--shop-text)]'
                                : 'text-[var(--shop-text-muted)] hover:bg-[var(--shop-bg)] hover:text-[var(--shop-text)]',
                        )}
                        aria-current={active ? 'page' : undefined}
                    >
                        <item.icon className="size-5 shrink-0" aria-hidden />
                        <span className={cn(collapsed && 'lg:sr-only')}>{item.label}</span>
                    </Link>
                );

                if (!collapsed) {
                    return <li key={item.href}>{link}</li>;
                }

                return (
                    <li key={item.href}>
                        <Tooltip>
                            <TooltipTrigger asChild>{link}</TooltipTrigger>
                            <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                    </li>
                );
            })}
        </ul>
    );
}

function AdminNav({
    collapsed,
    isAdmin,
    url,
    onNavigate,
}: {
    collapsed: boolean;
    isAdmin: boolean;
    url: string;
    onNavigate?: () => void;
}) {
    return (
        <nav className="flex flex-1 flex-col gap-6 px-3" aria-label="Admin">
            <div>
                <p className={cn('mb-2 px-3 text-xs font-medium uppercase tracking-wide text-[var(--shop-text-dim)]', collapsed && 'lg:sr-only')}>
                    Operations
                </p>
                <NavLinks items={operations} url={url} collapsed={collapsed} onNavigate={onNavigate} />
            </div>
            {isAdmin && (
                <div>
                    <p className={cn('mb-2 px-3 text-xs font-medium uppercase tracking-wide text-[var(--shop-text-dim)]', collapsed && 'lg:sr-only')}>
                        Store
                    </p>
                    <NavLinks items={storeNav} url={url} collapsed={collapsed} onNavigate={onNavigate} />
                </div>
            )}
            <div className="mt-auto pb-3">
                <NavLinks
                    items={[{ href: '/', label: 'View store', icon: Store }]}
                    url={url}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                />
            </div>
        </nav>
    );
}

export default function AdminLayout({ children, title }: PropsWithChildren<{ title?: string }>) {
    const page = usePage<AdminShared>();
    const { name, auth, flash } = page.props;
    const url = page.url.split('?')[0];
    const role = auth?.user?.role;
    const isAdmin = role === 'admin';
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        try {
            setCollapsed(localStorage.getItem(STORAGE_KEY) === '1');
        } catch {
            // ignore
        }
    }, []);

    const toggleCollapsed = () => {
        setCollapsed((current) => {
            const next = !current;
            try {
                localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
            } catch {
                // ignore
            }
            return next;
        });
    };

    return (
        <TooltipProvider delayDuration={200}>
            <div className="flex min-h-screen bg-[var(--shop-bg)] text-[var(--shop-text)]">
                {title && <Head title={title} />}
                <a
                    href="#admin-main"
                    className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--shop-surface)] focus:px-3 focus:py-2"
                >
                    Skip to content
                </a>
                <aside
                    className={cn(
                        'hidden w-60 shrink-0 flex-col border-r border-[var(--shop-border)] bg-[var(--shop-surface)] md:flex',
                        collapsed && 'lg:w-16',
                    )}
                >
                    <div className={cn('flex h-16 items-center border-b border-[var(--shop-border)] px-4', collapsed && 'lg:justify-center lg:px-2')}>
                        <span className={cn('truncate font-semibold', collapsed && 'lg:hidden')}>{name || 'Admin'}</span>
                        {collapsed && (
                            <span className="hidden text-sm font-semibold lg:inline">{(name || 'Admin').slice(0, 1)}</span>
                        )}
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col py-4">
                        <AdminNav collapsed={collapsed} isAdmin={isAdmin} url={url} />
                    </div>
                    <div className="hidden border-t border-[var(--shop-border)] p-2 lg:block">
                        <button
                            type="button"
                            onClick={toggleCollapsed}
                            className={cn(adminBtnClass.ghost, 'w-full', collapsed && 'lg:px-0')}
                            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {collapsed ? <PanelLeft className="size-5" /> : <PanelLeftClose className="size-5" />}
                            {!collapsed && <span>Collapse</span>}
                        </button>
                    </div>
                </aside>

                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[var(--shop-border)] bg-[var(--shop-surface)] px-4 md:px-6">
                        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                            <button
                                type="button"
                                className={cn(adminBtnClass.ghost, 'h-11 w-11 px-0 md:hidden')}
                                aria-label="Open menu"
                                onClick={() => setMobileOpen(true)}
                            >
                                <Menu className="size-5" />
                            </button>
                            <SheetContent
                                side="left"
                                className="flex w-72 flex-col bg-[var(--shop-surface)] p-0 text-[var(--shop-text)]"
                            >
                                <SheetHeader className="border-b border-[var(--shop-border)] px-4 py-4 text-left">
                                    <SheetTitle className="text-[var(--shop-text)]">{name || 'Admin'}</SheetTitle>
                                </SheetHeader>
                                <div className="flex min-h-0 flex-1 flex-col py-4">
                                    <AdminNav
                                        collapsed={false}
                                        isAdmin={isAdmin}
                                        url={url}
                                        onNavigate={() => setMobileOpen(false)}
                                    />
                                </div>
                            </SheetContent>
                        </Sheet>

                        <nav aria-label="Breadcrumb" className="min-w-0 flex-1 text-sm">
                            <ol className="flex items-center gap-2 text-[var(--shop-text-muted)]">
                                <li>
                                    <Link href="/admin" className="hover:text-[var(--shop-text)]">
                                        Admin
                                    </Link>
                                </li>
                                {title && title !== 'Dashboard' && (
                                    <>
                                        <li aria-hidden>/</li>
                                        <li className="truncate font-medium text-[var(--shop-text)]">{title}</li>
                                    </>
                                )}
                                {title === 'Dashboard' && (
                                    <>
                                        <li aria-hidden>/</li>
                                        <li className="truncate font-medium text-[var(--shop-text)]">Dashboard</li>
                                    </>
                                )}
                            </ol>
                        </nav>

                        <div className="flex items-center gap-2">
                            <div className="hidden text-right sm:block">
                                <p className="text-sm font-medium leading-tight">{auth?.user?.name}</p>
                                <p className="text-xs capitalize text-[var(--shop-text-muted)]">{role}</p>
                            </div>
                            <Link href="/logout" method="post" as="button" className={cn(adminBtnClass.ghost, 'h-11 w-11 px-0')} aria-label="Log out">
                                <LogOut className="size-5" />
                            </Link>
                        </div>
                    </header>

                    <main id="admin-main" className="flex-1 p-4 md:p-6 lg:p-8">
                        <div className="mx-auto w-full max-w-[1440px]">
                            {flash?.success && (
                                <div
                                    className="mb-4 rounded-[10px] bg-[color-mix(in_srgb,var(--shop-success)_12%,white)] px-4 py-3 text-sm text-[var(--shop-success)]"
                                    role="status"
                                >
                                    {flash.success}
                                </div>
                            )}
                            {flash?.error && (
                                <div
                                    className="mb-4 rounded-[10px] bg-[color-mix(in_srgb,var(--shop-danger)_12%,white)] px-4 py-3 text-sm text-[var(--shop-danger)]"
                                    role="alert"
                                >
                                    {flash.error}
                                </div>
                            )}
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </TooltipProvider>
    );
}
