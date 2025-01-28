import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, History, Info, Video, VideoOff, Upload, X, Clock } from 'lucide-react';

type DetectionResult = {
  id: string;
  timestamp: Date;
  type: 'live' | 'upload';
  objects: string[];
  imageUrl?: string;
};

type Tab = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

function App() {
  const [activeTab, setActiveTab] = useState('live');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [detectionHistory, setDetectionHistory] = useState<DetectionResult[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs: Tab[] = [
    { id: 'live', label: 'Live Detection', icon: <Camera className="w-5 h-5" /> },
    { id: 'upload', label: 'Image Upload', icon: <ImageIcon className="w-5 h-5" /> },
    { id: 'history', label: 'Detection History', icon: <History className="w-5 h-5" /> },
    { id: 'about', label: 'About', icon: <Info className="w-5 h-5" /> }
  ];

  const addToHistory = (type: 'live' | 'upload', objects: string[], imageUrl?: string) => {
    const newDetection: DetectionResult = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      objects,
      imageUrl
    };
    setDetectionHistory(prev => [newDetection, ...prev]);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setIsCameraOn(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Unable to access camera. Please make sure you have granted camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      streamRef.current = null;
      setIsCameraOn(false);
    }
  };

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Simulated detection function - replace with actual AI model integration
  const detectObjects = (type: 'live' | 'upload') => {
    // Simulated detection results
    const mockObjects = ['Person', 'Chair', 'Laptop'];
    addToHistory(type, mockObjects, type === 'upload' ? previewUrl : undefined);
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold py-4 text-white">AI Object Detector</h1>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-indigo-500 text-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'live' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Live Detection</h2>
              <button
                onClick={isCameraOn ? stopCamera : startCamera}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  isCameraOn
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                }`}
              >
                {isCameraOn ? (
                  <>
                    <VideoOff className="w-5 h-5 mr-2" />
                    Stop Camera
                  </>
                ) : (
                  <>
                    <Video className="w-5 h-5 mr-2" />
                    Start Camera
                  </>
                )}
              </button>
            </div>
            
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-inner">
              {!isCameraOn && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <Camera className="w-12 h-12 mb-2" />
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isCameraOn ? 'block' : 'hidden'}`}
              />
            </div>
            
            {isCameraOn && (
              <div className="mt-4">
                <button
                  onClick={() => detectObjects('live')}
                  className="w-full py-2 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                >
                  Detect Objects
                </button>
              </div>
            )}
          </div>
        )}
        {activeTab === 'upload' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Image Upload</h2>
            
            {!selectedImage ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300 hover:border-indigo-400'
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  className="hidden"
                />
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop an image here, or</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Browse Files
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Supports: JPG, PNG, GIF (max 10MB)
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={previewUrl!}
                    alt="Preview"
                    className="max-h-[600px] w-full object-contain rounded-lg shadow-lg"
                  />
                  <button
                    onClick={clearSelectedImage}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedImage.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => detectObjects('upload')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Detect Objects
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'history' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Detection History</h2>
            {detectionHistory.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No detections yet. Try detecting objects from Live Detection or Image Upload!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {detectionHistory.map((detection) => (
                  <div
                    key={detection.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {detection.type === 'live' ? (
                            <Camera className="w-4 h-4 text-indigo-500" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-purple-500" />
                          )}
                          <span className="text-sm font-medium capitalize text-gray-700">
                            {detection.type} Detection
                          </span>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {detection.timestamp.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {detection.imageUrl && (
                      <img
                        src={detection.imageUrl}
                        alt="Detection"
                        className="mt-2 rounded-lg max-h-40 object-cover"
                      />
                    )}
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-gray-700">Detected Objects:</h4>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {detection.objects.map((obj, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {obj}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'about' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">About</h2>
            <p className="text-gray-600">Information about the AI model and application will be displayed here</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;