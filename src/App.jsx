import { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toJpeg } from 'html-to-image';
import HTMLInviteTemplate from './components/HTMLInviteTemplate';
import './App.css';

function App() {
  const [namesText, setNamesText] = useState('');
  const [settings, setSettings] = useState({
    fontSize: 56,
    color: '#000000', // Default black name
    fontFamily: '"Playfair Display", serif'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const templateRefs = useRef([]);
  const gridRef = useRef(null);
  const [scale, setScale] = useState(0.3);

  // Extract non-empty names
  const names = namesText
    .split('\n')
    .map(n => n.trim())
    .filter(n => n.length > 0);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const observer = new ResizeObserver((entries) => {
      const wrapper = grid.querySelector('.preview-scale-wrapper');
      if (wrapper) {
        setScale(wrapper.clientWidth / 1000);
      }
    });
    observer.observe(grid);
    
    // Also trigger on window resize just in case
    const handleResize = () => {
      const wrapper = grid.querySelector('.preview-scale-wrapper');
      if (wrapper) setScale(wrapper.clientWidth / 1000);
    };
    window.addEventListener('resize', handleResize);
    
    // Initial calculation
    handleResize();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [names.length]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleDownloadSingle = async (index, name) => {
    const node = templateRefs.current[index];
    if (!node) return;
    
    try {
      const dataUrl = await toJpeg(node, { quality: 0.95, pixelRatio: 2, style: { transform: 'scale(1)' } });
      const link = document.createElement('a');
      link.download = `Invite_${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating image:', err);
      alert('Failed to generate image.');
    }
  };

  const handleShareSingle = async (index, name) => {
    const node = templateRefs.current[index];
    if (!node) return;
    
    try {
      const dataUrl = await toJpeg(node, { quality: 0.95, pixelRatio: 2, style: { transform: 'scale(1)' } });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const file = new File([blob], `Invite_${safeName}.jpg`, { type: 'image/jpeg' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${name}'s Invite`,
          text: `Here is the invite for ${name}!`
        });
      } else {
        alert('File sharing is not supported on this device/browser. Try downloading instead.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing image:', err);
        alert('Failed to share image.');
      }
    }
  };

  const handleCopySingle = async (index, name) => {
    const node = templateRefs.current[index];
    if (!node) return;
    
    try {
      const dataUrl = await toJpeg(node, { quality: 0.95, pixelRatio: 2, style: { transform: 'scale(1)' } });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
        // Visual feedback could be added here, but an alert is simple for now
        alert('Image copied to clipboard!');
      } else {
        alert('Copying images is not supported by your browser.');
      }
    } catch (err) {
      console.error('Error copying image:', err);
      alert('Failed to copy image.');
    }
  };

  const handleDownloadAll = async () => {
    if (names.length === 0) return;
    
    setIsGenerating(true);
    try {
      const zip = new JSZip();
      
      for (let i = 0; i < names.length; i++) {
        const node = templateRefs.current[i];
        if (node) {
          const dataUrl = await toJpeg(node, { quality: 0.95, pixelRatio: 2, style: { transform: 'scale(1)' } });
          const base64Data = dataUrl.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
          const safeName = names[i].replace(/[^a-z0-9]/gi, '_').toLowerCase();
          zip.file(`Invite_${safeName}.jpg`, base64Data, {base64: true});
        }
      }
      
      const content = await zip.generateAsync({type: 'blob'});
      saveAs(content, 'invites.zip');
    } catch (err) {
      console.error('Error generating zip:', err);
      alert('Failed to generate zip file.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header glass-panel">
        <h1>Invite Generator</h1>
        <p>Enter names and generate personalized invites instantly based on the St. Clare's template.</p>
      </header>

      <main className="main-content">
        <section className="controls-section glass-panel">
          <div className="form-group">
            <label htmlFor="names">1. Guest Names (One per line)</label>
            <textarea 
              id="names"
              className="name-input" 
              placeholder="John Doe&#10;Jane Smith&#10;The Johnson Family"
              value={namesText}
              onChange={(e) => setNamesText(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>2. Name Typography Settings</label>
            <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '0.5rem'}}>
              <div className="form-group">
                <label style={{fontSize: '0.8rem', opacity: 0.8}}>Font Family</label>
                <select 
                  value={settings.fontFamily} 
                  onChange={(e) => updateSetting('fontFamily', e.target.value)}
                  style={{padding: '0.5rem'}}
                >
                  <option value='"Playfair Display", serif'>Playfair Display (Serif)</option>
                  <option value='"Great Vibes", cursive'>Great Vibes (Cursive)</option>
                  <option value='"Montserrat", sans-serif'>Montserrat (Sans-Serif)</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{fontSize: '0.8rem', opacity: 0.8}}>Font Size (px)</label>
                <input 
                  type="range" 
                  min="20" max="100" 
                  value={settings.fontSize} 
                  onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                />
                <span style={{fontSize: '0.8rem', textAlign: 'right'}}>{settings.fontSize}px</span>
              </div>
              <div className="form-group">
                <label style={{fontSize: '0.8rem', opacity: 0.8}}>Text Color</label>
                <div className="color-swatches">
                  {['#000000', '#475569', '#e3342f', '#f59e0b', '#128c3a', '#14b8a6', '#1a4f8b', '#8b5cf6'].map(preset => (
                    <button
                      key={preset}
                      className={`color-swatch ${settings.color === preset ? 'active' : ''}`}
                      style={{ backgroundColor: preset }}
                      onClick={() => updateSetting('color', preset)}
                      title={preset}
                    />
                  ))}
                  <input 
                    type="color" 
                    value={settings.color} 
                    onChange={(e) => updateSetting('color', e.target.value)}
                    style={{width: '32px', height: '32px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent'}}
                    title="Custom Color"
                  />
                </div>
              </div>
            </div>
          </div>
          
        </section>

        <section className="preview-section glass-panel">
          <div className="preview-header">
            <h2>Preview</h2>
            <p style={{fontSize: '0.9rem', opacity: 0.8}}>
              {names.length === 0 ? 'Enter names to see previews' : `Showing ${names.length} invite(s)`}
            </p>
          </div>
          
          <div className="invites-grid" ref={gridRef}>
            {names.length === 0 && (
              <div className="preview-item">
                <div className="preview-scale-wrapper">
                  <div style={{ transform: `translate(-50%, -50%) scale(${scale})`, position: 'absolute', top: '50%', left: '50%', width: '1000px', height: '750px', transformOrigin: 'center center' }}>
                    <HTMLInviteTemplate 
                      name="Guest Name Preview" 
                      settings={settings} 
                    />
                  </div>
                </div>
              </div>
            )}

            {names.map((name, index) => (
              <div key={index} className="preview-item">
                <div className="preview-scale-wrapper">
                  <div style={{ transform: `translate(-50%, -50%) scale(${scale})`, position: 'absolute', top: '50%', left: '50%', width: '1000px', height: '750px', transformOrigin: 'center center' }}>
                    <HTMLInviteTemplate 
                      ref={(el) => templateRefs.current[index] = el}
                      name={name} 
                      settings={settings} 
                    />
                  </div>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', width: '100%'}}>
                  <button 
                    className="btn-primary" 
                    onClick={() => handleDownloadSingle(index, name)}
                    style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%'}}
                    disabled={isGenerating}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download {name}'s invite
                  </button>
                  <div style={{display: 'flex', gap: '0.75rem', width: '100%'}}>
                    <button 
                      className="btn-secondary" 
                      onClick={() => handleCopySingle(index, name)}
                      style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: 1, borderColor: '#ffffff'}}
                      disabled={isGenerating}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      Copy
                    </button>
                    {!!navigator.share && (
                      <button 
                        className="btn-secondary" 
                        onClick={() => handleShareSingle(index, name)}
                        style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: 1, borderColor: '#ffffff'}}
                        disabled={isGenerating}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                        Share
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {names.length > 0 && (
            <div style={{display: 'flex', justifyContent: 'center', marginTop: '2rem'}}>
              <button 
                className="btn-secondary" 
                onClick={handleDownloadAll}
                disabled={isGenerating}
                style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '1rem 3rem', fontSize: '1.2rem'}}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {isGenerating ? 'Generating ZIP...' : `Download All (${names.length} Invites)`}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
