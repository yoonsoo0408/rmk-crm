import { supabaseAdmin, ok, err, notFound, serverError } from '@/lib/supabase'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { data, error } = await supabaseAdmin
      .from('deals')
      .select(`*, company:companies(id,name,email,contact_name), client:clients(id,name), assignee:users(id,name), reminder:reminders(*)`)
      .eq('id', id)
      .single()

    if (error || !data) return notFound()
    return ok(data)
  } catch (e) {
    return serverError(e)
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    // 완료된 딜 스테이지 재변경 방지
    const { data: existing } = await supabaseAdmin
      .from('deals')
      .select('stage')
      .eq('id', id)
      .single()

    if (existing?.stage === 'order_confirmed' && body.stage && body.stage !== 'order_confirmed') {
      return err('수주 완료된 딜의 스테이지는 변경할 수 없습니다', 422)
    }

    const { data, error } = await supabaseAdmin
      .from('deals')
      .update(body)
      .eq('id', id)
      .select(`*, company:companies(id,name,email,contact_name), client:clients(id,name), assignee:users(id,name)`)
      .single()

    if (error) return err(error.message)
    if (!data) return notFound()
    return ok(data)
  } catch (e) {
    return serverError(e)
  }
}