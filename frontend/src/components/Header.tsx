import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Settings, Menu, X, ChevronDown, User, LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onNotify?: (message: string) => void;
}

export default function Header({ onNotify = () => { } }: Readonly<HeaderProps>) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const navItems = ['Documents', 'Cases', 'Templates', 'Archive'];

  const handleNavClick = (e: React.MouseEvent, _item: string) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <nav className="bg-surface border-b border-outline-variant/60 flex justify-between items-center w-full px-4 md:px-8 h-16 max-w-7xl mx-auto sticky top-0 left-0 right-0 z-50">
      {/* Brand logo & Desktop navigation */}
      <div className="flex items-center gap-6">
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); onNotify('Welcome to Case Builder!'); }}
          className="font-sans text-2xl font-black text-primary tracking-tight select-none focus:outline-none"
        >
          Case Builder
        </a>
        <div className="hidden md:flex gap-6 ml-8">
          {navItems.map((item) => (
            <a
              key={item}
              href="#"
              onClick={(e) => handleNavClick(e, item)}
              className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1"
            >
              {item}
            </a>
          ))}
        </div>
      </div>

      {/* Action utilities and User Profile */}
      <div className="flex items-center gap-3">
        {/* Support tool */}
        <button
          onClick={() => onNotify('Help Doc: Quick Tour of Pricing and Plan options is loading...')}
          className="p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Help System"
        >
          <HelpCircle size={20} />
        </button>

        {/* Settings tool */}
        <button
          onClick={() => onNotify('Global System Settings panel is opened.')}
          className="p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Workspace Settings"
        >
          <Settings size={20} />
        </button>

        {/* User profile dropdown trigger */}
        <div className="relative">
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-1 p-0.5 rounded-full hover:bg-surface-container transition-all focus:outline-none focus:ring-2 focus:ring-primary/35"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full border border-primary/20 overflow-hidden active:scale-95 transition-transform flex items-center justify-center bg-surface-container-highest">
              <img
                alt="User Profile"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-i3LLERO84_t7DcGoIK9r4IXGZ00ugk1cTzRgIcf7oXrp1aLs0rWDvIzHbbUQcDKiOuSryAY8SfAykQiU1epsoj092Ux5Uvzv-nxmGw69VauGXAviRGTlmQ4eJpasFUrVbR2kKXnP1RbfzCLgrPKUpNKzxhcITSMF6d0ngogXqBdNQhuADeF2RwdFHVMUDzHwgT67lszGUcuPvMfpSK-lfWfBq-PrGcUfdagPZ9rkY3aTu-c_8EbSBUdXa3q8ZIV1errIGNvKfoTd"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <ChevronDown size={14} className={`text-on-surface-variant transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isProfileDropdownOpen && (
              <>
                {/* Backdrop overlay to close */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsProfileDropdownOpen(false)}
                />

                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg p-1.5 z-[9999]"
                >
                  <div className="px-3 py-2 border-b border-outline-variant/40 mb-1">
                    <p className="text-xs font-semibold text-outline">CURRENT USER</p>
                    <p className="text-sm font-bold text-on-surface truncate">anikdey@gmail.com</p>
                    <p className="text-[11px] text-primary font-medium mt-0.5">Workspace Creator</p>
                  </div>

                  <button
                    onClick={() => { setIsProfileDropdownOpen(false); onNotify('Profile details viewed.'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors text-left focus:outline-none"
                  >
                    <User size={16} />
                    <span>My Account</span>
                  </button>

                  <button
                    onClick={() => { setIsProfileDropdownOpen(false); onNotify('Security and logs are in read-only status in this preview.'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors text-left focus:outline-none"
                  >
                    <Shield size={16} />
                    <span>Security Settings</span>
                  </button>

                  <div className="border-t border-outline-variant/40 my-1" />

                  <button
                    onClick={() => { setIsProfileDropdownOpen(false); onNotify('Standard logout trigger.'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-error hover:bg-error-container/20 rounded-lg transition-colors text-left font-medium focus:outline-none"
                  >
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 md:hidden text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Navigation Menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Expanded mobile navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-16 left-0 right-0 bg-surface border-b border-outline-variant/80 px-6 py-4 flex flex-col gap-3 md:hidden shadow-lg z-40 overflow-hidden"
          >
            {navItems.map((item) => (
              <a
                key={item}
                href="#"
                onClick={(e) => {
                  handleNavClick(e, item);
                  setIsMobileMenuOpen(false);
                }}
                className="text-on-surface-variant hover:text-primary py-2 text-base font-semibold border-b border-outline-variant/20 last:border-0"
              >
                {item}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
