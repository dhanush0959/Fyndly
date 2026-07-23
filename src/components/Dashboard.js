'use client';
import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import './styles/Dashboard.css';

function Dashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState({ lostItems: 0, foundItems: 0, totalMatches: 0 });
  const [matches, setMatches] = useState({ ownerMatches: [], finderMatches: [] });
  const [verifyingMatchId, setVerifyingMatchId] = useState(null);
  const [verifyAnswer, setVerifyAnswer] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const loadData = async () => {
      try {
        const [lostRes, foundRes, matchRes] = await Promise.all([
          fetch('/api/items/lost'),
          fetch('/api/items/found'),
          fetch('/api/matches'),
        ]);
        const lostData = await lostRes.json();
        const foundData = await foundRes.json();
        const matchData = await matchRes.json();

        setStats({
          lostItems: lostData.items?.length || 0,
          foundItems: foundData.items?.length || 0,
          totalMatches: (matchData.ownerMatches?.length || 0) + (matchData.finderMatches?.length || 0),
        });

        if (matchData.success) {
          setMatches({
            ownerMatches: matchData.ownerMatches || [],
            finderMatches: matchData.finderMatches || [],
          });
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();
  }, [status]);

  const handleVerifySubmit = async (matchId) => {
    if (!verifyAnswer.trim()) return;
    setVerifyLoading(true);
    setVerifyResult(null);

    try {
      const res = await fetch('/api/matches/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, answer: verifyAnswer }),
      });
      const data = await res.json();
      setVerifyResult(data);

      if (data.verified) {
        // Refresh matches
        const matchRes = await fetch('/api/matches');
        const matchData = await matchRes.json();
        if (matchData.success) {
          setMatches({
            ownerMatches: matchData.ownerMatches || [],
            finderMatches: matchData.finderMatches || [],
          });
        }
      }
    } catch (err) {
      console.error('Verify error:', err);
      setVerifyResult({ success: false, message: 'Verification failed. Please try again.' });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return null;
  }

  const userName = session?.user?.name || 'User';

  return (
    <div className="dashboard-page">
      <nav className="top-navbar">
        <div className="nav-brand">Fyndly</div>
        <div className="nav-links">
          <span className="active">Dashboard</span>
          <span onClick={() => router.push('/chat')}>Messages</span>
          <span onClick={handleLogout} className="logout-btn">Logout</span>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="welcome-section">
          <h1>Welcome back, {userName}! 👋</h1>
          <p className="subtitle">Your AI-powered lost &amp; found dashboard</p>
        </div>

        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">🔍</div>
            <h3>{stats.lostItems}</h3>
            <p>Lost Items Reported</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✨</div>
            <h3>{stats.foundItems}</h3>
            <p>Found Items</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <h3>{stats.totalMatches}</h3>
            <p>AI Matches</p>
          </div>
        </div>

        <div className="action-cards">
          <div className="action-card lost-card" onClick={() => router.push('/report-lost')}>
            <div className="action-icon">📢</div>
            <h2>Report a Lost Item</h2>
            <p>Lost something? Describe it in detail and our AI will search for matches.</p>
            <button className="action-btn lost-btn">Report Lost Item</button>
          </div>

          <div className="action-card found-card" onClick={() => router.push('/report-found')}>
            <div className="action-icon">🎉</div>
            <h2>Report a Found Item</h2>
            <p>Found something? Just upload a photo — AI does the rest!</p>
            <button className="action-btn found-btn">Report Found Item</button>
          </div>

          <div className="action-card gallery-card" onClick={() => router.push('/gallery')}>
            <div className="action-icon">🖼️</div>
            <h2>View Lost Items Gallery</h2>
            <p>Browse all currently reported lost items in the community.</p>
            <button className="action-btn gallery-btn">View Gallery</button>
          </div>
        </div>

        {/* ── Matches Section ── */}
        {(matches.ownerMatches.length > 0 || matches.finderMatches.length > 0) && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ color: '#0F172A', fontSize: '1.25rem', marginBottom: '1rem' }}>
              🎯 Your Matches
            </h3>

            {/* Matches where YOU are the owner (your lost item was found) */}
            {matches.ownerMatches.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ color: '#0D9488', fontSize: '1rem', marginBottom: '0.75rem' }}>
                  Items You Lost That Were Found
                </h4>
                {matches.ownerMatches.map((match) => (
                  <div key={match._id} style={{
                    background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px',
                    padding: '1.25rem', marginBottom: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontWeight: 600, color: '#0F172A' }}>
                          Your lost &ldquo;{match.lostItemId?.item_name}&rdquo; may have been found!
                        </p>
                        <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem' }}>
                          Found at: {match.foundItemId?.location} • Confidence: {match.confidence_score}%
                        </p>
                        <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.25rem' }}>
                          {match.ai_reasoning}
                        </p>
                      </div>
                      <span style={{
                        padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem',
                        fontWeight: 600,
                        background: match.verification_status === 'verified' ? '#DCFCE7' : match.verification_status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                        color: match.verification_status === 'verified' ? '#166534' : match.verification_status === 'rejected' ? '#DC2626' : '#92400E',
                      }}>
                        {match.verification_status === 'verified' ? '✅ Verified' :
                          match.verification_status === 'rejected' ? '❌ Rejected' :
                            match.verification_status === 'challenge_sent' ? '🔐 Verify Ownership' : '⏳ Pending'}
                      </span>
                    </div>

                    {/* Verification Challenge */}
                    {(match.verification_status === 'challenge_sent' || match.verification_status === 'pending') && match.verification_question && (
                      <div style={{
                        marginTop: '1rem', padding: '1rem', background: '#FFFBEB',
                        border: '1px solid #FDE68A', borderRadius: '10px'
                      }}>
                        <p style={{ fontWeight: 600, color: '#92400E', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          🔐 Ownership Verification Challenge
                        </p>
                        <p style={{ fontSize: '0.85rem', color: '#78350F', marginBottom: '0.75rem' }}>
                          {match.verification_question}
                        </p>

                        {verifyingMatchId === match._id ? (
                          <div>
                            <textarea
                              value={verifyAnswer}
                              onChange={(e) => setVerifyAnswer(e.target.value)}
                              placeholder="Type your answer here..."
                              rows={3}
                              style={{
                                width: '100%', padding: '0.75rem', borderRadius: '8px',
                                border: '1px solid #E2E8F0', fontSize: '0.875rem',
                                fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box'
                              }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <button
                                onClick={() => handleVerifySubmit(match._id)}
                                disabled={verifyLoading}
                                style={{
                                  padding: '0.5rem 1rem', background: '#0D9488', color: '#FFF',
                                  border: 'none', borderRadius: '8px', fontWeight: 600,
                                  cursor: verifyLoading ? 'not-allowed' : 'pointer', fontSize: '0.85rem'
                                }}
                              >
                                {verifyLoading ? '🤖 AI is verifying...' : 'Submit Answer'}
                              </button>
                              <button
                                onClick={() => { setVerifyingMatchId(null); setVerifyAnswer(''); setVerifyResult(null); }}
                                style={{
                                  padding: '0.5rem 1rem', background: '#F1F5F9', color: '#475569',
                                  border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem'
                                }}
                              >
                                Cancel
                              </button>
                            </div>

                            {verifyResult && (
                              <div style={{
                                marginTop: '0.75rem', padding: '0.75rem', borderRadius: '8px',
                                background: verifyResult.verified ? '#F0FDF4' : '#FEF2F2',
                                border: `1px solid ${verifyResult.verified ? '#BBF7D0' : '#FECACA'}`,
                                color: verifyResult.verified ? '#166534' : '#DC2626',
                                fontSize: '0.85rem'
                              }}>
                                <strong>{verifyResult.message}</strong>
                                {verifyResult.evaluation && (
                                  <p style={{ marginTop: '0.25rem', fontSize: '0.8rem', opacity: 0.8 }}>
                                    {verifyResult.evaluation}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => { setVerifyingMatchId(match._id); setVerifyAnswer(''); setVerifyResult(null); }}
                            style={{
                              padding: '0.5rem 1rem', background: '#F59E0B', color: '#FFF',
                              border: 'none', borderRadius: '8px', fontWeight: 600,
                              cursor: 'pointer', fontSize: '0.85rem'
                            }}
                          >
                            Answer Challenge
                          </button>
                        )}
                      </div>
                    )}

                    {/* Verified — show finder contact */}
                    {match.verification_status === 'verified' && match.finderId && (
                      <div style={{
                        marginTop: '1rem', padding: '1rem', background: '#F0FDF4',
                        border: '1px solid #BBF7D0', borderRadius: '10px'
                      }}>
                        <p style={{ fontWeight: 600, color: '#166534', fontSize: '0.9rem' }}>
                          ✅ Ownership Verified! Contact the finder:
                        </p>
                        <p style={{ fontSize: '0.85rem', color: '#15803D', marginTop: '0.25rem' }}>
                          {match.finderId.name} — {match.finderId.email}
                        </p>
                        <button
                          onClick={() => router.push('/chat')}
                          style={{
                            marginTop: '0.5rem', padding: '0.5rem 1rem', background: '#0D9488',
                            color: '#FFF', border: 'none', borderRadius: '8px',
                            fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem'
                          }}
                        >
                          💬 Open Chat
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Matches where YOU are the finder (item you found matched someone's lost report) */}
            {matches.finderMatches.length > 0 && (
              <div>
                <h4 style={{ color: '#0D9488', fontSize: '1rem', marginBottom: '0.75rem' }}>
                  Items You Found That Matched a Lost Report
                </h4>
                {matches.finderMatches.map((match) => (
                  <div key={match._id} style={{
                    background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px',
                    padding: '1.25rem', marginBottom: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontWeight: 600, color: '#0F172A' }}>
                          Item you found matched &ldquo;{match.lostItemId?.item_name}&rdquo;
                        </p>
                        <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem' }}>
                          Confidence: {match.confidence_score}%
                        </p>
                      </div>
                      <span style={{
                        padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                        background: match.verification_status === 'verified' ? '#DCFCE7' : '#FEF3C7',
                        color: match.verification_status === 'verified' ? '#166534' : '#92400E',
                      }}>
                        {match.verification_status === 'verified' ? '✅ Owner Verified' : '⏳ Awaiting Owner Verification'}
                      </span>
                    </div>

                    {match.verification_status === 'verified' && match.ownerId && (
                      <div style={{
                        marginTop: '0.75rem', padding: '0.75rem', background: '#F0FDF4',
                        borderRadius: '8px', border: '1px solid #BBF7D0'
                      }}>
                        <p style={{ fontSize: '0.85rem', color: '#15803D' }}>
                          Owner: {match.ownerId.name} — {match.ownerId.email}
                        </p>
                        <button
                          onClick={() => router.push('/chat')}
                          style={{
                            marginTop: '0.5rem', padding: '0.4rem 0.75rem', background: '#0D9488',
                            color: '#FFF', border: 'none', borderRadius: '8px',
                            fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem'
                          }}
                        >
                          💬 Chat
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* How It Works */}
        <div className="info-section">
          <h3>How It Works</h3>
          <div className="steps">
            <div className="step">
              <span className="step-number">1</span>
              <div className="step-content">
                <h4>Upload Photo</h4>
                <p>Finder uploads a photo — AI auto-detects and describes the item</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <div className="step-content">
                <h4>3-Tier Matching</h4>
                <p>DB filter → Tag similarity → Gemini Vision judge narrows thousands to top matches</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <div className="step-content">
                <h4>Verify Ownership</h4>
                <p>AI asks a secret challenge question only the real owner can answer</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">4</span>
              <div className="step-content">
                <h4>Connect & Return</h4>
                <p>Verified owner and finder connect via chat to arrange return</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="dashboard-footer">
        <p>© 2025 Fyndly</p>
        <p>AI-Powered Lost &amp; Found Platform</p>
      </footer>
    </div>
  );
}

export default Dashboard;
