"use client";

import { useState } from "react";
import { ChevronDown, Mail, Power, RotateCcw, ShieldAlert, Wrench } from "lucide-react";
import {
  createInternalLoginAccount,
  deactivateTeamMember,
  disableInternalAccess,
  reactivateTeamMember,
  repairInternalLoginRole,
  resendInternalInvite,
  updateTeamMember,
} from "./actions";

export type InternalTeamMember = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  role: string;
  title: string | null;
  responsibility_area: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profile_role?: string | null;
  auth_role?: string | null;
  has_role_mismatch?: boolean;
};

const teamRoles = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "developer", label: "Developer" },
  { value: "support", label: "Support" },
  { value: "tutor_manager", label: "Tutor manager" },
  { value: "finance", label: "Finance" },
];

const teamStatuses = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function roleLabel(role: string) {
  return teamRoles.find((item) => item.value === role)?.label || role;
}

function loginStatusLabel(member: InternalTeamMember) {
  if (member.status === "inactive") return "Inactive";
  return member.user_id ? "Login enabled" : "No login account";
}

function loginStatusTone(member: InternalTeamMember) {
  if (member.status === "inactive") return "bg-slate-100 text-slate-500";
  return member.user_id ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";
}

function statusTone(status: string) {
  return status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500";
}

function inputClass(extra = "") {
  return `min-h-11 w-full rounded-2xl border border-secondary/10 bg-white px-4 py-3 text-sm font-bold text-secondary outline-none transition-colors placeholder:text-secondary/35 focus:border-primary focus:ring-4 focus:ring-primary/10 ${extra}`;
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-secondary/40">
        {label}
      </span>
      {children}
    </label>
  );
}

function RoleSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <select name="role" defaultValue={defaultValue || "developer"} className={inputClass()}>
      {teamRoles.map((role) => (
        <option key={role.value} value={role.value}>
          {role.label}
        </option>
      ))}
    </select>
  );
}

function StatusSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <select name="status" defaultValue={defaultValue || "active"} className={inputClass()}>
      {teamStatuses.map((status) => (
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      ))}
    </select>
  );
}

function LoginAccountSection({ member }: { member: InternalTeamMember }) {
  if (member.status !== "active") {
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-sm font-black text-slate-700">Inactive member</p>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-400">
          Inactive members cannot receive login accounts or invite emails.
        </p>
      </div>
    );
  }

  const action = member.user_id ? resendInternalInvite : createInternalLoginAccount;
  const buttonLabel = member.user_id ? "Resend invite" : "Create login";

  return (
    <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
      {member.has_role_mismatch && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black text-amber-800">Login role mismatch detected.</p>
              <p className="mt-1 text-xs font-bold leading-5 text-amber-700/75">
                This login is linked as internal, but profile/auth role is not internal.
              </p>
            </div>
            <form action={repairInternalLoginRole}>
              <input type="hidden" name="id" value={member.id} />
              <button
                type="submit"
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-sm transition-colors hover:bg-amber-600 md:w-auto"
              >
                <Wrench className="h-4 w-4" aria-hidden="true" />
                Repair login role
              </button>
            </form>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black text-emerald-900">
            {member.user_id ? "Login enabled" : "Ready to create login"}
          </p>
          <p className="mt-1 text-xs font-bold leading-5 text-emerald-700/70">
            A fresh temporary password is generated on the server and sent by email only.
          </p>
        </div>
        <form action={action}>
          <input type="hidden" name="id" value={member.id} />
          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-sm transition-colors hover:bg-secondary/90 md:w-auto"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            {buttonLabel}
          </button>
        </form>
      </div>
    </div>
  );
}

function DangerZone({ member }: { member: InternalTeamMember }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const canDisable = member.status === "active" && member.role !== "owner" && member.role !== "admin";

  return (
    <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-red-500">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-red-800">Danger zone</p>
          <p className="mt-1 text-xs font-bold leading-5 text-red-700/70">
            These actions change internal access only. Supabase auth users are not permanently deleted.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {member.status === "active" ? (
          <form action={deactivateTeamMember}>
            <input type="hidden" name="id" value={member.id} />
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-red-600 transition-colors hover:bg-red-50"
            >
              <Power className="h-4 w-4" aria-hidden="true" />
              Mark inactive
            </button>
          </form>
        ) : (
          <form action={reactivateTeamMember}>
            <input type="hidden" name="id" value={member.id} />
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 transition-colors hover:bg-emerald-50"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reactivate
            </button>
          </form>
        )}

        <button
          type="button"
          disabled={!canDisable}
          onClick={() => {
            setConfirmOpen((value) => !value);
            setConfirmation("");
          }}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-red-500 px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-sm transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        >
          Disable internal access
        </button>
      </div>

      {confirmOpen && (
        <form action={disableInternalAccess} className="mt-4 rounded-2xl border border-red-200 bg-white p-4">
          <input type="hidden" name="id" value={member.id} />
          <p className="text-sm font-black text-red-800">Disable internal access for {member.name}?</p>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
            This marks the internal team profile inactive. The login account stays in Supabase, but inactive members are rejected by the internal dashboard guard.
          </p>
          <Field label="Type DELETE to confirm" className="mt-4">
            <input
              name="confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="DELETE"
              className={inputClass()}
            />
          </Field>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setConfirmOpen(false);
                setConfirmation("");
              }}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={confirmation !== "DELETE"}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-red-500 px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              Disable access
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function TeamMemberManagementList({ members }: { members: InternalTeamMember[] }) {
  const [openId, setOpenId] = useState<string | null>(members[0]?.id || null);

  if (members.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-secondary/20 bg-slate-50 p-8 text-center">
        <p className="font-black text-secondary">No internal team members yet</p>
        <p className="mt-1 text-sm font-bold text-secondary/45">Add a developer or support collaborator above.</p>
      </div>
    );
  }

  return (
    <section className="space-y-3" aria-label="Internal team member management">
      {members.map((member) => {
        const isOpen = openId === member.id;
        const preview = member.responsibility_area || member.notes || "No responsibility area added yet.";

        return (
          <article
            key={member.id}
            className={`overflow-hidden rounded-[1.5rem] border bg-white shadow-sm transition-colors md:rounded-[2rem] ${
              isOpen ? "border-primary/20" : "border-secondary/10 hover:border-primary/20"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : member.id)}
              aria-expanded={isOpen}
              aria-controls={`team-member-${member.id}`}
              className="w-full p-4 text-left md:p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-words text-lg font-black text-secondary">{member.name}</h2>
                    <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-sky-700">
                      {roleLabel(member.role)}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${statusTone(member.status)}`}>
                      {member.status}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${loginStatusTone(member)}`}>
                      {loginStatusLabel(member)}
                    </span>
                    {member.has_role_mismatch && (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-amber-700">
                        Role mismatch
                      </span>
                    )}
                  </div>
                  <p className="mt-1 break-words text-sm font-bold text-secondary/50">{member.email}</p>
                  <p className="mt-2 text-sm font-black text-secondary">{member.title || "Internal collaborator"}</p>
                  <p className="mt-1 line-clamp-2 max-w-3xl text-xs font-bold leading-5 text-secondary/45">{preview}</p>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-4 lg:justify-end">
                  <div className="text-left lg:text-right">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-secondary/30">Updated</p>
                    <p className="mt-1 text-xs font-black text-secondary/50">{formatDate(member.updated_at)}</p>
                  </div>
                  <span className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-secondary/10 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-secondary">
                    Manage
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                  </span>
                </div>
              </div>
            </button>

            {isOpen && (
              <div id={`team-member-${member.id}`} className="border-t border-secondary/8 bg-slate-50/50 p-4 md:p-5">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="rounded-2xl border border-secondary/10 bg-white p-4 md:p-5">
                    <div className="mb-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary/35">Profile details</p>
                      <h3 className="mt-1 text-lg font-black text-secondary">Edit internal profile</h3>
                    </div>

                    <form action={updateTeamMember} className="grid gap-4 lg:grid-cols-2">
                      <input type="hidden" name="id" value={member.id} />
                      <Field label="Name">
                        <input name="name" required defaultValue={member.name} className={inputClass()} />
                      </Field>
                      <Field label="Email">
                        <input name="email" required type="email" defaultValue={member.email} className={inputClass()} />
                      </Field>
                      <Field label="Role">
                        <RoleSelect defaultValue={member.role} />
                      </Field>
                      <Field label="Status">
                        <StatusSelect defaultValue={member.status} />
                      </Field>
                      <Field label="Title">
                        <input name="title" defaultValue={member.title || ""} className={inputClass()} />
                      </Field>
                      <Field label="Responsibility area">
                        <input name="responsibility_area" defaultValue={member.responsibility_area || ""} className={inputClass()} />
                      </Field>
                      <Field label="Internal notes" className="lg:col-span-2">
                        <textarea name="notes" rows={4} defaultValue={member.notes || ""} className={inputClass("resize-y")} />
                      </Field>
                      <div className="flex flex-col gap-2 lg:col-span-2 sm:flex-row">
                        <button
                          type="submit"
                          className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-secondary px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-secondary/90"
                        >
                          Save changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenId(null)}
                          className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-secondary/10 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-secondary transition-colors hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>

                  <aside className="space-y-4">
                    <LoginAccountSection member={member} />
                    <DangerZone member={member} />
                  </aside>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
