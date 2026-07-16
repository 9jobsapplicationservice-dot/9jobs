'use client';

import { startTransition, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useToast } from '@/components/admin/ToastProvider';

export default function ClientInterviewFeedbackActions({ feedbackId, editHref }) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm('Delete this client interview feedback entry?')) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/client-interview-feedback/${feedbackId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        pushToast({ title: data.error || 'Unable to delete feedback.', tone: 'error' });
        return;
      }

      pushToast({ title: 'Client interview feedback deleted.', tone: 'success' });
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="admin-actions-cell">
      <Link className="admin-link admin-link--view" href={editHref}>
 Edit
               </Link>
      <button
        className="admin-link admin-link--danger"
        disabled={isDeleting}
        onClick={handleDelete}
        type="button"
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
}
