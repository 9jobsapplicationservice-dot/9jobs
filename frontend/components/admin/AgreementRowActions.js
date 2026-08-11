'use client';

import Link from 'next/link';
import { startTransition, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useToast } from '@/components/admin/ToastProvider';

export default function AgreementRowActions({ agreementId, status }) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm('Delete this agreement?')) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/agreements?id=${agreementId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        pushToast({ title: data.error || 'Unable to delete agreement.', tone: 'error' });
        return;
      }

      pushToast({ title: 'Agreement deleted.', tone: 'success' });
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="admin-actions-row">
      <Link className="admin-link admin-link--view" href={`/admin/agreements/${agreementId}`} prefetch={false}>
        View
      </Link>
      {status !== 'completed' ? (
        <Link className="admin-link" href={`/admin/agreements/${agreementId}/edit`} prefetch={false}>
          Edit
        </Link>
      ) : null}
      <button className="admin-link" disabled={isDeleting} onClick={handleDelete} type="button">
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
}
