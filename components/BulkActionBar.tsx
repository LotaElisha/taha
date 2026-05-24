import React from 'react';

interface BulkActionBarProps {
    selectedCount: number;
    onExport: () => void;
    onDelete: () => void;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({ selectedCount, onExport, onDelete }) => {
    if (selectedCount === 0) return null;
    return (
        <div className="bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-500 text-blue-800 dark:text-blue-300 p-3 rounded-md mb-4 flex justify-between items-center animate-fade-in">
            <p className="font-semibold">{selectedCount} item(s) selected</p>
            <div className="space-x-3">
                <button onClick={onExport} className="font-semibold text-sm text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100">Export CSV</button>
                <button onClick={onDelete} className="font-semibold text-sm bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors">Delete Selected</button>
            </div>
        </div>
    );
};

export default BulkActionBar;
