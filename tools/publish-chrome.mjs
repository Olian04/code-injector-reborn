#!/usr/bin/env node
import { createSign } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const TOKEN_URI = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/chromewebstore';
const API = 'https://chromewebstore.googleapis.com';

function required(name) {
    const value = process.env[name];
    if (!value) {
        console.error(`Missing required environment variable: ${name}`);
        process.exit(1);
    }
    return value;
}

function base64url(input) {
    return Buffer.from(input)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Build a signed JWT assertion from a service-account JSON key.
 */
function signJwt(serviceAccount) {
    const now = Math.floor(Date.now() / 1000);
    const header = {
        alg: 'RS256',
        typ: 'JWT',
        kid: serviceAccount.private_key_id,
    };
    const claim = {
        iss: serviceAccount.client_email,
        scope: SCOPE,
        aud: TOKEN_URI,
        iat: now,
        exp: now + 3600,
    };

    const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;
    const signer = createSign('RSA-SHA256');
    signer.update(unsigned);
    signer.end();
    const signature = signer
        .sign(serviceAccount.private_key, 'base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return `${unsigned}.${signature}`;
}

/**
 * Resolve an OAuth assertion from the secret. Accepts either a service-account
 * JSON key (preferred; a fresh JWT is signed) or a pre-signed JWT string.
 */
function resolveAssertion(secret) {
    const trimmed = secret.trim();

    // Looks like JSON -> service-account key.
    if (trimmed.startsWith('{')) {
        const serviceAccount = JSON.parse(trimmed);
        if (!serviceAccount.client_email || !serviceAccount.private_key) {
            throw new Error('Service-account JSON is missing client_email or private_key.');
        }
        return signJwt(serviceAccount);
    }

    // Looks like a pre-signed JWT (header.payload.signature).
    if (trimmed.split('.').length === 3) {
        return trimmed;
    }

    throw new Error(
        'CHROME_WEBSTORE_SERVICE_ACCOUNT_JWT is neither service-account JSON nor a JWT assertion.'
    );
}

async function getAccessToken(assertion) {
    const res = await fetch(TOKEN_URI, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion,
        }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.access_token) {
        throw new Error(`Failed to obtain access token: ${res.status} ${JSON.stringify(body)}`);
    }
    return body.access_token;
}

async function uploadPackage(token, publisherId, itemId, zipBuffer) {
    const url = `${API}/upload/v2/publishers/${publisherId}/items/${itemId}:upload`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/zip',
        },
        body: zipBuffer,
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(`Upload failed: ${res.status} ${JSON.stringify(body)}`);
    }
    const state = body.uploadState || (body.itemError ? 'FAILURE' : 'UNKNOWN');
    if (state === 'FAILURE') {
        throw new Error(`Upload rejected: ${JSON.stringify(body)}`);
    }
    console.log(`Upload state: ${state}`);
    return body;
}

async function publishItem(token, publisherId, itemId) {
    const url = `${API}/v2/publishers/${publisherId}/items/${itemId}:publish`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(`Publish failed: ${res.status} ${JSON.stringify(body)}`);
    }
    console.log(`Publish status: ${JSON.stringify(body.status || body)}`);
    return body;
}

async function main() {
    const secret = required('CHROME_WEBSTORE_SERVICE_ACCOUNT_JWT');
    const publisherId = required('CHROME_PUBLISHER_ID');
    const itemId = required('CHROME_EXTENSION_ID');
    const zipPath = process.env.CHROME_ZIP_PATH || 'code-injector-reborn.zip';

    const zipBuffer = await readFile(path.resolve(zipPath));
    console.log(`Package: ${zipPath} (${zipBuffer.length} bytes)`);

    const assertion = resolveAssertion(secret);
    const token = await getAccessToken(assertion);
    console.log('Obtained Chrome Web Store access token.');

    await uploadPackage(token, publisherId, itemId, zipBuffer);
    await publishItem(token, publisherId, itemId);

    console.log('Done: uploaded and submitted for publishing.');
}

main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
});
