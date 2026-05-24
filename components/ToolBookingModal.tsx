import React, { useState, useEffect } from 'react';
import { Tool, ToolBooking } from '../types';

interface ToolBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool: Tool;
  onSave: (bookingData: Omit<ToolBooking, 'id' | 'farmerId' | 'status'>) => void;
  allBookings: ToolBooking[];
}

const ToolBookingModal: React.FC<ToolBookingModalProps> = ({ isOpen, onClose, tool, onSave, allBookings }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalCost, setTotalCost] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    // Reset state when modal opens or tool changes
    setStartDate('');
    setEndDate('');
    setTotalCost(0);
    setError('');
  }, [isOpen, tool]);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        setError('End date cannot be before start date.');
        setTotalCost(0);
        return;
      }
      
      // Combine manual blocks and existing bookings to check for availability
      const toolBookings = allBookings.filter(b => b.toolId === tool.id && b.status !== 'Cancelled' && b.status !== 'Rejected');
      const bookedRanges = toolBookings.map(b => ({ start: b.startDate, end: b.endDate }));
      const unavailableRanges = [...(tool.unavailableRanges || []), ...bookedRanges];

      const requestedStart = new Date(startDate);
      requestedStart.setUTCHours(0,0,0,0);
      const requestedEnd = new Date(endDate);
      requestedEnd.setUTCHours(0,0,0,0);

      const isBlocked = unavailableRanges.some(range => {
          const blockedStart = new Date(range.start);
          blockedStart.setUTCHours(0,0,0,0);
          const blockedEnd = new Date(range.end);
          blockedEnd.setUTCHours(0,0,0,0);
          // Check for overlap: (StartA <= EndB) and (EndA >= StartB)
          return requestedStart <= blockedEnd && requestedEnd >= blockedStart;
      });

      if (isBlocked) {
          setError('Some or all of the selected dates are unavailable for this tool.');
          setTotalCost(0);
          return;
      }
      
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive of start day
      
      if (diffDays > 0) {
        setTotalCost(diffDays * tool.dailyRate);
        setError('');
      } else {
        setTotalCost(0);
      }
    } else {
      setTotalCost(0);
    }
  }, [startDate, endDate, tool, allBookings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || error) {
      setError(error || 'Please select valid start and end dates.');
      return;
    }
    onSave({ toolId: tool.id, startDate, endDate, totalCost });
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <header className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-brand-green-dark dark:text-gray-100">Book: {tool.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">by {tool.owner.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white text-3xl">&times;</button>
        </header>
        <form onSubmit={handleSubmit} className="flex-grow p-6 overflow-y-auto">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="input-label">Start Date</label>
                <input type="date" name="startDate" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} required className="input-field" min={new Date().toISOString().split('T')[0]}/>
              </div>
              <div>
                <label htmlFor="endDate" className="input-label">End Date</label>
                <input type="date" name="endDate" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} required className="input-field" min={startDate || new Date().toISOString().split('T')[0]}/>
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="border-t dark:border-gray-700 pt-4 mt-4">
                 <div className="flex justify-between items-center text-lg font-bold">
                  <span className="dark:text-gray-100">Estimated Total:</span>
                  <span className="text-brand-green dark:text-brand-green-light">Tsh {totalCost.toLocaleString()}</span>
                </div>
            </div>
          </div>
          <footer className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3 -m-6 mt-6">
            <button type="button" onClick={onClose} className="btn-secondary-outline">Cancel</button>
            <button type="submit" disabled={!startDate || !endDate || !!error} className="btn-primary disabled:bg-gray-400">Confirm Booking</button>
          </footer>
        </form>
      </div>
       <style>{`
        .input-label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; }
        .dark .input-label { color: #D1D5DB; }
        .input-field { margin-top: 0.25rem; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
        .dark .input-field { background-color: #374151; border-color: #4B5563; color: #F9FAFB; }
        .input-field:focus { outline: none; box-shadow: 0 0 0 2px #556B2F; border-color: #556B2F; }
        .btn-primary { padding: 0.5rem 1.25rem; background-color: #556B2F; color: white; font-weight: bold; border-radius: 0.5rem; transition: background-color 0.2s; }
        .btn-primary:hover { background-color: #2E4628; }
        .btn-secondary-outline { padding: 0.5rem 1.25rem; background-color: white; color: #374151; font-weight: bold; border-radius: 0.5rem; transition: background-color 0.2s; border: 1px solid #D1D5DB; }
        .dark .btn-secondary-outline { background-color: #374151; color: #D1D5DB; border-color: #4B5563; }
        .btn-secondary-outline:hover { background-color: #F3F4F6; }
        .dark .btn-secondary-outline:hover { background-color: #4B5563; }
      `}</style>
    </div>
  );
};

export default ToolBookingModal;