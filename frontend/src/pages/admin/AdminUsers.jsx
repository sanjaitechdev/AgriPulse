import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Users, Search, CheckCircle, XCircle } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

export default function AdminUsers() {
  const qc = useQueryClient();
  const [role, setRole] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['admin-users', role], queryFn: () => api.get(`/admin/users?role=${role}&limit=50`).then((r) => r.data) });

  const { mutate: verify } = useMutation({
    mutationFn: ({ id, action }) => api.put(`/admin/users/${id}/verify`, { action }),
    onSuccess: (_, { action }) => { toast.success(`User ${action}d`); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="fade-in">
      <div className="page-header flex justify-between items-start">
        <div><h1 className="page-title">Users</h1><p className="page-subtitle">Manage farmer, buyer, and admin accounts</p></div>
        <div className="flex gap-2">
          {['', 'farmer', 'buyer', 'admin'].map((r) => (
            <button key={r} onClick={() => setRole(r)} className={`btn btn-sm ${role === r ? 'btn-primary' : 'btn-secondary'}`}>{r || 'All'}</button>
          ))}
        </div>
      </div>
      {isLoading ? <div className="skeleton" style={{ height: 400, borderRadius: 12 }} /> : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Verified</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {data?.data?.map((u) => (
                  <tr key={u._id}>
                    <td className="font-medium">{u.name}</td>
                    <td className="text-sm text-muted">{u.email}</td>
                    <td><span className={`badge ${u.role === 'farmer' ? 'badge-success' : u.role === 'buyer' ? 'badge-primary' : 'badge-warning'}`}>{u.role}</span></td>
                    <td className="text-sm">{u.phone || '—'}</td>
                    <td>{u.isVerified ? <CheckCircle size={15} color="var(--color-success)" /> : <XCircle size={15} color="var(--color-danger)" />}</td>
                    <td className="text-xs text-muted">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div className="flex gap-2">
                        {!u.isVerified && <button className="btn btn-sm btn-primary" onClick={() => verify({ id: u._id, action: 'approve' })}>Approve</button>}
                        {u.isVerified && <button className="btn btn-sm btn-secondary" onClick={() => verify({ id: u._id, action: 'reject' })}>Revoke</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
