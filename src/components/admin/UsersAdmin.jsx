'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/admin/users').then(setUsers).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const toggleAdmin = async (id) => {
    const d = await api.put(`/admin/users/${id}/admin`, {});
    setUsers(prev => prev.map(u => u._id === id ? { ...u, isAdmin: d.isAdmin } : u));
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user permanently? Their orders will remain.')) return;
    await api.delete(`/admin/users/${id}`);
    setUsers(prev => prev.filter(u => u._id !== id));
  };

  return (
    <div>
      <div className="admin-topbar">
        <div className="admin-page-title">Users ({users.length})</div>
      </div>
      <div className="admin-table-wrap">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', opacity: .4 }}>Loading users…</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Auth</th>
                <th>Verified</th>
                <th>Admin</th>
                <th>Addresses</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ fontSize: '.82rem', opacity: .7 }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.googleId ? 'badge-blue' : 'badge-gray'}`}>
                      {u.googleId ? 'Google' : 'Email'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.isVerified ? 'badge-green' : 'badge-yellow'}`}>
                      {u.isVerified ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.isAdmin ? 'badge-purple' : 'badge-gray'}`}>
                      {u.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td style={{ opacity: .5 }}>{u.addresses?.length || 0}</td>
                  <td style={{ opacity: .4, fontSize: '.75rem' }}>{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="act-btn" onClick={() => toggleAdmin(u._id)} title={u.isAdmin ? 'Remove admin' : 'Make admin'}>
                        {u.isAdmin ? 'Demote' : 'Make Admin'}
                      </button>
                      <button className="act-btn danger" onClick={() => deleteUser(u._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan={8} style={{ textAlign: 'center', opacity: .4, padding: 40 }}>No users yet</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
