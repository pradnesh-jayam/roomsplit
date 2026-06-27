import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { joinRoom } from '../api/rooms.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Join() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') || '';
  const [inviteCode, setInviteCode] = useState(code);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const showToast = useToast();

  async function handleSubmit(e) {
    e.preventDefault();

    if (!inviteCode) {
      showToast('Please enter an invite code', 'error');
      return;
    }

    if (!user) {
      navigate(`/login?redirect=/join?code=${inviteCode}`);
      return;
    }

    setLoading(true);
    try {
      const room = await joinRoom(inviteCode);
      navigate(`/room/${room.id}`);
      showToast('Joined room successfully!', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-center">Join Room</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-muted mb-1">Invite Code</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full px-4 py-3 bg-card border border-card rounded-lg text-text-primary focus:outline-none focus:border-primary"
              placeholder="Enter invite code"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </form>
        <p className="text-center text-text-muted mt-6">
          Don't have a code?{' '}
          <button onClick={() => navigate('/dashboard')} className="text-primary hover:underline">
            Go to Dashboard
          </button>
        </p>
      </div>
    </div>
  );
}
