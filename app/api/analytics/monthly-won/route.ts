import { supabaseAdmin, ok, err, serverError } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const year = url.searchParams.get('year') || new Date().getFullYear().toString()

    const { data: deals, error } = await supabaseAdmin
      .from('deals')
      .select('amount, confirmed_at')
      .eq('stage', 'order_confirmed')
      .gte('confirmed_at', `${year}-01-01`)
      .lte('confirmed_at', `${year}-12-31`)

    if (error) return err(error.message)

    const months = Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, '0')
      const key = `${year}-${month}`
      const monthDeals = deals?.filter(d => d.confirmed_at?.startsWith(key)) || []
      return {
        month: key,
        won_count: monthDeals.length,
        won_amount: monthDeals.reduce((s, d) => s + (d.amount || 0), 0)
      }
    })

    return ok(months)
  } catch (e) {
    return serverError(e)
  }
}