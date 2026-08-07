'use client';

import { useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';

import { fortnightAgreementInputSchema } from '@/lib/fortnight-agreements/schema';
import { useToast } from '@/components/admin/ToastProvider';

const initialState = {
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  providerName: '9 Jobs Pty Ltd',
  providerEmail: '9jobsapplicationservice@gmail.com',
  providerPhone: '+61 422 279 428',
  providerSignatureName: 'Aditya Singh',
  providerAbn: '83679842972',
  agreementDate: new Date().toISOString().slice(0, 10),
  servicePrice: 'AUD $200', // Upfront Service Fee
  initialTerm: 'two (2) months', // Service Period
  notes: '',
};

const sections = [
  {
    title: 'Client Details',
    fields: ['clientName', 'clientEmail', 'clientPhone'],
  },
  {
    title: 'Service Provider Details',
    fields: ['providerName', 'providerEmail', 'providerPhone', 'providerSignatureName', 'providerAbn'],
  },
  {
    title: 'Agreement Parameters',
    fields: ['agreementDate', 'initialTerm', 'servicePrice', 'notes'],
  },
];

const labels = {
  clientName: 'Client Name',
  clientEmail: 'Client Email',
  clientPhone: 'Client Phone',
  providerName: 'Provider Name',
  providerEmail: 'Provider Email',
  providerPhone: 'Provider Phone',
  providerSignatureName: 'Provider Signature Name',
  providerAbn: 'Provider ABN',
  agreementDate: 'Agreement Date',
  initialTerm: '2. Service Period (e.g. two (2) months)',
  servicePrice: '3. Upfront Service Fee (e.g. AUD $200)',
  notes: 'Notes',
};

function getInputType(field) {
  if (field.includes('Email')) return 'email';
  if (field.includes('Date')) return 'date';
  return 'text';
}

export default function FortnightAgreementForm({ initialValues = null, agreementId = '', mode = 'create' }) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [values, setValues] = useState(initialValues ? { ...initialState, ...initialValues } : initialState);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isPending, setIsPending] = useState(false);

  function updateField(field, value) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isPending) return;
    const validation = fortnightAgreementInputSchema.safeParse(values);

    if (!validation.success) {
      const nextErrors = {};

      validation.error.issues.forEach((issue) => {
        nextErrors[issue.path[0]] = issue.message;
      });

      setFieldErrors(nextErrors);
      pushToast({ title: 'Please fix the highlighted fields.', tone: 'error' });
      return;
    }

    setFieldErrors({});
    setIsPending(true);

    try {
      const response = await fetch('/api/fortnight-agreements', {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(mode === 'edit' ? { id: agreementId, ...validation.data } : validation.data),
      });
      const data = await response.json();

      if (!response.ok) {
        pushToast({ title: data.error || `Unable to ${mode === 'edit' ? 'update' : 'create'} contract.`, tone: 'error' });
        return;
      }

      pushToast({ title: mode === 'edit' ? 'Contract updated.' : 'Contract created.', tone: 'success' });
      startTransition(() => {
        router.push(`/admin/fortnight-agreements/${data.agreement._id}`);
        router.refresh();
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <section className="admin-panel admin-panel--hero">
        <div className="admin-panel__header admin-panel__header--stack">
          <div>
            <h2>Fortnight Agreement Workspace</h2>
            <p>Fill the details once. We generate the same PDF for preview and signing.</p>
          </div>
        </div>
        <div className="admin-chip-row">
          <span className="admin-chip">Custom Service Period</span>
          <span className="admin-chip">Custom Upfront Fee</span>
          <span className="admin-chip">On-Site E-Sign Ready</span>
        </div>
      </section>

      {sections.map((section) => (
        <section className="admin-panel" key={section.title}>
          <h2>{section.title}</h2>
          <div className="admin-form-grid">
            {section.fields.map((field) => (
              <label className={`admin-field ${field === 'notes' ? 'admin-field--full' : ''}`} key={field}>
                <span>{labels[field]}</span>
                {field === 'notes' ? (
                  <textarea
                    onChange={(event) => updateField(field, event.target.value)}
                    rows={5}
                    value={values[field]}
                  />
                ) : (
                  <input
                    onChange={(event) => updateField(field, event.target.value)}
                    type={getInputType(field)}
                    value={values[field]}
                  />
                )}
                {fieldErrors[field] ? <small className="admin-error-text">{fieldErrors[field]}</small> : null}
              </label>
            ))}
          </div>
        </section>
      ))}

      <div className="admin-form-actions">
        <button className="admin-primary-button" disabled={isPending} type="submit">
          {isPending ? (mode === 'edit' ? 'Saving...' : 'Creating...') : (mode === 'edit' ? 'Save Contract' : 'Create Contract')}
        </button>
      </div>
    </form>
  );
}
