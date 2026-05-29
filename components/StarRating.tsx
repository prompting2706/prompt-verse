import React from 'react';
import { StarIcon } from './icons/Icons';

interface StarRatingProps {
    rating: number;
    className?: string;
    interactive?: boolean;
    onRatingChange?: (newRating: number) => void;
    hoverRating?: number;
    onHoverChange?: (hoverRating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ 
    rating, 
    className = "h-5 w-5",
    interactive = false,
    onRatingChange,
    hoverRating,
    onHoverChange
}) => {
    
    const displayRating = (interactive && typeof hoverRating === 'number') ? hoverRating : rating;

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, starValue: number) => {
        if (!interactive || !onHoverChange) return;
        const rect = e.currentTarget.getBoundingClientRect();
        // Determine if the mouse is in the first half of the star
        const isHalf = (e.clientX - rect.left) / rect.width <= 0.5;
        onHoverChange(starValue - (isHalf ? 0.5 : 0));
    };
    
    const handleClick = () => {
        if (!interactive || !onRatingChange || typeof hoverRating !== 'number') return;
        // Allow deselecting by clicking the same rating again, otherwise set new rating
        const newRating = rating === hoverRating ? 0 : hoverRating;
        onRatingChange(newRating);
    };

    const handleMouseLeave = () => {
        if (!interactive || !onHoverChange) return;
        onHoverChange(0);
    };

    return (
        <div 
            className={`flex items-center ${interactive ? 'cursor-pointer' : ''}`} 
            aria-label={`Rating: ${rating} out of 5 stars`}
            onMouseLeave={interactive ? handleMouseLeave : undefined}
        >
            {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                let fillPercentage = 0;
                
                if (starValue <= displayRating) {
                    fillPercentage = 100;
                } else if (starValue > displayRating && starValue - 1 < displayRating) {
                    // This handles the fractional part of the rating for the partially filled star
                    fillPercentage = (displayRating % 1) * 100;
                }

                return (
                    <div 
                        key={index} 
                        className="relative"
                        onMouseMove={interactive ? (e) => handleMouseMove(e, starValue) : undefined}
                        onClick={interactive ? handleClick : undefined}
                        aria-hidden="true" // Hide from screen readers as the parent div has the full label
                    >
                        <StarIcon className={`${className} text-gray-300`} />
                        <div
                            className="absolute top-0 left-0 h-full overflow-hidden"
                            style={{ width: `${fillPercentage}%` }}
                        >
                            <StarIcon className={`${className} text-yellow-400`} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default StarRating;