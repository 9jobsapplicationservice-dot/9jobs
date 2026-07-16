import { NextResponse } from 'next/server';

import { requireAdminApiSession } from '@/lib/admin/auth/require-admin';
import { createDocuSignEnvelope } from '@/lib/docusign/client';
import { resolveEsignProvider } from '@/lib/agreements/provider';
import {
  getAgreementById,
  getAgreementDocumentById,
  generateAndStoreAgreementPdf,
  getAgreementPdfBuffer,
} from '@/lib/agreements/service';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const session = await requireAdminApiSession(request);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const agreementId = (await params).agreementId;
  const agreementDocument = await getAgreementDocumentById(agreementId);

  if (!agreementDocument) {
    return NextResponse.json({ error: 'Agreement not found.' }, { status: 404 });
  }

  if (!agreementDocument.generatedPdfUrl) {
    await generateAndStoreAgreementPdf(agreementDocument);
  }

  const agreement = await getAgreementById(agreementId);
  const pdfBuffer = await getAgreementPdfBuffer(agreement, 'generated');

  const hostname = new URL(request.url).hostname;
  const selectedProvider = resolveEsignProvider({
    configuredProvider: process.env.ESIGN_PROVIDER,
    hostname,
  });
  const useDocuSign = selectedProvider === 'docusign';

  console.info(
    '[agreement-send]',
    JSON.stringify({
      deploymentEnvironment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
      selectedProvider,
      agreementId,
      routeBranch: useDocuSign ? 'docusign' : 'internal',
      hostname,
    })
  );

  if (useDocuSign) {
    try {
      const envelope = await createDocuSignEnvelope({
        agreement,
        pdfBuffer,
      });

      agreementDocument.docuSignEnvelopeId = envelope.envelopeId;
      agreementDocument.status = 'sent';
      agreementDocument.sentAt = new Date();
      agreementDocument.esignProvider = 'docusign';
      agreementDocument.envelopeEvents.push({
        status: 'sent',
        payload: envelope,
      });
      await agreementDocument.save();

      return NextResponse.json({
        success: true,
        envelopeId: envelope.envelopeId,
      });
    } catch (error) {
      console.error('Unable to send agreement via DocuSign:', error);
      agreementDocument.status = 'send_failed';
      agreementDocument.esignError = error instanceof Error ? error.message : 'DocuSign sending failed';
      await agreementDocument.save();
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Unable to send agreement via DocuSign.',
        },
        { status: 500 }
      );
    }
  }

  // Internal E-Signature Workflow
  try {
    const { hashPdf, generateSecureToken, hashToken } = require('@/utils/cryptoUtils');
    const { sendClientSigningInvite } = require('@/lib/agreements/email');

    const originalPdfSha256 = hashPdf(pdfBuffer);
    const clientToken = generateSecureToken();
    const clientTokenHash = hashToken(clientToken);

    // Save tokens and PDF hashes in document
    agreementDocument.esignProvider = 'internal';
    agreementDocument.originalPdfSha256 = originalPdfSha256;
    agreementDocument.originalPdfUrl = agreementDocument.generatedPdfUrl;
    agreementDocument.originalPdfStorageKey = agreementDocument.generatedPdfPath;

    agreementDocument.clientSigningTokenHash = clientTokenHash;
    agreementDocument.clientTokenExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
    agreementDocument.clientTokenUsedAt = null;
    
    agreementDocument.status = 'sent_to_client';
    agreementDocument.sentAt = new Date();
    agreementDocument.clientInvitationSentAt = new Date();
    
    await agreementDocument.save();

    // Send email invitation containing the raw token
    await sendClientSigningInvite(agreementDocument, clientToken);

    return NextResponse.json({
      success: true,
      message: 'Agreement sent to client successfully.',
    });
  } catch (error) {
    console.error('Unable to send agreement internally:', error);
    agreementDocument.status = 'send_failed';
    agreementDocument.esignError = error instanceof Error ? error.message : 'Internal sending failed';
    await agreementDocument.save();
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to initialize electronic signature request.',
      },
      { status: 500 }
    );
  }
}
