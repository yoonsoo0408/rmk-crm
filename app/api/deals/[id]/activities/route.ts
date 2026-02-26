import { supabaseAdmin, ok, err, serverError } from '@/lib/supabase'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { data, error } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('deal_id', id)
      .order('created_at', { ascending: false })

    if (error) return err(error.message)
    return ok(data)
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { type, content } = await req.json()

    if (!type) return err('type is required')
    if (!content) return err('content is required')

    const { data, error } = await supabaseAdmin
      .from('activities')
      .insert({ deal_id: id, type, content, from_label: '담당자' })
      .select()
      .single()

    if (error) return err(error.message)
    return Response.json({ data }, { status: 201 })
  } catch (e) {
    return serverError(e)
  }
}