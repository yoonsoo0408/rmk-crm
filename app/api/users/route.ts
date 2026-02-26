import { supabaseAdmin, ok, err, serverError } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role')
      .eq('is_active', true)
      .order('name')

    if (error) return err(error.message)
    return ok(data)
  } catch (e) {
    return serverError(e)
  }
}