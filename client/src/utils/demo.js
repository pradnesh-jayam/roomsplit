export const DEMO_USER = {
  id: 'demo_user',
  name: 'You (Demo)',
  email: 'demo@roomsplit.app',
  upiId: 'demo@upi',
  isDemo: true
};

export const DEMO_ROOM = {
  id: 'demo_room_1',
  name: '404 Hostel Block B',
  inviteCode: 'DEMO123',
  members: [
    { userId: 'demo_user', name: 'You (Demo)', upiId: 'you@upi' },
    { userId: 'demo_arjun', name: 'Arjun', upiId: 'arjun@okaxis' },
    { userId: 'demo_priya', name: 'Priya', upiId: 'priya@ybl' },
    { userId: 'demo_karan', name: 'Karan', upiId: 'karan@okicici' },
  ]
};

export const DEMO_EXPENSES = [
  {
    id: 'e1', title: 'Groceries', amount: 1240, category: 'food',
    paidById: 'demo_arjun',
    date: new Date(Date.now() - 9 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    paidBy: { id: 'demo_arjun', name: 'Arjun' },
    splits: [
      { userId: 'demo_user', amount: 310, user: { id: 'demo_user', name: 'You (Demo)' } },
      { userId: 'demo_arjun', amount: 310, user: { id: 'demo_arjun', name: 'Arjun' } },
      { userId: 'demo_priya', amount: 310, user: { id: 'demo_priya', name: 'Priya' } },
      { userId: 'demo_karan', amount: 310, user: { id: 'demo_karan', name: 'Karan' } },
    ]
  },
  {
    id: 'e2', title: 'WiFi Bill', amount: 800, category: 'utilities',
    paidById: 'demo_user',
    date: new Date(Date.now() - 7 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    paidBy: { id: 'demo_user', name: 'You (Demo)' },
    splits: [
      { userId: 'demo_user', amount: 200, user: { id: 'demo_user', name: 'You (Demo)' } },
      { userId: 'demo_arjun', amount: 200, user: { id: 'demo_arjun', name: 'Arjun' } },
      { userId: 'demo_priya', amount: 200, user: { id: 'demo_priya', name: 'Priya' } },
      { userId: 'demo_karan', amount: 200, user: { id: 'demo_karan', name: 'Karan' } },
    ]
  },
  {
    id: 'e3', title: 'Swiggy Order', amount: 680, category: 'food',
    paidById: 'demo_priya',
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    paidBy: { id: 'demo_priya', name: 'Priya' },
    splits: [
      { userId: 'demo_user', amount: 170, user: { id: 'demo_user', name: 'You (Demo)' } },
      { userId: 'demo_arjun', amount: 170, user: { id: 'demo_arjun', name: 'Arjun' } },
      { userId: 'demo_priya', amount: 170, user: { id: 'demo_priya', name: 'Priya' } },
      { userId: 'demo_karan', amount: 170, user: { id: 'demo_karan', name: 'Karan' } },
    ]
  },
  {
    id: 'e4', title: 'Room Cleaning', amount: 500, category: 'household',
    paidById: 'demo_karan',
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    paidBy: { id: 'demo_karan', name: 'Karan' },
    splits: [
      { userId: 'demo_user', amount: 125, user: { id: 'demo_user', name: 'You (Demo)' } },
      { userId: 'demo_arjun', amount: 125, user: { id: 'demo_arjun', name: 'Arjun' } },
      { userId: 'demo_priya', amount: 125, user: { id: 'demo_priya', name: 'Priya' } },
      { userId: 'demo_karan', amount: 125, user: { id: 'demo_karan', name: 'Karan' } },
    ]
  },
  {
    id: 'e5', title: 'Electricity Bill', amount: 1600, category: 'utilities',
    paidById: 'demo_user',
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    paidBy: { id: 'demo_user', name: 'You (Demo)' },
    splits: [
      { userId: 'demo_user', amount: 400, user: { id: 'demo_user', name: 'You (Demo)' } },
      { userId: 'demo_arjun', amount: 400, user: { id: 'demo_arjun', name: 'Arjun' } },
      { userId: 'demo_priya', amount: 400, user: { id: 'demo_priya', name: 'Priya' } },
      { userId: 'demo_karan', amount: 400, user: { id: 'demo_karan', name: 'Karan' } },
    ]
  },
];

export const DEMO_PAYMENTS = [
  {
    id: 'p1', senderId: 'demo_arjun', receiverId: 'demo_user',
    amount: 310, note: 'Groceries share',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    sender: { id: 'demo_arjun', name: 'Arjun' },
    receiver: { id: 'demo_user', name: 'You (Demo)' }
  }
];

export function isDemoMode() {
  return sessionStorage.getItem('roomsplit-demo') === 'true';
}

export function enterDemoMode() {
  sessionStorage.setItem('roomsplit-demo', 'true');
}

export function exitDemoMode() {
  sessionStorage.removeItem('roomsplit-demo');
}
