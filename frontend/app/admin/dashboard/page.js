import Link from 'next/link';

import AdminShell from '@/components/admin/AdminShell';
import StatusBadge from '@/components/admin/StatusBadge';
import { requireAdminPageSession } from '@/lib/admin/auth/require-admin';
import connectDB from '@/utils/db';
import Agreement from '@/models/Agreement';
import { recoverFailedInternalAgreementCompletions, syncPendingAgreementStatuses } from '@/lib/agreements/service';
import { serializeAgreement } from '@/lib/agreements/serialize';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await requireAdminPageSession();
  await syncPendingAgreementStatuses();
  await recoverFailedInternalAgreementCompletions();
  await connectDB();

  const [totalAgreements, sent, completed, pendingDocs, latestAgreements] = await Promise.all([
    Agreement.countDocuments({}),
    Agreement.countDocuments({ status: { $in: ['sent', 'delivered', 'viewed'] } }),
    Agreement.countDocuments({ status: 'completed' }),
    Agreement.countDocuments({ status: { $in: ['draft', 'previewed'] } }),
    Agreement.find({}).sort({ createdAt: -1 }).limit(5),
  ]);

  return (
    <AdminShell eyebrow="Private agreement operations" title="Dashboard">
      <section className="admin-stats-grid">
        {[
          { label: 'Total Agreements', value: totalAgreements },
          { label: 'Sent', value: sent },
          { label: 'Completed', value: completed },
          { label: 'Pending', value: pendingDocs },
        ].map((card) => (
          <article className="admin-stat-card" key={card.label}>
            <p>{card.label}</p>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <section className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <h2>Latest Agreements</h2>
            <p>Recent drafts, previews, and signed contracts.</p>
          </div>
          <Link className="admin-ghost-button admin-ghost-button--link" href="/admin/agreements">
            View all
          </Link>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Package</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {latestAgreements.map((agreementDoc) => {
                const agreement = serializeAgreement(agreementDoc);

                return (
                  <tr key={agreement._id}>
                    <td>
                      <strong>{agreement.clientName}</strong>
                      <span>{agreement.clientEmail}</span>
                    </td>
                    <td>{agreement.packageName}</td>
                    <td>
                      <StatusBadge status={agreement.status} />
                    </td>
                    <td>{agreement.createdAt?.slice(0, 10)}</td>
                    <td className="admin-actions-cell" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Link className="admin-link admin-link--view" href={`/admin/agreements/${agreement._id}`}>
                        View
                      </Link>
                      {agreement.status === 'completed' && (
                        <a
                          className="admin-link admin-link--download"
                          href={`/api/docusign/download/${agreement._id}`}
                          download
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          Download
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
