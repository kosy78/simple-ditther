import { useState, useCallback, useRef } from 'react';
import { Slider } from './components/Slider';
import { Select } from './components/Select';
import { ColorPalette } from './components/ColorPalette';
import { Tabs } from './components/Tabs';
import { useMediaProcessor } from './hooks/useMediaProcessor';
import { DEFAULT_CHAR_SET, DENSE_CHAR_SET } from './lib/ascii';

function App() {
  // State
  const [activeTab, setActiveTab] = useState('Dither');

  // Dither State
  const [algorithm, setAlgorithm] = useState('Floyd-Steinberg');
  const [pointSize, setPointSize] = useState(6);

  // ASCII State
  const [fontSize, setFontSize] = useState(10);
  const [charSetType, setCharSetType] = useState('default');
  const [inverted, setInverted] = useState(false);

  // Shared State
  const [inkColor, setInkColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [brightness, setBrightness] = useState(1.0);
  const [contrast, setContrast] = useState(1.0);
  const [detail, setDetail] = useState(0.5);

  const [mediaSrc, setMediaSrc] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Media Processor Hook
  const { canvasRef, isProcessing } = useMediaProcessor({
    src: mediaSrc,
    type: mediaType,
    activeTab,
    options: {
      algorithm,
      pointSize,
      inkColor,
      bgColor,
      brightness,
      contrast,
      detail
    },
    asciiOptions: {
      fontSize,
      charSet: charSetType === 'default' ? DEFAULT_CHAR_SET : DENSE_CHAR_SET,
      inverted
    },
    isPlaying
  });

  // Handlers
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      setMediaType(isVideo ? 'video' : 'image');
      setIsPlaying(isVideo); // Auto-play video

      const reader = new FileReader();
      reader.onload = (event) => {
        setMediaSrc(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      if (file.type.startsWith('image/') || isVideo) {
        setMediaType(isVideo ? 'video' : 'image');
        setIsPlaying(isVideo);

        const reader = new FileReader();
        reader.onload = (event) => {
          setMediaSrc(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleExport = () => {
    if (!canvasRef.current) return;

    if (mediaType === 'image') {
      const link = document.createElement('a');
      link.download = activeTab === 'ASCII' ? 'ascii-art.png' : 'dithered-image.png';
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    } else {
      // Toggle Recording
      if (isRecording) {
        // Stop recording
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
      } else {
        // Start recording
        const stream = canvasRef.current.captureStream(30); // 30 FPS
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

        mediaRecorderRef.current = mediaRecorder;
        recordedChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = activeTab === 'ASCII' ? 'ascii-video.webm' : 'dithered-video.webm';
          link.click();
          URL.revokeObjectURL(url);
        };

        mediaRecorder.start();
        setIsRecording(true);

        // Ensure video is playing
        if (!isPlaying) setIsPlaying(true);
      }
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="app-container" onDrop={handleDrop} onDragOver={handleDragOver}>
      <aside className="sidebar">
        <h2 className="section-title">Effects</h2>
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div style={{ height: '24px' }}></div>

        {activeTab === 'Dither' && (
          <>
            <h3 className="control-label" style={{ marginBottom: '16px', color: '#fff', fontSize: '1rem' }}>Dithering Settings</h3>

            <Select
              label="Algorithm"
              value={algorithm}
              options={[
                { label: 'Floyd-Steinberg', value: 'Floyd-Steinberg' },
                { label: 'False Floyd-Steinberg', value: 'False Floyd-Steinberg' },
                { label: 'Atkinson', value: 'Atkinson' },
                { label: 'Stucki', value: 'Stucki' },
                { label: 'Burkes', value: 'Burkes' },
                { label: 'Sierra', value: 'Sierra' },
                { label: 'Sierra Two-Row', value: 'Sierra Two-Row' },
                { label: 'Sierra Lite', value: 'Sierra Lite' },
              ]}
              onChange={setAlgorithm}
            />

            <Slider
              label="Point Size"
              value={pointSize}
              min={1}
              max={16}
              onChange={setPointSize}
            />
          </>
        )}

        {activeTab === 'ASCII' && (
          <>
            <h3 className="control-label" style={{ marginBottom: '16px', color: '#fff', fontSize: '1rem' }}>ASCII Settings</h3>

            <Slider
              label="Font Size"
              value={fontSize}
              min={6}
              max={32}
              onChange={setFontSize}
            />

            <Select
              label="Character Set"
              value={charSetType}
              options={[
                { label: 'Default (Sparse)', value: 'default' },
                { label: 'Dense', value: 'dense' },
              ]}
              onChange={setCharSetType}
            />

            <div className="control-group">
              <label className="control-label" style={{ cursor: 'pointer' }}>
                <span>Inverted</span>
                <input
                  type="checkbox"
                  checked={inverted}
                  onChange={(e) => setInverted(e.target.checked)}
                  style={{ width: '20px', height: '20px' }}
                />
              </label>
            </div>
          </>
        )}

        <div style={{ height: '16px' }}></div>

        <ColorPalette
          inkColor={inkColor}
          bgColor={bgColor}
          onInkChange={setInkColor}
          onBgChange={setBgColor}
        />

        <div style={{ height: '16px' }}></div>

        {activeTab === 'Dither' && (
          <>
            <h3 className="control-label" style={{ marginBottom: '16px', color: '#fff', fontSize: '1rem' }}>Image Adjustments</h3>

            <Slider
              label="Brightness"
              value={brightness}
              min={0}
              max={2}
              step={0.01}
              onChange={setBrightness}
            />

            <Slider
              label="Contrast"
              value={contrast}
              min={0}
              max={2}
              step={0.01}
              onChange={setContrast}
            />

            <Slider
              label="Detail"
              value={detail}
              min={0}
              max={1}
              step={0.01}
              onChange={setDetail}
            />
          </>
        )}

        <div style={{ marginTop: 'auto' }}>
          <label className="upload-btn">
            Upload Media
            <input type="file" accept="image/*,video/*" onChange={handleUpload} hidden />
          </label>

          {mediaSrc && mediaType === 'video' && (
            <button className="export-btn" onClick={togglePlay} style={{ marginTop: '12px', width: '100%' }}>
              {isPlaying ? 'Pause Video' : 'Play Video'}
            </button>
          )}

          {mediaSrc && (
            <button
              className="export-btn"
              onClick={handleExport}
              style={{ marginTop: '12px', width: '100%', backgroundColor: isRecording ? '#ff4444' : '#fff', color: isRecording ? '#fff' : '#000' }}
            >
              {mediaType === 'image' ? 'Export Image' : (isRecording ? 'Stop Recording' : 'Start Recording')}
            </button>
          )}
        </div>
      </aside>

      <main className="main-preview">
        {!mediaSrc ? (
          <div className="placeholder-text">
            Drag & Drop Image/Video or Click Upload
          </div>
        ) : (
          <div className="canvas-wrapper">
            <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            {isProcessing && mediaType === 'image' && <div className="processing-indicator">Processing...</div>}
            {mediaType === 'video' && isRecording && <div className="processing-indicator" style={{ background: 'red' }}>Recording...</div>}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
