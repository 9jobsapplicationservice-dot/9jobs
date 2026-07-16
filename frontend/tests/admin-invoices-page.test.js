import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from '@jest/globals';

const root = path.resolve(process.cwd());

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('admin invoices pages', () => {
  test('adds invoice navigation and register page', () => {
    const adminShell = read('components/admin/AdminShell.js');
    const invoicesPage = read('app/admin/invoices/page.js');
    const invoiceDetailPage = read('app/admin/invoices/[id]/page.js');
    const invoiceForm = read('components/admin/InvoiceForm.js');
    const invoicePdf = read('lib/invoices/pdf.js');
    const invoiceRegisterActions = read('components/admin/InvoiceRegisterActions.js');

    expect(adminShell).toContain("{ href: '/admin/invoices', label: 'Invoices' }");
    expect(adminShell).toContain("{ href: '/admin/invoices/new', label: 'Create Invoice' }");
    expect(adminShell).toContain('href="/admin/invoices/new"');
    expect(invoicesPage).toContain('Invoice Register');
    expect(invoicesPage).toContain('Create Invoice');
    expect(invoicesPage).toContain('InvoiceRegisterActions');
    expect(invoiceRegisterActions).toContain('Edit');
    expect(invoiceRegisterActions).toContain('Delete');
    expect(invoiceRegisterActions).toContain('/admin/invoices/${invoiceId}/edit');
    expect(invoiceDetailPage).toContain('Send Invoice');
    expect(invoiceDetailPage).toContain('Back to list');
    expect(invoiceForm).not.toContain('accountName');
    expect(invoiceForm).not.toContain('bankName');
    expect(invoiceForm).not.toContain('accountNumber');
    expect(invoiceForm).not.toContain('bsb');
    expect(invoiceForm).toContain('Payment details are locked');
    expect(invoicePdf).toContain('Invoice No.');
    expect(invoicePdf).not.toContain("drawText(page, '9Jobs'");
    expect(invoicePdf).toContain('PAYMENT DETAILS');
    expect(invoicePdf).toContain('Account Number');
    expect(invoicePdf).toContain('BSB');
    expect(invoicePdf).toContain('cursorY');
    expect(invoicePdf).toContain('TOTAL');
    expect(invoicePdf).toContain('drawRectangle');
    expect(invoicePdf).toContain('Terms & Conditions');
    expect(invoicePdf).toContain('A4_WIDTH');
    expect(invoicePdf).toContain('A4_HEIGHT');
    expect(invoicePdf).toContain('TOP_MARGIN');
    expect(invoicePdf).toContain('SIDE_MARGIN');
    expect(invoicePdf).toContain('headerBarY');
  });
});
