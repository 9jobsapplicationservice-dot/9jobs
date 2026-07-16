import crypto from 'node:crypto';

import { put } from '@vercel/blob';

function ensureBlobConfig() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is required for private PDF storage.');
  }
}

export async function uploadPrivatePdf({ folder, fileName, buffer }) {
  ensureBlobConfig();

  const safeFolder = folder.replace(/^\/+|\/+$/g, '');
  const blobPath = `${safeFolder}/${crypto.randomUUID()}-${fileName}`;
  const result = await put(blobPath, buffer, {
    access: 'private',
    addRandomSuffix: false,
    contentType: 'application/pdf',
    cacheControlMaxAge: 0,
  });

  return {
    url: result.url,
    path: blobPath,
  };
}

export async function fetchBlobBuffer(url) {
  const response = await fetch(url, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch blob asset (${response.status}).`);
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * Resolves a private Vercel Blob URL dynamically by storage key/pathname
 * and downloads its content into a Buffer.
 * 
 * @param {string} key The Vercel Blob pathname / storage key
 * @returns {Promise<Buffer>}
 */
export async function fetchBlobBufferByKey(key) {
  ensureBlobConfig();
  
  if (!key) {
    throw new Error('Storage key is required to retrieve blob buffer.');
  }

  const { list } = require('@vercel/blob');
  const { blobs } = await list({ prefix: key });
  
  if (!blobs || blobs.length === 0) {
    throw new Error(`Private blob asset not found for key: ${key}`);
  }

  // Find exact match or first matching blob
  const targetBlob = blobs.find(b => b.pathname === key) || blobs[0];
  return fetchBlobBuffer(targetBlob.url);
}

