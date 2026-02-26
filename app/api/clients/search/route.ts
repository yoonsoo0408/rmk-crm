import { supabaseAdmin, ok, err, serverError } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = url.searchParams.get('q')

    if (!q) return err('q is required')

    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('id, name, country')
      .ilike('name', `%${q}%`)
      .limit(10)

    if (error) return err(error.message)
    return ok(data)
  } catch (e) {
    return serverError(e)
  }
}