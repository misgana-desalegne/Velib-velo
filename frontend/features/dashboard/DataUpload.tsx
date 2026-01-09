import { useState } from 'react';
import { Card } from '../../shared/ui/card';
import { Button } from '../../shared/ui/button';
import { Upload, File, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Progress } from '../../shared/ui/progress';

const uploadHistory = [
  { id: 1, filename: 'customer_data_2024.csv', size: '2.3 MB', status: 'completed', time: '5 mins ago' },
  { id: 2, filename: 'sales_records.xlsx', size: '4.1 MB', status: 'completed', time: '1 hour ago' },
  { id: 3, filename: 'product_inventory.json', size: '890 KB', status: 'processing', time: '2 hours ago' },
  { id: 4, filename: 'analytics_export.csv', size: '1.5 MB', status: 'failed', time: '3 hours ago' },
];

export function DataUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    // Mock upload simulation
    simulateUpload();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateUpload();
    }
  };

  const simulateUpload = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'processing':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl text-gray-900 mb-2">Upload Data</h2>
        <p className="text-gray-600">Import datasets for analysis and processing</p>
      </div>

      {/* Upload Area */}
      <Card className="p-8 mb-8">
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl text-gray-900 mb-2">Drag and drop your files here</h3>
          <p className="text-gray-600 mb-4">or</p>
          <label>
            <Button variant="default">
              Browse Files
            </Button>
            <input
              type="file"
              className="hidden"
              multiple
              accept=".csv,.xlsx,.json,.txt"
              onChange={handleFileInput}
            />
          </label>
          <p className="text-sm text-gray-500 mt-4">
            Supported formats: CSV, Excel, JSON, TXT (Max 50MB)
          </p>
        </div>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}
      </Card>

      {/* Upload Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-lg text-gray-900 mb-4">File Processing</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-sm text-gray-700">Auto-detect headers</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-sm text-gray-700">Clean missing values</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm text-gray-700">Normalize data</span>
            </label>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg text-gray-900 mb-4">Data Validation</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-sm text-gray-700">Check data types</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-sm text-gray-700">Detect duplicates</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm text-gray-700">Validate schema</span>
            </label>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg text-gray-900 mb-4">Storage Options</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input type="radio" name="storage" defaultChecked />
              <span className="text-sm text-gray-700">PostgreSQL</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="storage" />
              <span className="text-sm text-gray-700">MongoDB</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="storage" />
              <span className="text-sm text-gray-700">File System</span>
            </label>
          </div>
        </Card>
      </div>

      {/* Upload History */}
      <Card className="p-6">
        <h3 className="text-lg text-gray-900 mb-4">Upload History</h3>
        <div className="space-y-4">
          {uploadHistory.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0"
            >
              <File className="w-8 h-8 text-gray-400" />
              <div className="flex-1">
                <p className="text-gray-900">{item.filename}</p>
                <p className="text-sm text-gray-600">{item.size}</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(item.status)}
                <span className={`text-sm capitalize ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
              </div>
              <span className="text-sm text-gray-500">{item.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
