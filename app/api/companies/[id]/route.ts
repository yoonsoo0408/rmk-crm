import { supabaseAdmin, ok, err, notFound, serverError } from '@/lib/supabase'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return notFound()

    // 딜 히스토리
    const { data: deals } = await supabaseAdmin
      .from('deals')
      .select(`*, client:clients(id,name), assignee:users(id,name)`)
      .eq('company_id', id)
      .order('created_at', { ascending: false })

    const wonDeals = deals?.filter(d => d.stage === 'order_confirmed') || []
    const lostDeals = deals?.filter(d => d.stage === 'lost') || []
    const activeDeals = deals?.filter(d => ['inquiry_received','quote_preparing','quote_submitted','negotiating'].includes(d.stage)) || []

    return ok({
      ...data,
      deal_summary: {
        total_count: deals?.length || 0,
        active_count: activeDeals.length,
        won_count: wonDeals.length,
        lost_count: lostDeals.length,
        total_won_amount: wonDeals.reduce((s, d) => s + (d.amount || 0), 0)
      },
      deals: deals || []
    })
  } catch (e) {
    return serverError(e)
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const { data, error } = await supabaseAdmin
      .from('companies')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) return err(error.message)
    if (!data) return notFound()
    return ok(data)
  } catch (e) {
    return serverError(e)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // 딜 연결 확인
    const { data: deals } = await supabaseAdmin
      .from('deals')
      .select('id')
      .eq('company_id', id)
      .limit(1)

    if (deals && deals.length > 0) return err('연결된 딜이 있어 삭제할 수 없습니다', 422)

    const { error } = await supabaseAdmin.from('companies').delete().eq('id', id)
    if (error) return err(error.message)
    return ok({ deleted: true })
  } catch (e) {
    return serverError(e)
  }
}