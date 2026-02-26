import { supabaseAdmin, err, serverError } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Zapier는 flat 구조로 보냄 (email__from, email__subject 등)
    // body에서 zapier_secret 검증
    const secret = body.zapier_secret
    if (secret !== process.env.ZAPIER_WEBHOOK_SECRET) {
      return err('Unauthorized', 401)
    }

    // flat 구조 파싱
    const from = body.email__from || body.email?.from
    const fromName = body.email__from_name || body.email?.from_name
    const subject = body.email__subject || body.email?.subject
    const emailBody = body.email__body || body.email?.body
    const receivedAt = body.email__received_at || body.email?.received_at

    if (!from || !subject) return err('from and subject are required')

    // 거래처 매칭 또는 생성
    let companyId: string | null = null
    let companyIsNew = false

    const { data: existing } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('email', from)
      .single()

    if (existing) {
      companyId = existing.id
    } else {
      const { data: newCompany } = await supabaseAdmin
        .from('companies')
        .insert({ name: fromName || from, email: from })
        .select()
        .single()
      companyId = newCompany?.id || null
      companyIsNew = true
    }

    // 딜 생성
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .insert({
        subject: subject,
        company_id: companyId,
        stage: 'inquiry_received',
        first_contact_date: receivedAt
          ? new Date(receivedAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (dealError) return err(dealError.message)

    // 활동 기록
    await supabaseAdmin.from('activities').insert({
      deal_id: deal.id,
      type: 'email_received',
      content: emailBody || subject,
      ai_summary: null,
      from_label: fromName || from
    })

    return Response.json({
      data: {
        deal_id: deal.id,
        company_id: companyId,
        company_is_new: companyIsNew,
        subject: deal.subject
      }
    }, { status: 201 })
  } catch (e) {
    return serverError(e)
  }
}
