import * as FileSystem from 'expo-file-system/legacy';
import * as tus from 'tus-js-client';

import {
  ALLOWED_DOC_EXTENSIONS,
  ALLOWED_DOC_MIME_TYPES,
  MAX_UPLOAD_BYTES,
} from '../constants/validation';

import { getExtra } from './config';

const CHUNK_SIZE = 1024 * 1024;

export type LocalDocument = {
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
};

function extensionOf(name: string): string {
  const index = name.lastIndexOf('.');
  return index >= 0 ? name.slice(index).toLowerCase() : '';
}

export function validateDocument(file: LocalDocument): string | null {
  const ext = extensionOf(file.name || file.uri);
  if (!ALLOWED_DOC_EXTENSIONS.includes(ext as (typeof ALLOWED_DOC_EXTENSIONS)[number])) {
    return `File '${file.name}' is not allowed. Only image files (JPG, PNG, WEBP) are accepted.`;
  }

  const mime = (file.mimeType || '').toLowerCase();
  if (mime && mime !== 'application/octet-stream' && !ALLOWED_DOC_MIME_TYPES.includes(mime as (typeof ALLOWED_DOC_MIME_TYPES)[number])) {
    return `Invalid file type '${file.mimeType}'. Only image files (JPG, PNG, WEBP) are accepted.`;
  }

  if (typeof file.size === 'number' && file.size > MAX_UPLOAD_BYTES) {
    return 'File exceeds the 50MB upload limit.';
  }

  return null;
}

async function resolveFileSize(file: LocalDocument): Promise<number> {
  if (typeof file.size === 'number' && file.size > 0) {
    return file.size;
  }

  const info = await FileSystem.getInfoAsync(file.uri);
  if (info.exists && 'size' in info && typeof info.size === 'number') {
    return info.size;
  }

  throw new Error('Could not determine file size for upload.');
}

function extractFileId(uploadUrl: string): string {
  const trimmed = uploadUrl.replace(/\/+$/, '');
  const fileId = trimmed.split('/').pop();
  if (!fileId) {
    throw new Error('Upload completed but the server did not return a file id.');
  }
  return fileId;
}

function decodeBase64(base64: string): Uint8Array {
  const atobFn = globalThis.atob.bind(globalThis);
  const binary = atobFn(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function uploadWithTusJs(
  file: LocalDocument,
  size: number,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const { tusUrl } = getExtra();
  const mimeType = file.mimeType || 'application/octet-stream';

  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(
      {
        uri: file.uri,
        name: file.name,
        type: mimeType,
        size,
      } as unknown as Blob,
      {
        endpoint: tusUrl,
        chunkSize: CHUNK_SIZE,
        retryDelays: [0, 1000, 3000, 5000],
        uploadSize: size,
        metadata: {
          filename: file.name,
          filetype: mimeType,
        },
        onError: (error) => reject(error),
        onProgress: (bytesSent, bytesTotal) => {
          const total = bytesTotal || size;
          onProgress?.(Math.min(100, Math.round((bytesSent / total) * 100)));
        },
        onSuccess: () => {
          try {
            resolve(extractFileId(upload.url ?? ''));
          } catch (error) {
            reject(error);
          }
        },
      },
    );

    upload.start();
  });
}

async function uploadWithFetchChunks(
  file: LocalDocument,
  size: number,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const { tusUrl } = getExtra();
  const mimeType = file.mimeType || 'application/octet-stream';
  const fileNameB64 = globalThis.btoa(unescape(encodeURIComponent(file.name)));
  const fileTypeB64 = globalThis.btoa(mimeType);

  const createRes = await fetch(tusUrl, {
    method: 'POST',
    headers: {
      'Tus-Resumable': '1.0.0',
      'Upload-Length': String(size),
      'Upload-Metadata': `filename ${fileNameB64},filetype ${fileTypeB64}`,
    },
  });

  if (!createRes.ok && createRes.status !== 201) {
    throw new Error(`Upload creation failed: ${createRes.status}`);
  }

  const location = createRes.headers.get('Location') || createRes.headers.get('location');
  if (!location) {
    throw new Error('Server did not return upload location.');
  }

  const uploadUrl = new URL(location, tusUrl.endsWith('/') ? tusUrl : `${tusUrl}/`).toString();
  let offset = 0;

  while (offset < size) {
    const length = Math.min(CHUNK_SIZE, size - offset);
    const chunkBase64 = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.Base64,
      position: offset,
      length,
    });
    const bytes = decodeBase64(chunkBase64);

    const body = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(body).set(bytes);
    const patchRes = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        'Tus-Resumable': '1.0.0',
        'Upload-Offset': String(offset),
        'Content-Type': 'application/offset+octet-stream',
      },
      body,
    });

    if (!patchRes.ok && patchRes.status !== 204) {
      throw new Error(`Chunk upload failed at offset ${offset}: ${patchRes.status}`);
    }

    const nextOffset = patchRes.headers.get('Upload-Offset') || patchRes.headers.get('upload-offset');
    offset = nextOffset ? Number.parseInt(nextOffset, 10) : offset + bytes.byteLength;
    onProgress?.(Math.min(100, Math.round((offset / size) * 100)));
  }

  return extractFileId(uploadUrl);
}

export async function uploadDocument(
  file: LocalDocument,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const validationError = validateDocument(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const size = await resolveFileSize(file);
  if (size > MAX_UPLOAD_BYTES) {
    throw new Error('File exceeds the 50MB upload limit.');
  }

  try {
    return await uploadWithTusJs(file, size, onProgress);
  } catch {
    return uploadWithFetchChunks(file, size, onProgress);
  }
}
