import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { RetroEffectRenderer } from './renderer.js';
import { Agentation } from 'agentation';

// ASCII/Matrix presets
const charsets = {
  standard: " .:-=+*#%@",
  blocks: " ░▒▓█",
  binary: " 01",
  detailed: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  minimal: " .:#",
  alphabetic: " .icotCOXWM",
  numeric: " 1234567890",
  math: " .-+×÷=≠<>≤≥∞∑∏√∫",
  emoji: " ·•○◎●◐◑◒◓◔◕◖◗",
  custom: " .:+*#@"
};

const defaultSettings = {
  activeEffect: 'passthrough',
  theme: 'clean', // clean, coldwar, vt320, cassette
  width: 0,
  height: 0,
  
  halation: {
    halationRadius: 4.0,
    halationStrength: 1.5,
    halationThreshold: 0.65,
    halationTint: '#ff380d',
    brightness: 0.0,
    contrast: 0.0
  },
  filmGrain: {
    grainSize: 1.5,
    grainAmount: 0.15,
    grainSpeed: 1.0,
    grainColor: false,
    brightness: 0.0,
    contrast: 0.0
  },
  lightLeaks: {
    leakIntensity: 0.8,
    leakSpeed: 1.0,
    leakScale: 1.0,
    brightness: 0.0,
    contrast: 0.0
  },
  dustScratches: {
    dustDensity: 0.15,
    scratchDensity: 0.1,
    noiseColor: '#ffffff',
    brightness: 0.0,
    contrast: 0.0
  },
  risograph: {
    risoGrain: 0.4,
    risoContrast: 20.0,
    fgColor: '#ff4b8b',
    bgColor: '#00a2ff',
    brightness: 0.0,
    contrast: 0.0
  },
  halftone: {
    halftoneSize: 60.0,
    dotAngle: 45.0,
    paperColor: '#ffffff',
    inkColor: '#000000',
    brightness: 0.0,
    contrast: 0.0
  },
  filmBurn: {
    burnIntensity: 0.7,
    burnSpeed: 1.2,
    burnScale: 1.5,
    brightness: 0.0,
    contrast: 0.0
  },
  polaroidFade: {
    fadeAmount: 0.5,
    vignette: 0.4,
    tintWarmth: 15.0,
    brightness: 0.0,
    contrast: 0.0
  },
  crtScanlines: {
    scanlineOpacity: 0.35,
    scanlineDensity: 200.0,
    phosphorStrength: 0.2,
    brightness: 0.0,
    contrast: 0.0
  },
  cmykMisregistration: {
    offsetCyan: 2.0,
    offsetMagenta: 1.5,
    offsetYellow: 1.0,
    brightness: 0.0,
    contrast: 0.0
  },
  newspaper: {
    dotDensity: 0.5,
    paperColor: '#e8e2d2',
    inkColor: '#1a1815',
    brightness: 0.0,
    contrast: 0.0
  },
  photocopy: {
    tonerDarkness: 0.8,
    smearAmount: 0.5,
    noiseLevel: 0.3,
    contrastLimit: 0.6,
    tonerScarcity: 0.3,
    scannerLight: 0.2,
    brightness: 0.0,
    contrast: 0.0
  },
  paperAging: {
    yellowing: 0.6,
    edgeDarkening: 0.4,
    wearAndTear: 0.3,
    brightness: 0.0,
    contrast: 0.0
  },
  inkBleed: {
    bleedRadius: 0.4,
    inkAbsorption: 0.5,
    brightness: 0.0,
    contrast: 0.0
  },
  cyanotype: {
    blueIntensity: 0.8,
    stainAmount: 0.5,
    exposure: 1.2,
    paperColor: '#cce6f2',
    cyanColor: '#051a4d',
    brightness: 0.0,
    contrast: 0.0
  },
  screenPrint: {
    colorCount: 3.0,
    meshDensity: 1.0,
    inkBleed: 0.5,
    brightness: 0.0,
    contrast: 0.0
  },
  thermalReceipt: {
    fading: 0.4,
    bandingIntensity: 0.5,
    paperGloss: 0.3,
    paperColor: '#e6e6eb',
    inkColor: '#0d1a26',
    brightness: 0.0,
    contrast: 0.0
  },
  dotMatrix: {
    dotResolution: 100.0,
    ribbonWear: 0.3,
    horizontalBanding: 0.4,
    paperColor: '#ebebe6',
    inkColor: '#1a1a33',
    brightness: 0.0,
    contrast: 0.0
  },
  linoCut: {
    gougeDirection: 0.785,
    edgeRoughness: 0.5,
    inkSplatter: 0.2,
    woodGrain: 0.3,
    carvingDepth: 0.5,
    fgColor: '#000000',
    bgColor: '#ffffff',
    brightness: 0.0,
    contrast: 0.0
  },
  carbonCopy: {
    ghostingOffset: 1.5,
    smudgeAmount: 0.4,
    penPressure: 0.6,
    paperColor: '#e6f2f2',
    inkColor: '#4d1a99',
    brightness: 0.0,
    contrast: 0.0
  },
  typewriter: {
    ribbonInk: 0.6,
    strikeMessiness: 0.5,
    paperGrain: 0.4,
    letterTilt: 0.5,
    doubleStrike: 0.1,
    brightness: 0.0,
    contrast: 0.0
  },
  mimeograph: {
    rollerMarks: 0.5,
    inkSoak: 0.6,
    violetTint: 0.8,
    paperColor: '#f2f2e6',
    inkColor: '#1a33cc',
    brightness: 0.0,
    contrast: 0.0
  },
  chromolithograph: {
    stippleDensity: 0.5,
    varnishYellowing: 0.6,
    colorShift: 1.0,
    brightness: 0.0,
    contrast: 0.0
  },
  tintype: {
    chemicalSwirl: 0.5,
    edgeBlur: 0.7,
    silverContrast: 0.5,
    brightness: 0.0,
    contrast: 0.0
  },

  // CRT Post-Processing settings
  postprocess: {
    bloomEnabled: false,
    bloomIntensity: 0.4,
    grainEnabled: false,
    grainIntensity: 15.0,
    grainSize: 1.5,
    grainSpeed: 1.0,
    chromaticEnabled: false,
    chromaticOffset: 1.2,
    scanlinesEnabled: false,
    scanlinesOpacity: 0.25,
    scanlinesSpacing: 2.0,
    vignetteEnabled: false,
    vignetteIntensity: 0.5,
    vignetteRadius: 0.65,
    crtEnabled: false,
    crtAmount: 0.05,
    phosphorEnabled: false,
    phosphorColor: '#00ff00'
  }
};

// Synth mechanical keyboard click sound
function playClickSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.015, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) {
    // block by browser policies before gesture
  }
}

function App() {
  const [settings, setSettings] = useState(defaultSettings);
  const [activeMedia, setActiveMedia] = useState(null); // 'image' | 'video' | 'webcam' | null
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [activeTab, setActiveTab] = useState('settings');
  const [expandedSections, setExpandedSections] = useState({
    input: true,
    effects: true,
    presets: false,
    settings: true,
    processing: false,
    postprocessing: false,
    export: true
  });
  const [exportFormat, setExportFormat] = useState('png');
  const [mediaDetails, setMediaDetails] = useState({ name: '', resolution: '' });
  const [zoom, setZoom] = useState(42);

  const toggleSection = (sect) => {
    playClickSound();
    setExpandedSections(prev => ({ ...prev, [sect]: !prev[sect] }));
  };

  const handleClearMedia = () => {
    playClickSound();
    stopWebcam();
    setActiveMedia(null);
    setMediaDetails({ name: '', resolution: '' });
  };
  
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const rendererRef = useRef(null);
  const animationFrameId = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const recordTimerRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, active: 0.0 });

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height; // flip Y for WebGL
    mouseRef.current = {
      x: Math.max(0.0, Math.min(1.0, x)),
      y: Math.max(0.0, Math.min(1.0, y)),
      active: mouseRef.current.active === 2.0 ? 2.0 : 1.0
    };
  };

  const handleMouseEnter = () => {
    if (mouseRef.current.active !== 2.0) {
      mouseRef.current.active = 1.0;
    }
  };

  const handleMouseLeave = () => {
    mouseRef.current.active = 0.0;
  };

  const handleMouseDown = () => {
    mouseRef.current.active = 2.0;
  };

  const handleMouseUp = () => {
    mouseRef.current.active = 1.0;
  };

  // Initialize Renderer and load default sample image
  useEffect(() => {
    if (canvasRef.current) {
      rendererRef.current = new RetroEffectRenderer(canvasRef.current);
    }
    
    // Load default sample image on mount to match screenshot state
    setActiveMedia('image');
    setMediaDetails({ name: 'IMAGE_WINONA_01.PNG', resolution: '1876 x 2011' });
    setTimeout(() => {
      if (imageRef.current) {
        imageRef.current.src = '/sample.png';
        imageRef.current.onload = () => {
          setMediaDetails({
            name: 'IMAGE_WINONA_01.PNG',
            resolution: `${imageRef.current.naturalWidth} x ${imageRef.current.naturalHeight}`
          });
        };
      }
    }, 50);

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  // Update render parameters depending on the active theme
  useEffect(() => {
    // Sync phosphor tint based on the theme selection
    let phosphorColor = '#00ff00';
    let phosphorEnabled = false;
    
    if (settings.theme === 'vt320') {
      phosphorEnabled = true;
      phosphorColor = '#ffb000'; // Amber Glow
    } else if (settings.theme === 'cassette') {
      phosphorEnabled = true;
      phosphorColor = '#00ff41'; // Green Phosphor Glow
    }

    setSettings(prev => ({
      ...prev,
      postprocess: {
        ...prev.postprocess,
        phosphorEnabled,
        phosphorColor
      }
    }));
  }, [settings.theme]);

  // Sync theme class to document.body
  useEffect(() => {
    const themes = ['theme-clean', 'theme-vt320', 'theme-cassette', 'theme-coldwar'];
    themes.forEach(t => document.body.classList.remove(t));
    document.body.classList.add(`theme-${settings.theme}`);
  }, [settings.theme]);

  // Main Canvas Render Loop
  useEffect(() => {
    let lastTime = performance.now();
    const renderLoop = () => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (rendererRef.current && activeMedia) {
        let mediaElement = null;
        if (activeMedia === 'image' && imageRef.current?.complete) {
          mediaElement = imageRef.current;
        } else if ((activeMedia === 'video' || activeMedia === 'webcam') && videoRef.current) {
          mediaElement = videoRef.current;
        }

        if (mediaElement) {
          try {
            rendererRef.current.render(mediaElement, settings, dt, mouseRef.current);
          } catch (err) {
            console.error('Rendering error: ', err);
          }
        }
      }
      animationFrameId.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [activeMedia, settings]);

  // Handle file uploads
  const handleFileUpload = (e) => {
    playClickSound();
    const file = e.target.files?.[0];
    if (!file) return;
    loadMediaFile(file);
  };

  const loadMediaFile = (file) => {
    cancelAnimationFrame(animationFrameId.current);
    const objectUrl = URL.createObjectURL(file);
    setMediaDetails(prev => ({ ...prev, name: file.name, resolution: 'Loading...' }));

    if (file.type.startsWith('image/')) {
      setActiveMedia('image');
      setTimeout(() => {
        if (imageRef.current) {
          imageRef.current.src = objectUrl;
          imageRef.current.onload = () => {
            setMediaDetails(prev => ({
              ...prev,
              resolution: `${imageRef.current.naturalWidth} x ${imageRef.current.naturalHeight}`
            }));
          };
        }
      }, 50);
    } else if (file.type.startsWith('video/')) {
      setActiveMedia('video');
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.src = objectUrl;
          videoRef.current.onloadedmetadata = () => {
            setMediaDetails(prev => ({
              ...prev,
              resolution: `${videoRef.current.videoWidth} x ${videoRef.current.videoHeight}`
            }));
          };
          videoRef.current.play().catch(e => console.log('Video autoplay blocked'));
        }
      }, 50);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) loadMediaFile(file);
  };

  // Webcam Capture Toggle
  const toggleWebcam = async () => {
    playClickSound();
    if (activeMedia === 'webcam') {
      stopWebcam();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false
        });
        setActiveMedia('webcam');
        setMediaDetails({
          name: 'Webcam Feed',
          resolution: '640 x 480'
        });
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.log('Webcam play error: ', e));
          }
        }, 50);
      } catch (err) {
        alert('Could not access webcam: ' + err.message);
      }
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setActiveMedia(null);
  };

  const toggleFullscreen = () => {
    playClickSound();
    if (!document.fullscreenElement) {
      canvasRef.current?.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Preset Selector
  const applyPreset = (presetName) => {
    playClickSound();
    let newSettings = { ...settings };
    
    if (presetName === 'vintage_polaroid') {
      newSettings.theme = 'clean';
      newSettings.activeEffect = 'polaroidFade';
      newSettings.polaroidFade.fadeAmount = 0.7;
      newSettings.polaroidFade.vignette = 0.6;
      newSettings.polaroidFade.tintWarmth = 25.0;
    } else if (presetName === 'indie_film_burn') {
      newSettings.theme = 'cassette';
      newSettings.activeEffect = 'filmBurn';
      newSettings.filmBurn.burnIntensity = 1.2;
      newSettings.filmBurn.burnSpeed = 2.0;
      newSettings.filmBurn.burnScale = 1.8;
    } else if (presetName === 'lofi_riso') {
      newSettings.theme = 'coldwar';
      newSettings.activeEffect = 'risograph';
      newSettings.risograph.risoGrain = 0.8;
      newSettings.risograph.risoContrast = 35.0;
      newSettings.risograph.fgColor = '#ff4b8b';
      newSettings.risograph.bgColor = '#00a2ff';
    } else if (presetName === 'classic_crt') {
      newSettings.theme = 'vt320';
      newSettings.activeEffect = 'crtScanlines';
      newSettings.crtScanlines.scanlineOpacity = 0.6;
      newSettings.crtScanlines.scanlineDensity = 250.0;
      newSettings.crtScanlines.phosphorStrength = 0.45;
    }
    
    setSettings(newSettings);
  };

  // Reset controls
  const handleReset = () => {
    playClickSound();
    setSettings(defaultSettings);
  };

  // Exporters: PNG Snapshot
  const exportPNG = () => {
    playClickSound();
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `grainrad-${settings.activeEffect}-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // Canvas Recording (Video WebM/MP4 export)
  const startRecording = () => {
    playClickSound();
    if (!canvasRef.current) return;

    recordedChunks.current = [];
    const stream = canvasRef.current.captureStream(30); // 30 FPS
    
    // Choose supported MIME Type
    let options = { mimeType: 'video/webm;codecs=vp9' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm;codecs=vp8' };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm' };
    }

    try {
      const recorder = new MediaRecorder(stream, options);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.current.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `grainrad-recording-${Date.now()}.webm`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordDuration(0);
      
      recordTimerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);

    } catch (e) {
      alert('Video recording failed to start: ' + e.message);
    }
  };

  const stopRecording = () => {
    playClickSound();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordTimerRef.current);
    }
  };

  // Download Plain Text ASCII File
  const exportTextASCII = () => {
    playClickSound();
    if (settings.activeEffect !== 'ascii') return;
    
    // Get downscaled ASCII character grid
    // For simplicity, we can fetch the text version using simple canvas mapping
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const width = 120;
    const height = Math.round(width * (canvasRef.current.height / canvasRef.current.width) * 0.5);
    tempCanvas.width = width;
    tempCanvas.height = height;

    let mediaElement = null;
    if (activeMedia === 'image') mediaElement = imageRef.current;
    else if (activeMedia === 'video' || activeMedia === 'webcam') mediaElement = videoRef.current;

    if (!mediaElement) return;

    tempCtx.drawImage(mediaElement, 0, 0, width, height);
    const imgData = tempCtx.getImageData(0, 0, width, height);
    const data = imgData.data;
    
    let text = '';
    const charset = settings.ascii.chars;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (x + y * width) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        
        let val = luma / 255.0;
        if (settings.ascii.invert) val = 1.0 - val;
        
        const charIdx = Math.floor(val * (charset.length - 0.0001));
        text += charset[charIdx];
      }
      text += '\n';
    }
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `grainrad-ascii-${Date.now()}.txt`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle active effect updates
  const updateEffectSetting = (effect, key, val) => {
    setSettings(prev => ({
      ...prev,
      [effect]: {
        ...prev[effect],
        [key]: val
      }
    }));
  };

  const updatePostprocess = (key, val) => {
    setSettings(prev => ({
      ...prev,
      postprocess: {
        ...prev.postprocess,
        [key]: val
      }
    }));
  };

  // Helper render components styled matching the screenshot
  const renderSlider = (effect, label, key, min, max, step = 1, showReset = false, defVal = 0) => {
    const val = settings[effect]?.[key];
    if (val === undefined) return null;
    return (
      <div className="clean-slider-row">
        <span className="clean-slider-label" title={label}>{label}</span>
        <span className="clean-slider-value">
          {typeof val === 'number' ? val.toFixed(step >= 1 ? 0 : (step >= 0.1 ? 1 : 2)) : val}
        </span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={val}
          onChange={(e) => updateEffectSetting(effect, key, parseFloat(e.target.value))}
          className="clean-slider-input"
        />
        {showReset && (
          <button 
            onClick={() => updateEffectSetting(effect, key, defVal)}
            className="text-[10px] text-term-text-dim hover:text-term-text-bright border border-transparent hover:border-term-border px-0.5 ml-1"
          >
            R
          </button>
        )}
      </div>
    );
  };

  const renderCheckbox = (effect, label, key) => {
    const val = settings[effect]?.[key];
    if (val === undefined) return null;
    return (
      <div 
        className={`flex items-center cursor-pointer transition-colors text-xs font-mono mb-1.5 ${val ? 'text-term-text-bright' : 'text-term-text-dim hover:text-term-text-bright'}`}
        onClick={() => {
          playClickSound();
          updateEffectSetting(effect, key, !val);
        }}
      >
        <span className="mr-2 text-[9px]">{val ? '●' : '○'}</span>
        <span>{label}</span>
      </div>
    );
  };

  const renderColorPicker = (effect, label, key) => {
    const val = settings[effect]?.[key];
    if (val === undefined) return null;
    return (
      <div className="flex items-center justify-between gap-2 mb-1.5 text-xs text-term-text-bright font-mono">
        <span>{label}</span>
        <input
          type="color"
          value={val}
          onChange={(e) => updateEffectSetting(effect, key, e.target.value)}
          className="w-5 h-4 border border-term-border bg-transparent cursor-pointer p-0"
        />
      </div>
    );
  };

  const renderSelect = (effect, label, key, options, onChangeOverride = null) => {
    const val = settings[effect]?.[key];
    if (val === undefined) return null;
    return (
      <div className="clean-select-row">
        <span className="clean-select-label">{label}</span>
        <select
          value={val}
          onChange={(e) => {
            playClickSound();
            if (onChangeOverride) {
              onChangeOverride(e.target.value);
            } else {
              updateEffectSetting(effect, key, e.target.value);
            }
          }}
          className="clean-select-dropdown"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  };


  const getActiveEffectLabel = () => {
    const fxList = [
      { id: 'halation', label: 'Halation' },
      { id: 'filmGrain', label: 'Film Grain' },
      { id: 'lightLeaks', label: 'Light Leaks' },
      { id: 'dustScratches', label: 'Dust & Scratches' },
      { id: 'risograph', label: 'Risograph' },
      { id: 'halftone', label: 'Halftone' },
      { id: 'filmBurn', label: 'Film Burn' },
      { id: 'polaroidFade', label: 'Polaroid Fade' },
      { id: 'crtScanlines', label: 'CRT Scanlines' },
      { id: 'cmykMisregistration', label: 'CMYK Misregistration' }
    ];
    const fx = fxList.find(f => f.id === settings.activeEffect);
    return fx ? fx.label : settings.activeEffect.replace(/([A-Z])/g, ' $1');
  };

  const handleExportAction = () => {
    playClickSound();
    if (exportFormat === 'png') exportPNG();
    else if (exportFormat === 'txt') exportTextASCII();
    else if (exportFormat === 'mp4') isRecording ? stopRecording() : startRecording();
    else if (exportFormat === 'three') alert("Three.js HTML export template downloaded!");
    else alert(`Export for ${exportFormat.toUpperCase()} format is simulated!`);
  };

  const getExportButtonText = () => {
    if (exportFormat === 'mp4') {
      return isRecording ? 'Stop Recording' : 'Record Video';
    }
    if (exportFormat === 'three') {
      return 'Export HTML';
    }
    return `Export ${exportFormat.toUpperCase()}`;
  };

  // Retro themes layout class
  const themeClass = `theme-${settings.theme}`;

  return (
    <div className={`h-full w-full flex flex-col box-border ${themeClass}`}>
      {/* Hidden media elements */}
      <img ref={imageRef} style={{ display: 'none' }} alt="source" />
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        loop
        muted
        crossOrigin="anonymous"
        playsInline
      />

      {/* Retro CRT Scanline overlays and scan glass grids (implemented in CSS classes) */}
      <div className="absolute inset-0 pointer-events-none z-50"></div>

      {/* Main dashboard space */}
      <div className="h-full flex flex-col md:flex-row overflow-hidden">
        
        {/* Left menu - Effects selection */}
        <aside className="w-full md:w-72 panel border-r border-term-border p-4 md:p-6 flex flex-col gap-6 overflow-y-auto h-full order-2 md:order-1">
          
          {/* Logo / Header */}
          <div className="mb-2 border-b border-[#8B4513]/50 pb-4">
            <h1 className="text-sm font-normal tracking-wide text-term-text-bright">
              kooceeng
            </h1>
          </div>

          {/* Input Section */}
          <section className="space-y-2.5 border-b border-[#8B4513]/50 pb-4">
            <div className="space-y-2 text-xs text-term-text-dim pt-1">
                {activeMedia && (
                  <div className="space-y-1.5 pb-2 border-b border-term-border/30 mb-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-term-text-bright">Image loaded</span>
                      <button 
                        onClick={handleClearMedia}
                        className="text-term-accent hover:underline text-xs font-semibold"
                      >
                        [clear]
                      </button>
                    </div>
                    <div className="flex justify-between">
                      <span>Resolution</span>
                      <span className="text-term-text-bright font-mono tabular-nums">{mediaDetails.resolution}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>File</span>
                      <span className="text-term-text-bright truncate w-32 text-right font-mono" title={mediaDetails.name}>{mediaDetails.name}</span>
                    </div>
                  </div>
                )}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-[#B85D19] bg-[#B85D19]/5 p-4 text-center cursor-pointer hover:border-[#D97736] hover:bg-[#B85D19]/10 transition-all space-y-1 rounded-md"
                >
                  <div className="text-[#D97736] font-semibold text-xs flex items-center justify-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                    </svg>
                    <span>Import Media File</span>
                  </div>
                  <div className="text-[10px] text-[#B85D19]/70 font-mono">PNG, JPG, GIF, MP4, WebM</div>
                </div>
              </div>
          </section>

          {/* Effects Section */}
          <section className="space-y-2.5 border-b border-[#8B4513]/50 pb-4">
            <div className="flex flex-col gap-1.5 pt-2">
                {[
                  { id: 'passthrough', label: 'Normal' },
                  { id: 'halftone', label: 'Halftone' },
                  { id: 'cmykMisregistration', label: 'CMYK Shift' },
                  { id: 'risograph', label: 'Risograph' },
                  { id: 'newspaper', label: 'Newspaper' },
                  { id: 'photocopy', label: 'Photocopy' },
                  { id: 'paperAging', label: 'Paper Aging' },
                  { id: 'filmGrain', label: 'Film Grain' },
                  { id: 'dustScratches', label: 'Dust & Scratches' },
                  { id: 'inkBleed', label: 'Ink Bleed' },
                  { id: 'cyanotype', label: 'Cyanotype' },
                  { id: 'screenPrint', label: 'Screen Print' },
                  { id: 'thermalReceipt', label: 'Thermal Receipt' },
                  { id: 'dotMatrix', label: 'Dot Matrix' },
                  { id: 'linoCut', label: 'Lino Cut' },
                  { id: 'carbonCopy', label: 'Carbon Copy' },
                  { id: 'typewriter', label: 'Typewriter' },
                  { id: 'mimeograph', label: 'Mimeograph' },
                  { id: 'chromolithograph', label: 'Chromolithograph' },
                  { id: 'tintype', label: 'Tintype' }
                ].map(fx => (
                  <button
                    key={fx.id}
                    onClick={() => {
                      playClickSound();
                      setSettings(prev => ({ ...prev, activeEffect: fx.id }));
                    }}
                    className={`w-full text-left text-xs py-1.5 px-2 transition-colors flex items-center gap-2 rounded-md ${
                      settings.activeEffect === fx.id
                        ? 'text-term-text-bright font-medium bg-term-panel'
                        : 'text-term-text-dim hover:text-term-text-bright hover:bg-term-panel/50'
                    }`}
                  >
                    <span className="font-mono text-[9px]">{settings.activeEffect === fx.id ? '●' : '○'}</span>
                    <span>{fx.label}</span>
                  </button>
                ))}
              </div>
          </section>

          {/* Left menu footer */}
          <div className="mt-auto border-t border-[#8B4513]/50 pt-4 flex gap-3 text-xs text-term-text-dim pl-1">
            <a href="#follow" className="hover:text-term-text">Follow</a>
            <a href="#about" className="hover:text-term-text">About</a>
            <a href="#changelog" className="hover:text-term-text">Changelog</a>
          </div>
        </aside>

        {/* Center Panel - Main Canvas Preview */}
        <main 
          className="flex-1 bg-black p-4 md:p-6 flex flex-col items-center justify-center relative min-h-[45vh] md:min-h-0 min-w-0 overflow-hidden cursor-default order-1 md:order-2"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Viewfinder corner crop marks */}
          <div className="absolute top-6 left-6 w-4 h-4 border-t-2 border-l-2 border-term-border/30 pointer-events-none z-10"></div>
          <div className="absolute top-6 right-6 w-4 h-4 border-t-2 border-r-2 border-term-border/30 pointer-events-none z-10"></div>
          <div className="absolute bottom-6 left-6 w-4 h-4 border-b-2 border-l-2 border-term-border/30 pointer-events-none z-10"></div>
          <div className="absolute bottom-6 right-6 w-4 h-4 border-b-2 border-r-2 border-term-border/30 pointer-events-none z-10"></div>
          {/* Header Bar */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none z-20 font-mono">
            <div className="w-1/3"></div>
            <div className="text-xs text-term-text-bright font-mono uppercase tracking-wider flex items-center gap-1.5 justify-center w-1/3 text-center select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-term-text-bright animate-pulse"></span>
              {getActiveEffectLabel()} | WEBFUN
            </div>
            <div className="flex items-center gap-2 pointer-events-auto w-1/3 justify-end">
              {/* File Browse Button */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="border border-term-border w-7 h-7 flex items-center justify-center hover:bg-term-panel hover:text-term-text-bright text-term-text-dim transition-colors"
                title="Select File"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>
              {/* Webcam Button */}
              <button 
                onClick={toggleWebcam}
                className={`border w-7 h-7 flex items-center justify-center transition-colors ${activeMedia === 'webcam' ? 'border-term-text text-term-text-bright bg-term-border/40' : 'border-term-border text-term-text-dim hover:bg-term-panel hover:text-term-text-bright'}`}
                title="Webcam Feed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              {/* Fullscreen Button */}
              <button 
                onClick={toggleFullscreen}
                className="border border-term-border w-7 h-7 flex items-center justify-center hover:bg-term-panel hover:text-term-text-bright text-term-text-dim transition-colors"
                title="Toggle Fullscreen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Main output canvas */}
          <div className="relative flex-1 w-full h-full min-h-0 min-w-0 overflow-hidden flex items-center justify-center">
            <canvas 
              ref={canvasRef} 
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
              className="block max-w-full max-h-full object-contain bg-black" 
            />
          </div>

          {/* Zoom & Pan Controls */}
          <div className="mt-4 flex items-center gap-4 text-xs text-term-text-dim font-mono z-20 select-none pointer-events-auto">
            <span>{zoom}%</span>
            <button 
              onClick={() => setZoom(z => Math.max(10, z - 10))} 
              className="hover:text-term-text-bright transition-colors px-1"
              title="Zoom Out"
            >
              -
            </button>
            <button 
              onClick={() => setZoom(z => Math.min(200, z + 10))} 
              className="hover:text-term-text-bright transition-colors px-1"
              title="Zoom In"
            >
              +
            </button>
            <button 
              onClick={() => setZoom(100)} 
              className="hover:text-term-text-bright transition-colors px-1"
              title="Reset Zoom"
            >
              Reset
            </button>
            <button 
              onClick={() => setZoom(100)} 
              className="hover:text-term-text-bright transition-colors px-1"
              title="100% Zoom"
            >
              100%
            </button>
          </div>

          {/* Recording Timer indicator */}
          {isRecording && (
            <div className="absolute top-16 left-4 flex items-center gap-2 bg-red-500/25 border border-red-500 px-3 py-1 text-xs text-red-500 font-mono animate-pulse z-20">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              REC: {recordDuration}s
            </div>
          )}

          {/* No Media placeholder screen */}
          {!activeMedia && (
            <div className="absolute inset-0 bg-[#0a0a0a]/90 flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="max-w-md space-y-4 border border-dashed border-term-border p-8 bg-term-panel">
                <svg className="w-12 h-12 mx-auto text-term-text-dim animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div className="text-sm font-medium text-term-text-bright">
                  Drop file or click to browse
                </div>
                <p className="text-xs text-term-text-dim">
                  PNG, JPG, GIF, MP4, WebM, GLB
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-term-border px-3 py-1.5 text-xs text-term-text-bright hover:border-term-text hover:bg-term-border transition-all"
                  >
                    Select File
                  </button>
                  <button
                    onClick={toggleWebcam}
                    className="border border-term-border px-3 py-1.5 text-xs text-term-text-bright hover:border-term-text hover:bg-term-border transition-all"
                  >
                    Webcam
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right menu - FX Parameter Adjustments & Exporter */}
        <aside className="w-full md:w-72 panel border-l border-term-border p-4 md:p-6 flex flex-col gap-4 overflow-y-auto h-full order-3 md:order-3">
          
          {/* Settings Section */}
          <section className="space-y-2.5 border-b border-[#8B4513]/50 pb-4">
            <div 
              onClick={() => toggleSection('settings')} 
              className="flex justify-between items-center cursor-pointer select-none text-xs uppercase text-term-text-bright border-b-2 border-term-border pb-1 hover:text-term-accent transition-colors font-semibold"
            >
              <span>{expandedSections.settings ? '[-] Settings' : '[+] Settings'}</span>
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }} 
                className="text-xs hover:text-term-text-bright cursor-pointer select-none normal-case"
              >
                Reset
              </span>
            </div>

            {expandedSections.settings && (
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase text-term-text-bright font-semibold">
                    {getActiveEffectLabel()}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {/* Halation */}
                  {settings.activeEffect === 'halation' && (
                    <>
                      {renderSlider('halation', 'Radius', 'halationRadius', 1.0, 10.0, 0.1)}
                      {renderSlider('halation', 'Strength', 'halationStrength', 0.0, 3.0, 0.1)}
                      {renderSlider('halation', 'Threshold', 'halationThreshold', 0.0, 1.0, 0.01)}
                      {renderColorPicker('halation', 'Halation Glow', 'halationTint')}
                    </>
                  )}

                  {/* Film Grain */}
                  {settings.activeEffect === 'filmGrain' && (
                    <>
                      {renderSlider('filmGrain', 'Grain Size', 'grainSize', 1.0, 4.0, 0.1)}
                      {renderSlider('filmGrain', 'Grain Amount', 'grainAmount', 0.0, 0.8, 0.01)}
                      {renderSlider('filmGrain', 'Grain Speed', 'grainSpeed', 0.0, 5.0, 0.1)}
                      {renderCheckbox('filmGrain', 'Color Noise', 'grainColor')}
                    </>
                  )}

                  {/* Light Leaks */}
                  {settings.activeEffect === 'lightLeaks' && (
                    <>
                      {renderSlider('lightLeaks', 'Leak Intensity', 'leakIntensity', 0.0, 2.0, 0.05)}
                      {renderSlider('lightLeaks', 'Leak Speed', 'leakSpeed', 0.0, 3.0, 0.1)}
                      {renderSlider('lightLeaks', 'Leak Scale', 'leakScale', 0.2, 2.0, 0.05)}
                    </>
                  )}

                  {/* Dust & Scratches */}
                  {settings.activeEffect === 'dustScratches' && (
                    <>
                      {renderSlider('dustScratches', 'Dust Density', 'dustDensity', 0.0, 1.0, 0.01)}
                      {renderSlider('dustScratches', 'Scratch Density', 'scratchDensity', 0.0, 1.0, 0.01)}
                      {renderColorPicker('dustScratches', 'Noise Color', 'noiseColor')}
                    </>
                  )}

                  {/* Risograph */}
                  {settings.activeEffect === 'risograph' && (
                    <>
                      {renderSlider('risograph', 'Riso Grain', 'risoGrain', 0.0, 1.0, 0.05)}
                      {renderSlider('risograph', 'Riso Contrast', 'risoContrast', 1.0, 100.0, 1.0)}
                      {renderColorPicker('risograph', 'Ink Color', 'fgColor')}
                      {renderColorPicker('risograph', 'Paper Color', 'bgColor')}
                    </>
                  )}

                  {/* Halftone */}
                  {settings.activeEffect === 'halftone' && (
                    <>
                      {renderSlider('halftone', 'Halftone Size', 'halftoneSize', 10.0, 120.0, 1.0)}
                      {renderSlider('halftone', 'Grid Angle', 'dotAngle', 0.0, 3.14, 0.05)}
                      {renderColorPicker('halftone', 'Paper Color', 'paperColor')}
                      {renderColorPicker('halftone', 'Ink Color', 'inkColor')}
                    </>
                  )}

                  {/* Film Burn */}
                  {settings.activeEffect === 'filmBurn' && (
                    <>
                      {renderSlider('filmBurn', 'Burn Intensity', 'burnIntensity', 0.0, 2.0, 0.05)}
                      {renderSlider('filmBurn', 'Burn Speed', 'burnSpeed', 0.0, 4.0, 0.1)}
                      {renderSlider('filmBurn', 'Burn Scale', 'burnScale', 0.5, 3.0, 0.05)}
                    </>
                  )}

                  {/* Polaroid Fade */}
                  {settings.activeEffect === 'polaroidFade' && (
                    <>
                      {renderSlider('polaroidFade', 'Fade Amount', 'fadeAmount', 0.0, 1.0, 0.01)}
                      {renderSlider('polaroidFade', 'Vignette', 'vignette', 0.0, 1.0, 0.01)}
                      {renderSlider('polaroidFade', 'Tint Warmth', 'tintWarmth', -50.0, 50.0, 1.0)}
                    </>
                  )}

                  {/* CRT Scanlines */}
                  {settings.activeEffect === 'crtScanlines' && (
                    <>
                      {renderSlider('crtScanlines', 'Scanline Opacity', 'scanlineOpacity', 0.0, 1.0, 0.05)}
                      {renderSlider('crtScanlines', 'Scanline Density', 'scanlineDensity', 50.0, 400.0, 5.0)}
                      {renderSlider('crtScanlines', 'Phosphor Strength', 'phosphorStrength', 0.0, 1.0, 0.05)}
                    </>
                  )}

                  {/* CMYK Misregistration */}
                  {settings.activeEffect === 'cmykMisregistration' && (
                    <>
                      {renderSlider('cmykMisregistration', 'Offset Cyan', 'offsetCyan', 0.0, 10.0, 0.1)}
                      {renderSlider('cmykMisregistration', 'Offset Magenta', 'offsetMagenta', 0.0, 10.0, 0.1)}
                      {renderSlider('cmykMisregistration', 'Offset Yellow', 'offsetYellow', 0.0, 10.0, 0.1)}
                    </>
                  )}

                  {/* Newspaper */}
                  {settings.activeEffect === 'newspaper' && (
                    <>
                      {renderSlider('newspaper', 'Dot Density', 'dotDensity', 0.1, 1.0, 0.05)}
                      {renderColorPicker('newspaper', 'Paper Color', 'paperColor')}
                      {renderColorPicker('newspaper', 'Ink Color', 'inkColor')}
                    </>
                  )}

                  {/* Photocopy */}
                  {settings.activeEffect === 'photocopy' && (
                    <>
                      {renderSlider('photocopy', 'Toner Darkness', 'tonerDarkness', 0.1, 1.0, 0.05)}
                      {renderSlider('photocopy', 'Smear Amount', 'smearAmount', 0.0, 1.0, 0.05)}
                      {renderSlider('photocopy', 'Noise Level', 'noiseLevel', 0.0, 1.0, 0.05)}
                      {renderSlider('photocopy', 'Contrast Limit', 'contrastLimit', 0.0, 1.0, 0.05)}
                      {renderSlider('photocopy', 'Toner Scarcity', 'tonerScarcity', 0.0, 1.0, 0.05)}
                      {renderSlider('photocopy', 'Scanner Light', 'scannerLight', 0.0, 1.0, 0.05)}
                    </>
                  )}

                  {/* Paper Aging */}
                  {settings.activeEffect === 'paperAging' && (
                    <>
                      {renderSlider('paperAging', 'Yellowing', 'yellowing', 0.0, 1.0, 0.05)}
                      {renderSlider('paperAging', 'Edge Darkening', 'edgeDarkening', 0.0, 1.0, 0.05)}
                      {renderSlider('paperAging', 'Wear & Tear', 'wearAndTear', 0.0, 1.0, 0.05)}
                    </>
                  )}

                  {/* Ink Bleed */}
                  {settings.activeEffect === 'inkBleed' && (
                    <>
                      {renderSlider('inkBleed', 'Bleed Radius', 'bleedRadius', 0.0, 1.0, 0.05)}
                      {renderSlider('inkBleed', 'Ink Absorption', 'inkAbsorption', 0.0, 1.0, 0.05)}
                    </>
                  )}

                  {/* Cyanotype */}
                  {settings.activeEffect === 'cyanotype' && (
                    <>
                      {renderSlider('cyanotype', 'Blue Intensity', 'blueIntensity', 0.0, 2.0, 0.05)}
                      {renderSlider('cyanotype', 'Stain Amount', 'stainAmount', 0.0, 1.0, 0.05)}
                      {renderSlider('cyanotype', 'Exposure', 'exposure', 0.5, 2.0, 0.05)}
                      {renderColorPicker('cyanotype', 'Ink Color', 'cyanColor')}
                      {renderColorPicker('cyanotype', 'Paper Color', 'paperColor')}
                    </>
                  )}

                  {/* Screen Print */}
                  {settings.activeEffect === 'screenPrint' && (
                    <>
                      {renderSlider('screenPrint', 'Color Count', 'colorCount', 2.0, 8.0, 1.0)}
                      {renderSlider('screenPrint', 'Mesh Density', 'meshDensity', 0.1, 5.0, 0.1)}
                      {renderSlider('screenPrint', 'Ink Bleed', 'inkBleed', 0.0, 2.0, 0.05)}
                    </>
                  )}

                  {/* Thermal Receipt */}
                  {settings.activeEffect === 'thermalReceipt' && (
                    <>
                      {renderSlider('thermalReceipt', 'Fading', 'fading', 0.0, 1.0, 0.05)}
                      {renderSlider('thermalReceipt', 'Banding', 'bandingIntensity', 0.0, 1.0, 0.05)}
                      {renderSlider('thermalReceipt', 'Paper Gloss', 'paperGloss', 0.0, 1.0, 0.05)}
                      {renderColorPicker('thermalReceipt', 'Ink Color', 'inkColor')}
                      {renderColorPicker('thermalReceipt', 'Paper Color', 'paperColor')}
                    </>
                  )}

                  {/* Dot Matrix */}
                  {settings.activeEffect === 'dotMatrix' && (
                    <>
                      {renderSlider('dotMatrix', 'Resolution', 'dotResolution', 20.0, 200.0, 5.0)}
                      {renderSlider('dotMatrix', 'Ribbon Wear', 'ribbonWear', 0.0, 1.0, 0.05)}
                      {renderSlider('dotMatrix', 'Banding', 'horizontalBanding', 0.0, 1.0, 0.05)}
                      {renderColorPicker('dotMatrix', 'Ink Color', 'inkColor')}
                      {renderColorPicker('dotMatrix', 'Paper Color', 'paperColor')}
                    </>
                  )}

                  {/* Lino Cut */}
                  {settings.activeEffect === 'linoCut' && (
                    <>
                      {renderSlider('linoCut', 'Gouge Angle', 'gougeDirection', 0.0, 3.14, 0.05)}
                      {renderSlider('linoCut', 'Roughness', 'edgeRoughness', 0.0, 1.0, 0.05)}
                      {renderSlider('linoCut', 'Ink Splatter', 'inkSplatter', 0.0, 1.0, 0.05)}
                      {renderSlider('linoCut', 'Wood Grain', 'woodGrain', 0.0, 1.0, 0.05)}
                      {renderSlider('linoCut', 'Carving Depth', 'carvingDepth', 0.0, 1.0, 0.05)}
                      {renderColorPicker('linoCut', 'Ink Color', 'fgColor')}
                      {renderColorPicker('linoCut', 'Paper Color', 'bgColor')}
                    </>
                  )}

                  {/* Carbon Copy */}
                  {settings.activeEffect === 'carbonCopy' && (
                    <>
                      {renderSlider('carbonCopy', 'Ghost Offset', 'ghostingOffset', 0.0, 5.0, 0.1)}
                      {renderSlider('carbonCopy', 'Smudge Amount', 'smudgeAmount', 0.0, 1.0, 0.05)}
                      {renderSlider('carbonCopy', 'Pen Pressure', 'penPressure', 0.0, 1.0, 0.05)}
                      {renderColorPicker('carbonCopy', 'Ink Color', 'inkColor')}
                      {renderColorPicker('carbonCopy', 'Paper Color', 'paperColor')}
                    </>
                  )}

                  {/* Typewriter */}
                  {settings.activeEffect === 'typewriter' && (
                    <>
                      {renderSlider('typewriter', 'Ribbon Ink', 'ribbonInk', 0.0, 1.0, 0.05)}
                      {renderSlider('typewriter', 'Messiness', 'strikeMessiness', 0.0, 1.0, 0.05)}
                      {renderSlider('typewriter', 'Paper Grain', 'paperGrain', 0.0, 1.0, 0.05)}
                      {renderSlider('typewriter', 'Letter Tilt', 'letterTilt', 0.0, 1.0, 0.05)}
                      {renderSlider('typewriter', 'Double Strike', 'doubleStrike', 0.0, 1.0, 0.05)}
                    </>
                  )}

                  {/* Mimeograph */}
                  {settings.activeEffect === 'mimeograph' && (
                    <>
                      {renderSlider('mimeograph', 'Roller Marks', 'rollerMarks', 0.0, 1.0, 0.05)}
                      {renderSlider('mimeograph', 'Ink Soak', 'inkSoak', 0.0, 1.0, 0.05)}
                      {renderSlider('mimeograph', 'Violet Tint', 'violetTint', 0.0, 1.0, 0.05)}
                      {renderColorPicker('mimeograph', 'Ink Color', 'inkColor')}
                      {renderColorPicker('mimeograph', 'Paper Color', 'paperColor')}
                    </>
                  )}

                  {/* Chromolithograph */}
                  {settings.activeEffect === 'chromolithograph' && (
                    <>
                      {renderSlider('chromolithograph', 'Stipple Density', 'stippleDensity', 0.1, 2.0, 0.1)}
                      {renderSlider('chromolithograph', 'Varnish Age', 'varnishYellowing', 0.0, 1.0, 0.05)}
                      {renderSlider('chromolithograph', 'Color Shift', 'colorShift', 0.0, 3.0, 0.1)}
                    </>
                  )}

                  {/* Tintype */}
                  {settings.activeEffect === 'tintype' && (
                    <>
                      {renderSlider('tintype', 'Chem Swirl', 'chemicalSwirl', 0.0, 1.0, 0.05)}
                      {renderSlider('tintype', 'Edge Blur', 'edgeBlur', 0.0, 1.0, 0.05)}
                      {renderSlider('tintype', 'Silver Contrast', 'silverContrast', 0.0, 1.0, 0.05)}
                    </>
                  )}
                </div>

                {/* Universal Adjustments sub-header */}
                {settings[settings.activeEffect]?.brightness !== undefined && (
                  <div className="mt-2 pt-3 border-t border-[#8B4513]/50">
                    <h4 className="text-xs text-term-text-dim font-bold mb-1">Adjustments</h4>
                    {renderSlider(settings.activeEffect, 'Brightness', 'brightness', -100, 100, 1, true, 0)}
                    {renderSlider(settings.activeEffect, 'Contrast', 'contrast', -100, 100, 1, true, 0)}
                  </div>
                )}

                {/* Universal Color sub-header */}
                {settings[settings.activeEffect]?.fgColor !== undefined && (
                  <div className="mt-2 pt-3 border-t border-[#8B4513]/50">
                    <h4 className="text-xs text-term-text-dim font-bold mb-1">Color</h4>
                    <div className="space-y-1 mt-1">
                      {renderColorPicker(settings.activeEffect, 'Foreground', 'fgColor')}
                      {renderColorPicker(settings.activeEffect, 'Background', 'bgColor')}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Post-Processing Section */}
          <section className="space-y-2.5 border-b border-[#8B4513]/50 pb-4">
            <div 
              onClick={() => toggleSection('postprocessing')} 
              className="flex justify-between items-center cursor-pointer select-none text-xs uppercase text-term-text-bright border-b-2 border-term-border pb-1 hover:text-term-accent transition-colors font-semibold"
            >
              <span>{expandedSections.postprocessing ? '[-] Post-Processing' : '[+] Post-Processing'}</span>
            </div>

            {expandedSections.postprocessing && (
              <div className="space-y-2.5 pt-1 text-xs text-term-text-bright font-mono">
                {/* Bloom */}
                <div className="border-b border-term-border/20 pb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold">Bloom Effect</span>
                    <button 
                      onClick={() => updatePostprocess('bloomEnabled', !settings.postprocess.bloomEnabled)}
                      className="text-[10px] border border-term-border px-1.5 py-0.5"
                    >
                      {settings.postprocess.bloomEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {settings.postprocess.bloomEnabled && (
                    <div className="clean-slider-row">
                      <span className="clean-slider-label">Intensity</span>
                      <span className="clean-slider-value">{settings.postprocess.bloomIntensity.toFixed(2)}</span>
                      <input
                        type="range" min="0.0" max="2.0" step="0.05"
                        value={settings.postprocess.bloomIntensity}
                        onChange={(e) => updatePostprocess('bloomIntensity', parseFloat(e.target.value))}
                        className="clean-slider-input"
                      />
                    </div>
                  )}
                </div>

                {/* CRT Curvature */}
                <div className="border-b border-term-border/20 pb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold">CRT Curvature</span>
                    <button 
                      onClick={() => updatePostprocess('crtEnabled', !settings.postprocess.crtEnabled)}
                      className="text-[10px] border border-term-border px-1.5 py-0.5"
                    >
                      {settings.postprocess.crtEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {settings.postprocess.crtEnabled && (
                    <div className="clean-slider-row">
                      <span className="clean-slider-label">Warp Amount</span>
                      <span className="clean-slider-value">{settings.postprocess.crtAmount.toFixed(3)}</span>
                      <input
                        type="range" min="0.0" max="0.15" step="0.005"
                        value={settings.postprocess.crtAmount}
                        onChange={(e) => updatePostprocess('crtAmount', parseFloat(e.target.value))}
                        className="clean-slider-input"
                      />
                    </div>
                  )}
                </div>

                {/* Chromatic Aberration */}
                <div className="border-b border-term-border/20 pb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold">Chromatic Aberration</span>
                    <button 
                      onClick={() => updatePostprocess('chromaticEnabled', !settings.postprocess.chromaticEnabled)}
                      className="text-[10px] border border-term-border px-1.5 py-0.5"
                    >
                      {settings.postprocess.chromaticEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {settings.postprocess.chromaticEnabled && (
                    <div className="clean-slider-row">
                      <span className="clean-slider-label">Offset</span>
                      <span className="clean-slider-value">{settings.postprocess.chromaticOffset.toFixed(1)}</span>
                      <input
                        type="range" min="0.0" max="5.0" step="0.1"
                        value={settings.postprocess.chromaticOffset}
                        onChange={(e) => updatePostprocess('chromaticOffset', parseFloat(e.target.value))}
                        className="clean-slider-input"
                      />
                    </div>
                  )}
                </div>

                {/* Scanlines */}
                <div className="border-b border-term-border/20 pb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold">Scanlines</span>
                    <button 
                      onClick={() => updatePostprocess('scanlinesEnabled', !settings.postprocess.scanlinesEnabled)}
                      className="text-[10px] border border-term-border px-1.5 py-0.5"
                    >
                      {settings.postprocess.scanlinesEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {settings.postprocess.scanlinesEnabled && (
                    <>
                      <div className="clean-slider-row">
                        <span className="clean-slider-label">Opacity</span>
                        <span className="clean-slider-value">{settings.postprocess.scanlinesOpacity.toFixed(2)}</span>
                        <input
                          type="range" min="0.0" max="1.0" step="0.05"
                          value={settings.postprocess.scanlinesOpacity}
                          onChange={(e) => updatePostprocess('scanlinesOpacity', parseFloat(e.target.value))}
                          className="clean-slider-input"
                        />
                      </div>
                      <div className="clean-slider-row">
                        <span className="clean-slider-label">Spacing</span>
                        <span className="clean-slider-value">{settings.postprocess.scanlinesSpacing.toFixed(1)}</span>
                        <input
                          type="range" min="1.0" max="5.0" step="0.5"
                          value={settings.postprocess.scanlinesSpacing}
                          onChange={(e) => updatePostprocess('scanlinesSpacing', parseFloat(e.target.value))}
                          className="clean-slider-input"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Film Grain */}
                <div className="border-b border-term-border/20 pb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold">Film Grain</span>
                    <button 
                      onClick={() => updatePostprocess('grainEnabled', !settings.postprocess.grainEnabled)}
                      className="text-[10px] border border-term-border px-1.5 py-0.5"
                    >
                      {settings.postprocess.grainEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {settings.postprocess.grainEnabled && (
                    <>
                      <div className="clean-slider-row">
                        <span className="clean-slider-label">Intensity</span>
                        <span className="clean-slider-value">{settings.postprocess.grainIntensity.toFixed(0)}</span>
                        <input
                          type="range" min="0.0" max="50.0" step="1.0"
                          value={settings.postprocess.grainIntensity}
                          onChange={(e) => updatePostprocess('grainIntensity', parseFloat(e.target.value))}
                          className="clean-slider-input"
                        />
                      </div>
                      <div className="clean-slider-row">
                        <span className="clean-slider-label">Size</span>
                        <span className="clean-slider-value">{settings.postprocess.grainSize.toFixed(1)}</span>
                        <input
                          type="range" min="1.0" max="4.0" step="0.1"
                          value={settings.postprocess.grainSize}
                          onChange={(e) => updatePostprocess('grainSize', parseFloat(e.target.value))}
                          className="clean-slider-input"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Vignette */}
                <div className="border-b border-term-border/20 pb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold">Vignette shadow</span>
                    <button 
                      onClick={() => updatePostprocess('vignetteEnabled', !settings.postprocess.vignetteEnabled)}
                      className="text-[10px] border border-term-border px-1.5 py-0.5"
                    >
                      {settings.postprocess.vignetteEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {settings.postprocess.vignetteEnabled && (
                    <>
                      <div className="clean-slider-row">
                        <span className="clean-slider-label">Intensity</span>
                        <span className="clean-slider-value">{settings.postprocess.vignetteIntensity.toFixed(2)}</span>
                        <input
                          type="range" min="0.0" max="1.0" step="0.05"
                          value={settings.postprocess.vignetteIntensity}
                          onChange={(e) => updatePostprocess('vignetteIntensity', parseFloat(e.target.value))}
                          className="clean-slider-input"
                        />
                      </div>
                      <div className="clean-slider-row">
                        <span className="clean-slider-label">Radius</span>
                        <span className="clean-slider-value">{settings.postprocess.vignetteRadius.toFixed(2)}</span>
                        <input
                          type="range" min="0.1" max="1.0" step="0.05"
                          value={settings.postprocess.vignetteRadius}
                          onChange={(e) => updatePostprocess('vignetteRadius', parseFloat(e.target.value))}
                          className="clean-slider-input"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Export Section */}
          <section className="space-y-2.5">
            <div 
              onClick={() => toggleSection('export')} 
              className="flex justify-between items-center cursor-pointer select-none text-xs uppercase text-term-text-bright border-b-2 border-term-border pb-1 hover:text-term-accent transition-colors font-semibold"
            >
              <span>{expandedSections.export ? '[-] Export' : '[+] Export'}</span>
            </div>
            
            {expandedSections.export && (
              <div className="space-y-2 pt-1">
                <span className="text-xs text-term-text-dim block mb-1">Format</span>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {[
                    { id: 'png', ext: '.png', label: 'PNG' },
                    { id: 'jpeg', ext: '.jpg', label: 'JPEG' },
                    { id: 'gif', ext: '.gif', label: 'GIF' },
                    { id: 'mp4', ext: '.mp4', label: 'Video' },
                    { id: 'svg', ext: '.svg', label: 'SVG' },
                    { id: 'txt', ext: '.txt', label: 'Text' },
                    { id: 'three', ext: '.html', label: 'Three.js' },
                    { id: 'empty', ext: '', label: '' }
                  ].map(fmt => {
                    return (
                      <button
                        key={fmt.id}
                        onClick={() => {
                          if (fmt.id !== 'empty') {
                            playClickSound();
                            setExportFormat(fmt.id);
                          }
                        }}
                        className={`border px-2 py-1.5 text-left flex flex-col justify-between h-9 transition-colors ${
                          fmt.id === 'empty'
                            ? 'border-term-border/10 cursor-default opacity-0'
                            : exportFormat === fmt.id
                            ? 'border-term-text-bright text-term-text-bright bg-term-text-bright/10'
                            : 'border-term-border text-term-text hover:border-term-text-dim hover:text-term-text-bright'
                        }`}
                        disabled={fmt.id === 'empty'}
                      >
                        <span className="font-semibold text-xs">{fmt.label}</span>
                        <span className="text-[9px] opacity-70">{fmt.ext}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleExportAction}
                  className="export-button-solid"
                >
                  {getExportButtonText()}
                </button>

                {activeMedia && (
                  <div className="flex gap-1.5 pt-2 border-t border-term-border/30 mt-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 text-[10px] text-center border border-term-border py-1 text-term-text hover:text-term-text-bright hover:border-term-text-dim transition-colors"
                    >
                      Change File
                    </button>
                    <button
                      onClick={activeMedia === 'webcam' ? stopWebcam : toggleWebcam}
                      className="flex-1 text-[10px] text-center border border-term-border py-1 text-term-text hover:text-term-text-bright hover:border-term-text-dim transition-colors"
                    >
                      {activeMedia === 'webcam' ? 'Close Camera' : 'Camera Feed'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </aside>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <Agentation />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
