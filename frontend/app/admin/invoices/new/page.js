import AdminShell from '@/components/admin/AdminShell';
import InvoiceForm from '@/components/admin/InvoiceForm';
import { requireAdminPageSession } from '@/lib/admin/auth/require-admin';
import { suggestNextInvoiceDetails } from '@/lib/invoices/service';

export const dynamic = 'force-dynamic';

export default async function NewInvoicePage() {
  await requireAdminPageSession();
  const nextInvoiceDetails = await suggestNextInvoiceDetails();

  return (
    <AdminShell eyebrow="Create a new branded invoice PDF" title="Create Invoice">
      <InvoiceForm initialValues={nextInvoiceDetails} />
    </AdminShell>
  );
}
