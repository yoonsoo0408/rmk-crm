import { supabaseAdmin, ok, err, notFound, serverError } from '@/lib/supabase'

function buildWonEmailDraft(deal: any) {
  const subject = `[수주 공지] ${deal.company?.name || ''} - ${deal.product || ''}`
  const body = `수신: 전체
참조: ${deal.company?.contact_name || ''}

알엠케이 밀양 수주 공지 드리오니 확인 부탁드립니다.

수주 : ${deal.destination_port || '—'}
수주 진행 : 인천
담당 : ${deal.assignee?.name || '—'} 사원(영업)
관리번호 : ${deal.quote_ref || '—'}
수주처 : ${deal.company?.name || '—'}
품명 : ${deal.product || '—'}
금액 : ${deal.currency || 'USD'} ${deal.amount?.toLocaleString() || '—'}
총 수량 : ${deal.total_qty?.toLocaleString() || '—'} pcs
총 중량 : ${deal.total_weight?.toLocaleString() || '—'} kg
선적 조건 : ${deal.shipment_term || '—'}
결제 조건 : ${deal.payment_term || '—'}

Best Regards
RMK CO., LTD`
  return { subject, body }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { data, error } = await supabaseAdmin
      .from('deals')
      .select(`*, company:companies(id,name,contact_name), assignee:users(id,name)`)
      .eq('id', id)
      .single()

    if (error || !data) return notFound()
    return ok(buildWonEmailDraft(data))
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { email_body, send_email } = await req.json()

    const { data: existing } = await supabaseAdmin
      .from('deals')
      .select('stage')
      .eq('id', id)
      .single()

    if (!existing) return notFound()
    if (existing.stage === 'order_confirmed') return err('이미 수주 완료된 딜입니다', 422)

    const { data, error } = await supabaseAdmin
      .from('deals')
      .update({ stage: 'order_confirmed' })
      .eq('id', id)
      .select(`*, company:companies(id,name,contact_name), assignee:users(id,name)`)
      .single()

    if (error) return err(error.message)

    // 활동 기록
    await supabaseAdmin.from('activities').insert({
      deal_id: id,
      type: 'email_sent',
      content: email_body || '수주 공지 이메일 발송',
      from_label: '시스템'
    })

    return ok({
      id: data.id,
      stage: data.stage,
      confirmed_at: data.confirmed_at,
      onedrive_folder_url: null,
      email_sent: send_email || false
    })
  } catch (e) {
    return serverError(e)
  }
}