import crypto from 'node:crypto'

const cookieName = 'serverdock_session'
const getCookie = (request) => Object.fromEntries((request.headers.cookie || '').split(';').map(value => value.trim().split('=').map(decodeURIComponent)).filter(pair => pair.length === 2))
const sign = (value) => crypto.createHmac('sha256', process.env.SERVERDOCK_SESSION_SECRET).update(value).digest('base64url')
export const createSession = (username) => { const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 8; const value = `${username}.${expires}`; return `${value}.${sign(value)}` }
export const validSession = (request) => { try { const token = getCookie(request)[cookieName]; if (!token) return false; const [username, expires, signature] = token.split('.'); const value = `${username}.${expires}`; return username === process.env.SERVERDOCK_ADMIN_USER && Number(expires) > Date.now() / 1000 && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(sign(value))) } catch { return false } }
export const sessionCookie = (value, age = 28800) => `${cookieName}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`
