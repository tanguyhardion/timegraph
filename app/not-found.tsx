import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dial-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full fluted-bezel p-1 mb-4">
        <div className="w-full h-full rounded-full bg-dial-900 flex items-center justify-center text-gold-400">
          <Compass className="w-8 h-8" />
        </div>
      </div>
      <h2 className="font-display text-2xl font-bold text-white mb-2">Timepiece Lost to Time</h2>
      <p className="font-mono text-xs text-steel-400 max-w-sm mb-6">
        The requested horological record or reference could not be located on this dial.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-full bg-gold-500 hover:bg-gold-400 text-black font-semibold font-mono text-xs shadow-gold"
      >
        Return to Watchmaker Wishlist
      </Link>
    </div>
  );
}
