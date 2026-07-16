import { NextResponse } from 'next/server';
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

export async function POST(request) {
  try {
    const data = await request.json();
    const {
      full_name,
      email_address,
      interview_type,
      interview_result,
      interview_feedback,
    } = data;

    if (!full_name || typeof full_name !== 'string' || full_name.trim() === '') {
      return NextResponse.json({ error: 'Full Name is required.' }, { status: 400 });
    }

    if (!email_address || typeof email_address !== 'string' || email_address.trim() === '') {
      return NextResponse.json({ error: 'Email Address is required.' }, { status: 400 });
    }

    if (!EMAIL_PATTERN.test(email_address.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!INTERVIEW_TYPES.includes(interview_type)) {
      return NextResponse.json({ error: 'Please select a valid Interview Type.' }, { status: 400 });
    }

    if (!INTERVIEW_RESULTS.includes(interview_result)) {
      return NextResponse.json({ error: 'Please select a valid Interview Result.' }, { status: 400 });
    }

    if (!interview_feedback || typeof interview_feedback !== 'string' || interview_feedback.trim() === '') {
      return NextResponse.json({ error: 'Interview Feedback is required.' }, { status: 400 });
    }

    await connectDB();

    const feedback = new ClientInterviewFeedback({
      full_name: full_name.trim(),
      email_address: email_address.trim().toLowerCase(),
      interview_type,
      interview_result,
      interview_feedback: interview_feedback.trim(),
    });

    await feedback.save();

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully.',
    }, { status: 200 });
  } catch (error) {
    console.error('Error saving client interview feedback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
