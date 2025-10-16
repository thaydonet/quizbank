import React from 'react';

interface SkeletonLoaderProps {
  count?: number;
  type?: 'question' | 'list' | 'card' | 'text';
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  count = 1, 
  type = 'question',
  className = '' 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'question':
        return (
          <div className={`bg-white p-5 rounded-xl border-2 border-gray-200 animate-pulse ${className}`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start gap-4 flex-grow">
                <div className="h-5 w-5 bg-gray-300 rounded"></div>
                <div className="flex-grow">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-6 w-20 bg-gray-300 rounded-full"></div>
            </div>

            {/* Options */}
            <div className="pl-9 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-3 border border-gray-200 rounded-lg">
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                  </div>
                ))}
              </div>
              
              {/* Button */}
              <div className="flex justify-end mt-4">
                <div className="h-8 w-32 bg-gray-300 rounded-lg"></div>
              </div>
            </div>
          </div>
        );

      case 'list':
        return (
          <div className={`space-y-3 ${className}`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="h-4 w-4 bg-gray-300 rounded"></div>
                <div className="flex-1 h-4 bg-gray-300 rounded"></div>
                <div className="h-4 w-16 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        );

      case 'card':
        return (
          <div className={`bg-white p-4 rounded-lg border border-gray-200 animate-pulse ${className}`}>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-3"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          </div>
        );

      case 'text':
        return (
          <div className={`animate-pulse ${className}`}>
            <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

// Specific skeleton components for common use cases
export const QuestionCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <SkeletonLoader count={count} type="question" />
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <SkeletonLoader count={count} type="list" />
);

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <SkeletonLoader count={count} type="card" />
);

export const TextSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <SkeletonLoader count={count} type="text" />
);

// Loading states for specific components
export const DatabaseSidebarSkeleton: React.FC = () => (
  <div className="p-4 space-y-4">
    <div className="animate-pulse">
      <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <div className="h-4 w-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded flex-1"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const StatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-300 rounded w-3/4"></div>
      </div>
    ))}
  </div>
);

export default SkeletonLoader;