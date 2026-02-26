import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export function ok(data: unknown, status = 200) {
  return Response.json({ data }, { status })
}
export function created(data: unknown) {
  return Response.json({ data }, { status: 201 })
}
export function err(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}
export function notFound(msg = 'Not found') {
  return Response.json({ error: msg }, { status: 404 })
}
export function serverError(e: unknown) {
  console.error(e)
  return Response.json({ error: 'Internal server error' }, { status: 500 })
}

export const ACTIVE_STAGES = [
  'inquiry_received','quote_preparing','quote_submitted','negotiating'
]
export const STALE_THRESHOLD_DAYS = 60

export function verifyZapierSecret(req: Request) {
  const secret = req.headers.get('x-zapier-secret')
  return secret === process.env.ZAPIER_WEBHOOK_SECRET
}

export function parsePagination(req: Request) {
  const url = new URL(req.url)
  const page  = parseInt(url.searchParams.get('page')  || '1')
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const from  = (page - 1) * limit
  const to    = from + limit - 1
  return { page, limit, from, to }
}