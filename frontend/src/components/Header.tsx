import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Settings, Menu, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserAccountMenu from '@/components/UserAccountMenu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface HeaderProps {
  onNotify?: (message: string) => void;
}

export default function Header({ onNotify = () => { } }: Readonly<HeaderProps>) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

        <UserAccountMenu sideOffset={10}>
          {({ initials, isOpen, user }) => (
            <button
              className="flex items-center gap-1 rounded-full p-0.5 transition-all hover:bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary/35"
              aria-label="User menu"
            >
              <Avatar className="size-8 border border-primary/20 bg-surface-container-highest">
                <AvatarImage src="" alt={user?.name ?? 'Case Builder user'} />
                <AvatarFallback className="bg-surface-container-highest text-[11px] font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown
                size={14}
                className={`text-on-surface-variant transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </UserAccountMenu>

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
