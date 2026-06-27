export function generateUPILink({ upiId, name, amount, note }) {
  if (!upiId) return null;
  const params = new URLSearchParams({
    pa: upiId,
    pn: name,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: note || 'RoomSplit settlement'
  });
  return `upi://pay?${params.toString()}`;
}
