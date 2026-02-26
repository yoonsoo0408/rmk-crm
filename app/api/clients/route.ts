import { supabaseAdmin, ok, err, serverError, parsePagination } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = url.searchParams.get('q')
    const { from, to } = parsePagination(req)

    let query = supabaseAdmin
      .from('clients')
      .select('*', { count: 'exact' })
      .order('name')
      .range(from, to)

    if (q) query = query.ilike('name', `%${q}%`)

    const { data, error, count } = await query
    if (error) return err(error.message)

    return ok({ data, meta: { total: count } })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, country, industry, notes } = body

    if (!name) return err('name is required')

    const { data, error } = await supabaseAdmin
      .from('clients')
      .insert({ name, country, industry, notes })
      .select()
      .single()

    if (error) return err(error.message)
    return Response.json({ data }, { status: 201 })
  } catch (e) {
    return serverError(e)
  }
}