import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 이메일 → 담당자 ID 매핑
const ASSIGNEE_MAP: Record<string, string> = {
  "rmk@raremetal.co.kr":          "bb2384a7-6449-4a7c-a249-cb3cd08593aa", // 나윤수
  "rmk05@raremetal.co.kr":        "a2180756-58bb-40c7-ba6a-25afff137fe5", // 조맹현
  "rm10@raremetal.co.kr":         "4830e7f8-aa0f-4aa5-803f-91fb79f7bd79", // 김유진
  "rm11@raremetal.co.kr":         "26571920-63f6-4a31-8240-9965e92b2b5d", // 김지훈
  "rm6@raremetal.co.kr":          "3975ff03-1921-4044-92d4-76e17d56f56d", // 전정열
  "rmk01@raremetal.co.kr":        "26b94a64-0b90-4ac6-acfd-5836f0a19e0b", // 노은진
  "webmaster@raremetal.co.kr":    "d22d7806-4b74-45c5-ada8-ae3b8f9c676f", // 나한성
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 시크릿 키 검증
    if (body.zapier_secret !== "rmk-zapier-secret-2025") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      email_from,
      email_from_name,
      email_subject,
      email_body,
      email_received_at,
      email_clean_subject,
    } = body;

    // 1. 발신자 이메일로 거래처 매칭 (없으면 신규 생성)
    let companyId: string | null = null;
    if (email_from) {
      const { data: existing } = await supabase
        .from("companies")
        .select("id")
        .eq("email", email_from)
        .single();

      if (existing) {
        companyId = existing.id;
      } else {
        // 신규 거래처 자동 생성
        const { data: newCompany } = await supabase
          .from("companies")
          .insert({
            name: email_from_name || email_from,
            email: email_from,
          })
          .select("id")
          .single();
        if (newCompany) companyId = newCompany.id;
      }
    }

    // 2. CC 또는 To 필드에서 담당자 매칭
    //    Zapier에서 email_to 필드도 넘겨주면 더 정확하지만
    //    일단 email_from이 팀원이면 본인이 담당자
    let assigneeId: string | null = null;

    // CC에 팀원 이메일이 있으면 그 팀원이 담당자
    const allText = (body.email_to || "") + " " + (body.email_cc || "");
    for (const [email, id] of Object.entries(ASSIGNEE_MAP)) {
      if (allText.includes(email)) {
        assigneeId = id;
        break;
      }
    }

    // 3. 딜 생성
    const subject = email_clean_subject || email_subject || "제목 없음";
    const firstContactDate = email_received_at
      ? email_received_at.slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .insert({
        subject,
        stage: "inquiry_received",
        company_id: companyId,
        assignee_id: assigneeId,
        first_contact_date: firstContactDate,
        currency: "USD",
      })
      .select("id")
      .single();

    if (dealError) {
      console.error("Deal insert error:", dealError);
      return NextResponse.json({ error: dealError.message }, { status: 500 });
    }

    // 4. 활동 내역에 이메일 기록
    await supabase.from("activities").insert({
      deal_id: deal.id,
      type: "email_received",
      content: email_body?.slice(0, 1000) || "",
      from_email: email_from,
      from_name: email_from_name,
    });

    return NextResponse.json({
      success: true,
      deal_id: deal.id,
      company_id: companyId,
      assignee_id: assigneeId,
    }, { status: 201 });

  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
