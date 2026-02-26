'use client';

import { useState } from "react";

const STAGES = [
  { id: "inquiry_received", label: "문의 접수", color: "#6B7280" },
  { id: "quote_preparing",  label: "견적 작성",  color: "#3B82F6" },
  { id: "quote_submitted",  label: "견적 발송",  color: "#8B5CF6" },
  { id: "negotiating",      label: "협상 중",    color: "#F59E0B" },
  { id: "order_confirmed",  label: "수주 완료",  color: "#10B981" },
  { id: "lost",             label: "실패",       color: "#EF4444" },
  { id: "no_response",      label: "무응답",     color: "#4B5563" },
];
const ACTIVE_STAGES = STAGES.filter(s => !["order_confirmed","lost","no_response"].includes(s.id));
const ASSIGNEES = ["박준영", "김수연", "이도현"];
const LOSS_REASONS = ["가격 경쟁력 부족", "타사 선정", "스펙 미충족", "프로젝트 취소", "예산 삭감", "무응답 장기화", "기타"];

const fmtAmt = (n, cur) => n > 0 ? ${cur || "USD"}  : "—";
const fmtK   = (n, cur) => n > 0 ? ${cur||"USD"} K : "—";

export default function RMKCrm() {
  const [view, setView] = useState("dashboard");
  return (
    <div style={{ fontFamily:"'DM Mono','Courier New',monospace", background:"#0C0E12", minHeight:"100vh", color:"#E2E8F0", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontWeight:700, fontSize:32, color:"#F59E0B", marginBottom:16 }}>RMK/CRM</div>
        <div style={{ color:"#4B5563", fontSize:14 }}>UI 연동 작업 중...</div>
      </div>
    </div>
  );
}
