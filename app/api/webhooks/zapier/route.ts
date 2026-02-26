import { supabaseAdmin, err, serverError } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // 인증
    const secret = body.zapier_secret
    if (secret !== process.env.ZAPIER_WEBHOOK_SECRET) {
      return err('Unauthorized', 401)
    }

    // Zapier flat 구조 파싱
    const from        = body.email__from        || body.email?.from
    const fromName    = body.email__from_name   || body.email?.from_name
    const subject     = body.email__subject     || body.email?.subject
    const emailBody   = body.email__body        || body.email?.body
    const receivedAt  = body.email__received_at || body.email?.received_at

    // Zapier 6번 단계에서 정제된 원본 제목 (Re:, [고객사명] 제거한 순수 제목)
    // 없으면 raw subject 그대로 사용
    const cleanSubject = body.email__clean_subject || subject

    if (!from || !subject) return err('from and subject are required')

    // ────────────────────────────────────────────────
    // 1. 거래처 매칭 또는 생성
    // ────────────────────────────────────────────────
    let companyId: string | null = null
    let companyIsNew = false

    const { data: existingCompany } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('email', from)
      .single()

    if (existingCompany) {
      companyId = existingCompany.id
    } else {
      const { data: newCompany } = await supabaseAdmin
        .from('companies')
        .insert({ name: fromName || from, email: from })
        .select()
        .single()
      companyId = newCompany?.id || null
      companyIsNew = true
    }

    // ────────────────────────────────────────────────
    // 2. 중복 딜 체크 — 정제된 제목으로 기존 딜 검색
    //    완료(order_confirmed/lost/no_response) 제외하고 검색
    // ────────────────────────────────────────────────
    const { data: existingDeal } = await supabaseAdmin
      .from('deals')
      .select('id, subject, stage')
      .eq('subject', cleanSubject)
      .not('stage', 'in', '("order_confirmed","lost","no_response")')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // ────────────────────────────────────────────────
    // 3-A. 기존 딜 있으면 → 활동 기록만 추가 + updated_at 갱신
    // ────────────────────────────────────────────────
    if (existingDeal) {
      await supabaseAdmin.from('activities').insert({
        deal_id: existingDeal.id,
        type: 'email_received',
        content: emailBody || subject,
        ai_summary: null,
        from_label: fromName || from
      })

      // updated_at 갱신 (마지막 컨택일 추적용)
      await supabaseAdmin
        .from('deals')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', existingDeal.id)

      return Response.json({
        data: {
          deal_id: existingDeal.id,
          action: 'activity_added',       // 신규 생성이 아님을 명시
          company_id: companyId,
          company_is_new: companyIsNew,
          subject: existingDeal.subject
        }
      }, { status: 200 })
    }

    // ────────────────────────────────────────────────
    // 3-B. 기존 딜 없으면 → 신규 딜 생성
    // ────────────────────────────────────────────────
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .insert({
        subject: cleanSubject,
        company_id: companyId,
        stage: 'inquiry_received',
        first_contact_date: receivedAt
          ? new Date(receivedAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (dealError) return err(dealError.message)

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
        action: 'deal_created',           // 신규 생성
        company_id: companyId,
        company_is_new: companyIsNew,
        subject: deal.subject
      }
    }, { status: 201 })

  } catch (e) {
    return serverError(e)
  }
}
