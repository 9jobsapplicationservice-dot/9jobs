import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { parsePdfSignatureCoords } from './pdfCoords.js';
import { fetchBlobBuffer } from '@/lib/storage/blob';
import { del } from '@vercel/blob';

/**
 * Formats a date to "DD MMM YYYY" format in UTC.
 * @param {Date} date 
 * @returns {string}
 */
function formatUtcDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Seals the PDF document by overlaying both client and provider signatures/dates in a single pass.
 * Automatically handles drawn (PNG) or typed (TimesItalic font) signatures.
 * Clean up temporary signature files from storage after sealing.
 * 
 * @param {Buffer} originalPdfBuffer The unsigned PDF bytes
 * @param {Object} agreement Mongoose agreement document
 * @returns {Promise<Buffer>} Sealed PDF buffer
 */
export async function sealAgreementPdf(originalPdfBuffer, agreement) {
  // 1. Dynamic Coordinate Parsing
  const coords = await parsePdfSignatureCoords(originalPdfBuffer);
  
  const pdfDoc = await PDFDocument.load(originalPdfBuffer);
  const pages = pdfDoc.getPages();
  
  // Standard PDF 14 fonts, bundled in all viewers
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesItalic);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // 2. Draw Customer/Client Signature
  const clientCoords = coords.customerSign;
  const clientPage = pages[clientCoords.pageIndex];
  
  if (agreement.clientSignature.signatureType === 'drawn' && agreement.clientSignature.signatureFileKey) {
    const { fetchBlobBufferByKey } = require('@/lib/storage/blob');
    const clientSigBuffer = await fetchBlobBufferByKey(agreement.clientSignature.signatureFileKey);
    const clientImage = await pdfDoc.embedPng(clientSigBuffer);
    clientPage.drawImage(clientImage, {
      x: clientCoords.x,
      y: clientCoords.y + 5,
      width: 140,
      height: 40,
    });
  } else if (agreement.clientSignature.signatureType === 'typed') {
    clientPage.drawText(agreement.clientSignature.name, {
      x: clientCoords.x,
      y: clientCoords.y + 10,
      font: timesItalic,
      size: 16,
      color: rgb(0.06, 0.09, 0.16),
    });
  }

  // 3. Draw Provider Signature
  const providerCoords = coords.providerSign;
  const providerPage = pages[providerCoords.pageIndex];
  
  if (agreement.providerSignature.signatureType === 'drawn' && agreement.providerSignature.signatureFileKey) {
    const { fetchBlobBufferByKey } = require('@/lib/storage/blob');
    const providerSigBuffer = await fetchBlobBufferByKey(agreement.providerSignature.signatureFileKey);
    const providerImage = await pdfDoc.embedPng(providerSigBuffer);
    providerPage.drawImage(providerImage, {
      x: providerCoords.x,
      y: providerCoords.y + 5,
      width: 140,
      height: 40,
    });
  } else if (agreement.providerSignature.signatureType === 'typed') {
    providerPage.drawText(agreement.providerSignature.name, {
      x: providerCoords.x,
      y: providerCoords.y + 10,
      font: timesItalic,
      size: 16,
      color: rgb(0.06, 0.09, 0.16),
    });
  }

  // 4. Draw Signing Dates
  const dateCoords = coords.dateBlock;
  const datePage = pages[dateCoords.pageIndex];
  
  const clientDateStr = formatUtcDate(agreement.clientSignature.signedAt);
  const providerDateStr = formatUtcDate(agreement.providerSignature.signedAt);

  // Offset positions relative to anchors
  datePage.drawText(`Date: ${providerDateStr}`, {
    x: dateCoords.x,
    y: dateCoords.y,
    font: helvetica,
    size: 9,
    color: rgb(0.22, 0.25, 0.32),
  });

  datePage.drawText(`Date: ${clientDateStr}`, {
    x: dateCoords.x + 300,
    y: dateCoords.y,
    font: helvetica,
    size: 9,
    color: rgb(0.22, 0.25, 0.32),
  });

  const sealedBuffer = Buffer.from(await pdfDoc.save());
  return sealedBuffer;
}
