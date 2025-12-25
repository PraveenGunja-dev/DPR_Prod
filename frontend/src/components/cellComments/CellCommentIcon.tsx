// src/components/cellComments/CellCommentIcon.tsx
// Comment icon component that appears on cells with comments

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CellCommentIconProps {
    commentCount: number;
    hasRejectionComment: boolean;
    onClick: () => void;
    className?: string;
}

export const CellCommentIcon: React.FC<CellCommentIconProps> = ({
    commentCount,
    hasRejectionComment,
    onClick,
    className
}) => {
    if (commentCount === 0) return null;

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={cn(
                "absolute top-0 right-0 p-0.5 rounded-bl transition-colors",
                hasRejectionComment
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "bg-blue-100 text-blue-600 hover:bg-blue-200",
                className
            )}
            title={`${commentCount} comment${commentCount > 1 ? 's' : ''}`}
        >
            <MessageSquare className="w-3 h-3" />
            {commentCount > 1 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] rounded-full w-3 h-3 flex items-center justify-center">
                    {commentCount > 9 ? '9+' : commentCount}
                </span>
            )}
        </button>
    );
};

export default CellCommentIcon;
