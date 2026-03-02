// ============================
// GitHub API Service — Octokit wrapper
// ============================
import { Octokit } from '@octokit/rest';

let octokitInstance = null;
let currentToken = null;

export function initOctokit(token) {
    currentToken = token;
    octokitInstance = new Octokit({ auth: token });
    return octokitInstance;
}

function getOctokit() {
    // Lazy init: if not initialized yet, try loading token from localStorage
    if (!octokitInstance) {
        if (!currentToken) {
            try {
                const saved = localStorage.getItem('book-paper-reader-settings');
                if (saved) {
                    const settings = JSON.parse(saved);
                    if (settings.githubToken) {
                        currentToken = settings.githubToken;
                    }
                }
            } catch { /* ignore */ }
        }
        if (currentToken) {
            octokitInstance = new Octokit({ auth: currentToken });
        } else {
            throw new Error('GitHub not initialized. Please set your token.');
        }
    }
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
 * Check if a file exists in the repo (avoids noisy 404 errors)
 */
export async function checkFileExists(owner, repo, path) {
    try {
        const octokit = getOctokit();
        const { data } = await octokit.rest.repos.getContent({ owner, repo, path });
        return { exists: true, sha: data.sha, size: data.size };
    } catch (err) {
        if (err.status === 404) return { exists: false };
        throw err;
    }
}

/**
 * Download a PDF as ArrayBuffer using authenticated request
 */
export async function downloadPDF(owner, repo, path) {
    const octokit = getOctokit();

    // Get file metadata (for sha)
    const { data: meta } = await octokit.rest.repos.getContent({ owner, repo, path });

    // Encode each path segment individually (not the whole path)
    const encodedPath = path.split('/').map(s => encodeURIComponent(s)).join('/');

    // Use authenticated fetch with raw Accept header for binary content
    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`,
        {
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Accept': 'application/vnd.github.raw',
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.status}`);
    }

    return {
        arrayBuffer: await response.arrayBuffer(),
        sha: meta.sha,
        size: meta.size,
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
