// src/components/cellComments/CommentForm.tsx
// Form for adding comments or replies

import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface CommentFormProps {
    onSubmit: (text: string, isRejection: boolean) => Promise<void>;
    canAddRejection: boolean;
    isReply?: boolean;
    placeholder?: string;
}

export const CommentForm: React.FC<CommentFormProps> = ({
    onSubmit,
    canAddRejection,
    isReply = false,
    placeholder = 'Add a comment...'
}) => {
    const [text, setText] = useState('');
    const [isRejection, setIsRejection] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(text.trim(), isRejection && canAddRejection);
            setText('');
            setIsRejection(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder}
                className="min-h-[80px] text-sm resize-none"
                disabled={isSubmitting}
            />

            <div className="flex items-center justify-between">
                {canAddRejection && !isReply && (
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="rejection-comment"
                            checked={isRejection}
                            onCheckedChange={setIsRejection}
                        />
                        <Label
                            htmlFor="rejection-comment"
                            className="text-xs font-medium text-red-600 cursor-pointer"
                        >
                            Rejection Comment
                        </Label>
                    </div>
                )}

                <Button
                    type="submit"
                    size="sm"
                    disabled={!text.trim() || isSubmitting}
                    className={isRejection ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                    <Send className="w-3 h-3 mr-1" />
                    {isSubmitting ? 'Sending...' : isReply ? 'Reply' : 'Add Comment'}
                </Button>
            </div>
        </form>
    );
};

export default CommentForm;
