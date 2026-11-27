import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button, Input, Spinner } from '../components/ui';
import AuthLayout from '../components/AuthLayout';

export default function Login() {
  const { authUser, logIn, signUp, resendConfirmation, requestPasswordReset } = useApp();
  // Account creation comes first unless the link explicitly asks to log in.
  const [searchParams] = useSearchParams();
  const requestedMode = searchParams.get('mode');
  const [mode, setMode] = useState(requestedMode === 'login' ? 'login' : 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  // Set after a signup that still needs the email confirmed.
  const [pendingEmail, setPendingEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    if (requestedMode === 'login' || requestedMode === 'signup') setMode(requestedMode);
  }, [requestedMode]);

  if (authUser) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);

    if (mode === 'forgot') {
      const res = await requestPasswordReset(email.trim());
      setBusy(false);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setNotice(
        'If that address has an account, a reset link is on its way. Check your inbox and spam folder.',
      );
      return;
    }

    const res =
      mode === 'login'
        ? await logIn(email, password)
        : await signUp(email, password);
    setBusy(false);

    if (!res.ok) {
      setError(res.message);
      if (res.needsConfirmation) setPendingEmail(email.trim());
      return;
    }
    if (res.needsConfirmation) {
      setPendingEmail(email.trim());
      return;
    }
    navigate('/', { replace: true });
  };

  const resend = async () => {
    setError('');
    setNotice('');
    setBusy(true);
    const res = await resendConfirmation(pendingEmail);
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setCooldown(60);
    setNotice('New confirmation email sent.');
  };

  return (
    <AuthLayout>
        {pendingEmail ? (
          <div className="app-card mt-8 grid gap-4 rounded-2xl p-5 sm:p-7">
            <MailCheck className="w-8 h-8 text-champagne" aria-hidden="true" />
            <h1 className="font-display text-xl text-ink">Confirm your email</h1>
            <p className="text-sm text-slate">
              We sent a confirmation link to <span className="text-ink">{pendingEmail}</span>. Open
              it to activate the account — until then the app will not let you in.
            </p>
            <p className="text-xs text-mist">
              Nothing arrived? Check spam, or send it again. Confirmation emails are limited to a
              couple per hour.
            </p>

            {error && (
              <p role="alert" className="text-sm text-bordeaux">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="text-sm text-sage">
                {notice}
              </p>
            )}

            <Button type="button" onClick={resend} disabled={busy || cooldown > 0}>
              {busy ? (
                <Spinner label="Sending…" />
              ) : cooldown > 0 ? (
                `Resend in ${cooldown}s`
              ) : (
                'Resend confirmation email'
              )}
            </Button>

            <button
              type="button"
              onClick={() => {
                setPendingEmail('');
                setMode('login');
                setPassword('');
                setError('');
                setNotice('');
              }}
              className="text-xs text-slate hover:text-ink underline underline-offset-4 justify-self-center"
            >
              I confirmed it — log in
            </button>
            <button
              type="button"
              onClick={() => {
                setPendingEmail('');
                setError('');
                setNotice('');
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate hover:text-ink underline underline-offset-4 justify-self-center"
            >
              <ArrowLeft className="w-3 h-3" aria-hidden="true" />
              Use a different email
            </button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="app-card mt-8 grid gap-4 rounded-2xl p-5 sm:p-7"
          >
            <h1 className="font-display text-2xl tracking-tight text-ink sm:text-[28px]">
              {mode === 'signup'
                ? 'Create your account'
                : mode === 'forgot'
                  ? 'Reset your password'
                  : 'Welcome back'}
            </h1>
            <p className="text-[15px] leading-6 text-slate">
              {mode === 'signup'
                ? 'One account per email. You can only enter after you confirm the address.'
                : mode === 'forgot'
                  ? 'Enter the email you signed up with and we will send a reset link to it.'
                  : 'Log in with a confirmed account.'}
            </p>

            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {mode !== 'forgot' && (
              <Input
                label="Password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            )}
            {mode === 'signup' && (
              <p className="text-xs text-mist -mt-2">At least 6 characters.</p>
            )}
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setPassword('');
                  setError('');
                  setNotice('');
                }}
                className="text-xs text-slate hover:text-ink underline underline-offset-4 justify-self-start -mt-2"
              >
                Forgot password?
              </button>
            )}

            {error && (
              <p role="alert" className="text-sm text-bordeaux">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="text-sm text-sage">
                {notice}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? (
                <Spinner label="Working…" />
              ) : mode === 'login' ? (
                'Log in'
              ) : mode === 'signup' ? (
                'Create account'
              ) : (
                'Send reset link'
              )}
            </Button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signup' ? 'login' : mode === 'forgot' ? 'login' : 'signup');
                setError('');
                setNotice('');
              }}
              className="text-xs text-slate hover:text-ink underline underline-offset-4 justify-self-center"
            >
              {mode === 'signup'
                ? 'Already have an account? Log in'
                : mode === 'forgot'
                  ? 'Back to log in'
                  : 'Need an account? Create one'}
            </button>
          </form>
        )}
    </AuthLayout>
  );
}
