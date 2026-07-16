import connectDB from '@/utils/db';
import Agreement from '@/models/Agreement';
import { generateAgreementPdfBuffer } from '@/lib/agreements/pdf';
import { serializeAgreement } from '@/lib/agreements/serialize';
import { uploadPrivatePdf, fetchBlobBuffer } from '@/lib/storage/blob';
import {
  downloadCompletedEnvelopePdf,
  getDocuSignEnvelopeStatus,
  hasDocuSignRuntimeConfig,
} from '@/lib/docusign/client';
import { mapDocuSignEnvelopeStatus } from '@/lib/docusign/status';

const ACTIVE_DOCUSIGN_STATUSES = ['sent', 'delivered', 'viewed'];
const TERMINAL_DOCUSIGN_STATUSES = ['completed', 'declined', 'voided'];

function shouldSyncAgreementStatus(agreementDocument) {
  return Boolean(
    agreementDocument?.docuSignEnvelopeId &&
      !TERMINAL_DOCUSIGN_STATUSES.includes(agreementDocument.status)
  );
}

function shouldAppendEnvelopeEvent(agreementDocument, rawStatus) {
  const latestEvent = agreementDocument.envelopeEvents?.[agreementDocument.envelopeEvents.length - 1];
  return latestEvent?.status !== rawStatus;
}

export async function listAgreements() {
  await connectDB();
  const agreements = await Agreement.find({}).sort({ createdAt: -1 });
  return agreements.map(serializeAgreement);
}

export async function deleteAllAgreements() {
  await connectDB();
  const result = await Agreement.deleteMany({});
  return result.deletedCount || 0;
}

export async function getAgreementById(id) {
  await connectDB();
  const agreement = await Agreement.findById(id);
  return agreement ? serializeAgreement(agreement) : null;
}

export async function getAgreementDocumentById(id) {
  await connectDB();
  return Agreement.findById(id);
}

export async function syncAgreementDocumentStatusFromDocuSign(agreementDocument) {
  if (!shouldSyncAgreementStatus(agreementDocument) || !hasDocuSignRuntimeConfig()) {
    return agreementDocument ? serializeAgreement(agreementDocument) : null;
  }

  const envelope = await getDocuSignEnvelopeStatus(agreementDocument.docuSignEnvelopeId);
  const rawStatus = String(envelope?.status || '').toLowerCase();

  if (!rawStatus) {
    return serializeAgreement(agreementDocument);
  }

  const mappedStatus = mapDocuSignEnvelopeStatus(rawStatus);

  if (shouldAppendEnvelopeEvent(agreementDocument, rawStatus)) {
    agreementDocument.envelopeEvents.push({
      status: rawStatus,
      payload: envelope,
    });
  }

  agreementDocument.status = mappedStatus;

  if (mappedStatus === 'completed') {
    agreementDocument.signedAt = agreementDocument.signedAt || new Date();
    await agreementDocument.save();

    if (!agreementDocument.signedPdfUrl) {
      await attachSignedAgreementPdf(agreementDocument);
    }
  } else {
    await agreementDocument.save();
  }

  return serializeAgreement(agreementDocument);
}

export async function syncPendingAgreementStatuses() {
  if (!hasDocuSignRuntimeConfig()) {
    return 0;
  }

  await connectDB();
  const agreements = await Agreement.find({
    docuSignEnvelopeId: { $nin: ['', null] },
    status: { $in: ACTIVE_DOCUSIGN_STATUSES },
  });

  for (const agreementDocument of agreements) {
    try {
      await syncAgreementDocumentStatusFromDocuSign(agreementDocument);
    } catch (error) {
      console.error(`DocuSign status sync failed for agreement ${agreementDocument._id}:`, error);
    }
  }

  return agreements.length;
}

export async function createAgreement(payload) {
  await connectDB();
  const agreement = await Agreement.create({
    ...payload,
    notes: payload.notes || '',
    status: 'draft',
  });

  return serializeAgreement(agreement);
}

export async function updateAgreementById(id, updates) {
  await connectDB();
  const agreement = await Agreement.findByIdAndUpdate(id, updates, {
    new: true,
  });

  return agreement ? serializeAgreement(agreement) : null;
}

export async function generateAndStoreAgreementPdf(agreementDocument) {
  const buffer = await generateAgreementPdfBuffer({
    ...agreementDocument.toObject(),
    _id: String(agreementDocument._id),
  });

  let generatedPdfUrl = '';
  let generatedPdfPath = '';

  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const upload = await uploadPrivatePdf({
        folder: `agreements/${agreementDocument._id}`,
        fileName: 'generated-agreement.pdf',
        buffer,
      });
      generatedPdfUrl = upload.url;
      generatedPdfPath = upload.path;
    } else {
      // Fallback: store as data URL directly in database
      generatedPdfUrl = `data:application/pdf;base64,${buffer.toString('base64')}`;
      generatedPdfPath = `db://agreements/${agreementDocument._id}/generated-agreement.pdf`;
    }
  } catch (error) {
    console.error('Failed to upload generated PDF, falling back to db storage:', error);
    generatedPdfUrl = `data:application/pdf;base64,${buffer.toString('base64')}`;
    generatedPdfPath = `db://agreements/${agreementDocument._id}/generated-agreement.pdf`;
  }

  agreementDocument.generatedPdfUrl = generatedPdfUrl;
  agreementDocument.generatedPdfPath = generatedPdfPath;
  agreementDocument.status = agreementDocument.status === 'draft' ? 'previewed' : agreementDocument.status;
  await agreementDocument.save();

  return {
    agreement: serializeAgreement(agreementDocument),
    buffer,
  };
}

export async function getAgreementPdfBuffer(agreement, variant = 'generated') {
  const { fetchBlobBufferByKey } = require('@/lib/storage/blob');

  if (variant === 'signed') {
    if (agreement.signedPdfStorageKey) {
      return fetchBlobBufferByKey(agreement.signedPdfStorageKey);
    }
    if (agreement.signedPdfUrl) {
      const url = agreement.signedPdfUrl;
      if (url.startsWith('data:application/pdf;base64,')) {
        const base64Data = url.substring(url.indexOf(',') + 1);
        return Buffer.from(base64Data, 'base64');
      }
      return fetchBlobBuffer(url);
    }
    return null;
  }

  // Unsigned / Generated variant
  if (agreement.originalPdfStorageKey) {
    return fetchBlobBufferByKey(agreement.originalPdfStorageKey);
  }
  if (agreement.generatedPdfPath) {
    return fetchBlobBufferByKey(agreement.generatedPdfPath);
  }
  
  const url = agreement.generatedPdfUrl;
  if (!url) {
    return null;
  }

  if (url.startsWith('data:application/pdf;base64,')) {
    const base64Data = url.substring(url.indexOf(',') + 1);
    return Buffer.from(base64Data, 'base64');
  }

  return fetchBlobBuffer(url);
}

export async function attachSignedAgreementPdf(agreementDocument) {
  const signedBuffer = await downloadCompletedEnvelopePdf(agreementDocument.docuSignEnvelopeId);
  
  let signedPdfUrl = '';
  let signedPdfPath = '';

  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const upload = await uploadPrivatePdf({
        folder: `agreements/${agreementDocument._id}`,
        fileName: 'signed-agreement.pdf',
        buffer: signedBuffer,
      });
      signedPdfUrl = upload.url;
      signedPdfPath = upload.path;
    } else {
      signedPdfUrl = `data:application/pdf;base64,${signedBuffer.toString('base64')}`;
      signedPdfPath = `db://agreements/${agreementDocument._id}/signed-agreement.pdf`;
    }
  } catch (error) {
    console.error('Failed to upload signed PDF, falling back to db storage:', error);
    signedPdfUrl = `data:application/pdf;base64,${signedBuffer.toString('base64')}`;
    signedPdfPath = `db://agreements/${agreementDocument._id}/signed-agreement.pdf`;
  }

  agreementDocument.signedPdfUrl = signedPdfUrl;
  agreementDocument.signedPdfPath = signedPdfPath;
  agreementDocument.signedAt = new Date();
  await agreementDocument.save();

  return signedBuffer;
}
