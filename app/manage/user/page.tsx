"use client";

// app/user/page.tsx
// User management page — list, search, create, edit, delete.

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/components/ui/Toast";
import { TopBar } from "@/components/layout/TopBar";
import { UserTable } from "@/components/user/UserTable";
import { UserForm } from "@/components/user/UserForm";
import type { User, UserFormData } from "@/lib/types";

export default function UserPage() {
  const {
    items,
    total,
    totalPages,
    page,
    pageSize,
    loading,
    error,
    setPage,
    setSearch,
    createItem,
    updateItem,
    deleteItem,
  } = useUser();

  const { toast } = useToast();

  // Debounced search input
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchInput, setSearch]);

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setFormOpen(true);
  };

  const handleSubmit = async (data: UserFormData) => {
    if (editing) {
      await updateItem(editing.id, data);
      toast(`User "${data.username}" updated.`, "success");
    } else {
      await createItem(data);
      toast(`User "${data.username}" created.`, "success");
    }
  };

  const handleDelete = async (user: User) => {
    try {
      await deleteItem(user.id);
      toast(`User "${user.username}" deleted.`, "info");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed.", "error");
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar
        title="Users"
        subtitle={`${total.toLocaleString()} accounts`}
        actions={
          <button
            id="user-add-btn"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 transition-colors shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Add User
          </button>
        }
      />

      <main className="flex-1 p-6 space-y-4">
        {/* Search */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            id="user-search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search username or email…"
            className="w-72 max-w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Table */}
        <UserTable
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
      <UserForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
