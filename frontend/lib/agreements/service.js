import connectDB from '@/utils/db';
import Agreement from '@/models/Agreement';
import { generateAgreementPdfArtifact } from '@/lib/agreements/pdf';
import { serializeAgreement } from '@/lib/agreements/serialize';
import { uploadPrivatePdf, fetchBlobBuffer, fetchBlobBufferByKey } from '@/lib/storage/blob';
import {
  downloadCompletedEnvelopePdf,
  getDocuSignEnvelopeStatus,
  hasDocuSignRuntimeConfig,
} from '@/lib/docusign/client';
import { mapDocuSignEnvelopeStatus } from '@/lib/docusign/status';
import { retryFailedAgreementCompletion } from '@/lib/agreements/completion';

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

export async function recoverFailedInternalAgreementCompletions(limit = 10) {
  await connectDB();

  const agreements = await Agreement.find({
    status: 'completion_processing_failed',
    signedPdfStorageKey: '',
    auditTrailStorageKey: '',
    'clientSignature.signedAt': { $ne: null },
    'providerSignature.signedAt': { $ne: null },
  })
    .sort({ updatedAt: -1 })
    .limit(limit);

  let recoveredCount = 0;

  for (const agreement of agreements) {
    try {
      const recovered = await retryFailedAgreementCompletion(String(agreement._id));
      if (recovered?.status === 'completed') {
        recoveredCount += 1;
      }
    } catch (error) {
      console.error(`Agreement completion retry failed for ${agreement._id}:`, error);
    }
  }

  return recoveredCount;
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
  const artifact = await generateAgreementPdfArtifact({
    ...agreementDocument.toObject(),
    _id: String(agreementDocument._id),
  });
  const buffer = artifact.buffer;

  const upload = await uploadPrivatePdf({
    folder: `agreements/${agreementDocument._id}`,
    fileName: 'generated-agreement.pdf',
    buffer,
    contentType: 'application/pdf',
  });

  agreementDocument.generatedPdfUrl = upload.url;
  agreementDocument.generatedPdfPath = upload.path;
  agreementDocument.pdfAnchorCoords = artifact.anchorCoords;
  agreementDocument.status = agreementDocument.status === 'draft' ? 'previewed' : agreementDocument.status;
  await agreementDocument.save();

  return {
    agreement: serializeAgreement(agreementDocument),
    buffer,
  };
}

export async function getAgreementPdfBuffer(agreement, variant = 'generated') {
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

  const upload = await uploadPrivatePdf({
    folder: `agreements/${agreementDocument._id}`,
    fileName: 'signed-agreement.pdf',
    buffer: signedBuffer,
    contentType: 'application/pdf',
  });

  agreementDocument.signedPdfUrl = upload.url;
  agreementDocument.signedPdfPath = upload.path;
  agreementDocument.signedAt = new Date();
  await agreementDocument.save();

  return signedBuffer;
}
