import { ArrowUp, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import {
  cancelCommentCreation,
  cancelHighlight,
} from '@/features/toolbar/redux';
import { useCreateCommentMutation } from '@/features/toolbar/api';
import type { CreateCommentRequest } from '../types/types';
import { normalizeBundleId } from '@/lib/bundleId';
import { useParams } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

type InputCommentProps = {
  variant?: 'toolbar' | 'floating';
};

// ─── Component ────────────────────────────────────────────────────────────────

function InputComment({ variant = 'toolbar' }: Readonly<InputCommentProps>) {
  const [isVisible, setIsVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const justOpenedRef = useRef(false);

  const dispatch = useAppDispatch();
  const [createComment] = useCreateCommentMutation();

  // const bundleId = useAppSelector((state) => state.fileTree.tree.id);
  const { bundleId: routeBundleId } = useParams<{ bundleId: string }>();
  const bundleId = normalizeBundleId(routeBundleId);
  const CommentPosition = useAppSelector((state) => state.toolbar.CommentPosition);
  const pendingComment = useAppSelector((state) => state.toolbar.pendingComment);

  // Show/hide based on pending state
  useEffect(() => {
    const shouldShow =
      variant === 'floating'
        ? CommentPosition?.x !== null && CommentPosition?.y !== null
        : Boolean(pendingComment);

    if (shouldShow) {
      setIsVisible(true);
      justOpenedRef.current = true;

      setTimeout(() => {
        inputRef.current?.focus();
        setTimeout(() => { justOpenedRef.current = false; }, 100);
      }, 0);
    } else {
      setIsVisible(false);
      setCommentText('');
    }
  }, [CommentPosition, pendingComment, variant]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (justOpenedRef.current) return;

      const target = e.target as HTMLElement;

      if (
        target.closest('.comment-input') ||
        target.closest('.annotation-toolbar') ||
        target.closest('.highlight-color-picker')
      ) {
        return;
      }

      dispatch(cancelCommentCreation());
    };

    if (!isVisible) return;

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, dispatch]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentText.trim() || !pendingComment) return;

    const data: CreateCommentRequest = {
      document_id: pendingComment.fileId,
      page_number: pendingComment.pageNumber,
      text: commentText.trim(),
      selected_text: pendingComment.selectedText,
      x: pendingComment.position.x,
      y: pendingComment.position.y,
      page_y: pendingComment.position.pageY,
    };

    await createComment({ bundleId: bundleId ?? '', data });

    window.getSelection()?.removeAllRanges();
    dispatch(cancelCommentCreation());
    dispatch(cancelHighlight());
    setCommentText('');
  };

  const handleCancel = () => {
    dispatch(cancelCommentCreation());
    setCommentText('');
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (!isVisible) return null;

  if (variant === 'floating') {
    if (!CommentPosition || CommentPosition.x === null || CommentPosition.y === null) {
      return null;
    }

    return (
      <div
        className="comment-input absolute z-50 w-80 rounded-lg border border-gray-200 bg-white shadow-xl"
        style={{ right: `${-350}px`, top: `${CommentPosition.y}px` }}
      >
        <form className="relative flex items-start gap-2 p-3" onSubmit={handleSubmit}>
          <textarea
            className="min-h-[40px] flex-1 resize-none overflow-hidden rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            ref={inputRef}
            value={commentText}
          />
          <div className="flex flex-col gap-2">
            <Button
              className="h-6 w-6 rounded-full"
              disabled={!commentText.trim()}
              size="icon"
              title="Submit comment"
              type="submit"
            >
              <ArrowUp size={16} />
            </Button>
            <Button
              className="h-6 w-6 rounded-full"
              onClick={handleCancel}
              size="icon"
              title="Cancel"
              type="button"
              variant="outline"
            >
              <X size={16} />
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="comment-input w-full border-gray-200 border-t bg-white px-4 py-3">
      <form className="flex items-start gap-2" onSubmit={handleSubmit}>
        <textarea
          className="min-h-[40px] flex-1 resize-none overflow-hidden rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment..."
          ref={inputRef}
          value={commentText}
        />
        <div className="flex flex-col gap-2">
          <Button
            className="h-6 w-6 rounded-full"
            disabled={!commentText.trim()}
            size="icon"
            title="Submit comment"
            type="submit"
          >
            <ArrowUp size={16} />
          </Button>
          <Button
            className="h-6 w-6 rounded-full"
            onClick={handleCancel}
            size="icon"
            title="Cancel"
            type="button"
            variant="outline"
          >
            <X size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
}

export default InputComment;