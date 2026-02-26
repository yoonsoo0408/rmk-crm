import { supabaseAdmin, ok, err, serverError } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const year = url.searchParams.get('year') || new Date().getFullYear().toString()
    const month = url.searchParams.get('month')

    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('is_active', true)

    const result = await Promise.all((users || []).map(async (user) => {
      let query = supabaseAdmin
        .from('deals')
        .select('stage, amount')
        .eq('assignee_id', user.id)

      const { data: deals } = await query

      const activeStages = ['inquiry_received','quote_preparing','quote_submitted','negotiating']
      const active = deals?.filter(d => activeStages.includes(d.stage)) || []
      const won = deals?.filter(d => d.stage === 'order_confirmed') || []
      const lost = deals?.filter(d => d.stage === 'lost') || []

      return {
        assignee: { id: user.id, name: user.name },
        active_count: active.length,
        won_count: won.length,
        lost_count: lost.length,
        pipeline_amount: active.reduce((s, d) => s + (d.amount || 0), 0),
        won_amount: won.reduce((s, d) => s + (d.amount || 0), 0)
      }
    }))

    return ok(result)
  } catch (e) {
    return serverError(e)
  }
}