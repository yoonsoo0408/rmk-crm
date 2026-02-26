import { supabaseAdmin, ok, serverError, ACTIVE_STAGES, STALE_THRESHOLD_DAYS } from '@/lib/supabase'

export async function GET() {
  try {
    // 전체 딜 조회
    const { data: allDeals } = await supabaseAdmin
      .from('deals')
      .select(`*, company:companies(id,name), client:clients(id,name), assignee:users(id,name)`)
      .order('created_at', { ascending: false })

    if (!allDeals) return ok({})

    const activeDeals = allDeals.filter(d => ACTIVE_STAGES.includes(d.stage))
    const wonDeals = allDeals.filter(d => d.stage === 'order_confirmed')

    // 이번 달 수주
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const wonThisMonth = wonDeals.filter(d => d.confirmed_at?.startsWith(thisMonth))

    // KPI
    const kpi = {
      active_count: activeDeals.length,
      total_pipeline_amount: activeDeals.reduce((s, d) => s + (d.amount || 0), 0),
      won_amount_this_month: wonThisMonth.reduce((s, d) => s + (d.amount || 0), 0),
      overdue_count: activeDeals.filter(d => d.days_overdue > 0).length
    }

    // 장기 미처리
    const staleDeals = activeDeals
      .filter(d => d.days_stale > STALE_THRESHOLD_DAYS)
      .slice(0, 10)

    // 담당자 미지정
    const unassignedDeals = activeDeals.filter(d => !d.assignee_id)

    // 스테이지별 요약
    const stages = ['inquiry_received','quote_preparing','quote_submitted','negotiating','order_confirmed','lost','no_response']
    const stageSummary = stages.map(stage => ({
      stage,
      count: allDeals.filter(d => d.stage === stage).length,
      total_amount: allDeals.filter(d => d.stage === stage).reduce((s, d) => s + (d.amount || 0), 0)
    }))

    // 최근 수주
    const recentWon = wonDeals.slice(0, 5)

    return ok({ kpi, stale_deals: staleDeals, unassigned_deals: unassignedDeals, stage_summary: stageSummary, recent_won_deals: recentWon })
  } catch (e) {
    return serverError(e)
  }
}