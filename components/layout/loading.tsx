import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#e5e7eb] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#81dbe0] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-[#2b2731] font-bold text-xl">DR</span>
        </div>
        <Skeleton className="h-4 w-32 mx-auto mb-2" />
        <Skeleton className="h-4 w-24 mx-auto" />
      </div>
    </div>
  );
}