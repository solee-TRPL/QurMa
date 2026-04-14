
import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rect' | 'circle';
    pulse?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
    className = '', 
    variant = 'rect', 
    pulse = true 
}) => {
    const baseClasses = "bg-slate-200";
    const animationClass = pulse ? "animate-pulse" : "";
    
    let shapeClass = "";
    switch (variant) {
        case 'circle': shapeClass = "rounded-full"; break;
        case 'text': shapeClass = "rounded-md h-3 w-full"; break;
        case 'rect': shapeClass = "rounded-xl"; break;
    }

    return (
        <div 
            id="skeleton-loader" 
            className={`${baseClasses} ${shapeClass} ${animationClass} ${className}`}
        />
    );
};

export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-32" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-[400px]" />
                <Skeleton className="h-[400px]" />
            </div>
        </div>
    );
};
