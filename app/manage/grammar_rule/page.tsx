"use client";

// app/manage/grammar_rule/page.tsx
// Grammar rule management page — list, create, edit, delete.

import { useState } from "react";
import { useGrammarRule } from "@/hooks/useGrammarRule";
import { useToast } from "@/components/shared/manager_ui/Toast/Toast";
import { TopBar } from "@/components/layout/TopBar";
import { GrammarRuleTable } from "@/components/page/grammar_rule/GrammarRuleTable";
import { GrammarRuleForm } from "@/components/page/grammar_rule/GrammarRuleForm";
import { GRAMMAR_TYPES } from "@/lib/types/types";
import type { GrammarRule, GrammarRuleFormData } from "@/lib/types/types";

export default function GrammarRulePage() {
  const {
    items,
    total,
    totalPages,
    page,
    pageSize,
    grammarIdFilter,
    typeFilter,
    loading,
    error,
    setPage,
    setGrammarIdFilter,
    setTypeFilter,
    createItem,
    updateItem,
    deleteItem,
  } = useGrammarRule();

  const { toast } = useToast();

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GrammarRule | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (rule: GrammarRule) => {
    setEditing(rule);
    setFormOpen(true);
  };

  const handleSubmit = async (data: GrammarRuleFormData) => {
    if (editing) {
      await updateItem(editing.id, data);
      toast(`"${data.grammar_id}" updated successfully.`, "success");
    } else {
      await createItem(data);
      toast(`"${data.grammar_id}" added successfully.`, "success");
    }
  };

  const handleDelete = async (rule: GrammarRule) => {
    try {
      await deleteItem(rule.id);
      toast(`"${rule.grammar_id}" deleted.`, "info");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed.", "error");
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar
        title="Grammar Rules"
        subtitle={`${total.toLocaleString()} entries`}
        actions={
          <button
            id="grammar-rule-add-btn"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 transition-colors shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Add Grammar Rule
          </button>
        }
      />

      <main className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <label htmlFor="grammar-rule-id-filter" className="text-sm font-medium text-slate-600 shrink-0">
            Grammar ID:
          </label>
          <input
            id="grammar-rule-id-filter"
            value={grammarIdFilter}
            onChange={(e) => setGrammarIdFilter(e.target.value)}
            placeholder="H1-2-1"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
          />

          <label htmlFor="grammar-rule-type-filter" className="text-sm font-medium text-slate-600 shrink-0">
            Type:
          </label>
          <select
            id="grammar-rule-type-filter"
            value={typeFilter ?? ""}
            onChange={(e) => setTypeFilter(e.target.value === "" ? undefined : Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
          >
            <option value="">All Types</option>
            {GRAMMAR_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Table */}
        <GrammarRuleTable
          items={items}
          total={total}
          totalPages={totalPages}
          page={page}
          pageSize={pageSize}
          loading={loading}
          onPageChange={setPage}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </main>

      {/* Form modal */}
      <GrammarRuleForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
