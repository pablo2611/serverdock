import { validSession } from './_session.js'
export default function handler(request, response) { return validSession(request) ? response.status(200).json({ ok: true }) : response.status(401).json({ ok: false }) }
