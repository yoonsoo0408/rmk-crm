import { google } from 'googleapis'
import { getAuthorizedClient, extractBody, parseFrom } from '@/lib/gmail'
import { supabaseAdmin } from '@/lib/supabase'

const GMAIL_ACCOUNT = process.env.GMAIL_ACCOUNT!

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const oauthClient = await getAuthorizedClient(GMAIL_ACCOUNT)
    const gmail = google.gmail({ version: 'v1', auth: oauthClient })

    // 마지막 동기화 상태 조회
    const { data: syncState } = await supabaseAdmin
      .from('gmail_sync_state')
      .select('history_id')
      .eq('email', GMAIL_ACCOUNT)
      .single()

    if (!syncState?.history_id) {
      return Response.json({ error: 'Gmail 연동 필요. /api/auth/google 접속하여 연결하세요.' }, { status: 400 })
    }

    // 마지막 historyId 이후 변경사항 조회
    let historyData: any
    try {
      const res = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: syncState.history_id,
        historyTypes: ['messageAdded'],
      })
      historyData = res.data
    } catch (e: any) {
      // historyId 만료 시 (7일 이상 미동기화) 현재 시점으로 리셋
      if (e?.code === 404 || e?.status === 404) {
        const { data: profile } = await gmail.users.getProfile({ userId: 'me' })
        await supabaseAdmin
          .from('gmail_sync_state')
          .upsert({ email: GMAIL_ACCOUNT, history_id: profile.historyId, last_sync_at: new Date().toISOString() }, { onConflict: 'email' })
        return Response.json({ message: 'historyId 만료로 리셋. 다음 동기화부터 정상 작동.' })
      }
      throw e
    }

    const newHistoryId = historyData.historyId
    const histories = historyData.history || []

    // 중복 없이 메시지 ID 수집
    const messageIds = new Set<string>()
    for (const h of histories) {
      for (const m of (h.messagesAdded || [])) {
        if (m.message?.id) messageIds.add(m.message.id)
      }
    }

    let created = 0
    let updated = 0

    for (const messageId of messageIds) {
      const result = await processMessage(gmail, messageId)
      if (result === 'created') created++
      else if (result === 'updated') updated++
    }

    // historyId 갱신
    if (newHistoryId) {
      await supabaseAdmin
        .from('gmail_sync_state')
        .upsert({ email: GMAIL_ACCOUNT, history_id: newHistoryId, last_sync_at: new Date().toISOString() }, { onConflict: 'email' })
    }

    return Response.json({ ok: true, processed: messageIds.size, created, updated })
  } catch (e: any) {
    console.error('Gmail 동기화 오류:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

async function processMessage(gmail: any, messageId: string): Promise<'created' | 'updated' | 'skipped'> {
  const { data: msg } = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  })

  const labels = msg.labelIds || []
  const isInbox = labels.includes('INBOX')
  const isSent  = labels.includes('SENT')

  // 받은 메일 또는 보낸 메일만 처리 (초안/스팸 제외)
  if (!isInbox && !isSent) return 'skipped'

  const headers = msg.payload?.headers || []
  const h = (name: string) => headers.find((x: any) => x.name.toLowerCase() === name.toLowerCase())?.value || ''

  const subject  = h('Subject') || '(제목 없음)'
  const from     = h('From')
  const threadId = msg.threadId!
  const body     = (extractBody(msg.payload) || msg.snippet || '').slice(0, 3000)
  const { name: fromName, email: fromEmail } = parseFrom(from)

  // ── 1. 기존 딜 스레드 매칭 ──────────────────────────────
  const { data: existingDeal } = await supabaseAdmin
    .from('deals')
    .select('id, stage')
    .eq('gmail_thread_id', threadId)
    .maybeSingle()

  if (existingDeal) {
    // 활동 추가
    await supabaseAdmin.from('activities').insert({
      deal_id: existingDeal.id,
      type: isSent ? 'email_sent' : 'email_received',
      content: body,
      from_label: isSent ? 'RMK' : (fromName || fromEmail),
    })

    // 스테이지 자동 진행
    let nextStage: string | null = null
    if (isSent && existingDeal.stage === 'quote_preparing') {
      nextStage = 'quote_submitted'
    } else if (isInbox && existingDeal.stage === 'quote_submitted') {
      nextStage = 'negotiating'
    }

    await supabaseAdmin
      .from('deals')
      .update({
        ...(nextStage ? { stage: nextStage } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingDeal.id)

    return 'updated'
  }

  // ── 2. 새 스레드 — 수신 메일만 신규 딜 생성 ────────────
  if (!isInbox) return 'skipped'

  // 발신자 회사 매칭 또는 생성
  let companyId: string | null = null

  // 메일나라 전달 메일(rmk@raremetal.co.kr)은 원본 발신자 파싱 불가 → 회사 미지정
  const isForwarded = fromEmail.toLowerCase().includes('raremetal.co.kr')

  if (!isForwarded) {
    const { data: existingCompany } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('email', fromEmail)
      .maybeSingle()

    if (existingCompany) {
      companyId = existingCompany.id
    } else {
      const { data: newCompany } = await supabaseAdmin
        .from('companies')
        .insert({ name: fromName || fromEmail, email: fromEmail })
        .select('id')
        .single()
      companyId = newCompany?.id || null
    }
  }

  // 신규 딜 생성
  const { data: deal } = await supabaseAdmin
    .from('deals')
    .insert({
      subject,
      company_id: companyId,
      stage: 'inquiry_received',
      gmail_thread_id: threadId,
      first_contact_date: new Date().toISOString().split('T')[0],
    })
    .select('id')
    .single()

  if (deal) {
    await supabaseAdmin.from('activities').insert({
      deal_id: deal.id,
      type: 'email_received',
      content: body,
      from_label: isForwarded ? '메일나라(전달)' : (fromName || fromEmail),
    })
  }

  return 'created'
}
