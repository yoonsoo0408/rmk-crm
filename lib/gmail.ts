import { google } from 'googleapis'
import { supabaseAdmin } from './supabase'

function getRedirectUri() {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
}

export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri()
  )
}

export function getAuthUrl() {
  const client = createOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    prompt: 'consent',
  })
}

export async function saveTokens(email: string, tokens: {
  access_token?: string | null
  refresh_token?: string | null
  expiry_date?: number | null
}) {
  await supabaseAdmin
    .from('gmail_tokens')
    .upsert({
      email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' })
}

export async function getAuthorizedClient(email: string) {
  const { data: tokens } = await supabaseAdmin
    .from('gmail_tokens')
    .select('*')
    .eq('email', email)
    .single()

  if (!tokens) throw new Error(`Gmail 토큰 없음: ${email}`)

  const client = createOAuthClient()
  client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  })

  // 토큰 갱신 시 자동 저장
  client.on('tokens', async (newTokens) => {
    await saveTokens(email, { ...tokens, ...newTokens })
  })

  return client
}

// Gmail 메시지 payload에서 plain text 본문 추출
export function extractBody(payload: any): string {
  if (!payload) return ''

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64url').toString('utf-8')
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractBody(part)
      if (text) return text
    }
  }

  return ''
}

// Re:, Fwd:, [Company/Quotation] 등 제거
export function cleanSubject(subject: string): string {
  return subject
    .replace(/^(Re|Fwd|FW|RE|FWD|전달|회신):\s*/gi, '')
    .replace(/^\[.*?\]\s*/g, '')
    .trim()
}

// "Name <email@domain>" → { name, email }
export function parseFrom(from: string): { name: string; email: string } {
  const match = from.match(/^"?(.+?)"?\s*<(.+?)>$/)
  if (match) return { name: match[1].trim(), email: match[2].trim() }
  return { name: from.trim(), email: from.trim() }
}
