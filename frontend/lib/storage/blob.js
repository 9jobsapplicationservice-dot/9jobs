import mongoose from 'mongoose';

import connectDB from '@/utils/db';

const STORAGE_BUCKET_NAME = 'agreementFiles';
const GRIDFS_PROTOCOL = 'gridfs://';

function normalizeStorageKey(folder, fileName) {
  const safeFolder = String(folder || '').replace(/^\/+|\/+$/g, '');
  return safeFolder ? `${safeFolder}/${fileName}` : fileName;
}

function toGridFsUrl(key) {
  return `${GRIDFS_PROTOCOL}${encodeURIComponent(key)}`;
}

function extractGridFsKey(url) {
  if (!url?.startsWith(GRIDFS_PROTOCOL)) {
    return '';
  }

  return decodeURIComponent(url.slice(GRIDFS_PROTOCOL.length));
}

async function getBucket() {
  await connectDB();

  const db = mongoose.connection?.db;
  if (!db) {
    throw new Error('MongoDB connection is required for GridFS storage.');
  }

  return new mongoose.mongo.GridFSBucket(db, {
    bucketName: STORAGE_BUCKET_NAME,
  });
}

async function getFilesCollection() {
  await connectDB();

  const db = mongoose.connection?.db;
  if (!db) {
    throw new Error('MongoDB connection is required for GridFS storage.');
  }

  return db.collection(`${STORAGE_BUCKET_NAME}.files`);
}

async function getFileRecordByKey(key) {
  const files = await getFilesCollection();
  return files.findOne({ filename: key }, { sort: { uploadDate: -1 } });
}

async function bufferFromStream(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function uploadPrivatePdf({ folder, fileName, buffer, contentType = 'application/pdf', metadata = {} }) {
  const path = normalizeStorageKey(folder, fileName);
  await deleteStoredFileByKey(path).catch(() => {});
  const bucket = await getBucket();

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(path, {
      contentType,
      metadata,
    });

    uploadStream.on('error', reject);
    uploadStream.on('finish', () => {
      resolve({
        url: toGridFsUrl(path),
        path,
        id: String(uploadStream.id),
      });
    });

    uploadStream.end(buffer);
  });
}

export async function fetchBlobBuffer(url) {
  const gridFsKey = extractGridFsKey(url);
  if (gridFsKey) {
    return fetchBlobBufferByKey(gridFsKey);
  }

  const response = await fetch(url, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch stored asset (${response.status}).`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function fetchBlobBufferByKey(key) {
  if (!key) {
    throw new Error('Storage key is required to retrieve stored content.');
  }

  const { stream } = await openDownloadStreamByKey(key);
  return bufferFromStream(stream);
}

export async function openDownloadStreamByKey(key) {
  if (!key) {
    throw new Error('Storage key is required to open a download stream.');
  }

  const bucket = await getBucket();
  const file = await getFileRecordByKey(key);
  if (!file) {
    throw new Error(`Stored asset not found for key: ${key}`);
  }

  return {
    file,
    stream: bucket.openDownloadStream(file._id),
  };
}

export async function deleteStoredFileByKey(key) {
  if (!key) {
    return 0;
  }

  const bucket = await getBucket();
  const files = await getFilesCollection();
  const matches = await files.find({ filename: key }).toArray();

  for (const file of matches) {
    await bucket.delete(file._id);
  }

  return matches.length;
}

