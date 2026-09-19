import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { CheckCircle2, AlertCircle, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setSuccess(false);
      setMessage('Invalid or missing verification token.');
      return;
    }

    authAPI.verifyEmail({ token, email })
      .then((res) => {
        setSuccess(true);
        setMessage(res.data?.message || 'Email verified successfully!');
        toast.success('Email verified successfully!');
      })
      .catch((err) => {
        setSuccess(false);
        setMessage(err.response?.data?.error || err.message || 'Verification failed');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, email]);

  const handleResend = async () => {
    if (!email) {
      toast.error('Email address is missing. Please log in to resend verification.');
      return;
    }
    setResending(true);
    try {
      const res = await authAPI.resendVerification(email);
      toast.success(res.data?.message || 'Verification link sent!');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to resend link');
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <LoadingSpinner />
        <p className="text-sm font-bold text-slate-600 mt-4">Verifying your email address...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 p-8 shadow-xl text-center space-y-6 animate-fade-in">
        
        {success ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-green-50 text-green-600 border border-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Email Verified!</h2>
            <p className="text-sm text-slate-500 leading-relaxed">{message}</p>

            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={() => navigate('/landlord/login')}
                className="w-full py-3.5 bg-green-700 hover:bg-green-800 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2"
              >
                Log In as Landlord <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/tenant/login')}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2"
              >
                Log In as Tenant <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Verification Failed</h2>
            <p className="text-sm text-slate-500 leading-relaxed">{message}</p>

            <div className="pt-4 space-y-3">
              {email && (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                  {resending ? 'Sending Link...' : 'Resend Verification Link'}
                </button>
              )}
              <Link
                to="/"
                className="block text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider pt-2"
              >
                Return to Home
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default VerifyEmail;
