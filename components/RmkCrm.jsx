"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
const LOSS_REASONS = ["가격 경쟁력 부족", "타사 선정", "스펙 미충족", "프로젝트 취소", "예산 삭감", "무응답 장기화", "기타"];

const fmtK = (n, cur) => n > 0 ? `${cur||"USD"} ${(n/1000).toFixed(0)}K` : "—";

function mapDeal(row) {
  const now = new Date();
  const lastActivity = row.updated_at ? new Date(row.updated_at) : new Date(row.created_at);
  const daysStale = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
  const threshold = row.reminders?.[0]?.threshold_days ?? 14;
  const daysOverdue = daysStale > threshold ? daysStale - threshold : 0;
  return {
    id: row.id,
    subject: row.subject ?? "—",
    stage: row.stage ?? "inquiry_received",
    company: row.companies?.name ?? "—",
    companyEmail: row.companies?.email ?? null,
    contactName: row.companies?.contact_name ?? null,
    client: row.clients?.name ?? "—",
    assignee: row.users?.name ?? null,
    amount: row.total_amount ?? 0,
    currency: row.currency ?? "USD",
    product: row.product ?? "—",
    importance: row.importance ?? 3,
    quoteRef: row.quote_ref ?? null,
    destination: row.destination_port ?? null,
    loadingPort: row.loading_port ?? null,
    shipmentTerm: row.shipment_term ?? null,
    paymentTerm: row.payment_term ?? null,
    totalQty: row.total_qty ?? null,
    totalWeight: row.total_weight ?? null,
    firstContactDate: row.first_contact_date ?? null,
    validityEnd: row.validity_end ?? null,
    onedriveFolderUrl: row.onedrive_folder_url ?? null,
    daysStale,
    daysOverdue,
  };
}

export default function RMKCrm() {
  const [view, setView] = useState("dashboard");
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [deals, setDeals] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchDeals() {
    const { data, error } = await supabase
      .from("deals")
      .select(`*, companies(name,email,contact_name), clients(name), users(name), reminders(threshold_days,enabled)`)
      .order("created_at", { ascending: false });
    if (!error && data) setDeals(data.map(mapDeal));
  }

  async function fetchUsers() {
    const { data } = await supabase.from("users").select("id, name").order("name");
    if (data) setUsers(data.map(u => u.name));
  }

  useEffect(() => {
    Promise.all([fetchDeals(), fetchUsers()]).then(() => setLoading(false));
  }, []);

  const updateDeal = async (id, patch) => {
    const dbPatch = {};
    if (patch.stage     !== undefined) dbPatch.stage      = patch.stage;
    if (patch.importance!== undefined) dbPatch.importance = patch.importance;
    if (patch.assignee  !== undefined) {
      if (!patch.assignee) { dbPatch.assignee_id = null; }
      else {
        const { data } = await supabase.from("users").select("id").eq("name", patch.assignee).single();
        if (data) dbPatch.assignee_id = data.id;
      }
    }
    if (Object.keys(dbPatch).length > 0) {
      await supabase.from("deals").update(dbPatch).eq("id", id);
    }
    setDeals(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  };

  const openDeal = (deal) => { setSelectedDeal(deal); setView("deal"); };

  const activeDeals     = deals.filter(d => !["order_confirmed","lost","no_response"].includes(d.stage));
  const staleDeals      = deals.filter(d => d.daysStale > 60 && !["order_confirmed","lost","no_response"].includes(d.stage));
  const unassignedDeals = deals.filter(d => !d.assignee && !["order_confirmed","lost","no_response"].includes(d.stage));
  const overdueDeals    = deals.filter(d => d.daysOverdue > 0 && !["order_confirmed","lost","no_response"].includes(d.stage));
  const wonDeals        = deals.filter(d => d.stage === "order_confirmed");
  const totalPipeline   = activeDeals.reduce((s,d) => s+d.amount, 0);
  const wonAmount       = wonDeals.reduce((s,d) => s+d.amount, 0);

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Noto+Sans+KR:wght@400;500;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:4px;height:4px;}
    ::-webkit-scrollbar-track{background:#1A1D24;}
    ::-webkit-scrollbar-thumb{background:#3A3F4B;border-radius:2px;}
    .nav-btn{background:none;border:none;cursor:pointer;padding:8px 16px;font-family:'Noto Sans KR',sans-serif;font-size:13px;color:#6B7280;transition:all 0.15s;border-bottom:2px solid transparent;}
    .nav-btn:hover{color:#E2E8F0;} .nav-btn.active{color:#F59E0B;border-bottom:2px solid #F59E0B;}
    .kpi-card{background:#141720;border:1px solid #1E2330;padding:20px 24px;}
    .overdue-badge{background:rgba(239,68,68,0.15);color:#EF4444;font-size:10px;padding:1px 7px;border-radius:2px;font-weight:600;white-space:nowrap;font-family:'Noto Sans KR',sans-serif;}
    .stale-badge{background:rgba(251,191,36,0.12);color:#FBBF24;font-size:10px;padding:1px 7px;border-radius:2px;font-weight:600;white-space:nowrap;font-family:'Noto Sans KR',sans-serif;}
    .unassigned-badge{background:rgba(107,114,128,0.2);color:#9CA3AF;font-size:10px;padding:1px 7px;border-radius:2px;font-weight:600;font-family:'Noto Sans KR',sans-serif;}
    .section-title{font-family:'Noto Sans KR',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.04em;color:#4B5563;margin-bottom:14px;text-transform:uppercase;}
    .primary-btn{background:#F59E0B;color:#000;border:none;padding:8px 18px;font-family:'Noto Sans KR',sans-serif;font-size:13px;font-weight:700;cursor:pointer;}
    .primary-btn:hover{opacity:0.85;}
    .ghost-btn{background:#1A1D24;border:1px solid #2A3040;color:#9CA3AF;padding:7px 14px;cursor:pointer;font-family:'Noto Sans KR',sans-serif;font-size:12px;}
    .ghost-btn:hover{border-color:#3A3F4B;color:#E2E8F0;}
    .danger-btn{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#EF4444;padding:7px 14px;cursor:pointer;font-family:'Noto Sans KR',sans-serif;font-size:12px;}
    .danger-btn:hover{background:rgba(239,68,68,0.2);}
    .tab-btn{background:none;border:none;cursor:pointer;padding:10px 20px;font-family:'Noto Sans KR',sans-serif;font-size:13px;color:#6B7280;border-bottom:2px solid transparent;}
    .tab-btn.active{color:#F59E0B;border-bottom:2px solid #F59E0B;}
    .field-row{display:flex;justify-content:space-between;align-items:center;padding:9px 16px;border-bottom:1px solid #0F1117;}
    .field-label{color:#6B7280;font-size:11px;font-family:'Noto Sans KR',sans-serif;flex-shrink:0;}
    .field-value{color:#CBD5E1;font-weight:500;font-size:12px;text-align:right;}
    .field-pending{color:#2A3040;font-size:11px;font-family:'Noto Sans KR',sans-serif;font-style:italic;}
    .tbl-row{display:grid;padding:11px 16px;border-bottom:1px solid #141720;cursor:pointer;transition:background 0.1s;background:transparent;align-items:center;gap:10px;}
    .tbl-row:hover{background:#141720;}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:200;display:flex;align-items:center;justify-content:center;}
    .modal-box{background:#0F1117;border:1px solid #2A3040;padding:28px;max-height:85vh;overflow-y:auto;}
    .inline-select{background:#1A1D24;border:1px solid #2A3040;color:#CBD5E1;padding:4px 8px;font-family:'Noto Sans KR',sans-serif;font-size:12px;cursor:pointer;}
    select,input,textarea{outline:none;} select:focus,input:focus,textarea:focus{border-color:#F59E0B!important;}
  `;

  if (loading) return (
    <div style={{ fontFamily:"'DM Mono',monospace", background:"#0C0E12", minHeight:"100vh", color:"#E2E8F0", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{CSS}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:16 }}>⚙</div>
        <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:14, color:"#4B5563" }}>데이터 불러오는 중...</div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Mono','Courier New',monospace", background:"#0C0E12", minHeight:"100vh", color:"#E2E8F0" }}>
      <style>{CSS}</style>

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
          <div style={{ width:32, height:32, background:"#1E2330", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:"#9CA3AF", fontFamily:"'Noto Sans KR',sans-serif", fontWeight:600 }}>나</div>
        </div>
      </div>

      {/* 대시보드 */}
      {view === "dashboard" && (
        <div style={{ padding:24 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
            {[
              { label:"진행 중인 딜",   value:activeDeals.length,                        unit:"건",  color:"#3B82F6" },
              { label:"파이프라인 금액", value:`$${(totalPipeline/1000).toFixed(0)}K`,   unit:"USD", color:"#8B5CF6" },
              { label:"이번 달 수주",   value:`$${(wonAmount/1000).toFixed(0)}K`,        unit:"USD", color:"#10B981" },
              { label:"팔로업 지연",    value:overdueDeals.length,                       unit:"건",  color:"#EF4444" },
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
              {staleDeals.length > 0 && (
                <div style={{ marginBottom:20 }}>
                  <div className="section-title" style={{ color:"#FBBF24" }}>⏳ 장기 미처리 — 실패/무응답 처리 필요</div>
                  <div style={{ background:"#0F1117", border:"1px solid rgba(251,191,36,0.2)" }}>
                    {staleDeals.map(d => (
                      <div key={d.id} className="tbl-row" style={{ gridTemplateColumns:"24px 1fr 100px 85px 70px 70px" }} onClick={() => openDeal(d)}>
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
                          {users.map(a => <option key={a} value={a}>{a}</option>)}
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
                {wonDeals.length === 0 && <div style={{ padding:"20px 16px", fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#2A3040", textAlign:"center" }}>수주 완료 건 없음</div>}
                {wonDeals.slice(0,5).map(d => (
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

      {view === "pipeline"  && <PipelineView deals={deals} users={users} onOpen={openDeal} onUpdate={updateDeal} />}
      {view === "won"       && <WonView deals={wonDeals} onSelect={openDeal} />}
      {view === "deal"      && selectedDeal && (
        <DealDetailView
          deal={deals.find(d=>d.id===selectedDeal.id) || selectedDeal}
          users={users}
          onBack={() => setView("pipeline")}
          onUpdate={(patch) => updateDeal(selectedDeal.id, patch)}
        />
      )}
      {view === "new"       && <NewDealView onBack={() => setView("dashboard")} onCreated={() => { fetchDeals(); setView("pipeline"); }} users={users} />}
      {view === "clients"   && <ClientsView />}
      {view === "analytics" && <AnalyticsView deals={deals} users={users} />}
    </div>
  );
}

// ─── 파이프라인 ───
function PipelineView({ deals, users, onOpen, onUpdate }) {
  const [viewMode, setViewMode] = useState("table");
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
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:20, fontWeight:700 }}>
          파이프라인
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:14, color:"#4B5563", marginLeft:12, fontWeight:400 }}>
            {activeDeals.length}건 · ${(totalPipeline/1000).toFixed(0)}K
          </span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div style={{ display:"flex", border:"1px solid #1E2330", borderRadius:2, overflow:"hidden" }}>
            {[["table","≡ 테이블"],["kanban","⊞ 칸반"]].map(([m,label]) => (
              <button key={m} onClick={() => setViewMode(m)} style={{ background:viewMode===m?"#1E2330":"transparent", border:"none", color:viewMode===m?"#F59E0B":"#4B5563", padding:"6px 12px", cursor:"pointer", fontFamily:"'Noto Sans KR',sans-serif", fontSize:12 }}>{label}</button>
            ))}
          </div>
          <select className="inline-select" value={assigneeFilter} onChange={e=>setAssigneeFilter(e.target.value)}>
            <option value="all">전체 담당자</option>
            {users.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display:"flex", borderBottom:"1px solid #1A1D24", overflowX:"auto" }}>
        {[{id:"all",label:"전체"}, ...STAGES].map(s => {
          const cnt = s.id==="all" ? filtered.length : deals.filter(d=>d.stage===s.id).length;
          return (
            <button key={s.id} onClick={() => setStageFilter(s.id)}
              style={{ background:"none", border:"none", cursor:"pointer", padding:"9px 16px", fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:stageFilter===s.id?(s.color||"#F59E0B"):"#4B5563", borderBottom:stageFilter===s.id?`2px solid ${s.color||"#F59E0B"}`:"2px solid transparent", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:5 }}>
              {s.label}
              <span style={{ background:"#1A1D24", color:"#6B7280", fontFamily:"'DM Mono',monospace", fontSize:10, padding:"0 5px", borderRadius:2 }}>{cnt}</span>
            </button>
          );
        })}
      </div>

      {viewMode === "table" && (
        <div style={{ background:"#0F1117", border:"1px solid #1A1D24", borderTop:"none" }}>
          <div className="tbl-row" style={{ gridTemplateColumns:COL, background:"#0A0C10", cursor:"default", borderBottom:"1px solid #1A1D24" }}>
            {["","건명","바이어","최종 고객사","제품","금액","담당","지연"].map(h => (
              <div key={h} style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:10, color:"#4B5563", fontWeight:700 }}>{h}</div>
            ))}
          </div>
          {filtered.length === 0 && <div style={{ padding:"32px 16px", textAlign:"center", fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, color:"#2A3040" }}>해당 조건의 딜이 없습니다</div>}
          {filtered.map(d => {
            const stage = STAGES.find(s=>s.id===d.stage);
            return (
              <div key={d.id} className="tbl-row" style={{ gridTemplateColumns:COL }} onClick={() => onOpen(d)}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:stage?.color, display:"inline-block" }} />
                <div style={{ overflow:"hidden" }}>
                  <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#CBD5E1", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{d.subject}</div>
                  <div style={{ display:"flex", gap:6, marginTop:2, alignItems:"center" }}>
                    <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:10, color:stage?.color, background:`${stage?.color}18`, padding:"0 5px", borderRadius:2 }}>{stage?.label}</span>
                    {d.daysStale > 60 && <span className="stale-badge">{d.daysStale}일</span>}
                    {!d.assignee && <span className="unassigned-badge">미지정</span>}
                  </div>
                </div>
                <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#9CA3AF", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.company}</div>
                <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#6B7280" }}>{d.client}</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#6B7280" }}>{d.product}</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:d.amount>0?"#CBD5E1":"#4B5563" }}>{fmtK(d.amount, d.currency)}</div>
                <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:d.assignee?"#6B7280":"#EF4444" }}>{d.assignee||"미지정"}</div>
                <div>{d.daysOverdue > 0 && <span className="overdue-badge">{d.daysOverdue}일</span>}</div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "kanban" && (
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingTop:12, paddingBottom:12, minHeight:"60vh" }}>
          {STAGES.map(stage => {
            const stageDeals = filtered.filter(d=>d.stage===stage.id);
            const stageVal   = stageDeals.reduce((s,d)=>s+d.amount,0);
            return (
              <div key={stage.id} style={{ background:"#0F1117", border:"1px solid #1A1D24", flex:1, minWidth:180, maxWidth:215, display:"flex", flexDirection:"column" }}>
                <div style={{ padding:"9px 11px 7px", borderBottom:"1px solid #1A1D24" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:stage.color, display:"inline-block" }} />
                      <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#CBD5E1", fontWeight:700 }}>{stage.label}</span>
                    </div>
                    <span style={{ background:"#1A1D24", color:"#6B7280", fontFamily:"'DM Mono',monospace", fontSize:10, padding:"1px 6px", borderRadius:2 }}>{stageDeals.length}</span>
                  </div>
                  {stageVal > 0 && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#4B5563", paddingLeft:12, marginTop:2 }}>{fmtK(stageVal,"USD")}</div>}
                </div>
                <div style={{ flex:1, overflowY:"auto", padding:"4px 0" }}>
                  {stageDeals.map(d => (
                    <div key={d.id} style={{ background:"#141720", border:"1px solid #1E2330", margin:"5px 7px", padding:"10px", cursor:"pointer" }}
                      onMouseEnter={e=>e.currentTarget.style.borderColor="#3A3F4B"}
                      onMouseLeave={e=>e.currentTarget.style.borderColor="#1E2330"}
                      onClick={() => onOpen(d)}>
                      <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#CBD5E1", lineHeight:1.5, marginBottom:6 }}>{d.subject.length>44?d.subject.slice(0,44)+"…":d.subject}</div>
                      <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:10, color:"#4B5563", marginBottom:7 }}>{d.company} → {d.client}</div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ display:"flex", gap:2 }}>{[1,2,3,4,5].map(i=><div key={i} style={{ width:5, height:5, borderRadius:"50%", background:i<=d.importance?"#F59E0B":"#1E2330" }} />)}</div>
                        <div style={{ display:"flex", gap:4 }}>
                          {d.daysStale>60 && <span className="stale-badge">{d.daysStale}일</span>}
                          {d.daysOverdue>0 && <span className="overdue-badge">{d.daysOverdue}일</span>}
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

// ─── 수주 관리 ───
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
        {deals.length === 0 && <div style={{ padding:"32px 16px", textAlign:"center", fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, color:"#2A3040" }}>수주 완료 건이 없습니다</div>}
        {deals.map(d => (
          <div key={d.id} className="tbl-row" style={{ gridTemplateColumns:COL }} onClick={() => onSelect(d)}>
            <div>
              <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#CBD5E1" }}>{d.subject}</div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#4B5563", marginTop:2 }}>{d.quoteRef}</div>
            </div>
            <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#9CA3AF" }}>{d.company}</div>
            <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#9CA3AF" }}>{d.client}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:"#10B981", fontWeight:700 }}>{fmtK(d.amount,d.currency)}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#6B7280" }}>—</div>
            <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#6B7280" }}>{d.assignee||"—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 딜 상세 ───
function DealDetailView({ deal, users, onBack, onUpdate }) {
  const [activeTab, setActiveTab]         = useState("info");
  const [activities, setActivities]       = useState([]);
  const [showLostModal, setShowLostModal] = useState(false);
  const [showWonModal,  setShowWonModal]  = useState(false);
  const [lostReason, setLostReason]       = useState("");
  const [lostMemo,   setLostMemo]         = useState("");
  const [noteText,   setNoteText]         = useState("");

  const isBeforeSubmit = ["inquiry_received","quote_preparing"].includes(deal.stage);
  const isWon          = deal.stage === "order_confirmed";

  useEffect(() => {
    supabase.from("activities").select("*").eq("deal_id", deal.id).order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setActivities(data); });
  }, [deal.id]);

  const addNote = async () => {
    if (!noteText.trim()) return;
    const { data } = await supabase.from("activities").insert({ deal_id: deal.id, type: "note", content: noteText }).select().single();
    if (data) setActivities(prev => [data, ...prev]);
    setNoteText("");
  };

  const handleLost = async () => {
    if (!lostReason) return;
    await supabase.from("deals").update({ stage: "lost" }).eq("id", deal.id);
    onUpdate({ stage: "lost" });
    setShowLostModal(false);
  };

  const handleWon = async () => {
    await supabase.from("deals").update({ stage: "order_confirmed" }).eq("id", deal.id);
    onUpdate({ stage: "order_confirmed" });
    setShowWonModal(false);
  };

  const wonEmailTemplate = `수신: 전체\n참조: \n\n알엠케이 밀양 수주 공지 드리오니 확인 부탁드립니다.\n\n수주 : ${deal.destination||"—"}\n수주 진행 : 인천\n담당 : ${deal.assignee||"—"} 사원(영업)\n관리번호 : ${deal.quoteRef||"—"}\n수주처 : ${deal.company}\n품명 : ${deal.product}\n금액 : ${deal.currency||"USD"} ${deal.amount?.toLocaleString()||"—"}\n총 수량 : ${deal.totalQty?.toLocaleString()||"—"} pcs\n총 중량 : ${deal.totalWeight?.toLocaleString()||"—"} kg\n선적 조건 : ${deal.shipmentTerm||"—"}\n결제 조건 : ${deal.paymentTerm||"—"}\n\nBest Regards\nRMK CO., LTD`;

  const FIELDS_PRE  = [
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
  const actColor = t => ({ email_received:"#3B82F6", email_sent:"#8B5CF6", reminder_sent:"#F59E0B", note:"#6B7280", stage_changed:"#10B981" })[t]||"#4B5563";
  const actIcon  = t => ({ email_received:"↙", email_sent:"↗", reminder_sent:"⏰", note:"◆", stage_changed:"→" })[t]||"·";
  const actLabel = t => ({ email_received:"회신 수신", email_sent:"이메일 발송", reminder_sent:"리마인더", note:"메모", stage_changed:"스테이지 변경", file_uploaded:"파일 업로드" })[t]||t;

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:"flex", gap:16, alignItems:"flex-start", marginBottom:24 }}>
        <button onClick={onBack} className="ghost-btn">← 목록</button>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:STAGES.find(s=>s.id===deal.stage)?.color, display:"inline-block" }} />
            <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:STAGES.find(s=>s.id===deal.stage)?.color, fontWeight:700 }}>{STAGES.find(s=>s.id===deal.stage)?.label}</span>
            {deal.daysOverdue>0 && <span className="overdue-badge">{deal.daysOverdue}일 지연</span>}
            {deal.daysStale>60  && <span className="stale-badge">{deal.daysStale}일 방치</span>}
            {!deal.assignee     && <span className="unassigned-badge">담당자 미지정</span>}
          </div>
          <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:19, fontWeight:700, color:"#E2E8F0", marginBottom:4 }}>{deal.subject}</div>
          <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#4B5563" }}>{deal.company} → {deal.client}{deal.destination ? ` · ${deal.destination}` : ""}</div>
        </div>
        {!isWon && (
          <div style={{ display:"flex", gap:8 }}>
            <button className="danger-btn" onClick={() => setShowLostModal(true)}>실패 처리</button>
            <button className="primary-btn" onClick={() => setShowWonModal(true)}>수주 완료 →</button>
          </div>
        )}
        {isWon && <div style={{ background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.3)", color:"#10B981", padding:"8px 16px", fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, fontWeight:700 }}>✓ 수주 완료</div>}
      </div>

      <div style={{ display:"flex", borderBottom:"1px solid #1A1D24", marginBottom:20 }}>
        {[["info","딜 정보"],["activity","활동 내역"]].map(([id,label]) => (
          <button key={id} className={`tab-btn ${activeTab===id?"active":""}`} onClick={() => setActiveTab(id)}>{label}</button>
        ))}
      </div>

      {activeTab === "info" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <div>
            <div className="section-title">기본 정보</div>
            {isBeforeSubmit && (
              <div style={{ background:"rgba(59,130,246,0.06)", border:"1px solid rgba(59,130,246,0.2)", padding:"9px 14px", marginBottom:12, fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#60A5FA" }}>
                📋 견적 PDF 발송 후 상세 정보가 자동으로 채워집니다
              </div>
            )}
            <div style={{ background:"#0F1117", border:"1px solid #1A1D24" }}>
              <div className="field-row">
                <span className="field-label">담당자</span>
                <select className="inline-select" value={deal.assignee||""} onChange={e => onUpdate({ assignee: e.target.value || null })}>
                  <option value="">미지정</option>
                  {users.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              {isWon && deal.onedriveFolderUrl && (
                <div className="field-row">
                  <span className="field-label">📁 OneDrive 폴더</span>
                  <a href={deal.onedriveFolderUrl} target="_blank" rel="noreferrer" style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#3B82F6", textDecoration:"underline" }}>수주 폴더 열기 →</a>
                </div>
              )}
              {FIELDS.map(f => (
                <div key={f.label} className="field-row">
                  <span className="field-label">{f.label}</span>
                  {f.value ? <span className="field-value" style={{ fontFamily:f.mono?"'DM Mono',monospace":"'Noto Sans KR',sans-serif" }}>{f.value}</span> : <span className="field-pending">미입력</span>}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="section-title">진행 단계</div>
            <div style={{ background:"#0F1117", border:"1px solid #1A1D24", padding:20 }}>
              {(() => {
                const isOutcome = ["order_confirmed","lost","no_response"].includes(deal.stage);
                const activeIdx = isOutcome ? ACTIVE_STAGES.length : ACTIVE_STAGES.findIndex(st=>st.id===deal.stage);
                const outcomeStage = STAGES.find(s=>s.id===deal.stage);
                return (
                  <>
                    {ACTIVE_STAGES.map((s,i) => {
                      const isDone = i < activeIdx;
                      const isCurrent = !isOutcome && i === activeIdx;
                      return (
                        <div key={s.id} style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                            <div style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${isDone||isOutcome?"#10B981":isCurrent?s.color:"#1E2330"}`, background:isDone||isOutcome?"#10B981":isCurrent?`${s.color}22`:"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:isDone||isOutcome?"#000":isCurrent?s.color:"#2A3040", fontWeight:700, flexShrink:0 }}>{isDone||isOutcome?"✓":i+1}</div>
                            <div style={{ width:1, height:22, background:isDone||isOutcome?"#10B981":"#1E2330" }} />
                          </div>
                          <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:isDone||isOutcome?"#4B5563":isCurrent?"#E2E8F0":"#2A3040", paddingTop:3, paddingBottom:22 }}>{s.label}</span>
                        </div>
                      );
                    })}
                    <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                      <div style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${isOutcome?outcomeStage?.color:"#1E2330"}`, background:isOutcome?`${outcomeStage?.color}22`:"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:isOutcome?outcomeStage?.color:"#2A3040", fontWeight:700, flexShrink:0 }}>5</div>
                      <div style={{ paddingTop:3 }}>
                        <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:isOutcome?outcomeStage?.color:"#2A3040", fontWeight:isOutcome?700:400 }}>{isOutcome?outcomeStage?.label:"최종 결과"}</span>
                        {!isOutcome && <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:10, color:"#2A3040", marginTop:2 }}>수주 완료 · 실패 · 무응답</div>}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div style={{ maxWidth:660 }}>
          <div style={{ display:"flex", gap:10, marginBottom:20 }}>
            <input value={noteText} onChange={e=>setNoteText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addNote()} placeholder="메모 추가..." style={{ flex:1, background:"#0F1117", border:"1px solid #1E2330", color:"#CBD5E1", padding:"9px 14px", fontFamily:"'Noto Sans KR',sans-serif", fontSize:13 }} />
            <button className="primary-btn" onClick={addNote}>추가</button>
          </div>
          {activities.length === 0 && <div style={{ padding:"32px 16px", textAlign:"center", fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, color:"#2A3040" }}>활동 내역이 없습니다</div>}
          {activities.map((act,i) => (
            <div key={act.id} style={{ display:"flex", gap:14 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:26 }}>
                <div style={{ width:24, height:24, borderRadius:"50%", background:actColor(act.type), display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#000", flexShrink:0, fontWeight:700 }}>{actIcon(act.type)}</div>
                {i < activities.length-1 && <div style={{ width:1, flex:1, background:"#1A1D24", marginTop:4 }} />}
              </div>
              <div style={{ flex:1, paddingBottom:i<activities.length-1?18:0 }}>
                <div style={{ display:"flex", gap:8, marginBottom:5, alignItems:"center" }}>
                  <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, fontWeight:700, color:actColor(act.type) }}>{actLabel(act.type)}</span>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#2A3040", marginLeft:"auto" }}>{act.created_at?.slice(0,16).replace("T"," ")}</span>
                </div>
                <div style={{ background:"#0F1117", border:"1px solid #1A1D24", padding:"9px 14px" }}>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#6B7280", lineHeight:1.6 }}>{act.content}</div>
                  {act.ai_summary && (
                    <div style={{ marginTop:8, paddingTop:8, borderTop:"1px solid #141720", display:"flex", gap:6 }}>
                      <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:10, color:"#3B82F6", background:"rgba(59,130,246,0.1)", padding:"1px 6px", borderRadius:2, flexShrink:0 }}>AI 요약</span>
                      <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:11, color:"#9CA3AF" }}>{act.ai_summary}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showLostModal && (
        <div className="modal-overlay" onClick={() => setShowLostModal(false)}>
          <div className="modal-box" style={{ width:480 }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:16, fontWeight:700, marginBottom:6 }}>실패 처리</div>
            <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#4B5563", marginBottom:20 }}>사유를 선택해주세요.</div>
            <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:16 }}>
              {LOSS_REASONS.map(r => (
                <label key={r} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"8px 12px", background:lostReason===r?"rgba(239,68,68,0.08)":"#141720", border:`1px solid ${lostReason===r?"rgba(239,68,68,0.4)":"#1E2330"}` }}>
                  <input type="radio" name="lostReason" value={r} checked={lostReason===r} onChange={() => setLostReason(r)} style={{ accentColor:"#EF4444" }} />
                  <span style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, color:"#CBD5E1" }}>{r}</span>
                </label>
              ))}
            </div>
            {lostReason === "기타" && (
              <textarea placeholder="기타 사유..." value={lostMemo} onChange={e=>setLostMemo(e.target.value)} style={{ width:"100%", height:80, background:"#0F1117", border:"1px solid #1E2330", color:"#CBD5E1", padding:"10px 12px", fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, resize:"vertical", marginBottom:16 }} />
            )}
            <div style={{ display:"flex", gap:8 }}>
              <button className="ghost-btn" style={{ flex:1 }} onClick={() => setShowLostModal(false)}>취소</button>
              <button className="danger-btn" style={{ flex:1 }} onClick={handleLost} disabled={!lostReason}>실패 확정</button>
            </div>
          </div>
        </div>
      )}

      {showWonModal && (
        <div className="modal-overlay" onClick={() => setShowWonModal(false)}>
          <div className="modal-box" style={{ width:680 }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:16, fontWeight:700, marginBottom:6 }}>수주 완료 처리</div>
            <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#4B5563", marginBottom:20 }}>수주 공지 이메일 초안을 확인하세요.</div>
            <div className="section-title">수주 공지 이메일 초안</div>
            <textarea defaultValue={wonEmailTemplate} style={{ width:"100%", height:260, background:"#141720", border:"1px solid #1E2330", color:"#CBD5E1", padding:"12px 14px", fontFamily:"'DM Mono',monospace", fontSize:12, lineHeight:1.7, resize:"vertical" }} />
            <div style={{ display:"flex", gap:8, marginTop:14 }}>
              <button className="ghost-btn" style={{ flex:1 }} onClick={() => setShowWonModal(false)}>취소</button>
              <button className="primary-btn" style={{ flex:2 }} onClick={handleWon}>수주 확정 →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 신규 딜 등록 ───
function NewDealView({ onBack, onCreated, users }) {
  const [form, setForm] = useState({ subject:"", product:"", importance:3, stage:"inquiry_received" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.subject.trim()) return;
    setSaving(true);
    await supabase.from("deals").insert({
      subject: form.subject,
      product: form.product || null,
      importance: form.importance,
      stage: form.stage,
      first_contact_date: new Date().toISOString().slice(0,10),
    });
    setSaving(false);
    onCreated();
  };

  return (
    <div style={{ padding:24, maxWidth:600, margin:"0 auto" }}>
      <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:32 }}>
        <button onClick={onBack} className="ghost-btn">← 뒤로</button>
        <div>
          <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:20, fontWeight:700 }}>수동 등록</div>
          <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#4B5563", marginTop:3 }}>CC 누락 건 또는 이메일 외 문의 수동 등록</div>
        </div>
      </div>
      {[
        { label:"건명 *", key:"subject", placeholder:"예: SA179 Heat Exchanger Tubes - PTTGC" },
        { label:"제품",   key:"product", placeholder:"예: SMLS TUBE" },
      ].map(f => (
        <div key={f.key} style={{ marginBottom:16 }}>
          <div className="field-label" style={{ marginBottom:6, display:"block" }}>{f.label}</div>
          <input value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder}
            style={{ width:"100%", background:"#0F1117", border:"1px solid #1E2330", color:"#CBD5E1", padding:"10px 12px", fontFamily:"'DM Mono',monospace", fontSize:13 }} />
        </div>
      ))}
      <div style={{ marginBottom:24 }}>
        <div className="field-label" style={{ marginBottom:6, display:"block" }}>스테이지</div>
        <select value={form.stage} onChange={e=>setForm(p=>({...p,stage:e.target.value}))} style={{ width:"100%", background:"#0F1117", border:"1px solid #1E2330", color:"#CBD5E1", padding:"10px 12px", fontFamily:"'Noto Sans KR',sans-serif", fontSize:13 }}>
          {STAGES.slice(0,4).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <button className="primary-btn" style={{ width:"100%", padding:12 }} onClick={save} disabled={saving || !form.subject.trim()}>
        {saving ? "저장 중..." : "딜 등록 →"}
      </button>
    </div>
  );
}

// ─── 거래처 ───
function ClientsView() {
  const [companies, setCompanies] = useState([]);
  useEffect(() => {
    supabase.from("companies").select("id, name, country, email, contact_name").order("name")
      .then(({ data }) => { if (data) setCompanies(data); });
  }, []);
  const COL = "1fr 120px 1fr 120px";
  return (
    <div style={{ padding:24 }}>
      <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:20, fontWeight:700, marginBottom:20 }}>거래처 관리</div>
      <div style={{ background:"#0F1117", border:"1px solid #1A1D24" }}>
        <div className="tbl-row" style={{ gridTemplateColumns:COL, background:"#0A0C10", cursor:"default", borderBottom:"1px solid #1A1D24" }}>
          {["거래처명","국가","이메일","담당자"].map(h=>(
            <div key={h} style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:10, color:"#4B5563", fontWeight:700 }}>{h}</div>
          ))}
        </div>
        {companies.length === 0 && <div style={{ padding:"32px 16px", textAlign:"center", fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, color:"#2A3040" }}>거래처 데이터가 없습니다</div>}
        {companies.map(c => (
          <div key={c.id} className="tbl-row" style={{ gridTemplateColumns:COL }}>
            <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, color:"#CBD5E1", fontWeight:700 }}>{c.name}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"#6B7280" }}>{c.country||"—"}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#6B7280" }}>{c.email||"—"}</div>
            <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, color:"#9CA3AF" }}>{c.contact_name||"—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 실적 분석 ───
function AnalyticsView({ deals, users }) {
  const productMap = {};
  deals.forEach(d => { if(d.product && d.product !== "—") productMap[d.product] = (productMap[d.product]||0)+1; });
  const productEntries = Object.entries(productMap).sort((a,b)=>b[1]-a[1]);
  const maxCount = productEntries[0]?.[1] || 1;

  return (
    <div style={{ padding:24 }}>
      <div style={{ fontFamily:"'Noto Sans KR',sans-serif", fontSize:20, fontWeight:700, marginBottom:20 }}>실적 분석</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div>
          <div className="section-title">담당자별 현황</div>
          <div style={{ background:"#0F1117", border:"1px solid #1A1D24" }}>
            {users.length === 0 && <div style={{ padding:"24px", textAlign:"center", fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, color:"#2A3040" }}>팀원 데이터 없음</div>}
            {users.map(sp => {
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
          <div style={{ background:"#0F1117", border:"1px solid #1A1D24", padding:16 }}>
            {productEntries.length === 0
              ? <div style={{ textAlign:"center", fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, color:"#2A3040" }}>데이터 없음</div>
              : productEntries.map(([prod,count])=>(
                <div key={prod} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#9CA3AF" }}>{prod}</span>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#6B7280" }}>{count}건</span>
                  </div>
                  <div style={{ height:4, background:"#1A1D24", borderRadius:2 }}>
                    <div style={{ height:"100%", width:`${(count/maxCount)*100}%`, background:"#3B82F6", borderRadius:2 }} />
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
