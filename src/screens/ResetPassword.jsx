import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, KeyRound, MailCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BootLoader, Button, Input, Spinner } from '../components/ui';
import AuthLayout from '../components/AuthLayout';

function PasswordField({ label, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        label={label}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        required
        minLength={6}
        value={value}
        onChange={onChange}
        className="pr-14"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
        aria-pressed={visible}
        className="absolute right-2 top-[29px] grid h-10 w-10 place-items-center rounded-lg text-mist transition hover:bg-sand/60 hover:text-ink"
      >
        {visible ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

// Landing page for the Supabase recovery link. The link arrives as a PKCE code,
// a token hash, or implicit tokens in the hash — `completePasswordRecovery`
// turns whichever one it is into a session, and that session is what unlocks the
// form below. A link with no session left is genuinely dead.
export default function ResetPassword() {
  const { authUser, loading, completePasswordRecovery, updatePassword } = useApp();
  const [checking, setChecking] = useState(true);
  const [linkError, setLinkError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    if (authUser) {
      setChecking(false);
      return () => {
        active = false;
      };
    }
    (async () => {
      const res = await completePasswordRecovery();
      if (!active) return;
      if (!res.ok) setLinkError(res.message ?? '');
      setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, [authUser, completePasswordRecovery]);

  if (authUser === undefined || (authUser && loading) || checking) return <BootLoader />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Use at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    const res = await updatePassword(password);
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setDone(true);
  };

  return (
    <AuthLayout>
        {!authUser ? (
          <div className="app-card mt-8 grid gap-4 rounded-2xl p-6 sm:p-7">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-terracotta/25 bg-terracotta/10 text-terracotta">
              <MailCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="font-display text-2xl tracking-tight text-ink">This link is not active</h1>
            <p className="text-sm text-slate">
              {linkError ||
                'The reset link is no longer valid. Links work once and expire quickly.'}
            </p>
            <p className="text-xs leading-5 text-mist">
              Return to sign in and choose “Forgot password?” to request another email.
            </p>
            <Link to="/login?mode=login" className="block">
              <Button className="w-full">Back to sign in</Button>
            </Link>
          </div>
        ) : done ? (
          <div className="app-card mt-8 grid gap-4 rounded-2xl p-6 sm:p-7">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-sage/25 bg-sage/10 text-sage">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="font-display text-2xl tracking-tight text-ink">Password updated</h1>
            <p className="text-sm text-slate">
              Use your new password the next time you log in. You are still signed in on this device.
            </p>
            <Button onClick={() => navigate('/', { replace: true })} className="w-full">
              Go to today
            </Button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="app-card mt-8 grid gap-4 rounded-2xl p-6 sm:p-7"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-champagne/20 bg-champagne/10 text-champagne">
                <KeyRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h1 className="font-display text-2xl tracking-tight text-ink sm:text-[28px]">
                  Set a new password
                </h1>
                <p className="mt-1 text-sm leading-5 text-slate">
                  Choose a password you have not used here before.
                </p>
              </div>
            </div>
            <p className="text-sm leading-6 text-slate">
              Updating the password for <span className="text-ink">{authUser.email}</span>.
            </p>

            <PasswordField
              label="New password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <PasswordField
              label="Confirm new password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
            <p className="-mt-2 text-xs text-mist">Use at least 6 characters.</p>

            {error && (
              <p role="alert" className="text-sm text-bordeaux">
                {error}
              </p>
            )}

            <Button type="submit" disabled={busy}>
              {busy ? <Spinner label="Saving…" /> : 'Update password'}
            </Button>

            <Link
              to="/login?mode=login"
              className="text-xs text-slate hover:text-ink underline underline-offset-4 justify-self-center"
            >
              Back to log in
            </Link>
          </form>
        )}
    </AuthLayout>
  );
}
