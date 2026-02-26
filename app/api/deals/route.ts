import { supabaseAdmin, ok, err, serverError, parsePagination, ACTIVE_STAGES } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const stage = url.searchParams.get('stage')
    const assigneeId = url.searchParams.get('assignee_id')
    const companyId = url.searchParams.get('company_id')
    const clientId = url.searchParams.get('client_id')
    const staleOnly = url.searchParams.get('stale_only') === 'true'
    const unassignedOnly = url.searchParams.get('unassigned_only') === 'true'
    const overdueOnly = url.searchParams.get('overdue_only') === 'true'
    const { from, to } = parsePagination(req)

    let query = supabaseAdmin
      .from('deals')
      .select(`*, company:companies(id,name,email,contact_name), client:clients(id,name), assignee:users(id,name)`, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (stage) query = query.eq('stage', stage)
    if (assigneeId) query = query.eq('assignee_id', assigneeId)
    if (companyId) query = query.eq('company_id', companyId)
    if (clientId) query = query.eq('client_id', clientId)
    if (staleOnly) query = query.gt('days_stale', 60)
    if (unassignedOnly) query = query.is('assignee_id', null)
    if (overdueOnly) query = query.gt('days_overdue', 0)

    const { data, error, count } = await query
    if (error) return err(error.message)

    const activeDeals = await supabaseAdmin
      .from('deals')
      .select('amount')
      .in('stage', ACTIVE_STAGES)

    const totalPipeline = activeDeals.data?.reduce((s, d) => s + (d.amount || 0), 0) || 0

    return ok({ data, meta: { total: count, active_count: activeDeals.data?.length || 0, total_pipeline_amount: totalPipeline } })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { subject, company_id, client_id, assignee_id, product, importance, first_contact_date, stage } = body

    if (!subject) return err('subject is required')

    const { data, error } = await supabaseAdmin
      .from('deals')
      .insert({ subject, company_id, client_id, assignee_id, product, importance, first_contact_date, stage: stage || 'inquiry_received' })
      .select(`*, company:companies(id,name), client:clients(id,name), assignee:users(id,name)`)
      .single()

    if (error) return err(error.message)
    return Response.json({ data }, { status: 201 })
  } catch (e) {
    return serverError(e)
  }
}