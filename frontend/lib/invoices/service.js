import connectDB from '@/utils/db';
import Invoice from '@/models/Invoice';
import { applyInvoiceDefaults, LOCKED_INVOICE_PAYMENT_DETAILS } from '@/lib/invoices/defaults';
import { serializeInvoice } from '@/lib/invoices/serialize';
import { generateInvoicePdfBuffer } from '@/lib/invoices/pdf';
import { fetchBlobBuffer, uploadPrivatePdf } from '@/lib/storage/blob';

export async function listInvoices() {
  await connectDB();
  const invoices = await Invoice.find({}).sort({ createdAt: -1 });
  return invoices.map(serializeInvoice);
}

export async function createInvoice(payload) {
  await connectDB();
  const invoice = await Invoice.create({
    ...payload,
    ...LOCKED_INVOICE_PAYMENT_DETAILS,
    status: 'draft',
  });

  return applyInvoiceDefaults(serializeInvoice(invoice));
}

export async function updateInvoiceById(id, updates) {
  await connectDB();
  const invoice = await Invoice.findByIdAndUpdate(
    id,
    {
      ...updates,
      ...LOCKED_INVOICE_PAYMENT_DETAILS,
      generatedPdfUrl: '',
      generatedPdfPath: '',
      status: 'draft',
      sentAt: null,
    },
    { new: true }
  );

  return invoice ? applyInvoiceDefaults(serializeInvoice(invoice)) : null;
}

export async function deleteInvoiceById(id) {
  await connectDB();
  const result = await Invoice.findByIdAndDelete(id);
  return Boolean(result);
}

export async function getInvoiceById(id) {
  await connectDB();
  const invoice = await Invoice.findById(id);
  return invoice ? applyInvoiceDefaults(serializeInvoice(invoice)) : null;
}

export async function getInvoiceDocumentById(id) {
  await connectDB();
  return Invoice.findById(id);
}

export async function generateAndStoreInvoicePdf(invoiceDocument) {
  const buffer = await generateInvoicePdfBuffer({
    ...applyInvoiceDefaults(invoiceDocument.toObject()),
    _id: String(invoiceDocument._id),
  });

  let generatedPdfUrl = '';
  let generatedPdfPath = '';

  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const upload = await uploadPrivatePdf({
        folder: `invoices/${invoiceDocument._id}`,
        fileName: 'generated-invoice.pdf',
        buffer,
      });
      generatedPdfUrl = upload.url;
      generatedPdfPath = upload.path;
    } else {
      generatedPdfUrl = `data:application/pdf;base64,${buffer.toString('base64')}`;
      generatedPdfPath = `db://invoices/${invoiceDocument._id}/generated-invoice.pdf`;
    }
  } catch (error) {
    console.error('Failed to upload invoice PDF, falling back to db storage:', error);
    generatedPdfUrl = `data:application/pdf;base64,${buffer.toString('base64')}`;
    generatedPdfPath = `db://invoices/${invoiceDocument._id}/generated-invoice.pdf`;
  }

  invoiceDocument.generatedPdfUrl = generatedPdfUrl;
  invoiceDocument.generatedPdfPath = generatedPdfPath;
  invoiceDocument.accountName = invoiceDocument.accountName || LOCKED_INVOICE_PAYMENT_DETAILS.accountName;
  invoiceDocument.bankName = invoiceDocument.bankName || LOCKED_INVOICE_PAYMENT_DETAILS.bankName;
  invoiceDocument.accountNumber = invoiceDocument.accountNumber || LOCKED_INVOICE_PAYMENT_DETAILS.accountNumber;
  invoiceDocument.bsb = invoiceDocument.bsb || LOCKED_INVOICE_PAYMENT_DETAILS.bsb;
  invoiceDocument.status = invoiceDocument.status === 'draft' ? 'previewed' : invoiceDocument.status;
  await invoiceDocument.save();

  return {
    invoice: applyInvoiceDefaults(serializeInvoice(invoiceDocument)),
    buffer,
  };
}

export async function getInvoicePdfBuffer(invoice) {
  if (!invoice?.generatedPdfUrl) {
    return null;
  }

  if (invoice.generatedPdfUrl.startsWith('data:application/pdf;base64,')) {
    const base64Data = invoice.generatedPdfUrl.substring(invoice.generatedPdfUrl.indexOf(',') + 1);
    return Buffer.from(base64Data, 'base64');
  }

  return fetchBlobBuffer(invoice.generatedPdfUrl);
}

export async function markInvoiceSent(id) {
  await connectDB();
  const invoice = await Invoice.findByIdAndUpdate(
    id,
    {
      status: 'sent',
      sentAt: new Date(),
    },
    { new: true }
  );

  return invoice ? serializeInvoice(invoice) : null;
}

export async function suggestNextInvoiceDetails() {
  await connectDB();
  const latestInvoice = await Invoice.findOne({}).sort({ createdAt: -1 });

  // Calculate current date details
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `9J-${year}${month}-`;

  let nextNum = 17; // Default start if no database records

  if (latestInvoice && latestInvoice.invoiceNumber) {
    const match = latestInvoice.invoiceNumber.match(/9J-\d{6}-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  const paddedNum = String(nextNum).padStart(3, '0');
  const nextInvoiceNumber = `${prefix}${paddedNum}`;

  const todayStr = now.toISOString().split('T')[0];
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);
  const validUntilStr = nextWeek.toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const dueStr = tomorrow.toISOString().split('T')[0];

  return {
    invoiceNumber: nextInvoiceNumber,
    invoiceDate: todayStr,
    issuedDate: todayStr,
    validUntil: validUntilStr,
    dueDate: dueStr,
    billedToName: '',
    billedToEmail: '',
    billedToPhone: '',
    weekLabel: '1',
    description: 'Job Application Services',
    duration: '1 WEEK',
    total: '150',
  };
}
