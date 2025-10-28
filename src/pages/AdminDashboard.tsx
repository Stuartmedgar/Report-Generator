import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ApprovalRequest {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  created_at: string;
  approved: boolean;
  role: string;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.app_metadata?.roles?.includes('admin') || false;

  useEffect(() => {
    // Redirect if not admin
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/');
      return;
    }

    if (user && isAdmin) {
      loadApprovalRequests();
    }
  }, [user, isAdmin, authLoading, navigate]);

  const loadApprovalRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all users who are not approved yet
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setRequests(data || []);
    } catch (err: any) {
      console.error('Error loading approval requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!user) {
      alert('You must be logged in to approve users');
      return;
    }

    try {
      // Update user to approved status
      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_approved: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Reload the requests
      await loadApprovalRequests();
      alert('User approved successfully!');
    } catch (err: any) {
      console.error('Error approving user:', err);
      alert('Error approving user: ' + err.message);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!user) {
      alert('You must be logged in to reject users');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this user? This will delete their account.')) {
      return;
    }

    try {
      // Delete the user from the users table
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', requestId);

      if (deleteError) throw deleteError;

      // Reload the requests
      await loadApprovalRequests();
      alert('User rejected and removed successfully!');
    } catch (err: any) {
      console.error('Error rejecting user:', err);
      alert('Error rejecting user: ' + err.message);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#64748b'
      }}>
        Loading...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null; // Will redirect via useEffect
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                Admin Dashboard
              </h1>
              <p style={{
                fontSize: '16px',
                color: '#64748b'
              }}>
                Manage user approval requests
              </p>
            </div>
            <Link
              to="/"
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <p style={{
              color: '#dc2626',
              fontSize: '14px',
              margin: 0
            }}>
              {error}
            </p>
          </div>
        )}

        {/* Approval Requests */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '24px'
          }}>
            Pending Approval Requests ({requests.length})
          </h2>

          {requests.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 20px'
            }}>
              <p style={{
                fontSize: '18px',
                color: '#64748b',
                marginBottom: '8px'
              }}>
                No pending requests
              </p>
              <p style={{
                fontSize: '14px',
                color: '#94a3b8'
              }}>
                All users have been approved or rejected
              </p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {requests.map((request) => (
                <div
                  key={request.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '8px'
                    }}>
                      {request.full_name || `${request.first_name} ${request.last_name}`}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#64748b',
                      marginBottom: '4px'
                    }}>
                      {request.email}
                    </p>
                    <p style={{
                      fontSize: '12px',
                      color: '#94a3b8'
                    }}>
                      Requested: {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '12px'
                  }}>
                    <button
                      onClick={() => handleApprove(request.id)}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#059669';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#10b981';
                      }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#dc2626';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ef4444';
                      }}
                    >
                      × Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}