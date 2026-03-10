"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type OrganizationSummary = {
  id: number;
  name: string;
  description: string | null;
  userName: string;
  email: string;
  primaryAuditId: number | null;
  stats: {
    myAuditsCount: number;
    totalFormsCount: number;
  };
};

export default function ConsultantOrganizationsPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingOrg, setUpdatingOrg] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editingOrgId, setEditingOrgId] = useState<number | null>(null);
  const [editOrganizationName, setEditOrganizationName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editUserName, setEditUserName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");

  const [organizationName, setOrganizationName] = useState("");
  const [description, setDescription] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/consultant/organizations");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load organizations");
      }

      setOrganizations(data.organizations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/consultant/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName,
          description,
          name: userName,
          email,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to create organization");
      }

      setMessage(
        `Organization created. Credentials: ${data.credentials?.email} (${data.credentials?.role})`
      );

      setOrganizationName("");
      setDescription("");
      setUserName("");
      setEmail("");
      setPassword("");

      await loadOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create organization");
    } finally {
      setSaving(false);
    }
  };

  const startDiagnosis = (org: OrganizationSummary) => {
    const nextUrl = org.primaryAuditId
      ? `/dashboard/consultant/diagnostics?organizationId=${org.id}&organizationName=${encodeURIComponent(org.name)}&auditId=${org.primaryAuditId}`
      : `/dashboard/consultant/diagnostics?organizationId=${org.id}&organizationName=${encodeURIComponent(org.name)}`;
    router.push(nextUrl);
  };

  const handleOpenEdit = (org: OrganizationSummary) => {
    setEditingOrgId(org.id);
    setEditOrganizationName(org.name);
    setEditDescription(org.description || "");
    setEditUserName(org.userName || "");
    setEditEmail(org.email || "");
    setEditPassword("");
    setMessage(null);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingOrgId(null);
    setEditOrganizationName("");
    setEditDescription("");
    setEditUserName("");
    setEditEmail("");
    setEditPassword("");
  };

  const handleSaveEdit = async (orgId: number) => {
    if (!editOrganizationName.trim() || !editUserName.trim() || !editEmail.trim()) {
      setError("Organization name, user name and email are required");
      return;
    }

    if (editPassword && editPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      setUpdatingOrg(true);
      setError(null);
      setMessage(null);

      const res = await fetch("/api/consultant/organizations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          organizationName: editOrganizationName,
          description: editDescription,
          name: editUserName,
          email: editEmail,
          password: editPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update organization");
      }

      setMessage("Organization updated successfully");
      handleCancelEdit();
      await loadOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update organization");
    } finally {
      setUpdatingOrg(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-[#2E6347] mb-2">Organizations</h1>
      <p className="text-gray-600 mb-8">
        Create organizations with their login credentials and manage them from this panel.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="green-interactive rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-4">Create Organization</h2>

          <form onSubmit={handleCreate} className="space-y-4" autoComplete="off">
            <input
              className="w-full border rounded-md px-3 py-2"
              placeholder="Organization name"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              autoComplete="off"
              required
            />
            <input
              className="w-full border rounded-md px-3 py-2"
              placeholder="Organization user name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              autoComplete="off"
              required
            />
            <input
              className="w-full border rounded-md px-3 py-2"
              type="email"
              placeholder="Organization email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              required
            />
            <input
              className="w-full border rounded-md px-3 py-2"
              type="password"
              placeholder="Organization password (min 8 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <textarea
              className="w-full border rounded-md px-3 py-2"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoComplete="off"
              rows={3}
            />

            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-white px-4 py-2 rounded-md disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create Organization"}
            </button>
          </form>

          {message && <p className="mt-4 text-green-700">{message}</p>}
          {error && <p className="mt-4 text-red-600">{error}</p>}
        </section>

        <section className="green-interactive rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-4">My Organizations</h2>

          {loading ? <p>Loading...</p> : null}

          {!loading && organizations.length === 0 ? (
            <p className="text-gray-600">No organizations created yet.</p>
          ) : null}

          <div className="space-y-4">
            {organizations.map((org) => (
              <article
                key={org.id}
                className="green-interactive rounded-xl border border-primary/30 p-4 shadow-sm hover:shadow-md transition"
              >
                <h3 className="font-semibold text-lg">{org.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{org.description || "No description"}</p>
                <p className="text-sm text-gray-600 mt-1">
                  User: {org.userName} | Email: {org.email}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Audits: {org.stats.myAuditsCount} | Saved forms: {org.stats.totalFormsCount}
                </p>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => startDiagnosis(org)}
                    className="bg-[#2E6347] text-white px-3 py-2 rounded-md"
                  >
                    Start Diagnosis
                  </button>
                  <button
                    onClick={() => handleOpenEdit(org)}
                    className="border border-[#2E6347] text-[#2E6347] px-3 py-2 rounded-md"
                  >
                    Edit
                  </button>
                </div>

                {editingOrgId === org.id ? (
                  <div className="mt-4 space-y-3 border-t border-primary/20 pt-4">
                    <input
                      className="w-full border rounded-md px-3 py-2"
                      value={editOrganizationName}
                      onChange={(e) => setEditOrganizationName(e.target.value)}
                      placeholder="Organization name"
                      autoComplete="off"
                    />
                    <textarea
                      className="w-full border rounded-md px-3 py-2"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description"
                      rows={3}
                      autoComplete="off"
                    />
                    <input
                      className="w-full border rounded-md px-3 py-2"
                      value={editUserName}
                      onChange={(e) => setEditUserName(e.target.value)}
                      placeholder="Organization user name"
                      autoComplete="off"
                    />
                    <input
                      className="w-full border rounded-md px-3 py-2"
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Organization email"
                      autoComplete="off"
                    />
                    <input
                      className="w-full border rounded-md px-3 py-2"
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="New password (optional)"
                      autoComplete="new-password"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(org.id)}
                        disabled={updatingOrg}
                        className="bg-primary text-white px-3 py-2 rounded-md disabled:opacity-60"
                      >
                        {updatingOrg ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={updatingOrg}
                        className="border border-gray-400 px-3 py-2 rounded-md disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
