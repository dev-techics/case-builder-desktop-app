import { Receipt, Shield } from 'lucide-react';

export default function TrustSection() {
    return (
        <section className="w-full max-w-4xl mt-24 mb-12 px-4 flex flex-col items-center">
            {/* Trust highlight box */}
            <div className="w-full bg-white rounded-2xl border border-outline-variant/60 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
                <div className="max-w-md text-center md:text-left">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
                        <Shield size={12} />
                        Enterprise-Grade
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-on-surface mb-2">
                        Built for high-trust legal practice
                    </h3>
                    <p className="text-xs md:text-sm text-on-surface-variant font-medium leading-relaxed">
                        We process millions of discovery documents daily with bank-grade safety,
                        secure local sandboxes, and full digital chain of custody receipts.
                    </p>
                </div>

                <div className="flex gap-4 flex-wrap justify-center text-outline/80">
                    <div className="flex flex-col items-center p-3 px-5 bg-surface rounded-xl border border-outline-variant/40 min-w-[120px]">
                        <Receipt size={22} className="text-primary mb-1" />
                        <span className="text-[11px] font-bold text-on-surface">SOC2 Compliant</span>
                    </div>
                    <div className="flex flex-col items-center p-3 px-5 bg-surface rounded-xl border border-outline-variant/40 min-w-[120px]">
                        <Shield size={22} className="text-primary mb-1" />
                        <span className="text-[11px] font-bold text-on-surface">AES-256 Secure</span>
                    </div>
                </div>
            </div>

        </section>
    );
}