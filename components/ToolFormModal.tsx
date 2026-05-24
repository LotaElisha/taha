import React, { useState, useEffect, useMemo } from 'react';
import { Tool, User, Agrodealer, Agrovet, ToolAvailability, ToolCategory } from '../types';
import { toast } from './ui/sonner';

interface ToolFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tool: Tool) => void;
  toolToEdit?: Tool | null;
  currentUser?: User | null;
}

const Calendar: React.FC<{
    blockedRanges: { start: string; end: string }[];
    setBlockedRanges: (ranges: { start: string; end: string }[]) => void;
}> = ({ blockedRanges, setBlockedRanges }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectionStart, setSelectionStart] = useState<Date | null>(null);

    const isDateInRanges = (date: Date, ranges: { start: string; end: string }[]) => {
        const dateStr = date.toISOString().split('T')[0];
        return ranges.some(range => dateStr >= range.start && dateStr <= range.end);
    };

    const handleDateClick = (day: number) => {
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        
        // Check if clicking on an existing range to remove it
        const rangeToRemove = blockedRanges.find(range => {
            const startDate = new Date(range.start);
            const endDate = new Date(range.end);
            return clickedDate >= startDate && clickedDate <= endDate;
        });

        if (rangeToRemove) {
            toast('Remove this blocked period?', {
                action: {
                    label: 'Remove',
                    onClick: () => setBlockedRanges(blockedRanges.filter(r => r !== rangeToRemove)),
                },
                cancel: { label: 'Keep', onClick: () => {} },
            });
            setSelectionStart(null);
            return;
        }

        if (!selectionStart) {
            setSelectionStart(clickedDate);
        } else {
            const start = selectionStart < clickedDate ? selectionStart : clickedDate;
            const end = selectionStart < clickedDate ? clickedDate : selectionStart;
            
            const newRange = {
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0],
            };
            setBlockedRanges([...blockedRanges, newRange]);
            setSelectionStart(null);
        }
    };
    
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <button type="button" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">&lt;</button>
                <h4 className="font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                <button type="button" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 mt-2">
                {Array(firstDayOfMonth).fill(null).map((_, i) => <div key={`empty-${i}`}></div>)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const isBlocked = isDateInRanges(date, blockedRanges);
                    const isSelectionStart = selectionStart && date.toDateString() === selectionStart.toDateString();
                    
                    return (
                        <button
                            type="button"
                            key={day}
                            onClick={() => handleDateClick(day)}
                            className={`h-8 w-8 rounded-full text-sm transition-colors ${
                                isBlocked ? 'bg-red-500 text-white cursor-pointer' :
                                isSelectionStart ? 'bg-blue-500 text-white' :
                                'hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">Click a date to start a range, click another to end it. Click a blocked range to remove it.</p>
        </div>
    );
};


const ToolFormModal: React.FC<ToolFormModalProps> = ({ isOpen, onClose, onSave, toolToEdit, currentUser }) => {
  const [formData, setFormData] = useState<Partial<Tool>>({
    name: '',
    description: '',
    dailyRate: 0,
    imageUrl: '',
    availability: 'Available',
    category: 'Other',
  });
  const [blockedRanges, setBlockedRanges] = useState<{ start: string; end: string }[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (toolToEdit) {
      setFormData({
        id: toolToEdit.id,
        name: toolToEdit.name,
        description: toolToEdit.description,
        dailyRate: toolToEdit.dailyRate,
        imageUrl: toolToEdit.imageUrl,
        owner: toolToEdit.owner,
        availability: toolToEdit.availability,
        category: toolToEdit.category,
      });
      setBlockedRanges(toolToEdit.unavailableRanges || []);
      setImagePreview(toolToEdit.imageUrl || null);
    } else {
      setFormData({
        name: '',
        description: '',
        dailyRate: 0,
        imageUrl: '',
        owner: currentUser as Agrodealer | Agrovet,
        availability: 'Available',
        category: 'Other',
      });
      setBlockedRanges([]);
      setImagePreview(null);
    }
    setImageFile(null);
  }, [toolToEdit, isOpen, currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.dailyRate || !formData.owner) {
      toast.error('Please fill in all required fields.');
      return;
    }

    let imageUrl = toolToEdit?.imageUrl || '';
    if (imageFile) {
        imageUrl = `https://picsum.photos/seed/${formData.name}-${Date.now()}/400/400`;
    }
    
    // FIX: Added the 'category' property to the toolData object to match the 'Tool' type definition.
    const toolData: Tool = {
      id: toolToEdit?.id || `tool-${Date.now()}`,
      name: formData.name!,
      description: formData.description || '',
      imageUrl: imageUrl,
      dailyRate: Number(formData.dailyRate),
      owner: formData.owner!,
      availability: formData.availability as ToolAvailability || 'Available',
      category: formData.category as ToolCategory || 'Other',
      unavailableRanges: blockedRanges,
    };

    onSave(toolData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <header className="p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-brand-green-dark dark:text-gray-100">
            {toolToEdit ? 'Edit Tool' : 'Add New Tool'}
          </h2>
        </header>
        <form onSubmit={handleSubmit} className="flex-grow p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tool Image</label>
            <div className="mt-1 flex items-center space-x-4">
                <div className="flex-shrink-0 h-24 w-24 rounded-md bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
                    {imagePreview ? (
                        <img src={imagePreview} alt="Tool preview" className="h-full w-full object-cover" />
                    ) : (
                        <svg className="h-12 w-12 text-gray-300 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    )}
                </div>
                <input type="file" id="toolImageUpload" accept="image/png, image/jpeg" onChange={handleImageChange} className="hidden" />
                <label htmlFor="toolImageUpload" className="cursor-pointer bg-white dark:bg-gray-600 py-2 px-3 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green">
                    Change
                </label>
            </div>
          </div>
          <div>
            <label htmlFor="tool-name" className="input-label">Tool Name</label>
            <input type="text" name="name" id="tool-name" value={formData.name} onChange={handleChange} required className="input-field" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dailyRate" className="input-label">Daily Rate (Tsh)</label>
              <input type="number" name="dailyRate" id="dailyRate" value={formData.dailyRate} onChange={handleChange} required min="0" className="input-field" />
            </div>
            <div>
                <label htmlFor="availability" className="input-label">Availability</label>
                <select name="availability" id="availability" value={formData.availability} onChange={handleChange} required className="input-field">
                    <option value="Available">Available</option>
                    <option value="Rented Out">Rented Out</option>
                    <option value="Maintenance">Maintenance</option>
                </select>
            </div>
          </div>
          <div>
            <label htmlFor="category" className="input-label">Tool Category</label>
            <select name="category" id="category" value={formData.category} onChange={handleChange} required className="input-field">
                <option value="Tractor">Tractor</option>
                <option value="Tillage">Tillage</option>
                <option value="Seeding">Seeding</option>
                <option value="Harvester">Harvester</option>
                <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="tool-description" className="input-label">Description</label>
            <textarea name="description" id="tool-description" value={formData.description} onChange={handleChange} rows={3} className="input-field"></textarea>
          </div>
          {toolToEdit && (
            <div>
                <label className="input-label">Manage Availability</label>
                <Calendar blockedRanges={blockedRanges} setBlockedRanges={setBlockedRanges} />
            </div>
          )}
        </form>
        <footer className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="btn-secondary-outline">Cancel</button>
          <button type="submit" onClick={handleSubmit} className="btn-primary">Save Tool</button>
        </footer>
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

export default ToolFormModal;
