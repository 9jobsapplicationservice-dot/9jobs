'use client';

import { startTransition, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useToast } from '@/components/admin/ToastProvider';

const interviewTypes = [
  'Phone Interview',
  'Video Interview',
  'Face-to-Face Interview',
];

const interviewResults = [
  'Waiting for Response',
  'Shortlisted',
  'Invited for Second Interview',
  'Job Offer Received',
  'Rejected',
];

export default function ClientInterviewFeedbackForm({ feedback }) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: feedback.full_name || '',
    email_address: feedback.email_address || '',
    interview_type: feedback.interview_type || '',
    interview_result: feedback.interview_result || '',
    interview_feedback: feedback.interview_feedback || '',
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/client-interview-feedback/${feedback._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        pushToast({ title: data.error || 'Unable to update feedback.', tone: 'error' });
        return;
      }

      pushToast({ title: 'Client interview feedback updated.', tone: 'success' });
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="admin-form-grid">
        <label className="admin-field">
          <span>Full Name</span>
          <input name="full_name" onChange={handleChange} required type="text" value={formData.full_name} />
        </label>

        <label className="admin-field">
          <span>Email Address</span>
          <input name="email_address" onChange={handleChange} required type="email" value={formData.email_address} />
        </label>

        <label className="admin-field">
          <span>Interview Type</span>
          <select name="interview_type" onChange={handleChange} required value={formData.interview_type}>
            <option value="">Select interview type</option>
            {interviewTypes.map((option) => (
               <option key={option} value={option}>
                {option}
              </option>
 ))}
               </select>
        </label>

        <label className="admin-field">
          <span>Interview Result</span>
          <select name="interview_result" onChange={handleChange} required value={formData.interview_result}>
            <option value="">Select interview result</option>
            {interviewResults.map((option) => (
               <option key={option} value={option}>
                {option}
              </option>
 ))}
               </select>
        </label>

        <label className="admin-field admin-field--full">
          <span>Feedback</span>
          <textarea
            name="interview_feedback"
            onChange={handleChange}
            required
            rows="7"
            value={formData.interview_feedback}
          />
        </label>
      </div>

      <div className="admin-form-actions">
        <button className="admin-primary-button" disabled={isSaving} type="submit">
          {isSaving ? 'Saving...' : 'Update Feedback'}
        </button>
        <Link className="admin-ghost-button" href="/admin/dashboard">
 Back to Dashboard
               </Link>
      </div>
    </form>
  );
}
