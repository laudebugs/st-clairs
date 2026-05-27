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
          
          <button 
            className="btn-primary" 
            onClick={handleDownloadAll}
            disabled={names.length === 0 || isGenerating}
            style={{marginTop: '1rem'}}
          >
            {isGenerating ? 'Generating ZIP...' : `Download All (${names.length} Invites)`}
          </button>
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
                <button 
                  className="btn-secondary" 
                  onClick={() => handleDownloadSingle(index, name)}
                  style={{marginTop: '1rem', width: '100%'}}
                  disabled={isGenerating}
                >
                  Download {name}'s invite
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
