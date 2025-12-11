/**
 * Generate a session id string of given length using characters:
 *  - A-Z a-z 0-9 _ -
 * Defaults to 16 characters.
 */
export function generateSessionId(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charsLen = chars.length

  // Use Web Crypto when available for better randomness
  try {
    const cryptoObj: any =
      typeof crypto !== 'undefined' ? crypto : (globalThis as any).crypto
    if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
      const arr = new Uint8Array(length)
      cryptoObj.getRandomValues(arr)
      return Array.from(arr)
        .map(n => chars[n % charsLen])
        .join('')
    }
  } catch (e) {
    // fall through to Math.random fallback
  }

  // Fallback (less cryptographically secure)
  let id = ''
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * charsLen))
  }
  return id
}

export default generateSessionId
