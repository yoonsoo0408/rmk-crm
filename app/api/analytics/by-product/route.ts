import { supabaseAdmin, ok, err, serverError } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const year = url.searchParams.get('year') || new Date().getFullYear().toString()

    const { data: deals, error } = await supabaseAdmin
      .from('deals')
      .select('product, amount')
      .gte('created_at', `${year}-01-01`)
      .lte('created_at', `${year}-12-31`)
      .not('product', 'is', null)

    if (error) return err(error.message)

    const productMap: Record<string, { count: number, amount: number }> = {}
    deals?.forEach(d => {
      if (!d.product) return
      if (!productMap[d.product]) productMap[d.product] = { count: 0, amount: 0 }
      productMap[d.product].count++
      productMap[d.product].amount += d.amount || 0
    })

    const result = Object.entries(productMap)
      .map(([product, stats]) => ({ product, ...stats }))
      .sort((a, b) => b.count - a.count)

    return ok(result)
  } catch (e) {
    return serverError(e)
  }
}