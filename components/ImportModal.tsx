import React, { useState } from 'react';

interface ImportResult {
    successCount: number;
    errorCount: number;
    errors: string[];
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string; // e.g., "Products"
  templateHeaders: string[];
  onImport: (data: any[]) => Promise<ImportResult>;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, entityName, templateHeaders, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setIsProcessing(false);
    onClose();
  };

  const downloadTemplate = () => {
    const csvContent = templateHeaders.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${entityName.toLowerCase()}_import_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleProcessImport = async () => {
    if (!file) {
      setError('Please select a file to import.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
            throw new Error('CSV file must contain a header row and at least one data row.');
        }
        const headers = lines[0].split(',').map(h => h.trim());
        
        const missingHeaders = templateHeaders.filter(h => !headers.includes(h) && !h.endsWith(' (optional)'));
        if (missingHeaders.length > 0) {
            throw new Error(`CSV is missing required headers: ${missingHeaders.join(', ')}`);
        }

        const data = lines.slice(1).map(line => {
          // A simple CSV parser; not robust for all cases (e.g., commas in quoted values)
          const values = line.split(',');
          return headers.reduce((obj, header, index) => {
            obj[header.replace(' (optional)', '')] = values[index]?.trim();
            return obj;
          }, {} as { [key: string]: string });
        });

        const importResult = await onImport(data);
        setResult(importResult);
      } catch (err: any) {
        setError(err.message || 'An error occurred during parsing.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
        setError('Failed to read the file.');
        setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <header className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-brand-green-dark dark:text-gray-100">Import {entityName}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white text-3xl">&times;</button>
        </header>
        <div className="p-6 overflow-y-auto">
          {!result ? (
            <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    Upload a CSV file to bulk import or update {entityName.toLowerCase()}. The file must contain the following headers. Fields marked as optional can be omitted.
                </p>
                <code className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded-md block">{templateHeaders.join(', ')}</code>
                <button onClick={downloadTemplate} className="text-sm font-medium text-blue-600 hover:underline">Download Template</button>

                <div className="mt-4">
                    <label htmlFor="csv-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload CSV File</label>
                    <div className="mt-1 flex items-center space-x-2">
                        <input id="csv-upload" type="file" accept=".csv" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-brown-light file:text-brand-green-dark hover:file:bg-brand-brown"/>
                    </div>
                </div>
                {file && <p className="text-sm text-gray-500">Selected file: {file.name}</p>}
                {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          ) : (
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Import Complete</h3>
              <p className="mt-2 text-green-600">{result.successCount} {entityName.toLowerCase()} imported/updated successfully.</p>
              {result.errorCount > 0 && <p className="text-red-500">{result.errorCount} rows had errors.</p>}
              {result.errors.length > 0 && (
                <div className="mt-4 text-left bg-gray-100 dark:bg-gray-700 p-3 rounded-md max-h-48 overflow-y-auto">
                    <h4 className="font-semibold text-sm">Error Details:</h4>
                    <ul className="list-disc list-inside text-xs text-red-600">
                        {result.errors.slice(0, 10).map((err, i) => <li key={i}>{err}</li>)}
                        {result.errors.length > 10 && <li>...and {result.errors.length - 10} more errors.</li>}
                    </ul>
                </div>
              )}
            </div>
          )}
        </div>
        <footer className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3">
          <button type="button" onClick={handleClose} className="btn-secondary-outline">Close</button>
          {!result && (
            <button type="button" onClick={handleProcessImport} disabled={!file || isProcessing} className="btn-primary disabled:bg-gray-400">
              {isProcessing ? 'Processing...' : `Import ${entityName}`}
            </button>
          )}
        </footer>
      </div>
      <style>{`
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

export default ImportModal;
