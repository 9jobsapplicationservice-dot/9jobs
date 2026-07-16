import Link from 'next/link';

import LogoutButton from '@/components/admin/LogoutButton';

const links = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/agreements', label: 'Agreements' },
  { href: '/admin/invoices', label: 'Invoices' },
  { href: '/admin/agreements/new', label: 'Create Agreement' },
  { href: '/admin/invoices/new', label: 'Create Invoice' },
];

export default function AdminShell({ title, eyebrow, children }) {
  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div>
          <p className="admin-topbar__brand">9Jobs Admin</p>
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
          <LogoutButton />
        </div>
      </header>

      <nav className="admin-subnav">
        {links.map((link) => (
          <Link className="admin-subnav__link" href={link.href} key={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>

      {children}
    </main>
  );
}
