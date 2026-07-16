import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import { buildAgreementTemplate } from '@/lib/agreements/template';
import { LOGO_BASE64 } from './logo-base64';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN_LEFT_RIGHT = 54;
const PAGE_MARGIN_TOP = 92;
const PAGE_MARGIN_BOTTOM = 60;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN_LEFT_RIGHT * 2;
const COLOR_INK = rgb(0.06, 0.09, 0.16);
const COLOR_BODY = rgb(0.22, 0.25, 0.32);
const COLOR_MUTED = rgb(0.42, 0.45, 0.5);
const COLOR_WHITE = rgb(1, 1, 1);

function wrapText(text, font, fontSize, maxWidth) {
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ');

  if (!words[0]) {
    return [''];
  }

  const lines = [];
  let currentLine = words[0];

  for (const word of words.slice(1)) {
    const nextLine = `${currentLine} ${word}`;

    if (font.widthOfTextAtSize(nextLine, fontSize) <= maxWidth) {
      currentLine = nextLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  lines.push(currentLine);
  return lines;
}

function createRenderer(pdfDoc, fonts) {
  const pages = [];
  let page = null;
  let cursorY = 0;

  function addPage() {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(page);
    cursorY = PAGE_HEIGHT - PAGE_MARGIN_TOP;
    return page;
  }

  function ensureSpace(requiredHeight) {
    if (!page || cursorY - requiredHeight < PAGE_MARGIN_BOTTOM) {
      addPage();
    }
  }

  function drawWrappedText(text, options = {}) {
    const {
      x = PAGE_MARGIN_LEFT_RIGHT,
      font = fonts.regular,
      fontSize = 10.5,
      color = COLOR_BODY,
      lineHeight = fontSize * 1.45,
      paragraphGap = 8,
      maxWidth = CONTENT_WIDTH,
    } = options;

    const lines = wrapText(text, font, fontSize, maxWidth);
    ensureSpace(lines.length * lineHeight + paragraphGap);

    for (const line of lines) {
      page.drawText(line, {
        x,
        y: cursorY - fontSize,
        font,
        size: fontSize,
        color,
      });
      cursorY -= lineHeight;
    }

    cursorY -= paragraphGap;
  }

  function drawCenteredText(text, options = {}) {
    const { font = fonts.bold, fontSize = 20, color = COLOR_INK, paragraphGap = 12 } = options;
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    ensureSpace(fontSize + paragraphGap);
    page.drawText(text, {
      x: (PAGE_WIDTH - textWidth) / 2,
      y: cursorY - fontSize,
      font,
      size: fontSize,
      color,
    });
    cursorY -= fontSize * 1.35 + paragraphGap;
  }

  function drawSignatureLine(label, value, options = {}) {
    const { gapAfter = 8, font = fonts.regular } = options;
    drawWrappedText(`${label} ${value}`, {
      font,
      fontSize: 11,
      color: COLOR_INK,
      paragraphGap: gapAfter,
    });
  }

  addPage();

  return {
    addPage,
    pages,
    fonts,
    drawCenteredText,
    drawWrappedText,
    drawSignatureLine,
    get page() {
      return page;
    },
    set cursorY(value) {
      cursorY = value;
    },
    get cursorY() {
      return cursorY;
    },
  };
}

function drawHeaderAndFooter(renderer, logoImage) {
  renderer.pages.forEach((page, index) => {
    if (logoImage) {
      const logoWidth = 85;
      const logoHeight = 85;
      page.drawImage(logoImage, {
        x: PAGE_WIDTH - PAGE_MARGIN_LEFT_RIGHT - logoWidth,
        y: PAGE_HEIGHT - 88,
        width: logoWidth,
        height: logoHeight,
      });
    }

    page.drawText(`Page ${index + 1} of ${renderer.pages.length}`, {
      x: PAGE_MARGIN_LEFT_RIGHT,
      y: 28,
      font: renderer.fonts.regular,
      size: 9,
      color: COLOR_MUTED,
    });
  });
}

export async function generateAgreementPdfBuffer(agreement) {
  const document = buildAgreementTemplate(agreement);
  const pdfDoc = await PDFDocument.create();
  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };

  let logoImage = null;
  try {
    const logoBuffer = Buffer.from(LOGO_BASE64, 'base64');
    logoImage = await pdfDoc.embedPng(logoBuffer);
  } catch (err) {
    console.error('Error embedding logo png:', err);
  }

  const renderer = createRenderer(pdfDoc, fonts);

  renderer.drawCenteredText('9Jobs Service Contract', {
    font: fonts.bold,
    fontSize: 20,
    color: COLOR_INK,
    paragraphGap: 10,
  });

  renderer.drawWrappedText(
    `This Service Agreement is made and entered into as of ${document.agreementDate || '29 June 2026'}, by and between:`,
    {
      font: fonts.regular,
      fontSize: 11,
      color: COLOR_BODY,
      lineHeight: 16,
      paragraphGap: 16,
    }
  );

  renderer.drawWrappedText(document.provider.legalName, {
    font: fonts.bold,
    fontSize: 11,
    color: COLOR_INK,
    paragraphGap: 4,
  });
  renderer.drawWrappedText(`ABN : ${document.provider.abn}`, {
    font: fonts.regular,
    fontSize: 11,
    color: COLOR_INK,
    paragraphGap: 4,
  });
  renderer.drawWrappedText(`Phone : ${document.provider.phone}`, {
    font: fonts.regular,
    fontSize: 11,
    color: COLOR_INK,
    paragraphGap: 18,
  });

  renderer.drawWrappedText('And', {
    font: fonts.regular,
    fontSize: 11,
    color: COLOR_MUTED,
    paragraphGap: 18,
  });

  renderer.drawWrappedText(document.signatureBlocks.customer.name, {
    font: fonts.bold,
    fontSize: 11,
    color: COLOR_INK,
    paragraphGap: 4,
  });
  renderer.drawSignatureLine('Email:', document.signatureBlocks.customer.email, { gapAfter: 4 });
  renderer.drawSignatureLine('Phone:', document.signatureBlocks.customer.phone, { gapAfter: 20 });

  document.sections.forEach((section) => {
    renderer.drawWrappedText(section.heading, {
      font: fonts.bold,
      fontSize: 13,
      color: COLOR_INK,
      lineHeight: 18,
      paragraphGap: 6,
    });

    if (section.intro) {
      renderer.drawWrappedText(section.intro, {
        font: fonts.regular,
        fontSize: 10.5,
        color: COLOR_BODY,
        lineHeight: 15,
        paragraphGap: 6,
      });
    }

    section.paragraphs.forEach((paragraph, index) => {
      const letter = String.fromCharCode(97 + index);
      renderer.drawWrappedText(`${letter}. ${paragraph}`, {
        x: PAGE_MARGIN_LEFT_RIGHT + 14,
        maxWidth: CONTENT_WIDTH - 14,
        font: fonts.regular,
        fontSize: 10.5,
        color: COLOR_BODY,
        lineHeight: 15,
        paragraphGap: 6,
      });
    });

  });

  // Ensure the entire signature section fits on the current page, otherwise break page
  const requiredSigHeight = 200;
  if (renderer.cursorY - requiredSigHeight < PAGE_MARGIN_BOTTOM) {
    renderer.addPage();
  }
  renderer.drawWrappedText(
    'In witness where of, the parties have executed this Agreement as of the date first written above.',
    {
      font: fonts.regular,
      fontSize: 11,
      color: COLOR_BODY,
      lineHeight: 16,
      paragraphGap: 22,
    }
  );

  renderer.drawWrappedText('Service Provider:', {
    font: fonts.bold,
    fontSize: 12,
    color: COLOR_INK,
    paragraphGap: 6,
  });
  renderer.drawSignatureLine('Name:', document.provider.legalName, { gapAfter: 4 });
  renderer.drawSignatureLine('ABN :', document.provider.abn, { gapAfter: 4 });
  renderer.drawSignatureLine('Signature:', '___________________', {
    font: fonts.bold,
    gapAfter: 20,
  });
  renderer.page.drawText('[[DS_PROVIDER_SIGN_HERE]]', {
    x: PAGE_MARGIN_LEFT_RIGHT + 60,
    y: renderer.cursorY + 25,
    font: fonts.regular,
    size: 11,
    color: COLOR_WHITE,
  });

  renderer.drawWrappedText('Customer:', {
    font: fonts.bold,
    fontSize: 12,
    color: COLOR_INK,
    paragraphGap: 6,
  });
  renderer.drawSignatureLine('Name:', document.signatureBlocks.customer.name, { gapAfter: 4 });
  renderer.drawSignatureLine('Signature:', '___________________', {
    font: fonts.bold,
    gapAfter: 20,
  });
  renderer.page.drawText('[[DS_CUSTOMER_SIGN_HERE]]', {
    x: PAGE_MARGIN_LEFT_RIGHT + 60,
    y: renderer.cursorY + 25,
    font: fonts.regular,
    size: 11,
    color: COLOR_WHITE,
  });

  renderer.page.drawText('[[DS_PROVIDER_DATE_HERE]] [[DS_CUSTOMER_DATE_HERE]]', {
    x: PAGE_MARGIN_LEFT_RIGHT,
    y: PAGE_MARGIN_BOTTOM,
    font: fonts.regular,
    size: 10,
    color: COLOR_WHITE,
  });

  drawHeaderAndFooter(renderer, logoImage);

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
