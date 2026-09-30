import React, { useState } from 'react';
import { Users, Plus, ShieldCheck, Mail, Trash2, CheckCircle2, UserCheck } from 'lucide-react';
import { CommercialShell } from './CommercialShell';
import { useApp } from '../context/AppContext';
import { TeamMember } from '../types';

const permissions: Record<string, string> = {
  Owner: 'Full root access including billing, workspace deletion, team management, and API credentials.',
  Admin: 'Manage contacts, campaigns, analytics, integrations, and invite team members.',
  Manager: 'Create and launch campaigns, manage contacts, build automations, and view analytics.',
  Employee: 'Access live inbox, chat with assigned customers, and queue pre-approved templates.',
  Viewer: 'Read-only access to campaign performance metrics and contact analytics.',
};

export const TeamView: React.FC = () => {
  const { team, inviteTeamMember, removeTeamMember } = useApp();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<TeamMember['role']>('Employee');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    try {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (team.some(m => m.email.trim().toLowerCase() === email.trim().toLowerCase())) { setError('This email is already on the team.'); return; }
    await inviteTeamMember(email.trim().toLowerCase(), role, name);
    setNotice(`Invitation request saved for ${email} as ${role}. No email was sent.`);
    setIsInviteOpen(false);
    setEmail('');
    setName('');
    setError('');
    } catch (error) { console.error(error); }
  };

  return (
    <CommercialShell
      title="Team & Role-Based Access"
      subtitle="Manage organization workspace members with granular permission levels."
    >
      {error && <div className="notice errorNotice">{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      <div className="commercialToolbar">
        <div />
        <button
          className="cbtn primary"
          onClick={() => setIsInviteOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={15} /> Invite Team Member
        </button>
      </div>

      {/* Role Definitions */}
      <div className="roleCards">
        {Object.entries(permissions).map(([roleName, desc]) => (
          <article key={roleName} style={{ background: '#ffffff', border: '1px solid #dfe9ed', borderRadius: '14px', padding: '16px' }}>
            <h4 style={{ margin: '0 0 6px', fontSize: '13px', color: '#0f172a' }}>{roleName}</h4>
            <p style={{ margin: 0, fontSize: '10px', color: '#64748b', lineHeight: 1.5 }}>{desc}</p>
          </article>
        ))}
      </div>

      {/* Members Table */}
      <section className="panel" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <h3>Active Workspace Members</h3>
            <p>Team members linked to the Savrdh Technology workspace.</p>
          </div>
          <span style={{ fontSize: '10px', color: '#64748b' }}>{team.length} members total</span>
        </div>

        <div className="responsiveTable">
          <table className="dataTable">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Added Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {team.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: '#e0f2fe',
                          color: '#0284c7',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: '11px',
                          fontWeight: 800,
                        }}
                      >
                        {m.avatar}
                      </div>
                      <div>
                        <b>{m.name || m.email.split('@')[0]}</b>
                        <small className="cellSub">{m.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: m.role === 'Owner' ? '#fef3c7' : m.role === 'Admin' ? '#e0f2fe' : '#f1f5f9',
                        color: m.role === 'Owner' ? '#b45309' : m.role === 'Admin' ? '#0369a1' : '#475569',
                      }}
                    >
                      {m.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className="status"
                      style={{
                        background: m.status === 'active' ? '#dcfce7' : '#fef3c7',
                        color: m.status === 'active' ? '#15803d' : '#b45309',
                      }}
                    >
                      {m.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{new Date(m.created_at).toLocaleDateString()}</td>
                  <td>
                    {m.role !== 'Owner' && (
                      <button
                        className="tableAction dangerText"
                        onClick={() => {
                          if (confirm(`Remove ${m.email} from workspace?`)) removeTeamMember(m.id);
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="modalBackdrop">
          <div className="modalCard" style={{ maxWidth: '520px' }}>
            <div className="modalHead">
              <div>
                <small>INVITE TEAM MEMBER</small>
                <h3>Grant Workspace Access</h3>
              </div>
              <button onClick={() => setIsInviteOpen(false)}>×</button>
            </div>

            <form onSubmit={handleInvite}>
              <div className="formGrid">
                <div className="field full">
                  <label>Full Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>
                <div className="field full">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@savrdh.com"
                  />
                </div>
                <div className="field full">
                  <label>Role & Permissions</label>
                  <select value={role} onChange={(e) => setRole(e.target.value as any)}>
                    <option value="Admin">Admin (Full operations)</option>
                    <option value="Manager">Manager (Campaigns & Contacts)</option>
                    <option value="Employee">Employee (Live Chat & Templates)</option>
                    <option value="Viewer">Viewer (Read-only analytics)</option>
                  </select>
                </div>
              </div>

              <div className="modalActions">
                <button type="button" className="cbtn secondary" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="cbtn primary">
                  Send Workspace Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CommercialShell>
  );
};
