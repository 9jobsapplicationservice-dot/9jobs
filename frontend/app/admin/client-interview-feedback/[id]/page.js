import { notFound } from 'next/navigation';

import AdminShell from '@/components/admin/AdminShell';
import ClientInterviewFeedbackForm from '@/components/admin/ClientInterviewFeedbackForm';
import { requireAdminPageSession } from '@/lib/admin/auth/require-admin';
import connectDB from '@/utils/db';
import ClientInterviewFeedback from '@/models/ClientInterviewFeedback';

export const dynamic = 'force-dynamic';

export default async function ClientInterviewFeedbackDetailPage({ params }) {
  await requireAdminPageSession();
  const { id } = await params;
  await connectDB();

  const feedbackDocument = await ClientInterviewFeedback.findById(id).lean();

  if (!feedbackDocument) {
    notFound();
  }

  const feedback = {
    _id: String(feedbackDocument._id),
    full_name: feedbackDocument.full_name,
    email_address: feedbackDocument.email_address,
    interview_type: feedbackDocument.interview_type,
    interview_result: feedbackDocument.interview_result,
    interview_feedback: feedbackDocument.interview_feedback,
    created_at: feedbackDocument.created_at instanceof Date
      ? feedbackDocument.created_at.toISOString()
      : String(feedbackDocument.created_at || ''),
  };

  return (
    <AdminShell eyebrow="Update or remove client interview feedback entries" title={feedback.full_name}>
      <section className="admin-panel">
        <div className="admin-panel__header admin-panel__header--stack">
          <div>
            <h2>Edit Client Interview Feedback</h2>
            <p>{feedback.email_address}</p>
          </div>
        </div>

        <ClientInterviewFeedbackForm feedback={feedback} />
      </section>
    </AdminShell>
  );
}
