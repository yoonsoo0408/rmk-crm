import { supabaseAdmin, ok, err, notFound, serverError } from '@/lib/supabase'

const LOSS_REASONS = ['가격 경쟁력 부족','타사 선정','스펙 미충족','프로젝트 취소','예산 삭감','무응답 장기화','기타']

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { reason, memo } = await req.json()

    if (!reason || !LOSS_REASONS.includes(reason)) return err('올바른 실패 사유를 선택해주세요')
    if (reason === '기타' && !memo) return err('기타 선택 시 메모를 입력해주세요')

    const { data: existing } = await supabaseAdmin.from('deals').select('stage').eq('id', id).single()
    if (!existing) return notFound()
    if (existing.stage === 'order_confirmed') return err('수주 완료된 딜은 실패 처리할 수 없습니다', 422)

    const { data, error } = await supabaseAdmin
      .from('deals')
      .update({ stage: 'lost', lost_reason: reason, lost_memo: memo || null })
      .eq('id', id)
      .select()
      .single()

    if (error) return err(error.message)
    return ok({ id: data.id, stage: data.stage, lost_reason: data.lost_reason, lost_at: data.lost_at })
  } catch (e) {
    return serverError(e)
  }
}