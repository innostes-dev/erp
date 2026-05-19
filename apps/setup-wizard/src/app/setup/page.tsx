'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Building2, 
  UserCircle2, 
  Rocket, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe
} from 'lucide-react';

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: ShieldCheck },
  { id: 'organization', title: 'Organization', icon: Building2 },
  { id: 'admin', title: 'Administrator', icon: UserCircle2 },
  { id: 'finish', title: 'Finish', icon: Rocket }
];

export default function SetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/v1/auth/setup-status');
      const data = await res.json();
      if (data.isInitialized) {
        window.location.href = `${process.env.NEXT_PUBLIC_SHELL_URL || 'http://localhost:3000'}/auth`;
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to check setup status', err);
      setIsLoading(false);
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    tenantId: 'system-tenant',
    tenantName: '',
    tenantSlug: '',
    branchName: 'Main Headquarters',
    adminEmail: '',
    adminPassword: '',
    adminFirstName: '',
    adminLastName: '',
  });

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Auto-generate slug from name if empty
      ...(field === 'tenantName' && !prev.tenantSlug ? { tenantSlug: value.toLowerCase().replace(/\s+/g, '-') } : {})
    }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setCurrentStep(3); // Go to finish step
      } else {
        setError(data.message || 'Initialization failed. Please check your inputs.');
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="setup-step-content animate-fade-in">
            <div className="setup-welcome-badge">v1.0.0-beta</div>
            <h2 className="setup-step-title">Welcome to Innostes OS</h2>
            <p className="setup-step-desc">
              Your enterprise operating system is ready for its initial configuration. 
              We'll help you set up your organization and primary administrator account in just a few minutes.
            </p>
            <div className="setup-feature-grid">
              <div className="setup-feature-item">
                <div className="feature-icon-box"><ShieldCheck size={20} /></div>
                <div>
                  <h4>Secure by Default</h4>
                  <p>Military-grade encryption for all PII data.</p>
                </div>
              </div>
              <div className="setup-feature-item">
                <div className="feature-icon-box"><Globe size={20} /></div>
                <div>
                  <h4>Multi-Tenant</h4>
                  <p>Isolation and data residency built into the core.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 1: // Organization
        return (
          <div className="setup-step-content animate-fade-in">
            <h2 className="setup-step-title">Configure Organization</h2>
            <p className="setup-step-desc">Tell us about your company or workspace.</p>
            
            <div className="setup-form-grid">
              <div className="form-group">
                <label>Organization Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Acme Corp" 
                  className="setup-input"
                  value={formData.tenantName}
                  onChange={(e) => updateFormData('tenantName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Workspace Slug</label>
                <div className="slug-input-wrapper">
                  <span className="slug-prefix">innostes.io/</span>
                  <input 
                    type="text" 
                    placeholder="acme-corp" 
                    className="setup-input slug-input"
                    value={formData.tenantSlug}
                    onChange={(e) => updateFormData('tenantSlug', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Primary Branch (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Main Headquarters" 
                  className="setup-input"
                  value={formData.branchName}
                  onChange={(e) => updateFormData('branchName', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 2: // Admin
        return (
          <div className="setup-step-content animate-fade-in">
            <h2 className="setup-step-title">Primary Administrator</h2>
            <p className="setup-step-desc">Create the first account with full system access.</p>
            
            <div className="setup-form-grid">
              <div className="name-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input 
                    type="text" 
                    placeholder="John" 
                    className="setup-input"
                    value={formData.adminFirstName}
                    onChange={(e) => updateFormData('adminFirstName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input 
                    type="text" 
                    placeholder="Doe" 
                    className="setup-input"
                    value={formData.adminLastName}
                    onChange={(e) => updateFormData('adminLastName', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Work Email</label>
                <input 
                  type="email" 
                  placeholder="admin@company.com" 
                  className="setup-input"
                  value={formData.adminEmail}
                  onChange={(e) => updateFormData('adminEmail', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Secure Password</label>
                <input 
                  type="password" 
                  placeholder="Minimum 12 characters" 
                  className="setup-input"
                  value={formData.adminPassword}
                  onChange={(e) => updateFormData('adminPassword', e.target.value)}
                />
                <p className="input-hint">Use a combination of uppercase, lowercase, and symbols.</p>
              </div>
            </div>
            {error && (
              <div className="setup-error-box">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}
          </div>
        );

      case 3: // Finish
        return (
          <div className="setup-step-content animate-fade-in text-center">
            <div className="success-lottie-placeholder">
              <CheckCircle2 size={80} className="text-emerald-500 mx-auto" />
            </div>
            <h2 className="setup-step-title">All Systems Go!</h2>
            <p className="setup-step-desc">
              Your enterprise environment has been initialized. You are now the Super Admin of <strong>{formData.tenantName}</strong>.
            </p>
            <div className="setup-summary-card">
              <div className="summary-item">
                <span className="label">Primary Email</span>
                <span className="value">{formData.adminEmail}</span>
              </div>
              <div className="summary-item">
                <span className="label">Tenant ID</span>
                <span className="value">{formData.tenantId}</span>
              </div>
            </div>
            <button 
              className="setup-finish-btn"
              onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_SHELL_URL || 'http://localhost:3000'}/auth`}
            >
              Launch Dashboard <Rocket size={18} className="ml-2" />
            </button>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="setup-loading-layout">
        <div className="setup-loading-card">
          <div className="setup-loading-spinner-container">
            <div className="setup-loading-glow"></div>
            <div className="setup-loading-spinner"></div>
            <div className="setup-loading-logo">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              </svg>
            </div>
          </div>
          <h3 className="setup-loading-title">Innostes Business OS</h3>
          <p className="setup-loading-text">Verifying system initialization state...</p>
        </div>

        <style jsx global>{`
          .setup-loading-layout {
            min-height: 100vh;
            background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', system-ui, sans-serif;
            color: #ffffff;
          }

          .setup-loading-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 24px;
            padding: 40px;
            border-radius: 24px;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            animation: pulse-card 3s ease-in-out infinite;
          }

          .setup-loading-spinner-container {
            position: relative;
            width: 100px;
            height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .setup-loading-glow {
            position: absolute;
            width: 80px;
            height: 80px;
            background: radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, transparent 70%);
            filter: blur(8px);
            animation: pulse-glow 2s ease-in-out infinite alternate;
          }

          .setup-loading-spinner {
            position: absolute;
            width: 90px;
            height: 90px;
            border-radius: 50%;
            border: 3px solid transparent;
            border-top-color: #38bdf8;
            border-left-color: #38bdf8;
            animation: spin-loader 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          }

          .setup-loading-logo {
            position: absolute;
            color: #38bdf8;
            animation: rotate-logo 6s linear infinite;
          }

          .setup-loading-title {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.02em;
            background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0;
          }

          .setup-loading-text {
            font-size: 14px;
            color: #94a3b8;
            margin: 0;
            letter-spacing: 0.05em;
            animation: fade-text 2s ease-in-out infinite alternate;
          }

          @keyframes pulse-card {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }

          @keyframes pulse-glow {
            0% { transform: scale(0.8); opacity: 0.5; }
            100% { transform: scale(1.2); opacity: 1; }
          }

          @keyframes rotate-logo {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes fade-text {
            0% { opacity: 0.5; }
            100% { opacity: 1; }
          }

          @keyframes spin-loader {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="setup-layout">
      <div className="setup-container">
        {/* Progress Sidebar */}
        <div className="setup-sidebar">
          <div className="setup-sidebar-header">
            <div className="setup-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              </svg>
              <span>Setup Wizard</span>
            </div>
          </div>
          
          <div className="setup-stepper">
            {STEPS.map((step, idx) => (
              <div key={step.id} className={`step-item ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}>
                <div className="step-icon">
                  {idx < currentStep ? <CheckCircle2 size={16} /> : <step.icon size={16} />}
                </div>
                <span className="step-title">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="setup-main">
          <div className="setup-card">
            <div className="setup-card-inner">
              {renderStepContent()}
            </div>

            {currentStep < 3 && (
              <div className="setup-actions">
                {currentStep > 0 && (
                  <button className="setup-btn-ghost" onClick={handleBack} disabled={isSubmitting}>
                    <ArrowLeft size={18} className="mr-2" /> Back
                  </button>
                )}
                
                <div className="flex-grow"></div>

                {currentStep === 2 ? (
                  <button 
                    className="setup-btn-primary" 
                    onClick={handleSubmit}
                    disabled={isSubmitting || !formData.adminEmail || !formData.adminPassword}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                    Complete Setup <CheckCircle2 size={18} className="ml-2" />
                  </button>
                ) : (
                  <button className="setup-btn-primary" onClick={handleNext}>
                    Continue <ArrowRight size={18} className="ml-2" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .setup-layout {
          min-height: 100vh;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .setup-container {
          width: 1000px;
          height: 640px;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
          display: flex;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.8);
        }

        .setup-sidebar {
          width: 280px;
          background: #0f172a;
          color: white;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          gap: 60px;
        }

        .setup-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 700;
          font-size: 18px;
          color: #38bdf8;
        }

        .setup-stepper {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .step-item {
          display: flex;
          align-items: center;
          gap: 16px;
          opacity: 0.4;
          transition: all 0.3s ease;
        }

        .step-item.active {
          opacity: 1;
        }

        .step-item.completed {
          opacity: 0.7;
          color: #10b981;
        }

        .step-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .step-item.active .step-icon {
          background: #38bdf8;
          color: #0f172a;
          box-shadow: 0 0 15px rgba(56, 189, 248, 0.4);
        }

        .step-item.completed .step-icon {
          background: #10b981;
          color: white;
        }

        .step-title {
          font-size: 14px;
          font-weight: 600;
        }

        .setup-main {
          flex: 1;
          padding: 60px;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          position: relative;
        }

        .setup-card {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .setup-card-inner {
          flex: 1;
        }

        .setup-step-title {
          font-size: 28px;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }

        .setup-step-desc {
          font-size: 16px;
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 40px;
        }

        .setup-welcome-badge {
          display: inline-block;
          padding: 4px 12px;
          background: #e0f2fe;
          color: #0369a1;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .setup-feature-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-top: 20px;
        }

        .setup-feature-item {
          display: flex;
          gap: 16px;
        }

        .feature-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0369a1;
          flex-shrink: 0;
        }

        .setup-feature-item h4 {
          margin: 0 0 4px 0;
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
        }

        .setup-feature-item p {
          margin: 0;
          font-size: 13px;
          color: #94a3b8;
        }

        .setup-form-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
        }

        .setup-input {
          height: 48px;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          padding: 0 16px;
          font-size: 15px;
          outline: none;
          transition: all 0.2s ease;
        }

        .setup-input:focus {
          border-color: #38bdf8;
          box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.1);
        }

        .slug-input-wrapper {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
        }

        .slug-prefix {
          padding-left: 16px;
          font-size: 14px;
          color: #94a3b8;
          font-weight: 500;
        }

        .slug-input {
          flex: 1;
          border: none !important;
          background: transparent !important;
          padding-left: 4px;
        }

        .name-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .setup-actions {
          padding-top: 40px;
          display: flex;
          align-items: center;
          border-top: 1px solid #f1f5f9;
        }

        .setup-btn-primary {
          height: 48px;
          padding: 0 28px;
          background: #0f172a;
          color: white;
          border-radius: 14px;
          border: none;
          font-weight: 700;
          font-size: 15px;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .setup-btn-primary:hover:not(:disabled) {
          background: #1e293b;
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .setup-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .setup-btn-ghost {
          background: transparent;
          border: none;
          color: #64748b;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .setup-error-box {
          margin-top: 24px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .setup-summary-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          margin: 30px 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .summary-item .label {
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
        }

        .summary-item .value {
          font-size: 14px;
          color: #1e293b;
          font-weight: 700;
        }

        .setup-finish-btn {
          width: 100%;
          height: 56px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 18px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .setup-finish-btn:hover {
          background: #059669;
          transform: scale(1.02);
          box-shadow: 0 20px 25px -5px rgba(16, 185, 129, 0.2);
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
