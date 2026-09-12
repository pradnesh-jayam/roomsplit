import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRooms, createRoom, joinRoom } from '../api/rooms.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatCurrency } from '../utils/format.js';
import { isDemoMode } from '../utils/demo.js';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';

export default function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    setLoading(true);
    try {
      const data = await getRooms();
      setRooms(data);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRoom(e) {
    e.preventDefault();
    if (!newRoomName.trim()) {
      showToast('Room name is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const room = await createRoom(newRoomName);
      setRooms([...rooms, room]);
      setShowCreateModal(false);
      setNewRoomName('');
      navigate(`/room/${room.id}`);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoinRoom(e) {
    e.preventDefault();
    if (!inviteCode.trim()) {
      showToast('Invite code is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const room = await joinRoom(inviteCode);
      setRooms([...rooms, room]);
      setShowJoinModal(false);
      setInviteCode('');
      navigate(`/room/${room.id}`);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="px-4 py-4 border-b border-card">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">RoomSplit</h1>
          <div className="flex items-center gap-4">
            <span className="text-text-muted">{user?.name}</span>
            <button onClick={logout} className="text-text-muted hover:text-text-primary">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Rooms</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-4 py-2 bg-card text-text-primary rounded-lg hover:bg-card/80 transition-colors"
              >
                Join Room
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create Room
              </button>
            </div>
          </div>

          {rooms.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-muted mb-4">No rooms yet. Create one to get started!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create Your First Room
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => (
                <Link
                  key={room.id}
                  to={`/room/${room.id}`}
                  className="block p-4 bg-card rounded-lg hover:bg-card/80 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{room.name}</h3>
                      <p className="text-text-muted text-sm">
                        {room.members?.length || 0} members
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-md bg-surface rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Create New Room</h3>
            <form onSubmit={handleCreateRoom}>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full px-4 py-3 bg-card border border-card rounded-lg text-text-primary focus:outline-none focus:border-primary mb-4"
                placeholder="Room name (e.g., 404 Hostel Block B)"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-card text-text-primary rounded-lg hover:bg-card/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-md bg-surface rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Join Room</h3>
            <form onSubmit={handleJoinRoom}>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full px-4 py-3 bg-card border border-card rounded-lg text-text-primary focus:outline-none focus:border-primary mb-4"
                placeholder="Enter invite code"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 bg-card text-text-primary rounded-lg hover:bg-card/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? 'Joining...' : 'Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
