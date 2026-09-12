import { Link } from 'react-router-dom';
import { enterDemoMode } from '../utils/demo.js';

export default function Landing() {
  function handleTryDemo() {
    enterDemoMode();
    window.location.href = '/room/demo_room_1';
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-primary">RoomSplit</h1>
        </div>
      </nav>

      <main className="px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Split expenses with your roommates.<br />
            <span className="text-primary">Settle with one tap.</span>
          </h2>
          <p className="text-text-muted text-lg mb-8 max-w-xl mx-auto">
            Track who paid what, who owes whom, and settle all debts with the minimum number of transactions possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
            <button
              onClick={handleTryDemo}
              className="px-6 py-3 bg-card text-text-primary rounded-lg font-medium hover:bg-card/80 transition-colors border border-card"
            >
              Try Demo
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-20 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">🧮</div>
            <h3 className="text-xl font-semibold mb-2">Smart Splitting</h3>
            <p className="text-text-muted">Equal or custom splits — you decide how to divide expenses fairly.</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Minimum Settlements</h3>
            <p className="text-text-muted">Our algorithm calculates the minimum number of transactions to settle all debts.</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">UPI Pay</h3>
            <p className="text-text-muted">One-tap UPI deep links — opens GPay, PhonePe, or Paytm directly.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
