import React, { useState } from 'react';
import { Review } from '../types';
import StarRating from './StarRating';

interface ReviewSectionProps {
  reviews: Review[];
  vendorId: string;
  onAddReview: (reviewData: {
    vendorId: string;
    userName: string;
    rating: number;
    comment: string;
  }) => void;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ reviews, vendorId, onAddReview }) => {
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || rating === 0 || !comment) {
      setError('Please fill out all fields and provide a rating.');
      return;
    }
    setError('');
    onAddReview({ vendorId, userName, rating, comment });
    // Reset form
    setUserName('');
    setRating(0);
    setComment('');
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">Customer Reviews</h2>
      
      {/* Add Review Form */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-bold text-brand-green-dark dark:text-gray-100 mb-4">Leave a Review</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="userName" className="block text-gray-700 dark:text-gray-200 font-semibold mb-2">Your Name</label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green dark:bg-gray-700 dark:text-white"
              placeholder="e.g., John D."
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-2">Your Rating</label>
            <StarRating rating={rating} setRating={setRating} />
          </div>
          <div className="mb-4">
            <label htmlFor="comment" className="block text-gray-700 dark:text-gray-200 font-semibold mb-2">Your Comment</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green dark:bg-gray-700 dark:text-white"
              placeholder="Share your experience with this vendor..."
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button type="submit" className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-2 px-6 rounded-lg transition-colors">
            Submit Review
          </button>
        </form>
      </div>

      {/* Existing Reviews */}
      <div className="space-y-6">
        {reviews.length > 0 ? (
          reviews.map(review => (
            <div key={review.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-brand-green-light">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-gray-800 dark:text-gray-100">{review.userName}</h4>
                <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(review.date).toLocaleDateString()}</span>
              </div>
              <div className="mb-2">
                 <StarRating rating={review.rating} readOnly={true} size="sm" />
              </div>
              <p className="text-gray-600 dark:text-gray-300">{review.comment}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400">This vendor has no reviews yet. Be the first to leave one!</p>
        )}
      </div>
    </div>
  );
};

export default ReviewSection;