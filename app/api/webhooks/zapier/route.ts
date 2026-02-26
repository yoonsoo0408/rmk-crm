import { supabaseAdmin, err, serverError, verifyZapierSecret } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    if (!verifyZapierSecret(req)) return err('Unauthorized', 401)

    const { email } = await req.json()
    if (!email?.from || !email?.subject) return err('from and subject are required')

    // 거래처 매칭 또는 생성
    let companyId: string | null = null
    let companyIsNew = false

    const { data: existing } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('email', email.from)
      .single()

    if (existing) {
      companyId = existing.id
    } else {
      const { data: newCompany } = await supabaseAdmin
        .from('companies')
        .insert({ name: email.from_name || email.from, email: email.from })
        .select()
        .single()
      companyId = newCompany?.id || null
      companyIsNew = true
    }

    // 딜 생성
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .insert({
        subject: email.subject,
        company_id: companyId,
        stage: 'inquiry_received',
        first_contact_date: email.received_at?.split('T')[0] || new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (dealError) return err(dealError.message)

    // 활동 기록
    await supabaseAdmin.from('activities').insert({
      deal_id: deal.id,
      type: 'email_received',
      content: email.body || email.subject,
      ai_summary: null,
      from_label: email.from_name || email.from
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