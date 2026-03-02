// ============================
// GitHub API Service — Octokit wrapper
// ============================
import { Octokit } from '@octokit/rest';

let octokitInstance = null;

export function initOctokit(token) {
    octokitInstance = new Octokit({ auth: token });
    return octokitInstance;
}

function getOctokit() {
    if (!octokitInstance) throw new Error('GitHub not initialized. Please set your token.');
    return octokitInstance;
}

/**
 * Test connection by fetching the authenticated user
 */
export async function testConnection(token) {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.users.getAuthenticated();
    return data;
}

/**
 * Test repo access
 */
export async function testRepoAccess(token, owner, repo) {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.repos.get({ owner, repo });
    return data;
}

/**
 * List contents of a path in the repo
 */
export async function listContents(owner, repo, path = '') {
    const octokit = getOctokit();
    try {
        const { data } = await octokit.rest.repos.getContent({ owner, repo, path });
        return Array.isArray(data) ? data : [data];
    } catch (err) {
        if (err.status === 404) return [];
        throw err;
    }
}

/**
 * Get a text file's content (decoded from base64)
 */
export async function getFileContent(owner, repo, path) {
    const octokit = getOctokit();
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path });

    if (data.encoding === 'base64') {
        const text = decodeBase64(data.content);
        return { content: text, sha: data.sha, size: data.size };
    }
    return { content: data.content, sha: data.sha, size: data.size };
}

/**
 * Get raw binary file (for PDFs > 1MB)
 */
export async function getRawFile(owner, repo, path) {
    const octokit = getOctokit();
    const { data } = await octokit.rest.repos.getContent({
        owner, repo, path,
        mediaType: { format: 'raw' },
    });
    return data;
}

/**
 * Download a PDF as ArrayBuffer using the download URL
 */
export async function downloadPDF(owner, repo, path, token) {
    const octokit = getOctokit();
    // Get the download URL
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path });
    const downloadUrl = data.download_url;

    // Fetch as ArrayBuffer
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error(`Failed to download PDF: ${response.status}`);
    return {
        arrayBuffer: await response.arrayBuffer(),
        sha: data.sha,
        size: data.size,
    };
}

/**
 * Create or update a file in the repo
 */
export async function saveFile(owner, repo, path, content, message, sha = null) {
    const octokit = getOctokit();
    const params = {
        owner, repo, path,
        message,
        content: encodeBase64(content),
    };
    if (sha) params.sha = sha;

    const { data } = await octokit.rest.repos.createOrUpdateFileContents(params);
    return data;
}

/**
 * Save binary data (e.g., PDF) as base64
 */
export async function saveBinaryFile(owner, repo, path, arrayBuffer, message, sha = null) {
    const octokit = getOctokit();
    const base64 = arrayBufferToBase64(arrayBuffer);
    const params = {
        owner, repo, path,
        message,
        content: base64,
    };
    if (sha) params.sha = sha;

    const { data } = await octokit.rest.repos.createOrUpdateFileContents(params);
    return data;
}

// --- Helpers ---

function encodeBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

function decodeBase64(base64) {
    // Handle multiline base64 from GitHub
    const cleaned = base64.replace(/\n/g, '');
    return decodeURIComponent(escape(atob(cleaned)));
}

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
