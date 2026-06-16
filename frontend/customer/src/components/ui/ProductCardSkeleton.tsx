export default function ProductCardSkeleton() {
  return (
    <div className="group/card bg-white flex flex-col rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative h-full min-h-[290px]">
      {/* Top Image Section Skeleton */}
      <div className="relative h-[135px] w-full bg-gray-100 flex items-center justify-center p-3 animate-pulse">
        {/* Placeholder for Product Image */}
        <div className="w-22 h-22 bg-gray-200 rounded-lg"></div>
      </div>

      {/* Bottom Content Section Skeleton */}
      <div className="p-3 flex flex-col flex-1 bg-white">
        {/* Badge Skeleton */}
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>

        {/* Title Skeleton */}
        <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-1.5"></div>
        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>

        <div className="mt-auto">
          {/* Ratings Skeleton */}
          <div className="flex items-center gap-1 mb-2">
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Price & Add Button Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-10 bg-gray-100 rounded animate-pulse"></div>
            </div>
            <div className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
