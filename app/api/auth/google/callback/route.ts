import { google } from 'googleapis'
import { createOAuthClient, saveTokens } from '@/lib/gmail'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error) {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?gmail_error=${error}`)
  }
  if (!code) {
    return Response.json({ error: 'code 없음' }, { status: 400 })
  }

  try {
    const client = createOAuthClient()
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    // 연결된 Gmail 계정 확인
    const oauth2 = google.oauth2({ version: 'v2', auth: client })
    const { data: userInfo } = await oauth2.userinfo.get()
    const email = userInfo.email!

    // 토큰 저장
    await saveTokens(email, tokens)

    // 현재 historyId 저장 (이 시점 이후 메일부터 동기화 시작)
    const gmail = google.gmail({ version: 'v1', auth: client })
    const { data: profile } = await gmail.users.getProfile({ userId: 'me' })

    await supabaseAdmin
      .from('gmail_sync_state')
      .upsert({
        email,
        history_id: profile.historyId,
        last_sync_at: new Date().toISOString(),
      }, { onConflict: 'email' })

    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?gmail_connected=1`)
  } catch (e) {
    console.error('Gmail OAuth 콜백 오류:', e)
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?gmail_error=auth_failed`)
  }
}
