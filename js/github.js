// A small client for the parts of the GitHub REST API the hub needs:
// read the repo, list a folder, read a file, write a file, delete a file.
// The key (a fine-grained personal access token) is sent only to the API base.

export class GitHubError extends Error {
  constructor(status, message) {
    super(message || `GitHub answered ${status}`);
    this.status = status;
  }
}

const encodePath = (p) => p.split('/').filter(Boolean).map(encodeURIComponent).join('/');

export function bytesToBase64(bytes) {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return btoa(bin);
}
export const textToBase64 = (text) => bytesToBase64(new TextEncoder().encode(text));
export function base64ToText(b64) {
  const bin = atob((b64 || '').replace(/\s/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export class GitHub {
  constructor({ owner, repo, token, apiBase = 'https://api.github.com' }) {
    this.owner = owner;
    this.repo = repo;
    this.token = token;
    this.apiBase = apiBase.replace(/\/$/, '');
  }

  get repoPath() { return `/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}`; }

  async request(method, path, { body, accept, raw } = {}) {
    let res;
    try {
      res = await fetch(this.apiBase + path, {
        method,
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: accept || 'application/vnd.github+json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      throw new GitHubError(0, 'No connection to GitHub. Check the internet and try again.');
    }
    if (!res.ok) {
      let message = '';
      try { message = (await res.json()).message; } catch { /* not JSON */ }
      throw new GitHubError(res.status, message);
    }
    if (raw) return res;
    if (res.status === 204) return null;
    return res.json();
  }

  repoInfo() { return this.request('GET', this.repoPath); }

  /** Lists a folder. A missing folder is an empty list, not an error. */
  async list(dir) {
    try {
      const out = await this.request('GET', `${this.repoPath}/contents/${encodePath(dir)}`);
      return Array.isArray(out) ? out : [];
    } catch (err) {
      if (err.status === 404) return [];
      throw err;
    }
  }

  /** Reads a text file. Returns { text, sha } or null when it doesn't exist. */
  async readText(path) {
    try {
      const out = await this.request('GET', `${this.repoPath}/contents/${encodePath(path)}`);
      if (out.content || out.size === 0) return { text: base64ToText(out.content), sha: out.sha };
      // Files over 1 MB come back without content; ask for the raw bytes instead.
      const res = await this.request('GET', `${this.repoPath}/contents/${encodePath(path)}`, { accept: 'application/vnd.github.raw', raw: true });
      return { text: await res.text(), sha: out.sha };
    } catch (err) {
      if (err.status === 404) return null;
      throw err;
    }
  }

  async readBlob(path) {
    const res = await this.request('GET', `${this.repoPath}/contents/${encodePath(path)}`, { accept: 'application/vnd.github.raw', raw: true });
    return res.blob();
  }

  /** Creates or updates a file. content is base64. Returns the new sha. */
  async put(path, contentBase64, message, sha) {
    const out = await this.request('PUT', `${this.repoPath}/contents/${encodePath(path)}`, {
      body: { message, content: contentBase64, ...(sha ? { sha } : {}) },
    });
    return out.content.sha;
  }

  async remove(path, sha, message) {
    await this.request('DELETE', `${this.repoPath}/contents/${encodePath(path)}`, { body: { message, sha } });
  }
}

/** Turns an API error into one plain sentence for the person using the app. */
export function explainError(err, owner, repo) {
  const status = err && err.status;
  if (status === 0) return err.message;
  if (status === 401) return 'GitHub refused the key. It may have expired or been typed wrong. Open Settings and paste a new one.';
  if (status === 403) return 'This key can read but not save. To save, the key needs "Contents: Read and write" on the data repository.';
  if (status === 404) return `Can't find ${owner}/${repo}. Check the name, and that the key was given access to this repository.`;
  if (status === 409 || status === 422) return 'This item was changed somewhere else (maybe by the agent). Reload, then make your change again.';
  if (status === 413) return 'That file is too big for GitHub. Keep videos in Google Drive and paste the link.';
  return (err && err.message) || 'Something went wrong talking to GitHub.';
}
