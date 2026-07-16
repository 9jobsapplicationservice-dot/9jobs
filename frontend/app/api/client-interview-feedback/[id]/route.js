import { NextResponse } from 'next/server';

import { requireAdminApiSession } from '@/lib/admin/auth/require-admin';
import connectDB from '@/utils/db';
import ClientInterviewFeedback from '@/models/ClientInterviewFeedback';

export const dynamic = 'force-dynamic';

const INTERVIEW_TYPES = [
  'Phone Interview',
  'Video Interview',
  'Face-to-Face Interview',
];

const INTERVIEW_RESULTS = [
  'Waiting for Response',
  'Shortlisted',
  'Invited for Second Interview',
  'Job Offer Received',
  'Rejected',
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
}

function notFoundResponse() {
  return NextResponse.json({ error: 'Feedback entry not found.' }, { status: 404 });
}

function validatePayload(data) {
  const {
    full_name,
    email_address,
    interview_type,
    interview_result,
    interview_feedback,
  } = data;

  if (!full_name || typeof full_name !== 'string' || full_name.trim() === '') {
    return 'Full Name is required.';
  }

  if (!email_address || typeof email_address !== 'string' || email_address.trim() === '') {
    return 'Email Address is required.';
  }

  if (!EMAIL_PATTERN.test(email_address.trim())) {
    return 'Please enter a valid email address.';
  }

  if (!INTERVIEW_TYPES.includes(interview_type)) {
    return 'Please select a valid Interview Type.';
  }

  if (!INTERVIEW_RESULTS.includes(interview_result)) {
    return 'Please select a valid Interview Result.';
  }

  if (!interview_feedback || typeof interview_feedback !== 'string' || interview_feedback.trim() === '') {
    return 'Interview Feedback is required.';
  }

  return null;
}

export async function PATCH(request, { params }) {
  const session = await requireAdminApiSession(request);

  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const payload = await request.json();
    const validationError = validatePayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    await connectDB();

    const updatedFeedback = await ClientInterviewFeedback.findByIdAndUpdate(
      id,
      {
        full_name: payload.full_name.trim(),
        email_address: payload.email_address.trim().toLowerCase(),
        interview_type: payload.interview_type,
        interview_result: payload.interview_result,
        interview_feedback: payload.interview_feedback.trim(),
      },
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!updatedFeedback) {
      return notFoundResponse();
    }

    return NextResponse.json({
      feedback: updatedFeedback,
      message: 'Client interview feedback updated.',
    });
  } catch (error) {
    console.error('Unable to update client interview feedback:', error);
    return NextResponse.json({ error: 'Unable to update client interview feedback.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await requireAdminApiSession(request);

  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    await connectDB();

    const deletedFeedback = await ClientInterviewFeedback.findByIdAndDelete(id).lean();

    if (!deletedFeedback) {
      return notFoundResponse();
    }

    return NextResponse.json({
      message: 'Client interview feedback deleted.',
    });
  } catch (error) {
    console.error('Unable to delete client interview feedback:', error);
    return NextResponse.json({ error: 'Unable to delete client interview feedback.' }, { status: 500 });
  }
}
