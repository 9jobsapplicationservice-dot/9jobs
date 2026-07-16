'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams } from 'next/navigation';

export default function SignAgreementPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const agreementId = params.id;
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signerContext, setSignerContext] = useState(null);
  
  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Signing States
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [signatureType, setSignatureType] = useState('drawn'); // 'drawn' or 'typed'
  const [signerName, setSignerName] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [submittingSign, setSubmittingSign] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Canvas Ref
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Fetch Initial Token Verification Context
  useEffect(() => {
    if (!agreementId || !token) {
      setTimeout(() => {
        setError('Invalid or expired signing link. Missing required token parameter.');
        setLoading(false);
      }, 0);
      return;
    }

    async function fetchContext() {
      try {
        const res = await fetch(`/api/agreements/${agreementId}/sign?token=${token}`);
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || 'Access denied: Invalid link.');
        } else {
          setSignerContext(data);
          setSignerName(data.signerRole === 'Client' ? data.clientName : data.providerName);
          setIsOtpVerified(data.isOtpVerified);
        }
      } catch (err) {
        setError('Connection failed. Please check your internet connection.');
      } finally {
        setLoading(false);
      }
    }

    fetchContext();
  }, [agreementId, token]);

  // Handle OTP Cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // Canvas Drawing Logic
  useEffect(() => {
    if (!isOtpVerified || signatureType !== 'drawn' || completed || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas resolution for crisp lines
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [isOtpVerified, signatureType, completed]);

  // Touch & Mouse Canvas Draw Handlers
  const startDrawing = (e) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Actions
  const handleRequestOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agreements/${agreementId}/sign`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'request_otp', token })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to request code.');
      } else {
        setOtpSent(true);
        setOtpCooldown(60);
      }
    } catch (err) {
      alert('Failed to connect to verification server.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpVerifying(true);
    const otp = otpCode.join('');
    if (otp.length !== 6) {
      alert('Verification code must be 6 digits.');
      setOtpVerifying(false);
      return;
    }

    try {
      const res = await fetch(`/api/agreements/${agreementId}/sign`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'verify_otp', token, otp })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Invalid code.');
      } else {
        setIsOtpVerified(true);
      }
    } catch (err) {
      alert('Verification connection failed.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleOtpInput = (val, index) => {
    if (isNaN(val)) return;
    const newCode = [...otpCode];
    newCode[index] = val;
    setOtpCode(newCode);

    // Auto-focus next field
    if (val && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleSubmitSignature = async () => {
    if (!consentAccepted) {
      alert('You must accept the electronic signature consent checkbox.');
      return;
    }
    if (!signerName.trim()) {
      alert('Signature name cannot be empty.');
      return;
    }

    setSubmittingSign(true);
    let signatureImage = '';

    if (signatureType === 'drawn') {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      signatureImage = canvas.toDataURL('image/png');
    }

    try {
      const res = await fetch(`/api/agreements/${agreementId}/sign`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_signature',
          token,
          signatureType,
          signatureName: signerName,
          signatureImage,
          consentAccepted
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to submit signature.');
      } else {
        setCompleted(true);
      }
    } catch (err) {
      alert('Connection failed during signature submission.');
    } finally {
      setSubmittingSign(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '15px', color: '#64748b' }}>Securing signing session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>✕</div>
          <h3 style={styles.errorTitle}>Access Denied</h3>
          <p style={styles.errorDescription}>{error}</p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div style={styles.completedContainer}>
        <div style={styles.completedCard}>
          <div style={styles.completedIcon}>✓</div>
          <h3 style={styles.completedTitle}>Agreement Signed!</h3>
          <p style={styles.completedDesc}>
            Thank you, {signerName}. Your signature has been successfully captured and applied to the agreement.
          </p>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            A completed copy of the document has been emailed to your registered mailbox.
          </p>
        </div>
      </div>
    );
  }

  // 1. Render OTP Verification Form
  if (!isOtpVerified) {
    return (
      <div style={styles.otpContainer}>
        <div style={styles.otpCard}>
          <h3 style={styles.otpTitle}>Security Identity Verification</h3>
          <p style={styles.otpDesc}>
            For security compliance, please verify your identity to access the signing portal for this document.
          </p>

          {!otpSent ? (
            <button onClick={handleRequestOtp} style={styles.btnPrimary}>
              Request Verification Code
            </button>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ width: '100%' }}>
              <p style={{ color: '#475569', fontSize: '14px', marginBottom: '15px' }}>
                We sent a 6-digit code to your registered email <strong>{signerContext?.signerEmail}</strong>.
              </p>
              <div style={styles.otpInputRow}>
                {otpCode.map((num, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    maxLength="1"
                    value={num}
                    onChange={(e) => handleOtpInput(e.target.value, i)}
                    onKeyDown={(e) => handleOtpKeyDown(e, i)}
                    style={styles.otpBox}
                    required
                  />
                ))}
              </div>
              <button type="submit" disabled={otpVerifying} style={styles.btnPrimary}>
                {otpVerifying ? 'Verifying Code...' : 'Verify Code & Access'}
              </button>
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={otpCooldown > 0}
                  style={otpCooldown > 0 ? styles.btnDisabled : styles.btnText}
                >
                  {otpCooldown > 0 ? `Resend Code (${otpCooldown}s)` : 'Resend Verification Code'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // 2. Render PDF Viewer & Signature Collection Form
  return (
    <div style={styles.signLayout}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
        * { font-family: 'Outfit', sans-serif; }
      `}</style>
      
      {/* PDF View Panel */}
      <div style={styles.pdfPanel}>
        <iframe
          src={`/api/agreements/${agreementId}/preview-original?token=${token}`}
          style={styles.iframe}
          title="Document Preview"
        />
      </div>

      {/* Signature Panel */}
      <div style={styles.signPanel}>
        <div style={styles.signCard}>
          <span style={styles.badge}>{signerContext?.signerRole} Session</span>
          <h2 style={styles.signTitle}>Review and Sign</h2>
          <p style={styles.signDesc}>
            Please review the document in the preview pane, enter your signature below, and click Submit.
          </p>

          {/* Consent Checkbox */}
          <div style={styles.consentRow}>
            <input
              type="checkbox"
              id="consent-check"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              style={styles.checkbox}
            />
            <label htmlFor="consent-check" style={styles.checkboxLabel}>
              I have reviewed this agreement and agree to use my electronic signature. I understand that clicking Sign and Submit applies my signature to this agreement.
            </label>
          </div>

          {/* Signature Mode Selector */}
          <div style={styles.tabBar}>
            <button
              onClick={() => setSignatureType('drawn')}
              style={signatureType === 'drawn' ? styles.tabActive : styles.tabInactive}
            >
              Draw Signature
            </button>
            <button
              onClick={() => setSignatureType('typed')}
              style={signatureType === 'typed' ? styles.tabActive : styles.tabInactive}
            >
              Type Signature
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={styles.inputLabel}>Full Legal Name</label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              style={styles.inputField}
              placeholder="Enter your name"
              required
            />
          </div>

          {/* Signature Input Container */}
          {signatureType === 'drawn' ? (
            <div style={{ marginBottom: '20px' }}>
              <label style={styles.inputLabel}>Draw Signature on Canvas</label>
              <div style={styles.canvasContainer}>
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  style={styles.canvas}
                />
              </div>
              <button onClick={clearCanvas} style={styles.btnSecondary}>
                Clear Drawing
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: '25px' }}>
              <label style={styles.inputLabel}>Signature Preview</label>
              <div style={styles.typedPreview}>
                {signerName || 'Signature Preview'}
              </div>
            </div>
          )}

          {/* Actions */}
          <button
            onClick={handleSubmitSignature}
            disabled={submittingSign}
            style={submittingSign ? styles.btnDisabled : styles.btnPrimary}
          >
            {submittingSign ? 'Submitting Signature...' : 'Sign and Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Styling Object using Premium Glassmorphism & Sleek Dark Accents
const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#090d16',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(255,255,255,0.1)',
    borderTop: '4px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#090d16',
    padding: '20px',
  },
  errorCard: {
    backgroundColor: 'rgba(30, 27, 46, 0.75)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '450px',
    textAlign: 'center',
    boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)',
  },
  errorIcon: {
    fontSize: '40px',
    color: '#ef4444',
    marginBottom: '20px',
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: '22px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  errorDescription: {
    color: '#94a3b8',
    fontSize: '15px',
    lineHeight: '1.5',
  },
  completedContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#090d16',
    padding: '20px',
  },
  completedCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '500px',
    textAlign: 'center',
    boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)',
  },
  completedIcon: {
    fontSize: '48px',
    color: '#10b981',
    marginBottom: '20px',
  },
  completedTitle: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '15px',
  },
  completedDesc: {
    color: '#e2e8f0',
    fontSize: '16px',
    lineHeight: '1.6',
    marginBottom: '10px',
  },
  otpContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#090d16',
    padding: '20px',
  },
  otpCard: {
    backgroundColor: '#0f172a',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '450px',
    textAlign: 'center',
    boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
  },
  otpTitle: {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  otpDesc: {
    color: '#94a3b8',
    fontSize: '14px',
    lineHeight: '1.5',
    marginBottom: '25px',
  },
  otpInputRow: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '25px 0',
  },
  otpBox: {
    width: '45px',
    height: '50px',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: 'bold',
    textAlign: 'center',
    borderRadius: '8px',
    outline: 'none',
  },
  btnPrimary: {
    width: '100%',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  btnSecondary: {
    backgroundColor: '#1e293b',
    color: '#cbd5e1',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '8px 15px',
    fontSize: '13px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  btnDisabled: {
    width: '100%',
    backgroundColor: '#334155',
    color: '#64748b',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '16px',
    cursor: 'not-allowed',
  },
  btnText: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    fontSize: '14px',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  signLayout: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#090d16',
    overflow: 'hidden',
  },
  pdfPanel: {
    flex: 1,
    height: '100%',
    borderRight: '1px solid #1e293b',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
  signPanel: {
    width: '450px',
    height: '100%',
    overflowY: 'auto',
    backgroundColor: '#0f172a',
    padding: '30px',
  },
  signCard: {
    display: 'flex',
    flexDirection: 'column',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    color: '#3b82f6',
    fontSize: '12px',
    fontWeight: 'bold',
    padding: '4px 12px',
    borderRadius: '20px',
    marginBottom: '15px',
  },
  signTitle: {
    color: '#ffffff',
    fontSize: '22px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
  },
  signDesc: {
    color: '#94a3b8',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0 0 25px 0',
  },
  consentRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '20px',
  },
  checkbox: {
    marginTop: '3px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    color: '#cbd5e1',
    fontSize: '12px',
    lineHeight: '1.5',
    cursor: 'pointer',
  },
  tabBar: {
    display: 'flex',
    gap: '10px',
    borderBottom: '1px solid #1e293b',
    marginBottom: '20px',
  },
  tabActive: {
    background: 'none',
    border: 'none',
    borderBottom: '2.5px solid #3b82f6',
    color: '#3b82f6',
    padding: '10px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  tabInactive: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    padding: '10px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  inputLabel: {
    display: 'block',
    color: '#94a3b8',
    fontSize: '13px',
    marginBottom: '6px',
  },
  inputField: {
    width: '100%',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
  },
  canvasContainer: {
    width: '100%',
    height: '150px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px dashed #334155',
  },
  canvas: {
    width: '100%',
    height: '100%',
    cursor: 'crosshair',
    backgroundColor: '#ffffff',
  },
  typedPreview: {
    width: '100%',
    padding: '20px',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    fontSize: '28px',
    fontStyle: 'italic',
    fontFamily: '"Times New Roman", Times, serif',
    textAlign: 'center',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  }
};
