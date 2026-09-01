"use client";

// components/page/learner/grammar/GrammarPanel.tsx
// Renders the lesson's grammar sections. Ported from renderGrammar()/
// renderGrammarItem()/renderGrammarTable() in Learning/web_app/static/grammar/
// grammar.js. type: 1 section title · 2 description · 3 example (cn~vn) ·
// 4 table (context rows) or ref text · 5 dialogue (cn~vn). Content is
// language-aware — English on the EN locale, Vietnamese otherwise — falling back
// to whichever the row actually has (the legacy page was Vietnamese-only).

import { useT } from "@/components/i18n/I18nProvider";
import type { LessonGrammarRule } from "@/lib/types/types";
import type { GrammarSection } from "@/hooks/useGrammar";

export function GrammarPanel({
  sections,
  loading,
  error,
}: {
  sections: GrammarSection[];
  loading: boolean;
  error: string | null;
}) {
  const { t, lang } = useT();

  if (loading) return <div className="lesson-learner-empty">{t("grammar.loading")}</div>;
  if (error) return <div className="lesson-learner-empty">{t("grammar.error_loading")}</div>;
  if (sections.length === 0)
    return <div className="lesson-learner-empty">{t("grammar.no_rules")}</div>;

  return (
    <div className="grammar-content">
      {sections.map((section, i) => (
        <div key={i} className="grammar-section">
          {section.map((g, j) => (
            <GrammarItem key={g.grammar_id ?? `${i}-${j}`} rule={g} lang={lang} />
          ))}
        </div>
      ))}
    </div>
  );
}

function content(rule: LessonGrammarRule, lang: string): string {
  const primary = lang === "vi" ? rule.vietnamese_content : rule.english_content;
  return (primary || rule.vietnamese_content || rule.english_content || "").trim();
}

function contextRows(rule: LessonGrammarRule, lang: string): Array<Record<string, string>> | null {
  const primary = lang === "vi" ? rule.vn_context : rule.en_context;
  return primary ?? rule.vn_context ?? rule.en_context ?? null;
}

function GrammarItem({ rule, lang }: { rule: LessonGrammarRule; lang: string }) {
  const text = content(rule, lang);

  switch (rule.type) {
    case 1:
      return <h3 className="grammar-title">{text}</h3>;
    case 2:
      return <p className="grammar-desc">{text}</p>;
    case 3: {
      const [cn = "", vn = ""] = text.split("~");
      return (
        <div className="grammar-example">
          <div className="ex-cn" lang="zh-CN">
            {cn.trim()}
          </div>
          <div className="ex-vn">{vn.trim()}</div>
        </div>
      );
    }
    case 4: {
      const rows = contextRows(rule, lang);
      if (rows && rows.length > 0) return <GrammarTable rows={rows} />;
      return <div className="grammar-table-ref">{text}</div>;
    }
    case 5: {
      const [cn = "", vn = ""] = text.split("~");
      return (
        <div className="grammar-dialogue">
          <div className="dlg-cn" lang="zh-CN">
            {cn.trim()}
          </div>
          <div className="dlg-vn">{vn.trim()}</div>
        </div>
      );
    }
    default:
      return null;
  }
}

function GrammarTable({ rows }: { rows: Array<Record<string, string>> }) {
  const headers = Object.keys(rows[0] ?? {});
  return (
    <div className="grammar-table-container">
      <table className="grammar-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {headers.map((h) => (
                <td key={h}>{row[h] ?? ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
