import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  RefreshCcw,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  clearAuth,
  selectLicense,
  selectUser,
  setLicense,
} from '@/features/auth/redux/authSlice';
import { useLogoutMutation } from '@/features/auth/api';
import { hasDesktopLicenseAccess } from '@/features/auth/utils';

const benefits = [
  'Unlimited access to bundle creation and document organization.',
  'Keep using export, cover pages, annotations, and redactions.',
  'Your local work stays intact while billing is updated on the server.',
];

const formatExpiry = (value?: string): string | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(date);
};

const PaywallPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const license = useAppSelector(selectLicense);
  const [logout] = useLogoutMutation();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const desktopApi = window.api?.isDesktop ? window.api : null;
  const isDesktop = !!desktopApi;

  const headline = useMemo(() => {
    if (license?.status === 'cancelled') {
      return 'Your subscription is no longer active';
    }

    if (license?.status === 'none') {
      return 'Choose a plan to unlock the app';
    }

    return 'Your access has expired';
  }, [license?.status]);

  const detail = useMemo(() => {
    const expiresOn = formatExpiry(license?.expiresAt);

    if (license?.status === 'cancelled') {
      return expiresOn
        ? `Your previous plan ended on ${expiresOn}. Upgrade to continue using Case Builder.`
        : 'Upgrade to continue using Case Builder.';
    }

    if (license?.status === 'none') {
      return 'Your account is signed in, but there is no active license attached yet.';
    }

    return expiresOn
      ? `Your trial or subscription ended on ${expiresOn}. Upgrade to restore full access.`
      : 'Your trial or subscription is no longer active. Upgrade to restore full access.';
  }, [license?.expiresAt, license?.status]);

  const handleRefresh = async () => {
    if (!isDesktop) {
      return;
    }

    setActionError(null);
    setActionNotice(null);
    setIsRefreshing(true);

    try {
      const nextLicense = await desktopApi.checkLicense();
      dispatch(setLicense(nextLicense));

      if (hasDesktopLicenseAccess(nextLicense)) {
        navigate('/dashboard', { replace: true });
        return;
      }

      setActionNotice(
        'We checked your account, but there is still no active paid license yet.'
      );
    } catch {
      setActionError('Unable to refresh your license right now.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpgrade = async () => {
    if (!isDesktop) {
      setActionError('Checkout is only available in the desktop app.');
      return;
    }

    setActionError(null);
    setActionNotice(null);
    setIsOpeningCheckout(true);

    try {
      const result = await desktopApi.openCheckout();
      if (!result.success) {
        setActionError(result.error ?? 'Unable to open checkout.');
        return;
      }

      setActionNotice(
        'Checkout opened in your browser. After payment, come back here and click Refresh access.'
      );
    } finally {
      setIsOpeningCheckout(false);
    }
  };

  const handleSignOut = async () => {
    setActionError(null);
    setActionNotice(null);
    setIsSigningOut(true);

    try {
      await logout().unwrap();
    } finally {
      dispatch(clearAuth());
      navigate('/login', { replace: true });
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.16),_transparent_40%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_45%,#f8fafc_100%)] px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-slate-200/80 bg-white/90 shadow-xl shadow-blue-100/40 backdrop-blur">
            <CardHeader className="gap-4 border-b border-slate-100 pb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                <LockKeyhole className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950">
                  {headline}
                </CardTitle>
                <CardDescription className="max-w-2xl text-base leading-7 text-slate-600">
                  {detail}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {user && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                  <p className="text-sm font-medium text-slate-500">
                    Signed in as
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {user.name}
                  </p>
                  <p className="text-sm text-slate-600">{user.email}</p>
                </div>
              )}

              {license?.daysLeft !== undefined && license.daysLeft > 0 && (
                <Alert className="border-blue-200 bg-blue-50 text-blue-900">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your current license still shows {license.daysLeft} day
                    {license.daysLeft === 1 ? '' : 's'} remaining. If you just
                    upgraded, click Refresh access to sync the desktop app.
                  </AlertDescription>
                </Alert>
              )}

              {actionError && (
                <Alert variant="destructive">
                  <AlertDescription>{actionError}</AlertDescription>
                </Alert>
              )}

              {actionNotice && (
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{actionNotice}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  What you unlock
                </h2>
                <div className="space-y-3">
                  {benefits.map(item => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                      <p className="text-sm leading-6 text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col items-stretch gap-3 border-t border-slate-100 pt-6 sm:flex-row">
              <Button
                className="h-11 flex-1 gap-2"
                onClick={handleUpgrade}
                disabled={isOpeningCheckout}
              >
                <CreditCard className="h-4 w-4" />
                {isOpeningCheckout ? 'Opening checkout...' : 'Upgrade now'}
                {!isOpeningCheckout && <ArrowRight className="h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                className="h-11 flex-1 gap-2"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCcw className="h-4 w-4" />
                {isRefreshing ? 'Refreshing...' : 'Refresh access'}
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-slate-200/80 bg-slate-950 text-white shadow-xl shadow-slate-300/30">
            <CardHeader className="border-b border-white/10 pb-6">
              <CardTitle className="text-2xl font-semibold">
                Simple billing flow
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-slate-300">
                The desktop app stays local-first. Authentication, trials, and
                paid access are verified against your server when available.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-slate-300">Current state</p>
                <p className="mt-2 text-2xl font-semibold capitalize text-white">
                  {(license?.status ?? 'none').replace('_', ' ')}
                </p>
              </div>

              <div className="space-y-3 text-sm leading-6 text-slate-300">
                <p>1. Upgrade opens Stripe checkout in your default browser.</p>
                <p>2. After payment, your server activates the paid license.</p>
                <p>3. Refresh access here and the app unlocks immediately.</p>
              </div>
            </CardContent>

            <CardFooter className="border-t border-white/10 pt-6">
              <Button
                variant="secondary"
                className="h-11 w-full"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? 'Signing out...' : 'Sign out'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaywallPage;
