'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { MailWarning, Smartphone, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCustomerStore } from '@/stores/customer.store';

export default function VerifyBanners() {
  const { customer, resendVerification, sendMobileOtp, verifyMobileOtp } = useCustomerStore();

  const [emailSending, setEmailSending] = useState(false);
  const [mobileSending, setMobileSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  if (!customer) return null;

  const emailUnverified = customer.emailVerified === false;
  const mobileUnverified = customer.mobileVerified === false;

  if (!emailUnverified && !mobileUnverified) return null;

  async function handleResendEmail() {
    setEmailSending(true);
    try {
      await resendVerification();
      toast.success('Verification email sent');
    } catch {
      toast.error('Could not send email');
    } finally {
      setEmailSending(false);
    }
  }

  async function handleSendCode() {
    setMobileSending(true);
    try {
      await sendMobileOtp();
      toast.success('Code sent');
      setOtpSent(true);
    } catch {
      toast.error('Could not send code');
    } finally {
      setMobileSending(false);
    }
  }

  async function handleVerifyOtp() {
    setVerifying(true);
    try {
      await verifyMobileOtp(code);
      toast.success('Mobile verified');
    } catch (e) {
      const status = (e as { response?: { status?: number } }).response?.status;
      if (status === 400) {
        toast.error('Incorrect or expired code');
      } else if (status === 429) {
        toast.error('Too many attempts — request a new code');
      } else {
        toast.error('Could not verify');
      }
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="space-y-3 mb-6">
      {emailUnverified && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <MailWarning className="size-5 shrink-0 text-amber-600" />
          <p className="flex-1 text-sm">Verify your email address to secure your account.</p>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer border-amber-300 text-amber-800 hover:bg-amber-100 hover:text-amber-900 bg-transparent shrink-0"
            onClick={handleResendEmail}
            disabled={emailSending}
          >
            {emailSending ? (
              <>
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                Sending…
              </>
            ) : (
              'Resend email'
            )}
          </Button>
        </div>
      )}

      {mobileUnverified && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <Smartphone className="size-5 shrink-0 text-amber-600" />
          <p className="flex-1 text-sm">Verify your mobile number.</p>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {!otpSent ? (
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer border-amber-300 text-amber-800 hover:bg-amber-100 hover:text-amber-900 bg-transparent"
                onClick={handleSendCode}
                disabled={mobileSending}
              >
                {mobileSending ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send code'
                )}
              </Button>
            ) : (
              <>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit code"
                  className="w-32 h-8 text-sm border-amber-300 bg-white focus-visible:ring-amber-400"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer border-amber-300 text-amber-800 hover:bg-amber-100 hover:text-amber-900 bg-transparent"
                  onClick={handleVerifyOtp}
                  disabled={verifying || code.length !== 6}
                >
                  {verifying ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <>
                      <Check className="size-3.5 mr-1" />
                      Verify
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
