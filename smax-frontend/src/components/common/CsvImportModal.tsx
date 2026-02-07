import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Upload, Download, AlertCircle, FileText } from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  templateData: any[];
  templateFilename: string;
  onImport: (data: any[]) => Promise<void>;
  requiredFields: string[];
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  title,
  templateData,
  templateFilename,
  onImport,
  requiredFields
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please upload a valid CSV file.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        
        // Validate required fields
        if (data.length === 0) {
          setError('The CSV file is empty.');
          setParsedData([]);
          return;
        }

        const headers = Object.keys(data[0]);
        const missingFields = requiredFields.filter(field => !headers.includes(field));

        if (missingFields.length > 0) {
          setError(`Missing required columns: ${missingFields.join(', ')}`);
          setParsedData([]);
          return;
        }

        setParsedData(data);
        setError(null);
      },
      error: (err) => {
        setError(`Failed to parse CSV: ${err.message}`);
      }
    });
  };

  const handleImport = async () => {
    if (!parsedData.length) return;
    
    setLoading(true);
    try {
      await onImport(parsedData);
      onClose();
      setFile(null);
      setParsedData([]);
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', templateFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        {/* Step 1: Download Template */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Step 1: Prepare your data
          </h4>
          <p className="text-sm text-blue-800 mb-3">
            Download the sample CSV template to ensure your data is formatted correctly.
          </p>
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Template
          </Button>
        </div>

        {/* Step 2: Upload File */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Step 2: Upload CSV file</h4>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">CSV file only</p>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept=".csv"
                onChange={handleFileChange}
              />
            </label>
          </div>
          {file && (
            <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {file.name} ({parsedData.length} records found)
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 p-3 rounded-md flex items-start gap-2 text-red-700 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || parsedData.length === 0 || loading}>
            {loading ? 'Importing...' : 'Import Data'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
