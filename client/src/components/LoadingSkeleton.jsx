export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-card rounded mb-3 w-3/4"></div>
      <div className="h-4 bg-card rounded mb-3 w-1/2"></div>
      <div className="h-4 bg-card rounded w-5/6"></div>
    </div>
  );
}
