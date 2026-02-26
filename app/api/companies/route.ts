import { supabaseAdmin, ok, err, serverError, parsePagination } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = url.searchParams.get('q')
    const { from, to } = parsePagination(req)

    let query = supabaseAdmin
      .from('companies')
      .select('*', { count: 'exact' })
      .order('name')
      .range(from, to)

    if (q) query = query.ilike('name', `%${q}%`)

    const { data, error, count } = await query
    if (error) return err(error.message)

    // 각 거래처별 딜 집계
    const enriched = await Promise.all((data || []).map(async (company) => {
      const { data: deals } = await supabaseAdmin
        .from('deals')
        .select('stage, amount, client:clients(name)')
        .eq('company_id', company.id)

      const activeStages = ['inquiry_received','quote_preparing','quote_submitted','negotiating']
      const activeDeals = deals?.filter(d => activeStages.includes(d.stage)) || []
      const clients = [...new Set(deals?.map((d: any) => d.client?.name).filter(Boolean))]

      return {
        ...company,
        deal_count: deals?.length || 0,
        open_pipeline_amount: activeDeals.reduce((s, d) => s + (d.amount || 0), 0),
        currency: 'USD',
        clients
      }
    }))

    return ok({ data: enriched, meta: { total: count } })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, country, email, contact_name, phone, notes } = body

    if (!name) return err('name is required')

    // 중복 이메일 체크
    if (email) {
      const { data: existing } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('email', email)
        .single()
      if (existing) return err('이미 등록된 이메일입니다', 409)
    }

    const { data, error } = await supabaseAdmin
      .from('companies')
      .insert({ name, country, email, contact_name, phone, notes })
      .select()
      .single()

    if (error) return err(error.message)
    return Response.json({ data }, { status: 201 })
  } catch (e) {
    return serverError(e)
  }
}