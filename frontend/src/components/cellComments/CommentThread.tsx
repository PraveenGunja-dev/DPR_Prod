// src/components/cellComments/CommentThread.tsx
// Displays a single comment with its replies

import React from 'react';
import { format } from 'date-fns';
import { MessageSquare, Reply, Trash2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CommentThread as CommentThreadType } from '@/services/cellCommentsService';

interface CommentThreadProps {
    thread: CommentThreadType;
    currentUserRole: string;
    currentUserId: number;
    onReply: (commentId: string) => void;
    onDelete: (commentId: string) => void;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
    thread,
    currentUserRole,
    currentUserId,
    onReply,
    onDelete
}) => {
    const canReply = currentUserRole === 'supervisor' || currentUserRole === 'Site PM';
    const canDelete = thread.created_by === currentUserId || currentUserRole === 'Super Admin';

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM d, yyyy h:mm a');
        } catch {
            return dateString;
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'Site PM': return 'bg-purple-100 text-purple-700';
            case 'supervisor': return 'bg-blue-100 text-blue-700';
            case 'PMAG': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="border rounded-lg p-3 mb-3 bg-white shadow-sm">
            {/* Main comment */}
            <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="font-medium text-sm">{thread.author_name}</span>
                        <Badge className={`text-xs ${getRoleBadgeColor(thread.role)}`}>
                            {thread.role}
                        </Badge>
                        {thread.comment_type === 'REJECTION' && (
                            <Badge className="text-xs bg-red-100 text-red-700">
                                Rejection
                            </Badge>
                        )}
                    </div>
                    <span className="text-xs text-gray-500">
                        {formatDate(thread.created_at)}
                    </span>
                </div>
                <p className="text-sm text-gray-700 ml-8">{thread.comment_text}</p>

                {/* Actions */}
                <div className="flex gap-2 mt-2 ml-8">
                    {canReply && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => onReply(thread.id)}
                        >
                            <Reply className="w-3 h-3 mr-1" />
                            Reply
                        </Button>
                    )}
                    {canDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-red-600 hover:text-red-700"
                            onClick={() => onDelete(thread.id)}
                        >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                        </Button>
                    )}
                </div>
            </div>

            {/* Replies */}
            {thread.replies && thread.replies.length > 0 && (
                <div className="ml-6 pl-4 border-l-2 border-gray-200 space-y-2 mt-2">
                    {thread.replies.map((reply) => (
                        <div key={reply.id} className="bg-gray-50 rounded p-2">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User className="w-3 h-3 text-gray-500" />
                                </div>
                                <span className="font-medium text-xs">{reply.author_name}</span>
                                <Badge className={`text-[10px] ${getRoleBadgeColor(reply.role)}`}>
                                    {reply.role}
                                </Badge>
                                <span className="text-[10px] text-gray-500 ml-auto">
                                    {formatDate(reply.created_at)}
                                </span>
                            </div>
                            <p className="text-xs text-gray-700 ml-7">{reply.comment_text}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommentThread;
