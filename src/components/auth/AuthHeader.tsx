import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UserProfile from './UserProfile';

export default function AuthHeader() {
  const { user } = useAuth();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);

  if (!user) return null;

  const isHomePage = location.pathname === '/';

  return (
    <header style={{
      backgroundColor: 'white',
      borderBottom: '1px solid #e2e8f0',
      padding: '16px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Logo/Home Link */}
        <Link 
          to="/"
          style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            textDecoration: 'none'
          }}
        >
          Report Generator
        </Link>

        {/* Navigation Links */}
        {!isHomePage && (
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px'
          }}>
            <Link
              to="/write-reports"
              style={{
                color: location.pathname.includes('/write-reports') ? '#3b82f6' : '#64748b',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'color 0.2s'
              }}
            >
              Write Reports
            </Link>
            <Link
              to="/create-template"
              style={{
                color: location.pathname.includes('/create-template') ? '#3b82f6' : '#64748b',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'color 0.2s'
              }}
            >
              Templates
            </Link>
            <Link
              to="/class-management"
              style={{
                color: location.pathname.includes('/class-management') ? '#3b82f6' : '#64748b',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'color 0.2s'
              }}
            >
              Classes
            </Link>
            <Link
              to="/view-reports"
              style={{
                color: location.pathname.includes('/view-reports') ? '#3b82f6' : '#64748b',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'color 0.2s'
              }}
            >
              View Reports
            </Link>
          </nav>
        )}

        {/* User Profile */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {user.user_metadata?.first_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
            </div>
            
            {/* User Info */}
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#1e293b'
              }}>
                {user.user_metadata?.first_name 
                  ? `${user.user_metadata.first_name} ${user.user_metadata?.last_name || ''}`.trim()
                  : 'Teacher'
                }
              </div>
              <div style={{
                fontSize: '12px',
                color: '#64748b'
              }}>
                Full Access
              </div>
            </div>

            {/* Dropdown Arrow */}
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#64748b" 
              strokeWidth="2"
              style={{
                transform: showProfile ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            >
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          </button>

          {showProfile && (
            <>
              {/* Backdrop */}
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999
                }}
                onClick={() => setShowProfile(false)}
              />
              <UserProfile />
            </>
          )}
        </div>
      </div>
    </header>
  );
}