import { sessionCookie } from './_session.js'
export default function handler(request, response) { if (request.method !== 'POST') return response.status(405).end(); response.setHeader('Set-Cookie', sessionCookie('', 0)); response.status(200).json({ ok: true }) }
