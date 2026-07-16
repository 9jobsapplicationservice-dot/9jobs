'use client';

import { startTransition, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useToast } from '@/components/admin/ToastProvider';

export default function InvoiceActions({ invoiceId, hasGeneratedPdf }) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [pendingAction, setPendingAction] = useState('');

  async function runAction(action, url) {
    setPendingAction(action);

    try {
      const response = await fetch(url, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        pushToast({ title: data.error || `Unable to ${action} invoice.`, tone: 'error' });
        return;
      }

      pushToast({
        title: action === 'generate' ? 'Invoice preview generated.' : 'Invoice sent by email.',
        tone: 'success',
      });
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setPendingAction('');
    }
  }

  return (
    <div className="admin-actions-row">
      <button
        className="admin-primary-button"
        disabled={pendingAction === 'generate'}
        onClick={() => runAction('generate', `/api/invoices/${invoiceId}/generate-pdf`)}
        type="button"
      >
        {pendingAction === 'generate' ? 'Generating...' : hasGeneratedPdf ? 'Regenerate Preview' : 'Generate Preview'}
      </button>
      <button
        className="admin-dark-button"
        disabled={pendingAction === 'send'}
        onClick={() => runAction('send', `/api/invoices/send/${invoiceId}`)}
        type="button"
      >
        {pendingAction === 'send' ? 'Sending...' : 'Send Invoice'}
      </button>
    </div>
  );
}
