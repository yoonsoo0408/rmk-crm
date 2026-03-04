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

const MOCK_DEALS = [
  { id:"D001", subject:"12\" SMLS Tube - PTTGC Thailand Project",  company:"Van Leeuwen",  companyEmail:"purchasing@vanleeuwen.com", contactName:"Mr. Hans Weber", client:"PTTGC",   stage:"negotiating",      amount:284500, currency:"USD", daysOverdue:18, assignee:"박준영", importance:5, destination:"Laem Chabang", loadingPort:"Busan", shipmentTerm:"FOB", paymentTerm:"LC at sight", product:"SMLS TUBE",    totalQty:2400, totalWeight:42300, firstContactDate:"2025-11-18", quoteRef:"RMK-2025-1142", validityEnd:"2026-01-31", daysStale:0 },
  { id:"D002", subject:"CuNi C70600 Tube Bundle",                   company:"JJ Advanced",  companyEmail:"orders@jjadvanced.sg",     contactName:"Mr. James Lim",  client:"OQ",      stage:"negotiating",      amount:156800, currency:"USD", daysOverdue:0,  assignee:"김수연", importance:4, destination:"Sohar",       loadingPort:"Busan", shipmentTerm:"CIF", paymentTerm:"T/T",        product:"FIN TUBE",     totalQty:1800, totalWeight:31200, firstContactDate:"2025-11-28", quoteRef:"RMK-2025-1155", validityEnd:"2026-02-10", daysStale:0 },
  { id:"D003", subject:"SA179 Heat Exchanger Tubes",                 company:"Corrpro",      companyEmail:"procurement@corrpro.com",  contactName:"Mr. Jeon",       client:"Petronas", stage:"quote_submitted",  amount:98200,  currency:"USD", daysOverdue:22, assignee:"이도현", importance:3, destination:"Port Klang",  loadingPort:"Busan", shipmentTerm:"FOB", paymentTerm:"LC at sight", product:"SMLS TUBE",    totalQty:960,  totalWeight:18400, firstContactDate:"2025-11-10", quoteRef:"RMK-2025-1138", validityEnd:"2026-01-20", daysStale:0 },
  { id:"D004", subject:"Extruded Fin Tube - Karachi Refinery",       company:"AMC",          companyEmail:null,                       contactName:null,             client:"PSO",      stage:"quote_preparing",  amount:0,      currency:"USD", daysOverdue:0,  assignee:null,     importance:4, destination:"Karachi",     loadingPort:null,    shipmentTerm:null,  paymentTerm:null,         product:"EXTRUDED FIN", totalQty:null, totalWeight:null,  firstContactDate:"2025-12-01", quoteRef:null,            validityEnd:null,         daysStale:0 },
  { id:"D005", subject:"Low Fin Tube Bundle - Thailand LNG",         company:"Van Leeuwen",  companyEmail:"purchasing@vanleeuwen.com", contactName:"Mr. Hans Weber", client:"PTTGC",   stage:"quote_submitted",  amount:412000, currency:"USD", daysOverdue:9,  assignee:"김수연", importance:5, destination:"Laem Chabang", loadingPort:"Busan", shipmentTerm:"FOB", paymentTerm:"LC at sight", product:"LOW FIN",      totalQty:3200, totalWeight:58600, firstContactDate:"2025-11-05", quoteRef:"RMK-2025-1130", validityEnd:"2026-01-15", daysStale:0 },
  { id:"D006", subject:"SS 316L Plant Items - Oman Refinery",        company:"Gulf Technical",companyEmail:null,                       contactName:null,             client:"OQ",      stage:"inquiry_received", amount:0,      currency:"USD", daysOverdue:0,  assignee:null,     importance:2, destination:"Sohar",       loadingPort:null,    shipmentTerm:null,  paymentTerm:null,         product:"PLANT ITEMS",  totalQty:null, totalWeight:null,  firstContactDate:"2025-12-05", quoteRef:null,            validityEnd:null,         daysStale:0 },
  { id:"D007", subject:"C70600 Condenser Tubes x 2400pcs",           company:"JJ Advanced",  companyEmail:"orders@jjadvanced.sg",     contactName:"Mr. James Lim",  client:"PTTGC",   stage:"order_confirmed",  amount:337600, currency:"USD", daysOverdue:0,  assignee:"박준영", importance:5, destination:"Laem Chabang", loadingPort:"Busan", shipmentTerm:"FOB", paymentTerm:"LC at sight", product:"SMLS TUBE",    totalQty:2400, totalWeight:44800, firstContactDate:"2025-10-12", quoteRef:"RMK-2025-1098", validityEnd:"2025-12-31", daysStale:0 },
  { id:"D008", subject:"SA789 S31803 Duplex Tubes",                   company:"Corrpro",      companyEmail:"procurement@corrpro.com",  contactName:"Mr. Jeon",       client:"Petronas", stage:"negotiating",      amount:189300, currency:"USD", daysOverdue:6,  assignee:"김수연", importance:4, destination:"Port Klang",  loadingPort:"Busan", shipmentTerm:"CIF", paymentTerm:"LC at sight", product:"SMLS TUBE",    totalQty:1560, totalWeight:28900, firstContactDate:"2025-11-20", quoteRef:"RMK-2025-1148", validityEnd:"2026-01-28", daysStale:0 },
  { id:"D009", subject:"B-111 C70600 Fin Tube - Thailand",           company:"Van Leeuwen",  companyEmail:"purchasing@vanleeuwen.com", contactName:"Mr. Hans Weber", client:"PTTGC",   stage:"quote_submitted",  amount:67400,  currency:"USD", daysOverdue:0,  assignee:"이도현", importance:3, destination:"Laem Chabang", loadingPort:"Busan", shipmentTerm:"FOB", paymentTerm:"T/T",        product:"FIN TUBE",     totalQty:720,  totalWeight:12300, firstContactDate:"2025-12-03", quoteRef:"RMK-2025-1160", validityEnd:"2026-02-28", daysStale:0 },
  { id:"D010", subject:"SA179 Condenser Tubes - Old Inquiry",        company:"AMC",          companyEmail:null,                       contactName:null,             client:"PSO",      stage:"quote_submitted",  amount:45000,  currency:"USD", daysOverdue:0,  assignee:"박준영", importance:2, destination:"Karachi",     loadingPort:"Busan", shipmentTerm:"FOB", paymentTerm:"T/T",        product:"SMLS TUBE",    totalQty:480,  totalWeight:8200,  firstContactDate:"2025-08-10", quoteRef:"RMK-2025-0890", validityEnd:"2025-10-10", daysStale:87 },
  { id:"D011", subject:"CuNi Tube Bundle - Pakistan Project",        company:"Gulf Technical",companyEmail:null,                       contactName:null,             client:"OQ",      stage:"negotiating",      amount:112000, currency:"USD", daysOverdue:0,  assignee:"김수연", importance:3, destination:"Sohar",       loadingPort:"Busan", shipmentTerm:"CIF", paymentTerm:"LC at sight", product:"FIN TUBE",     totalQty:900,  totalWeight:16500, firstContactDate:"2025-07-15", quoteRef:"RMK-2025-0820", validityEnd:"2025-09-15", daysStale:112 },
];

const fmtAmt = (n, cur) => n > 0 ? `${cur || "USD"} ${n.toLocaleString()}` : "—";
const fmtK   = (n, cur) => n > 0 ? `${cur||"USD"} ${(n/1000).toFixed(0)}K` : "—";

export default function RMKCrm() {
  const [view, setView] = useState("dashboard");
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [deals, setDeals] = useState(MOCK_DEALS);

  const activeDeals    = deals.filter(d => !["order_confirmed","lost","no_response"].includes(d.stage));
  const staleDeals     = deals.filter(d => d.daysStale > 60 && !["order_confirmed","lost","no_response"].includes(d.stage));
  const unassignedDeals= deals.filter(d => !d.assignee && !["order_confirmed","lost","no_response"].includes(d.stage));
  const overdueDeals   = deals.filter(d => d.daysOverdue > 0 && !["order_confirmed","lost","no_response"].includes(d.stage));
  const wonDeals       = deals.filter(d => d.stage === "order_confirmed");
  const totalPipeline  = activeDeals.reduce((s,d) => s+d.amount, 0);
  const wonAmount      = wonDeals.reduce((s,d) => s+d.amount, 0);

  const updateDeal = (id, patch) => setDeals(prev => prev.map(d => d.id===id ? {...d,...patch} : d));

  const openDeal = (deal) => { setSelectedDeal(deal); setView("deal"); };

  return (
    <div style={{ fontFamily:"'DM Mono','Courier New',monospace", background:"#0C0E12", minHeight:"100vh", color:"#E2E8F0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Noto+Sans+KR:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:#1A1D24;}
        ::-webkit-scrollbar-thumb{background:#3A3F4B;border-radius:2px;}
        .nav-btn{background:none;border:none;cursor:pointer;padding:8px 16px;font-family:'Noto Sans KR',sans-serif;font-size:13px;color:#6B7280;transition:all 0.15s;border-bottom:2px solid transparent;}
        .nav-btn:hover{color:#E2E8F0;}
        .nav-btn.active{color:#F59E0B;border-bottom:2px solid #F59E0B;}
        .kpi-card{background:#141720;border:1px solid #1E2330;padding:20px 24px;}
        .kpi-card:hover{border-color:#2A3040;}
        .overdue-badge{background:rgba(239,68,68,0.15);color:#EF4444;font-size:10px;padding:1px 7px;border-radius:2px;font-weight:600;white-space:nowrap;font-family:'Noto Sans KR',sans-serif;}
        .stale-badge{background:rgba(251,191,36,0.12);color:#FBBF24;font-size:10px;padding:1px 7px;border-radius:2px;font-weight:600;white-space:nowrap;font-family:'Noto Sans KR',sans-serif;}
        .unassigned-badge{background:rgba(107,114,128,0.2);color:#9CA3AF;font-size:10px;padding:1px 7px;border-radius:2px;font-weight:600;white-space:nowrap;font-family:'Noto Sans KR',sans-serif;}
        .section-title{font-family:'Noto Sans KR',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.04em;color:#4B5563;margin-bottom:14px;text-transform:uppercase;}
        .primary-btn{background:#F59E0B;color:#000;border:none;padding:8px 18px;font-family:'Noto Sans KR',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:opacity 0.15s;}
        .primary-btn:hover{opacity:0.85;}
        .ghost-btn{background:#1A1D24;border:1px solid #2A3040;color:#9CA3AF;padding:7px 14px;cursor:pointer;font-family:'Noto Sans KR',sans-serif;font-size:12px;transition:all 0.15s;}
        .ghost-btn:hover{border-color:#3A3F4B;color:#E2E8F0;}
        .danger-btn{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#EF4444;padding:7px 14px;cursor:pointer;font-family:'Noto Sans KR',sans-serif;font-size:12px;transition:all 0.15s;}
        .danger-btn:hover{background:rgba(239,68,68,0.2);}
        .tab-btn{background:none;border:none;cursor:pointer;padding:10px 20px;font-family:'Noto Sans KR',sans-serif;font-size:13px;color:#6B7280;transition:all 0.15s;border-bottom:2px solid transparent;}
        .tab-btn:hover{color:#E2E8F0;}
        .tab-btn.active{color:#F59E0B;border-bottom:2px solid #F59E0B;}
        .field-row{display:flex;justify-content:space-between;align-items:center;padding:9px 16px;border-bottom:1px solid #0F1117;}
        .field-label{color:#6B7280;font-size:11px;font-family:'Noto Sans KR',sans-serif;flex-shrink:0;}
        .field-value{color:#CBD5E1;font-weight:500;font-size:12px;text-align:right;}
        .field-pending{color:#2A3040;font-size:11px;font-family:'Noto Sans KR',sans-serif;font-style:italic;}
        .row-hover:hover{background:#141720!important;}
        .tbl-row{display:grid;padding:11px 16px;border-bottom:1px solid #141720;cursor:pointer;transition:background 0.1s;background:transparent;align-items:center;gap:10px;}
        .tbl-row:hover{background:#141720;}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:200;display:flex;align-items:center;justify-content:center;}
        .modal-box{background:#0F1117;border:1px solid #2A3040;padding:28px;max-height:85vh;overflow-y:auto;}
        .ai-bar{height:3px;background:#1E2330;border-radius:1px;overflow:hidden;margin-top:4px;}
        .imp-dot{width:5px;height:5px;border-radius:50%;}
        select,input,textarea{outline:none;}
        select:focus,input:focus,textarea:focus{border-color:#F59E0B!important;}
        .inline-select{background:#1A1D24;border:1px solid #2A3040;color:#CBD5E1;padding:4px 8px;font-family:'Noto Sans KR',sans-serif;font-size:12px;cursor:pointer;}
        .inline-select:hover{border-color:#3A3F4B;}
      `}</style>

      {/* 네비게이션 */}
      <div style={{ background:"#0A0C10", borderBottom:"1px solid #1A1D24", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", height:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:24 }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontWeight:700, fontSize:14, letterSpacing:"0.06em", color:"#F59E0B" }}>RMK<span style={{ color:"#4B5563" }}>/</span>CRM</div>
          <div style={{ display:"flex" }}>
            {[{id:"dashboard",label:"대시보드"},{id:"pipeline",label:"파이프라인"},{id:"won",label:"수주 관리"},{id:"clients",label:"거래처"},{id:"analytics",label:"실적 분석"}].map(n => (
              <button key={n.id} className={`nav-btn ${view===n.id?"active":""}`} onClick={() => setView(n.id)}>{n.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {unassignedDeals.length > 0 && (
            <div style={{ background:"rgba(107,114,128,0.15)", border:"1px solid rgba(107,114,128,0.3)", color:"#9CA3AF", padding:"4px 10px", fontSize:11, fontFamily:"'Noto Sans KR',sans-serif", cursor:"pointer" }} onClick={() => setView("pipeline")}>
              담당자 미지정 {unassignedDeals.length}건
            </div>
          )}
          <button className="primary-btn" onClick={() => setView("new")}>+ 수동 등록</button>
          <div style={{ width:32, height:32, background:"#1E2330", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:"#9CA3AF", fontFamily:"'Noto Sans KR',sans-serif", fontWeight:600 }}>박</div>
        </div>
      </div>

      {/* ── 대시보드 ── */}
      {view === "dashboard" && (
        <div style={{ padding:24 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
            {[
              { label:"진행 중인 딜",   value:activeDeals.length,              unit:"건",  color:"#3B82F6" },
              { label:"파이프라인 금액", value:`$${(totalPipeline/1000).toFixed(0)}K`, unit:"USD", color:"#8B5CF6" },
              { label:"이번 달 수주",   value:`$${(wonAmount/1000).toFixed(0)}K`, unit:"USD", color:"#10B981" },
              { label:"팔로업 지연",    value:overdueDeals.length,             unit:"건",  color:"#EF4444" },
            ].map(kpi => (
              <div key={kpi.label} className="kpi-card">
                <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#4B5563", marginBottom:10, fontWeight:700 }}>{kpi.label}</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:32, fontWeight:700, color:kpi.color, lineHeight:1 }}>{kpi.value}</div>
                <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#4B5563", marginTop:5 }}>{kpi.unit}</div>
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:16 }}>
            <div>
              {/* 장기 미처리 */}
              {staleDeals.length > 0 && (
                <div style={{ marginBottom:20 }}>
                  <div className="section-title" style={{ color:"#FBBF24" }}>⏳ 장기 미처리 — 실패/무응답 처리 필요</div>
                  <div style={{ background:"#0F1117", border:"1px solid rgba(251,191,36,0.2)" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"24px 1fr 100px 85px 70px 70px", gap:10, padding:"7px 16px", borderBottom:"1px solid #1A1D24" }}>
                      {["","건명","바이어","금액","방치","담당"].map(h => <div key={h} style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:10, color:"#4B5563", fontWeight:700 }}>{h}</div>)}
                    </div>
                    {staleDeals.map(d => (
                      <div key={d.id} className="tbl-row row-hover" style={{ gridTemplateColumns:"24px 1fr 100px 85px 70px 70px" }} onClick={() => openDeal(d)}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:STAGES.find(s=>s.id===d.stage)?.color, display:"inline-block" }} />
                        <div style={{ overflow:"hidden" }}>
                          <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#CBD5E1", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{d.subject}</div>
                          <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:10, color:"#4B5563", marginTop:1 }}>{STAGES.find(s=>s.id===d.stage)?.label}</div>
                        </div>
                        <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#9CA3AF" }}>{d.company}</div>
                        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"#CBD5E1" }}>{fmtK(d.amount, d.currency)}</div>
                        <span className="stale-badge">{d.daysStale}일</span>
                        <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#6B7280" }}>{d.assignee||"—"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* 담당자 미지정 */}
              {unassignedDeals.length > 0 && (
                <div>
                  <div className="section-title" style={{ color:"#9CA3AF" }}>👤 담당자 미지정 — 배정 필요</div>
                  <div style={{ background:"#0F1117", border:"1px solid rgba(107,114,128,0.25)" }}>
                    {unassignedDeals.map(d => (
                      <div key={d.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 16px", borderBottom:"1px solid #141720" }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:STAGES.find(s=>s.id===d.stage)?.color, display:"inline-block", flexShrink:0 }} />
                        <div style={{ flex:1, cursor:"pointer", overflow:"hidden" }} onClick={() => openDeal(d)}>
                          <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#CBD5E1", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{d.subject}</div>
                          <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#4B5563", marginTop:1 }}>{d.company} · {d.firstContactDate}</div>
                        </div>
                        <select className="inline-select" defaultValue="" onChange={e => updateDeal(d.id, { assignee: e.target.value || null })}>
                          <option value="">배정 안 됨</option>
                          {ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {staleDeals.length === 0 && unassignedDeals.length === 0 && (
                <div style={{ background:"#0F1117", border:"1px solid #1A1D24", padding:"40px 24px", textAlign:"center" }}>
                  <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, color:"#2A3040" }}>처리 필요한 항목이 없습니다 ✓</div>
                </div>
              )}
            </div>

            <div>
              <div className="section-title">스테이지별 현황</div>
              <div style={{ background:"#0F1117", border:"1px solid #1A1D24", padding:16, marginBottom:16 }}>
                {STAGES.map(stage => {
                  const count = deals.filter(d=>d.stage===stage.id).length;
                  const val   = deals.filter(d=>d.stage===stage.id).reduce((s,d)=>s+d.amount,0);
                  return (
                    <div key={stage.id} style={{ marginBottom:13, cursor:"pointer" }} onClick={() => setView("pipeline")}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ width:6, height:6, borderRadius:"50%", background:stage.color, display:"inline-block" }} />
                          <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#9CA3AF" }}>{stage.label}</span>
                        </div>
                        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                          {val > 0 && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#4B5563" }}>{fmtK(val,"USD")}</span>}
                          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"#6B7280", width:18, textAlign:"right" }}>{count}</span>
                        </div>
                      </div>
                      <div style={{ height:3, background:"#1A1D24", borderRadius:1 }}>
                        <div style={{ height:"100%", width:`${Math.min((count/4)*100,100)}%`, background:stage.color, borderRadius:1, opacity:0.7 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="section-title">최근 수주</div>
              <div style={{ background:"#0F1117", border:"1px solid #1A1D24" }}>
                {wonDeals.map(d => (
                  <div key={d.id} style={{ padding:"11px 14px", borderBottom:"1px solid #141720", cursor:"pointer" }} onClick={() => openDeal(d)}>
                    <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#CBD5E1", marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{d.subject}</div>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#4B5563" }}>{d.company}</span>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"#10B981", fontWeight:700 }}>{fmtK(d.amount, d.currency)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 파이프라인 (테이블 기본 + 칸반 토글) ── */}
      {view === "pipeline" && (
        <PipelineView deals={deals} onOpen={openDeal} onUpdate={updateDeal} onNew={() => setView("new")} />
      )}

      {/* ── 수주 관리 ── */}
      {view === "won" && <WonView deals={wonDeals} onSelect={openDeal} />}

      {/* ── 딜 상세 ── */}
      {view === "deal" && selectedDeal && (
        <DealDetailView
          deal={deals.find(d=>d.id===selectedDeal.id) || selectedDeal}
          onBack={() => setView("pipeline")}
          onUpdate={(patch) => { updateDeal(selectedDeal.id, patch); }}
        />
      )}

      {view === "new"      && <NewDealView onBack={() => setView("dashboard")} />}
      {view === "clients"  && <ClientsView />}
      {view === "analytics"&& <AnalyticsView deals={deals} />}
    </div>
  );
}

// ─────────────────────────────────────────
// 파이프라인 — 테이블 기본, 칸반 토글
// ─────────────────────────────────────────
function PipelineView({ deals, onOpen, onUpdate, onNew }) {
  const [viewMode, setViewMode]   = useState("table"); // table | kanban
  const [stageFilter, setStageFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const filtered = deals.filter(d => {
    const stageOk    = stageFilter    === "all" || d.stage === stageFilter;
    const assigneeOk = assigneeFilter === "all" || d.assignee === assigneeFilter;
    return stageOk && assigneeOk;
  });

  const activeDeals   = deals.filter(d => !["order_confirmed","lost","no_response"].includes(d.stage));
  const totalPipeline = activeDeals.reduce((s,d) => s+d.amount, 0);

  const COL = "28px 1fr 110px 110px 110px 100px 80px 70px";

  return (
    <div style={{ padding:24 }}>
      {/* 헤더 */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:20, fontWeight:700 }}>
          파이프라인
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:14, color:"#4B5563", marginLeft:12, fontWeight:400 }}>
            {activeDeals.length}건 · ${(totalPipeline/1000).toFixed(0)}K
          </span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {/* 뷰 토글 */}
          <div style={{ display:"flex", border:"1px solid #1E2330", borderRadius:2, overflow:"hidden" }}>
            {[["table","≡ 테이블"],["kanban","⊞ 칸반"]].map(([m,label]) => (
              <button key={m} onClick={() => setViewMode(m)} style={{ background: viewMode===m?"#1E2330":"transparent", border:"none", color: viewMode===m?"#F59E0B":"#4B5563", padding:"6px 12px", cursor:"pointer", fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, transition:"all 0.15s" }}>{label}</button>
            ))}
          </div>
          <select className="inline-select" value={assigneeFilter} onChange={e=>setAssigneeFilter(e.target.value)}>
            <option value="all">전체 담당자</option>
            {ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

        </div>
      </div>

      {/* 스테이지 필터 탭 */}
      <div style={{ display:"flex", borderBottom:"1px solid #1A1D24", marginBottom:0, overflowX:"auto" }}>
        {[{id:"all",label:"전체"}, ...STAGES].map(s => {
          const cnt = s.id==="all" ? filtered.length : deals.filter(d=>d.stage===s.id).length;
          return (
            <button key={s.id} onClick={() => setStageFilter(s.id)}
              style={{ background:"none", border:"none", cursor:"pointer", padding:"9px 16px", fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color: stageFilter===s.id ? (s.color||"#F59E0B") : "#4B5563", borderBottom: stageFilter===s.id ? `2px solid ${s.color||"#F59E0B"}` : "2px solid transparent", whiteSpace:"nowrap", transition:"all 0.15s", display:"flex", alignItems:"center", gap:5 }}>
              {s.label}
              <span style={{ background:"#1A1D24", color:"#6B7280", fontFamily:"'DM Mono',monospace", fontSize:10, padding:"0 5px", borderRadius:2 }}>{cnt}</span>
            </button>
          );
        })}
      </div>

      {/* 테이블 뷰 */}
      {viewMode === "table" && (
        <div style={{ background:"#0F1117", border:"1px solid #1A1D24", borderTop:"none" }}>
          <div className="tbl-row" style={{ gridTemplateColumns:COL, background:"#0A0C10", cursor:"default", borderBottom:"1px solid #1A1D24" }}>
            {["","건명","바이어","최종 고객사","제품","금액","담당","지연"].map(h => (
              <div key={h} style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:10, color:"#4B5563", fontWeight:700 }}>{h}</div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ padding:"32px 16px", textAlign:"center", fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, color:"#2A3040" }}>해당 조건의 딜이 없습니다</div>
          )}
          {filtered.map(d => {
            const stage = STAGES.find(s=>s.id===d.stage);
            return (
              <div key={d.id} className="tbl-row row-hover" style={{ gridTemplateColumns:COL }} onClick={() => onOpen(d)}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:stage?.color, display:"inline-block" }} />
                <div style={{ overflow:"hidden" }}>
                  <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#CBD5E1", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{d.subject}</div>
                  <div style={{ display:"flex", gap:6, marginTop:2, alignItems:"center" }}>
                    <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:10, color: stage?.color, background:`${stage?.color}18`, padding:"0 5px", borderRadius:2 }}>{stage?.label}</span>
                    {d.daysStale > 60 && <span className="stale-badge">{d.daysStale}일</span>}
                    {!d.assignee && <span className="unassigned-badge">미지정</span>}
                  </div>
                </div>
                <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#9CA3AF", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{d.company}</div>
                <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#6B7280" }}>{d.client}</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#6B7280" }}>{d.product}</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color: d.amount>0?"#CBD5E1":"#4B5563", fontWeight:500 }}>{fmtK(d.amount, d.currency)}</div>
                <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color: d.assignee?"#6B7280":"#EF4444" }}>{d.assignee||"미지정"}</div>
                <div>
                  {d.daysOverdue > 0 && <span className="overdue-badge">{d.daysOverdue}일</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 칸반 뷰 */}
      {viewMode === "kanban" && (
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingTop:12, paddingBottom:12, minHeight:"60vh" }}>
          {STAGES.map(stage => {
            const stageDeals = filtered.filter(d=>d.stage===stage.id);
            const stageVal   = stageDeals.reduce((s,d)=>s+d.amount,0);
            return (
              <div key={stage.id} style={{ background:"#0F1117", border:"1px solid #1A1D24", flex:1, minWidth:180, maxWidth:215, display:"flex", flexDirection:"column" }}>
                <div style={{ padding:"9px 11px 7px", borderBottom:"1px solid #1A1D24" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:2 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:stage.color, display:"inline-block" }} />
                      <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#CBD5E1", fontWeight:700 }}>{stage.label}</span>
                    </div>
                    <span style={{ background:"#1A1D24", color:"#6B7280", fontFamily:"'DM Mono',monospace", fontSize:10, padding:"1px 6px", borderRadius:2 }}>{stageDeals.length}</span>
                  </div>
                  {stageVal > 0 && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#4B5563", paddingLeft:12 }}>{fmtK(stageVal,"USD")}</div>}
                </div>
                <div style={{ flex:1, overflowY:"auto", padding:"4px 0" }}>
                  {stageDeals.map(d => (
                    <div key={d.id} style={{ background:"#141720", border:"1px solid #1E2330", margin:"5px 7px", padding:"10px", cursor:"pointer", transition:"border-color 0.15s" }}
                      onMouseEnter={e=>e.currentTarget.style.borderColor="#3A3F4B"}
                      onMouseLeave={e=>e.currentTarget.style.borderColor="#1E2330"}
                      onClick={() => onOpen(d)}>
                      {!d.assignee && <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:10, color:"#6B7280", background:"rgba(107,114,128,0.1)", padding:"2px 6px", marginBottom:6 }}>담당자 미지정</div>}
                      <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#CBD5E1", lineHeight:1.5, marginBottom:6 }}>
                        {d.subject.length > 44 ? d.subject.slice(0,44)+"…" : d.subject}
                      </div>
                      <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:10, color:"#4B5563", marginBottom:7 }}>{d.company} → {d.client}</div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ display:"flex", gap:2 }}>{[1,2,3,4,5].map(i=><div key={i} className="imp-dot" style={{ background:i<=d.importance?"#F59E0B":"#1E2330" }} />)}</div>
                        <div style={{ display:"flex", gap:4 }}>
                          {d.daysStale>60 && <span className="stale-badge">{d.daysStale}일</span>}
                          {d.daysOverdue>0 && d.daysStale<=60 && <span className="overdue-badge">{d.daysOverdue}일</span>}
                          {d.amount>0 && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#6B7280" }}>{fmtK(d.amount,d.currency)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {stageDeals.length===0 && <div style={{ padding:"20px 10px", textAlign:"center", fontFamily:"'Noto Sans KR',sans-serif", color:"#1E2330", fontSize:12 }}>딜 없음</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// 수주 관리
// ─────────────────────────────────────────
function WonView({ deals, onSelect }) {
  const total = deals.reduce((s,d)=>s+d.amount,0);
  const COL = "1fr 110px 110px 110px 80px 70px";
  return (
    <div style={{ padding:24 }}>
      <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:20, fontWeight:700, marginBottom:4 }}>수주 관리</div>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:"#4B5563", marginBottom:20 }}>총 {deals.length}건 · ${(total/1000).toFixed(0)}K</div>
      <div style={{ background:"#0F1117", border:"1px solid #1A1D24" }}>
        <div className="tbl-row" style={{ gridTemplateColumns:COL, background:"#0A0C10", cursor:"default", borderBottom:"1px solid #1A1D24" }}>
          {["건명","바이어","최종 고객사","금액","수주일","담당"].map(h => (
            <div key={h} style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:10, color:"#4B5563", fontWeight:700 }}>{h}</div>
          ))}
        </div>
        {deals.map(d => (
          <div key={d.id} className="tbl-row row-hover" style={{ gridTemplateColumns:COL }} onClick={() => onSelect(d)}>
            <div>
              <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#CBD5E1" }}>{d.subject}</div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#4B5563", marginTop:2 }}>{d.quoteRef}</div>
            </div>
            <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#9CA3AF" }}>{d.company}</div>
            <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#9CA3AF" }}>{d.client}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:"#10B981", fontWeight:700 }}>{fmtK(d.amount,d.currency)}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#6B7280" }}>2025-12-15</div>
            <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#6B7280" }}>{d.assignee}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// 딜 상세
// ─────────────────────────────────────────
function DealDetailView({ deal, onBack, onUpdate }) {
  const [activeTab, setActiveTab]     = useState("info");
  const [showLostModal, setShowLostModal] = useState(false);
  const [showWonModal,  setShowWonModal]  = useState(false);
  const [lostReason, setLostReason]   = useState("");
  const [lostMemo,   setLostMemo]     = useState("");

  const isBeforeSubmit = ["inquiry_received","quote_preparing"].includes(deal.stage);
  const isWon          = deal.stage === "order_confirmed";

  const ACTIVITIES = [
    { type:"email_received", label:"회신 수신",  content:"Requesting revised pricing for 2400pcs and delivery confirmation", summary:"단가 재검토 및 납기 확인 요청", time:"2025-12-10 14:23", from:deal.company },
    { type:"reminder_sent",  label:"리마인더 발송", content:"Auto-reminder sent (1st)", summary:null, time:"2025-12-08 09:00", from:"시스템" },
    { type:"email_sent",     label:"견적 발송",  content:"Quotation submitted with FOB Busan terms", summary:"FOB 부산 조건 견적서 제출", time:"2025-11-25 11:45", from:"박준영" },
    { type:"note",           label:"메모",       content:"Client mentioned delivery before Q2 is critical", summary:null, time:"2025-11-22 16:00", from:"박준영" },
    { type:"email_received", label:"문의 접수",  content:"Initial RFQ received via email", summary:"PTTGC 프로젝트용 SMLS Tube 견적 요청", time:"2025-11-18 10:15", from:deal.company },
  ];

  const FIELDS_PRE = [
    { label:"최초 컨택일",     value:deal.firstContactDate, mono:true },
    { label:"최종 고객사",     value:deal.client },
    { label:"바이어 (업체)",   value:deal.company },
    { label:"업체 이메일",     value:deal.companyEmail },
    { label:"바이어 담당자명", value:deal.contactName },
    { label:"중요도",          value:deal.importance ? "★".repeat(deal.importance) : null },
  ];
  const FIELDS_POST = [
    { label:"견적 번호",       value:deal.quoteRef, mono:true },
    { label:"최초 컨택일",     value:deal.firstContactDate, mono:true },
    { label:"최종 고객사",     value:deal.client },
    { label:"바이어 (업체)",   value:deal.company },
    { label:"업체 이메일",     value:deal.companyEmail },
    { label:"바이어 담당자명", value:deal.contactName },
    { label:"도착 항구",       value:deal.destination },
    { label:"선적 항구",       value:deal.loadingPort },
    { label:"선적 조건",       value:deal.shipmentTerm },
    { label:"결제 조건",       value:deal.paymentTerm },
    { label:"견적 금액",       value:deal.amount>0 ? `${deal.currency} ${deal.amount.toLocaleString()}` : null, mono:true },
    { label:"총 수량",         value:deal.totalQty ? `${deal.totalQty.toLocaleString()} pcs` : null, mono:true },
    { label:"총 중량",         value:deal.totalWeight ? `${deal.totalWeight.toLocaleString()} kg` : null, mono:true },
    { label:"유효 기간",       value:deal.validityEnd, mono:true },
  ];
  const FIELDS = isBeforeSubmit ? FIELDS_PRE : FIELDS_POST;

  const actColor = t => ({ email_received:"#3B82F6", email_sent:"#8B5CF6", reminder_sent:"#F59E0B", note:"#6B7280" })[t]||"#4B5563";
  const actIcon  = t => ({ email_received:"↙", email_sent:"↗", reminder_sent:"⏰", note:"◆" })[t]||"·";

  const wonEmailTemplate = `수신: 전체\n참조: Mr Hans, Mr James, Mr Jeon JY, +13명\n\n알엠케이 밀양 수주 공지 드리오니 확인 부탁드립니다.\n\n수주 : ${deal.destination||"—"}\n수주 진행 : 인천\n담당 : ${deal.assignee||"—"} 사원(영업)\n관리번호 : ${deal.quoteRef||"—"}\n수주처 : ${deal.company}\n품명 : ${deal.product}\n금액 : ${deal.currency||"USD"} ${deal.amount?.toLocaleString()||"—"}\n총 수량 : ${deal.totalQty?.toLocaleString()||"—"} pcs\n총 중량 : ${deal.totalWeight?.toLocaleString()||"—"} kg\n선적 조건 : ${deal.shipmentTerm||"—"}\n결제 조건 : ${deal.paymentTerm||"—"}\n\nBest Regards\nRMK CO., LTD`;

  return (
    <div style={{ padding:24 }}>
      {/* 헤더 */}
      <div style={{ display:"flex", gap:16, alignItems:"flex-start", marginBottom:24 }}>
        <button onClick={onBack} className="ghost-btn">← 목록</button>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:STAGES.find(s=>s.id===deal.stage)?.color, display:"inline-block" }} />
            <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:STAGES.find(s=>s.id===deal.stage)?.color, fontWeight:700 }}>
              {STAGES.find(s=>s.id===deal.stage)?.label}
            </span>
            {deal.daysOverdue>0 && <span className="overdue-badge">{deal.daysOverdue}일 지연</span>}
            {deal.daysStale>60  && <span className="stale-badge">{deal.daysStale}일 방치</span>}
            {!deal.assignee     && <span className="unassigned-badge">담당자 미지정</span>}
          </div>
          <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:19, fontWeight:700, color:"#E2E8F0", marginBottom:4 }}>{deal.subject}</div>
          <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#4B5563" }}>{deal.company} → {deal.client}{deal.destination ? ` · ${deal.destination}` : ""}</div>
        </div>
        {!isWon && (
          <div style={{ display:"flex", gap:8 }}>
            <button className="ghost-btn">리마인더 발송</button>
            <button className="danger-btn" onClick={() => setShowLostModal(true)}>실패 처리</button>
            <button className="primary-btn" onClick={() => setShowWonModal(true)}>수주 완료 →</button>
          </div>
        )}
        {isWon && (
          <div style={{ background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.3)", color:"#10B981", padding:"8px 16px", fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, fontWeight:700 }}>✓ 수주 완료</div>
        )}
      </div>

      {/* 탭 */}
      <div style={{ display:"flex", borderBottom:"1px solid #1A1D24", marginBottom:20 }}>
        {[["info","딜 정보"],["activity","활동 내역"],["ai","AI 추출 결과"]].map(([id,label]) => (
          <button key={id} className={`tab-btn ${activeTab===id?"active":""}`} onClick={() => setActiveTab(id)}>{label}</button>
        ))}
      </div>

      {/* 딜 정보 */}
      {activeTab === "info" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <div>
            <div className="section-title">{isBeforeSubmit ? "기본 정보 (견적 발송 전)" : "기본 정보"}</div>
            {isBeforeSubmit && (
              <div style={{ background:"rgba(59,130,246,0.06)", border:"1px solid rgba(59,130,246,0.2)", padding:"9px 14px", marginBottom:12, fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#60A5FA" }}>
                📋 견적 PDF 발송 후 상세 정보가 자동으로 채워집니다
              </div>
            )}
            <div style={{ background:"#0F1117", border:"1px solid #1A1D24" }}>
              {/* 담당자 — 드롭다운으로 바로 수정 가능 */}
              <div className="field-row">
                <span className="field-label">담당자</span>
                <select className="inline-select" value={deal.assignee||""} onChange={e => onUpdate({ assignee: e.target.value || null })}>
                  <option value="">미지정</option>
                  {ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              {/* OneDrive 링크 - 수주 완료 딜에만 표시 */}
              {isWon && (
                <div className="field-row">
                  <span className="field-label">📁 OneDrive 폴더</span>
                  <a href="#" style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#3B82F6", textDecoration:"underline" }}>수주 폴더 열기 →</a>
                </div>
              )}
              {FIELDS.map(f => (
                <div key={f.label} className="field-row">
                  <span className="field-label">{f.label}</span>
                  {f.value
                    ? <span className="field-value" style={{ fontFamily:f.mono?"'DM Mono',monospace":"'Noto Sans KR',sans-serif" }}>{f.value}</span>
                    : <span className="field-pending">미입력</span>
                  }
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="section-title">진행 단계</div>
            <div style={{ background:"#0F1117", border:"1px solid #1A1D24", padding:20, marginBottom:16 }}>
              {(() => {
                const OUTCOME_STAGES = ["order_confirmed","lost","no_response"];
                const isOutcome = OUTCOME_STAGES.includes(deal.stage);
                const activeIdx = isOutcome ? ACTIVE_STAGES.length : ACTIVE_STAGES.findIndex(st=>st.id===deal.stage);
                const outcomeStage = STAGES.find(s=>s.id===deal.stage);

                return (
                  <>
                    {ACTIVE_STAGES.map((s,i) => {
                      const isDone    = i < activeIdx;
                      const isCurrent = !isOutcome && i === activeIdx;
                      return (
                        <div key={s.id} style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                            <div style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${isDone||isOutcome?"#10B981":isCurrent?s.color:"#1E2330"}`, background:isDone||isOutcome?"#10B981":isCurrent?`${s.color}22`:"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:isDone||isOutcome?"#000":isCurrent?s.color:"#2A3040", fontWeight:700, flexShrink:0 }}>
                              {isDone||isOutcome?"✓":i+1}
                            </div>
                            <div style={{ width:1, height:22, background:isDone||isOutcome?"#10B981":"#1E2330" }} />
                          </div>
                          <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:isDone||isOutcome?"#4B5563":isCurrent?"#E2E8F0":"#2A3040", paddingTop:3, paddingBottom:22 }}>{s.label}</span>
                        </div>
                      );
                    })}
                    {/* 5단계: 최종 결과 */}
                    <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                        <div style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${isOutcome ? outcomeStage?.color : "#1E2330"}`, background: isOutcome ? `${outcomeStage?.color}22` : "transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color: isOutcome ? outcomeStage?.color : "#2A3040", fontWeight:700, flexShrink:0 }}>
                          5
                        </div>
                      </div>
                      <div style={{ paddingTop:3 }}>
                        <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color: isOutcome ? outcomeStage?.color : "#2A3040", fontWeight: isOutcome ? 700 : 400 }}>
                          {isOutcome ? outcomeStage?.label : "최종 결과"}
                        </span>
                        {!isOutcome && (
                          <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:10, color:"#2A3040", marginTop:2 }}>
                            수주 완료 · 실패 · 무응답
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="section-title">리마인더 설정</div>
            <div style={{ background:"#0F1117", border:"1px solid #1A1D24", padding:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:12, marginBottom:4, borderBottom:"1px solid #141720" }}>
                <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, color:"#9CA3AF" }}>자동 리마인더</span>
                <div style={{ width:36, height:20, background:"#F59E0B", borderRadius:10, padding:"2px 2px 2px 18px", cursor:"pointer" }}>
                  <div style={{ width:16, height:16, background:"#000", borderRadius:"50%" }} />
                </div>
              </div>
              {[
                { label:"기준일 (임계값)", value:"14일" },
                { label:"마지막 리마인더", value:"2025-12-08" },
                { label:"다음 예정일",    value: deal.daysOverdue>0 ? `초과됨 (${deal.daysOverdue}일 전)` : "2026-01-05" },
              ].map(f => (
                <div key={f.label} className="field-row" style={{ padding:"8px 0" }}>
                  <span className="field-label">{f.label}</span>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:f.value.includes("초과")?"#EF4444":"#CBD5E1", fontWeight:500 }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 활동 내역 */}
      {activeTab === "activity" && (
        <div style={{ maxWidth:660 }}>
          <div style={{ display:"flex", gap:10, marginBottom:20 }}>
            <input placeholder="메모 추가..." style={{ flex:1, background:"#0F1117", border:"1px solid #1E2330", color:"#CBD5E1", padding:"9px 14px", fontFamily:"'Noto Sans KR',sans-serif", fontSize:13 }} />
            <button className="primary-btn">추가</button>
          </div>
          {ACTIVITIES.map((act,i) => (
            <div key={i} style={{ display:"flex", gap:14 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:26 }}>
                <div style={{ width:24, height:24, borderRadius:"50%", background:actColor(act.type), display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#000", flexShrink:0, fontWeight:700 }}>{actIcon(act.type)}</div>
                {i < ACTIVITIES.length-1 && <div style={{ width:1, flex:1, background:"#1A1D24", marginTop:4 }} />}
              </div>
              <div style={{ flex:1, paddingBottom:i<ACTIVITIES.length-1?18:0 }}>
                <div style={{ display:"flex", gap:8, marginBottom:5, alignItems:"center" }}>
                  <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, fontWeight:700, color:actColor(act.type) }}>{act.label}</span>
                  <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#4B5563" }}>{act.from}</span>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#2A3040", marginLeft:"auto" }}>{act.time}</span>
                </div>
                <div style={{ background:"#0F1117", border:"1px solid #1A1D24", padding:"9px 14px" }}>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#6B7280", lineHeight:1.6 }}>{act.content}</div>
                  {act.summary && (
                    <div style={{ marginTop:8, paddingTop:8, borderTop:"1px solid #141720", display:"flex", gap:6, alignItems:"flex-start" }}>
                      <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:10, color:"#3B82F6", background:"rgba(59,130,246,0.1)", padding:"1px 6px", borderRadius:2, flexShrink:0 }}>AI 요약</span>
                      <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#9CA3AF", lineHeight:1.5 }}>{act.summary}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI 추출 결과 */}
      {activeTab === "ai" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <div>
            <div className="section-title">추출 필드 — 수정 후 확인</div>
            <div style={{ background:"#0F1117", border:"1px solid #1A1D24" }}>
              {[
                { label:"업체명",         value:"Van Leeuwen Pipe & Tube", c:0.97 },
                { label:"바이어 담당자명",value:"purchasing@vanleeuwen.com", c:0.92 },
                { label:"도착 항구",       value:"Laem Chabang, Thailand",  c:0.88 },
                { label:"선적 항구",       value:"Busan, Korea",             c:0.95 },
                { label:"선적 조건",       value:"FOB",                      c:0.99 },
                { label:"결제 조건",       value:"LC at sight",              c:0.91 },
                { label:"총 금액",         value:"USD 284,500",              c:0.96 },
                { label:"총 중량",         value:"42,300 kg",                c:0.73 },
                { label:"총 수량",         value:"2,400 pcs",                c:0.89 },
                { label:"견적 번호",       value:"RMK-2025-1142",            c:0.98 },
                { label:"유효 기간",       value:"2026-01-31",               c:0.85 },
              ].map(f => (
                <div key={f.label} style={{ padding:"10px 14px", borderBottom:"1px solid #0A0C10" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span className="field-label">{f.label}</span>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:f.c>=0.9?"#10B981":f.c>=0.75?"#F59E0B":"#EF4444" }}>{(f.c*100).toFixed(0)}%</span>
                  </div>
                  <input defaultValue={f.value} style={{ width:"100%", background:f.c<0.75?"rgba(239,68,68,0.05)":"#141720", border:`1px solid ${f.c<0.75?"rgba(239,68,68,0.3)":"#1E2330"}`, color:"#CBD5E1", padding:"6px 10px", fontFamily:"'DM Mono',monospace", fontSize:12 }} />
                  <div className="ai-bar"><div style={{ height:"100%", width:`${f.c*100}%`, background:f.c>=0.9?"#10B981":f.c>=0.75?"#F59E0B":"#EF4444", borderRadius:1 }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="section-title">검토 상태</div>
            <div style={{ background:"#0F1117", border:"1px solid #1A1D24", padding:16, marginBottom:14 }}>
              <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#6B7280", lineHeight:1.7 }}>
                필드를 직접 수정한 후 확인하면 딜 정보에 반영됩니다. 수정 내역은 AI 개선에 활용됩니다.
              </div>
            </div>
            <div style={{ background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.2)", padding:14, marginBottom:16 }}>
              <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#EF4444", marginBottom:10, fontWeight:700 }}>낮은 신뢰도 필드</div>
              <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#9CA3AF", lineHeight:2 }}>
                · 총 중량 (73%) — PDF 형식 불명확<br />
                · 유효 기간 (85%) — 날짜 복수 감지
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button className="ghost-btn" style={{ flex:1 }}>재추출</button>
              <button className="primary-btn" style={{ flex:1 }}>수정 확인 및 저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 실패 처리 모달 */}
      {showLostModal && (
        <div className="modal-overlay" onClick={() => setShowLostModal(false)}>
          <div className="modal-box" style={{ width:480 }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:16, fontWeight:700, marginBottom:6 }}>실패 처리</div>
            <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#4B5563", marginBottom:20 }}>사유를 선택해주세요. 향후 분석에 활용됩니다.</div>
            <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:16 }}>
              {LOSS_REASONS.map(r => (
                <label key={r} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"8px 12px", background:lostReason===r?"rgba(239,68,68,0.08)":"#141720", border:`1px solid ${lostReason===r?"rgba(239,68,68,0.4)":"#1E2330"}`, transition:"all 0.1s" }}>
                  <input type="radio" name="lostReason" value={r} checked={lostReason===r} onChange={() => setLostReason(r)} style={{ accentColor:"#EF4444" }} />
                  <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, color:"#CBD5E1" }}>{r}</span>
                </label>
              ))}
            </div>
            {lostReason === "기타" && (
              <textarea
                placeholder="기타 사유를 입력해주세요..."
                value={lostMemo}
                onChange={e => setLostMemo(e.target.value)}
                style={{ width:"100%", height:80, background:"#0F1117", border:"1px solid #1E2330", color:"#CBD5E1", padding:"10px 12px", fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, lineHeight:1.6, resize:"vertical", marginBottom:16 }}
              />
            )}
            <div style={{ display:"flex", gap:8 }}>
              <button className="ghost-btn" style={{ flex:1 }} onClick={() => setShowLostModal(false)}>취소</button>
              <button className="danger-btn" style={{ flex:1 }} onClick={() => setShowLostModal(false)}>실패 확정</button>
            </div>
          </div>
        </div>
      )}

      {/* 수주 완료 모달 */}
      {showWonModal && (
        <div className="modal-overlay" onClick={() => setShowWonModal(false)}>
          <div className="modal-box" style={{ width:680 }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:16, fontWeight:700, marginBottom:6 }}>수주 완료 처리</div>
            <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#4B5563", marginBottom:20 }}>수주 공지 이메일 초안을 확인하고 발송하세요.</div>

            {/* 첨부 파일 업로드 */}
            <div className="section-title">관련 파일 첨부</div>
            <div style={{ background:"rgba(245,158,11,0.05)", border:"1px dashed rgba(245,158,11,0.3)", padding:"16px 20px", marginBottom:20, textAlign:"center", cursor:"pointer" }}>
              <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, color:"#9CA3AF", marginBottom:6 }}>📎 파일을 드래그하거나 클릭하여 첨부</div>
              <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#4B5563" }}>견적서, 서명본, PO 등 · 첨부 즉시 OneDrive 수주 폴더에 자동 업로드됩니다</div>
            </div>

            {/* 수주 공지 이메일 초안 */}
            <div className="section-title">수주 공지 이메일 초안</div>
            <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#4B5563", marginBottom:8 }}>
              내용 확인 후 발송 버튼을 누르면 자동으로 전송됩니다
            </div>
            <textarea
              defaultValue={wonEmailTemplate}
              style={{ width:"100%", height:260, background:"#141720", border:"1px solid #1E2330", color:"#CBD5E1", padding:"12px 14px", fontFamily:"'DM Mono',monospace", fontSize:12, lineHeight:1.7, resize:"vertical" }}
            />
            <div style={{ display:"flex", gap:8, marginTop:14 }}>
              <button className="ghost-btn" style={{ flex:1 }} onClick={() => setShowWonModal(false)}>취소</button>
              <button className="primary-btn" style={{ flex:2 }} onClick={() => setShowWonModal(false)}>수주 확정 및 공지 발송 →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// 신규 딜 등록
// ─────────────────────────────────────────
function NewDealView({ onBack }) {
  const [step, setStep]       = useState(1);
  const [dragging, setDragging] = useState(false);
  return (
    <div style={{ padding:24, maxWidth:820, margin:"0 auto" }}>
      <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:32 }}>
        <button onClick={onBack} className="ghost-btn">← 뒤로</button>
        <div>
          <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:20, fontWeight:700 }}>수동 등록</div>
          <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#4B5563", marginTop:3 }}>CC 누락 건 또는 이메일 외 문의 수동 등록</div>
        </div>
      </div>
      {/* 단계 표시 */}
      <div style={{ display:"flex", alignItems:"center", marginBottom:36 }}>
        {[["1","PDF 업로드"],["2","AI 추출 중"],["3","검토 및 확정"]].map(([n,label],i) => (
          <div key={n} style={{ display:"flex", alignItems:"center", flex:i<2?1:"none" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:26, height:26, borderRadius:"50%", border:`2px solid ${step>i+1?"#10B981":step===i+1?"#F59E0B":"#1E2330"}`, background:step>i+1?"#10B981":"transparent", color:step>i+1?"#000":step===i+1?"#F59E0B":"#2A3040", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0 }}>
                {step>i+1?"✓":n}
              </div>
              <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, color:step===i+1?"#E2E8F0":"#4B5563", whiteSpace:"nowrap" }}>{label}</span>
            </div>
            {i<2 && <div style={{ flex:1, height:1, background:step>i+1?"#10B981":"#1A1D24", margin:"0 16px" }} />}
          </div>
        ))}
      </div>

      {step===1 && (
        <div>
          <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)}
            onDrop={e=>{e.preventDefault();setDragging(false);setStep(2);setTimeout(()=>setStep(3),1800);}}
            onClick={()=>{setStep(2);setTimeout(()=>setStep(3),1800);}}
            style={{ border:`2px dashed ${dragging?"#F59E0B":"#1E2330"}`, padding:"60px 40px", textAlign:"center", cursor:"pointer", transition:"all 0.2s", background:dragging?"rgba(245,158,11,0.04)":"transparent", marginBottom:14 }}>
            <div style={{ fontSize:40, marginBottom:16 }}>📄</div>
            <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:18, fontWeight:700, marginBottom:8 }}>견적 PDF를 여기에 드래그하세요</div>
            <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, color:"#4B5563" }}>또는 클릭하여 파일 선택 · PDF, DOC, DOCX · 최대 20MB</div>
          </div>
          <div style={{ textAlign:"center", fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#4B5563" }}>
            PDF 없이 직접 입력하시려면&nbsp;
            <span style={{ color:"#F59E0B", cursor:"pointer", textDecoration:"underline" }} onClick={()=>setStep(3)}>수동 입력</span>
          </div>
        </div>
      )}
      {step===2 && (
        <div style={{ textAlign:"center", padding:"70px 40px", background:"#0F1117", border:"1px solid #1A1D24" }}>
          <div style={{ fontSize:40, marginBottom:20 }}>⚙</div>
          <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:18, fontWeight:700, marginBottom:14 }}>AI가 필드를 추출하는 중...</div>
          <div style={{ width:220, height:3, background:"#1A1D24", margin:"0 auto 20px", borderRadius:1, overflow:"hidden" }}>
            <style>{`@keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
            <div style={{ height:"100%", background:"#F59E0B", borderRadius:1, width:"55%", animation:"slide 1.5s ease-in-out infinite" }} />
          </div>
          <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, color:"#4B5563" }}>업체 정보, 금액, 무역 조건, 항구 정보 추출 중...</div>
        </div>
      )}
      {step===3 && (
        <div>
          <div style={{ background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.2)", padding:"11px 16px", marginBottom:20, display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ color:"#10B981" }}>✓</span>
            <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, color:"#10B981" }}>AI 추출 완료. 내용을 확인하고 딜을 활성화해주세요.</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            <div>
              <div className="section-title">추출된 필드 — 수정 가능</div>
              {[
                { label:"업체명",      value:"Van Leeuwen Pipe & Tube", c:0.97, flagged:false },
                { label:"도착 항구",   value:"Laem Chabang, Thailand",  c:0.88, flagged:false },
                { label:"선적 조건",   value:"FOB",                     c:0.99, flagged:false },
                { label:"결제 조건",   value:"LC at sight",             c:0.91, flagged:false },
                { label:"총 금액",     value:"USD 284,500",             c:0.96, flagged:false },
                { label:"총 중량",     value:"42,300 kg",               c:0.73, flagged:true  },
                { label:"총 수량",     value:"2,400 pcs",               c:0.89, flagged:false },
              ].map(f => (
                <div key={f.label} style={{ padding:"10px 0", borderBottom:"1px solid #141720" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span className="field-label">{f.label}</span>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:f.c>=0.9?"#10B981":f.c>=0.75?"#F59E0B":"#EF4444" }}>{(f.c*100).toFixed(0)}%</span>
                  </div>
                  <input defaultValue={f.value} style={{ width:"100%", background:f.flagged?"rgba(239,68,68,0.05)":"#0F1117", border:`1px solid ${f.flagged?"rgba(239,68,68,0.4)":"#1E2330"}`, color:"#CBD5E1", padding:"8px 10px", fontFamily:"'DM Mono',monospace", fontSize:12 }} />
                </div>
              ))}
            </div>
            <div>
              <div className="section-title">딜 설정</div>
              <div style={{ padding:"12px 0", borderBottom:"1px solid #141720" }}>
                <span className="field-label" style={{ display:"block", marginBottom:7 }}>담당자</span>
                <select style={{ width:"100%", background:"#0F1117", border:"1px solid #1E2330", color:"#CBD5E1", padding:"9px 10px", fontFamily:"'Noto Sans KR',sans-serif", fontSize:13 }}>
                  <option value="">미지정</option>
                  {ASSIGNEES.map(a=><option key={a}>{a}</option>)}
                </select>
              </div>
              {[
                { label:"스테이지", options:["문의 접수","견적 작성","견적 발송"] },
                { label:"프로젝트", options:["PTTGC Thailand LNG","OQ Sohar Refinery","—"] },
              ].map(f => (
                <div key={f.label} style={{ padding:"12px 0", borderBottom:"1px solid #141720" }}>
                  <span className="field-label" style={{ display:"block", marginBottom:7 }}>{f.label}</span>
                  <select style={{ width:"100%", background:"#0F1117", border:"1px solid #1E2330", color:"#CBD5E1", padding:"9px 10px", fontFamily:"'Noto Sans KR',sans-serif", fontSize:13 }}>
                    {f.options.map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ padding:"12px 0", borderBottom:"1px solid #141720" }}>
                <span className="field-label" style={{ display:"block", marginBottom:7 }}>자동 리마인더</span>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <div style={{ width:36, height:20, background:"#F59E0B", borderRadius:10, padding:"2px 2px 2px 18px", cursor:"pointer" }}>
                    <div style={{ width:16, height:16, background:"#000", borderRadius:"50%" }} />
                  </div>
                  <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#6B7280" }}>활성화 — 14일 기준</span>
                </div>
              </div>
              <div style={{ padding:"12px 0" }}>
                <span className="field-label" style={{ display:"block", marginBottom:7 }}>중요도</span>
                <div style={{ display:"flex", gap:6 }}>
                  {[1,2,3,4,5].map(i=><div key={i} style={{ width:22, height:22, background:i<=4?"#F59E0B":"#1A1D24", borderRadius:3, cursor:"pointer", border:`1px solid ${i<=4?"#F59E0B":"#2A3040"}` }} />)}
                </div>
              </div>
              <div style={{ display:"flex", gap:8, marginTop:20 }}>
                <button className="ghost-btn" style={{ flex:1 }}>임시 저장</button>
                <button className="primary-btn" style={{ flex:1 }}>딜 활성화 →</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// 거래처
// ─────────────────────────────────────────
function ClientsView() {
  const COMPANIES = [
    { name:"Van Leeuwen Pipe & Tube", country:"Netherlands", deals:12, openValue:696500, clients:["PTTGC","Petronas"] },
    { name:"JJ Advanced",            country:"Singapore",   deals:8,  openValue:245600, clients:["OQ","ADNOC"] },
    { name:"Corrpro",                 country:"USA",         deals:5,  openValue:287500, clients:["Petronas"] },
    { name:"AMC",                     country:"UAE",         deals:3,  openValue:0,      clients:["PSO"] },
    { name:"Gulf Technical",          country:"Oman",        deals:2,  openValue:0,      clients:["OQ"] },
  ];
  const COL = "1fr 100px 70px 100px 180px";
  return (
    <div style={{ padding:24 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:20, fontWeight:700 }}>거래처 관리</div>
        <button className="primary-btn">+ 거래처 추가</button>
      </div>
      <div style={{ background:"#0F1117", border:"1px solid #1A1D24" }}>
        <div className="tbl-row" style={{ gridTemplateColumns:COL, background:"#0A0C10", cursor:"default", borderBottom:"1px solid #1A1D24" }}>
          {["거래처명","국가","딜 수","오픈 금액","최종 고객사"].map(h=>(
            <div key={h} style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:10, color:"#4B5563", fontWeight:700 }}>{h}</div>
          ))}
        </div>
        {COMPANIES.map(c => (
          <div key={c.name} className="tbl-row row-hover" style={{ gridTemplateColumns:COL, background:"transparent" }}>
            <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, color:"#CBD5E1", fontWeight:700 }}>{c.name}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"#6B7280" }}>{c.country}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"#9CA3AF" }}>{c.deals}건</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:c.openValue>0?"#CBD5E1":"#4B5563", fontWeight:c.openValue>0?600:400 }}>{c.openValue>0?`$${(c.openValue/1000).toFixed(0)}K`:"—"}</div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {c.clients.map(cl=><span key={cl} style={{ background:"#1A1D24", color:"#9CA3AF", fontFamily:"'DM Mono',monospace", fontSize:10, padding:"2px 8px", borderRadius:2 }}>{cl}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// 실적 분석
// ─────────────────────────────────────────
function AnalyticsView({ deals }) {
  return (
    <div style={{ padding:24 }}>
      <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:20, fontWeight:700, marginBottom:20 }}>실적 분석</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div>
          <div className="section-title">담당자별 현황</div>
          <div style={{ background:"#0F1117", border:"1px solid #1A1D24" }}>
            {ASSIGNEES.map(sp => {
              const myDeals = deals.filter(d=>d.assignee===sp);
              const won     = myDeals.filter(d=>d.stage==="order_confirmed");
              const active  = myDeals.filter(d=>!["order_confirmed","lost","no_response"].includes(d.stage));
              const total   = active.reduce((s,d)=>s+d.amount,0);
              return (
                <div key={sp} style={{ padding:"16px 18px", borderBottom:"1px solid #141720" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                    <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:15, fontWeight:700 }}>{sp}</span>
                    <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#6B7280" }}>총 {myDeals.length}건</span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                    {[{label:"진행 중",value:active.length+"건",color:"#3B82F6"},{label:"수주",value:won.length+"건",color:"#10B981"},{label:"파이프라인",value:`$${(total/1000).toFixed(0)}K`,color:"#F59E0B"}].map(s=>(
                      <div key={s.label} style={{ background:"#141720", padding:"9px 11px" }}>
                        <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:10, color:"#4B5563", marginBottom:4 }}>{s.label}</div>
                        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:18, fontWeight:700, color:s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div className="section-title">제품별 분포</div>
          <div style={{ background:"#0F1117", border:"1px solid #1A1D24", padding:16, marginBottom:16 }}>
            {[["SMLS TUBE",4],["FIN TUBE",2],["EXTRUDED FIN",1],["LOW FIN",1],["PLANT ITEMS",1]].map(([prod,count])=>(
              <div key={prod} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#9CA3AF" }}>{prod}</span>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#6B7280" }}>{count}건</span>
                </div>
                <div style={{ height:4, background:"#1A1D24", borderRadius:2 }}>
                  <div style={{ height:"100%", width:`${(count/4)*100}%`, background:"#3B82F6", borderRadius:2 }} />
                </div>
              </div>
            ))}
          </div>
          <div className="section-title">월별 수주 추이</div>
          <div style={{ background:"#0F1117", border:"1px solid #1A1D24", padding:"16px 16px 8px" }}>
            <div style={{ display:"flex", alignItems:"flex-end", gap:5, height:80, marginBottom:8 }}>
              {[40,65,30,80,55,90,45,70,85,60,95,75].map((h,i)=>(
                <div key={i} style={{ flex:1, background:i===11?"#F59E0B":"#1E2330", height:`${h}%`, borderRadius:"2px 2px 0 0" }} />
              ))}
            </div>
            <div style={{ display:"flex", gap:5 }}>
              {["1","2","3","4","5","6","7","8","9","10","11","12"].map((m,i)=>(
                <div key={m} style={{ flex:1, textAlign:"center", fontFamily:"'DM Mono',monospace", fontSize:9, color:i===11?"#F59E0B":"#2A3040" }}>{m}월</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
