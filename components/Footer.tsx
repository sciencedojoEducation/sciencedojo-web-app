import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="w-full border-t border-secondary/10 bg-surface py-12">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center flex-col md:flex-row gap-8">
          <div className="flex items-center gap-6">
            <Logo className="text-lg" dotClassName="w-1.5 h-1.5" />
            <p className="text-[10px] text-secondary/40 font-black uppercase tracking-[0.2em]">
              &copy; {new Date().getFullYear()} sciencedojo. All rights reserved.
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/terms" className="text-sm text-secondary/60 hover:text-primary transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-secondary/60 hover:text-primary transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
