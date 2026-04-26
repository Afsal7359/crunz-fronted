const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('crunz_token');
}

function headers(extra = {}) {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra
  };
}

async function request(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: headers(),
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),

  // File upload (multipart) — images or videos
  upload: async (path, formData, onProgress) => {
    const token = getToken();
    // Use XMLHttpRequest when progress callback is provided
    if (onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API}${path}`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100)); };
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 400) reject(new Error(data.message || 'Upload failed'));
            else resolve(data);
          } catch { reject(new Error('Upload failed')); }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
      });
    }
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data;
  }
};

export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

// Replaces any localhost image URL with the real backend URL.
// Fixes images that were uploaded before BACKEND_URL env var was set.
export function fixImageUrl(url) {
  if (!url) return url;
  if (!url.includes('localhost')) return url;
  const real = (process.env.NEXT_PUBLIC_API_URL || '').replace('/api', '');
  if (!real || real.includes('localhost')) return url;
  return url.replace(/https?:\/\/localhost:\d+/, real);
}
