import FingerprintJS from '@fingerprintjs/fingerprintjs';

let cachedId: string | null = null;

/**
 * Generates or retrieves a unique device fingerprint.
 * Used to identify guest devices and prevent trial abuse.
 */
export async function getDeviceFingerprint(): Promise<string> {
  if (cachedId) return cachedId;
  
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    cachedId = result.visitorId;
    return cachedId;
  } catch (err) {
    console.error('Failed to generate device fingerprint:', err);
    // Fallback to a random ID if fingerprinting fails (not ideal but keeps it working)
    const fallback = 'fb-' + Math.random().toString(36).substring(2, 15);
    return fallback;
  }
}
