import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';

export default function UserProfile() {
  const { user, signOut, updateProfile } = useAuth();
  const { currentPlan, subscription } = useSubscription();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.user_metadata?.first_name || '',
    last_name: user?.user_metadata?.last_name || ''
  });

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleSignOut = async () => {
    const confirmed = window.confirm('Are you sure you want to sign out?');
    if (confirmed) {
      await signOut();
    }
  };

  if (!user) return null;

  const proExpiresAt = user.app_metadata?.proExpiresAt;
  const isPro = subscription.planId === 'teacher_pro_annual';

  return (
    <div style={{
      position: 'absolute',
      top: '60px',
      right: '20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      padding: '24px',
      minWidth: '300px',
      zIndex: 1000
    }}>
      <div style={{
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '16px',
        marginBottom: '16px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#1e293b',
          marginBottom: '8px'
        }}>
          Account Settings
        </h3>
        <p style={{
          fontSize: '14px',
          color: '#64748b'
        }}>
          {user.email}
        </p>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: isPro ? '#eff6ff' : '#f8fafc',
        border: `1px solid ${isPro ? '#bfdbfe' : '#e2e8f0'}`,
        borderRadius: '8px',
        padding: '12px 14px',
        marginBottom: '16px'
      }}>
        <div>
          <p style={{
            fontSize: '13px',
            fontWeight: '600',
            color: isPro ? '#1d4ed8' : '#1e293b',
            marginBottom: '2px'
          }}>
            {currentPlan.name}
          </p>
          {proExpiresAt && (
            <p style={{ fontSize: '12px', color: '#64748b' }}>
              Until {new Date(proExpiresAt).toLocaleDateString()}
            </p>
          )}
        </div>
        {!isPro && (
          <Link
            to="/pricing"
            style={{
              fontSize: '13px',
              fontWeight: '500',
              color: '#3b82f6',
              textDecoration: 'none'
            }}
          >
            Upgrade
          </Link>
        )}
      </div>

      {isEditing ? (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              First Name
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Last Name
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSave}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          <p style={{
            fontSize: '16px',
            fontWeight: '500',
            color: '#1e293b',
            marginBottom: '4px'
          }}>
            {user.user_metadata?.first_name || user.user_metadata?.last_name
              ? `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim()
              : 'Teacher Account'
            }
          </p>
          <button
            onClick={() => setIsEditing(true)}
            style={{
              fontSize: '14px',
              color: '#3b82f6',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Edit Profile
          </button>
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <Link
          to="/pricing"
          style={{
            fontSize: '14px',
            color: '#3b82f6',
            textDecoration: 'underline'
          }}
        >
          Have a promo code?
        </Link>
      </div>

      <div style={{
        borderTop: '1px solid #e2e8f0',
        paddingTop: '16px'
      }}>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
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
          Sign Out
        </button>
      </div>
    </div>
  );
}
