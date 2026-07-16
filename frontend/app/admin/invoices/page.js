import Link from 'next/link';

import AdminShell from '@/components/admin/AdminShell';
import InvoiceRegisterActions from '@/components/admin/InvoiceRegisterActions';
import StatusBadge from '@/components/admin/StatusBadge';
import { requireAdminPageSession } from '@/lib/admin/auth/require-admin';
import { listInvoices } from '@/lib/invoices/service';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  await requireAdminPageSession();
  const invoices = await listInvoices();

  return (
    <AdminShell eyebrow="Preview and email invoices with PDF attachments" title="Invoices">
      <section className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <h2>Invoice Register</h2>
            <p>Track invoice preview generation and email delivery from one admin view.</p>
          </div>
          <Link className="admin-primary-button" href="/admin/invoices/new">
 Create Invoice
               </Link>
        </div>

        {invoices.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Billed To</th>
                  <th>Due</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
               <tr key={invoice._id}>
                    <td>
                      <strong>{invoice.invoiceNumber}</strong>
                      <span>{invoice.invoiceDate}</span>
                    </td>
                    <td>
                      <strong>{invoice.billedToName}</strong>
                      <span>{invoice.billedToEmail}</span>
                    </td>
                    <td>{invoice.dueDate}</td>
                    <td>${invoice.total}</td>
                    <td>
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="admin-actions-cell">
                      <InvoiceRegisterActions invoiceId={invoice._id} />
                    </td>
                  </tr>
 ))}
               </tbody>
            </table>
          </div>
 ) : (
               <div className="admin-empty-state">
            <p>No invoices are stored right now. Create a new invoice to generate a branded PDF and send it by email.</p>
          </div>
 )}
               </section>
    </AdminShell>
  );
}
