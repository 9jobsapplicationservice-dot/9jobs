'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import LogoutButton from '@/components/admin/LogoutButton';

const sidebarGroups = [
  {
    title: 'Dashboard',
    links: [
      { href: '/admin/dashboard', label: 'Overview' },
    ],
  },
  {
    title: 'Agreements',
    links: [
      { href: '/admin/agreements', label: 'All Agreements' },
      { href: '/admin/agreements/new', label: 'Create Agreement' },
    ],
  },
  {
    title: 'Fortnight Agreements',
    links: [
      { href: '/admin/fortnight-agreements', label: 'All Fortnight' },
      { href: '/admin/fortnight-agreements/new', label: 'Create Fortnight' },
    ],
  },
  {
    title: 'Invoices',
    links: [
      { href: '/admin/invoices', label: 'All Invoices' },
      { href: '/admin/invoices/new', label: 'Create Invoice' },
    ],
  },
  {
    title: 'Client Information',
    links: [
      { href: '/admin/client-information', label: 'Client Submissions' },
    ],
  },
];

export default function AdminShell({ title, eyebrow, children }) {
  const pathname = usePathname();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">9Jobs Admin</div>
        
        <nav className="admin-sidebar__nav">
          {sidebarGroups.map((group) => (
            <div className="admin-sidebar__group" key={group.title}>
              <h3>{group.title}</h3>
              {group.links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    className={`admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`}
                    href={link.href}
                    key={link.href}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <LogoutButton />
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>{title}</h1>
            {eyebrow ? <p className="admin-topbar__eyebrow">{eyebrow}</p> : null}
          </div>
          <div className="admin-topbar__actions">
            <Link className="admin-ghost-button admin-ghost-button--link" href="/admin/invoices/new">
              New Invoice
            </Link>
            <Link className="admin-primary-button" href="/admin/agreements/new">
              New Agreement
            </Link>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
