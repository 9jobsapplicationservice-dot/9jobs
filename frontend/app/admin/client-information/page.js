import connectDB from '@/utils/db';
import ClientInfo from '@/models/ClientInfo';
import { requireAdminPageSession } from '@/lib/admin/auth/require-admin';
import AdminShell from '@/components/admin/AdminShell';
import ClientInfoList from '@/components/admin/ClientInfoList';

export const dynamic = 'force-dynamic';

export default async function AdminClientInformationPage() {
  await requireAdminPageSession();
  await connectDB();
  
  const submissions = await ClientInfo.find({}).sort({ createdAt: -1 });

  // Convert Mongoose documents to plain JSON objects to prevent Next.js serialization warnings
  const plainSubmissions = submissions.map((doc) => {
    const obj = doc.toObject();
    obj._id = String(obj._id);
    if (obj.createdAt) obj.createdAt = obj.createdAt.toISOString();
    if (obj.updatedAt) obj.updatedAt = obj.updatedAt.toISOString();
    return obj;
  });

  return (
    <AdminShell eyebrow="View and manage client onboarding submissions" title="Client Information">
      <ClientInfoList initialSubmissions={plainSubmissions} />
    </AdminShell>
  );
}
