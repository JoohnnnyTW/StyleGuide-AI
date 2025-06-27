

import React, { useEffect, useState } from 'react';
import { Button, Card, CardContent, Input, Label, Separator, GoogleIcon, StyleGuideLogoIcon } from './Primitives'; 
import { AppleIcon, PhoneIcon, MailIcon } from '../../App';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className={className || "w-5 h-5 sm:w-6 sm:h-6"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);


export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleGoogleLogin = () => console.log("Attempt Google Login");
  const handleAppleLogin = () => console.log("Attempt Apple Login");
  const handlePhoneLogin = () => console.log("Attempt Phone Login with:", phone);
  const handleEmailLogin = () => console.log("Attempt Email Login with:", email);


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <Card
        className="w-full max-w-sm sm:max-w-md rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/80">
          <h2 id="login-modal-title" className="text-lg sm:text-xl font-semibold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <StyleGuideLogoIcon className="w-6 h-6 sm:w-7 sm:h-7" /> 登入或註冊
          </h2>
          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 text-neutral-500 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-100 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label="關閉彈窗"
          >
            <CloseIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
          </button>
        </header>
        
        <CardContent className="py-5 px-4 sm:px-6 space-y-4 sm:space-y-5">
            <div className="space-y-2.5 sm:space-y-3">
                 <Button variant="outline" size="lg" className="w-full rounded-lg text-xs sm:text-sm text-neutral-700 dark:text-neutral-200 py-2.5 sm:py-3 h-auto" onClick={handleGoogleLogin}>
                    <GoogleIcon className="size-4 sm:size-5" /> 使用 Google 帳戶繼續
                 </Button>
                 <Button variant="outline" size="lg" className="w-full rounded-lg text-xs sm:text-sm text-neutral-700 dark:text-neutral-200 py-2.5 sm:py-3 h-auto" onClick={handleAppleLogin}>
                    <AppleIcon className="size-4 sm:size-5" /> 使用 Apple 帳戶繼續
                 </Button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                <Separator className="flex-1" />
                <span className="text-[0.65rem] sm:text-xs text-neutral-500 dark:text-neutral-400">或</span>
                <Separator className="flex-1" />
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleEmailLogin(); }} className="space-y-3 sm:space-y-4">
                <div>
                    <Label htmlFor="email-login" className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mb-1 sm:mb-1.5">使用電子郵件繼續</Label>
                    <div className="flex gap-1.5 sm:gap-2">
                        <Input
                        id="email-login"
                        type="email"
                        placeholder="您的電子郵件"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg h-9 sm:h-10 text-xs sm:text-sm"
                        aria-label="登入用電子郵件"
                        />
                        <Button type="submit" size="lg" className="rounded-lg h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm shrink-0" disabled={!email.includes('@')}>
                            <MailIcon className="size-4 sm:size-5 sm:hidden"/> <span className="hidden sm:inline">傳送連結</span>
                        </Button>
                    </div>
                </div>
            </form>

            <form onSubmit={(e) => { e.preventDefault(); handlePhoneLogin(); }} className="space-y-3 sm:space-y-4">
                 <div>
                    <Label htmlFor="phone-login" className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mb-1 sm:mb-1.5">使用電話號碼繼續</Label>
                    <div className="flex gap-1.5 sm:gap-2">
                        <Input
                        id="phone-login"
                        type="tel"
                        placeholder="輸入電話號碼"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-lg h-9 sm:h-10 text-xs sm:text-sm"
                        aria-label="登入用電話號碼"
                        />
                        <Button type="submit" size="lg" className="rounded-lg h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm shrink-0" disabled={phone.length < 7}>
                             <PhoneIcon className="size-4 sm:size-5 sm:hidden"/> <span className="hidden sm:inline">傳送驗證碼</span>
                        </Button>
                    </div>
                </div>
            </form>


            <p className="text-center text-[0.6rem] sm:text-xs text-neutral-500 dark:text-neutral-400 pt-1 sm:pt-2">
              繼續即表示您同意我們的{" "}
              <a href="#" className="underline hover:text-sky-600 dark:hover:text-sky-400">
                服務條款
              </a>{" "}
              和{" "}
              <a href="#" className="underline hover:text-sky-600 dark:hover:text-sky-400">
                隱私權政策
              </a>
              。
            </p>
        </CardContent>
      </Card>
    </div>
  );
};
