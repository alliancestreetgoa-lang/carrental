'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: number;
}

export function StarRating({ value, onChange, size = 16 }: StarRatingProps) {
  const interactive = typeof onChange === 'function';

  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        return (
          <span
            key={star}
            role={interactive ? 'button' : undefined}
            aria-label={interactive ? `Rate ${star} star${star > 1 ? 's' : ''}` : undefined}
            tabIndex={interactive ? 0 : undefined}
            onClick={interactive ? () => onChange(star) : undefined}
            onKeyDown={
              interactive
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onChange(star);
                    }
                  }
                : undefined
            }
            className={interactive ? 'cursor-pointer' : undefined}
          >
            <Star
              style={{ width: size, height: size }}
              strokeWidth={1.5}
              className={
                filled
                  ? 'fill-amber-400 text-amber-400 transition-colors'
                  : interactive
                  ? 'text-slate-300 hover:text-amber-300 transition-colors'
                  : 'text-slate-300'
              }
            />
          </span>
        );
      })}
    </span>
  );
}
