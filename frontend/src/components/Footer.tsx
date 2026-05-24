import React from 'react';

interface FooterProps {
  onNotify?: (message: string) => void;
}

export default function Footer({ onNotify = () => { } }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (e: React.MouseEvent, page: string) => {
    e.preventDefault();
    onNotify(`Opening ${page} in simulated viewing tab.`);
  };

  return (
    <footer className="mt-auto py-8 w-full border-t border-outline-variant/40 bg-surface flex flex-col items-center gap-4 text-center px-4">
      <div className="flex flex-wrap justify-center gap-6 md:gap-8">
        <a
          href="#"
          onClick={(e) => handleLinkClick(e, 'Terms of Service')}
          className="font-medium text-xs md:text-sm text-on-surface-variant hover:text-primary transition-colors focus:outline-none focus:underline"
        >
          Terms of Service
        </a>
        <a
          href="#"
          onClick={(e) => handleLinkClick(e, 'Privacy Policy')}
          className="font-medium text-xs md:text-sm text-on-surface-variant hover:text-primary transition-colors focus:outline-none focus:underline"
        >
          Privacy Policy
        </a>
        <a
          href="#"
          onClick={(e) => handleLinkClick(e, 'Help Center')}
          className="font-medium text-xs md:text-sm text-on-surface-variant hover:text-primary transition-colors focus:outline-none focus:underline"
        >
          Help Center
        </a>
      </div>
      <p className="font-medium text-xs text-outline/80 mt-1">
        © {currentYear} Case Builder Legal Suite v2.4. All rights reserved.
      </p>
    </footer>
  );
}
