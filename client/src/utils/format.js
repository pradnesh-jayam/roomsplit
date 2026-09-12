export function formatCurrency(amount) {
  return `₹${Math.abs(amount).toFixed(2)}`;
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const CATEGORY_EMOJIS = {
  food: '🍕',
  utilities: '💡',
  household: '🏠',
  transport: '🚗',
  entertainment: '🎮',
  general: '📦'
};

export function getCategoryEmoji(category) {
  return CATEGORY_EMOJIS[category] || CATEGORY_EMOJIS.general;
}
