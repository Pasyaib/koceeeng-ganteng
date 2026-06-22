import {
  vertexShader,
  postprocessFragment,
  bloomThresholdFragment,
  bloomBlurFragment,
  shaderMap
} from './shaders.js';

export class RetroEffectRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: true // needed for PNG export
    });
    if (!this.gl) {
      throw new Error('WebGL2 is not supported by your browser');
    }

    this.programs = new Map();
    this.textures = new Map();
    this.framebuffers = new Map();
    
    // Shared quad vertex array (empty since we generate vertices on-the-fly via gl_VertexID)
    this.vao = this.gl.createVertexArray();
    
    // Create base programs
    this.postprocessProgram = this.createProgram(vertexShader, postprocessFragment);
    this.bloomThresholdProgram = this.createProgram(vertexShader, bloomThresholdFragment);
    this.bloomBlurProgram = this.createProgram(vertexShader, bloomBlurFragment);

    // Active textures and configuration
    this.mediaTexture = this.gl.createTexture();
    this.fontAtlasTexture = this.gl.createTexture();
    this.currentCharset = '';
    
    this.time = 0.0;
    this.initTextureState(this.mediaTexture);
    this.initTextureState(this.fontAtlasTexture);
  }

  initTextureState(tex) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
  }

  createProgram(vsSource, fsSource) {
    const gl = this.gl;
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      throw new Error('Vertex shader compile error: ' + gl.getShaderInfoLog(vs));
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      throw new Error('Fragment shader compile error: ' + gl.getShaderInfoLog(fs));
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error('Program link error: ' + gl.getProgramInfoLog(prog));
    }
    
    return prog;
  }

  getEffectProgram(effectId) {
    if (this.programs.has(effectId)) {
      return this.programs.get(effectId);
    }
    const fsSource = shaderMap[effectId];
    if (!fsSource) {
      throw new Error(`Shader source for ${effectId} not found`);
    }
    const prog = this.createProgram(vertexShader, fsSource);
    this.programs.set(effectId, prog);
    return prog;
  }

  updateFontAtlas(charset) {
    if (this.currentCharset === charset) return;
    this.currentCharset = charset;
    
    const charWidth = 12;
    const charHeight = 20;
    
    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = charWidth * charset.length;
    atlasCanvas.height = charHeight;
    
    const ctx = atlasCanvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, atlasCanvas.width, atlasCanvas.height);
    ctx.fillStyle = '#ffffff';
    // Use Share Tech Mono if loaded, fallback to courier monospace
    ctx.font = `bold 16px "Share Tech Mono", "JetBrains Mono", Courier, monospace`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    
    for (let i = 0; i < charset.length; i++) {
      ctx.fillText(charset[i], i * charWidth + charWidth / 2, charHeight / 2);
    }
    
    // Upload font atlas to texture
    const gl = this.gl;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.bindTexture(gl.TEXTURE_2D, this.fontAtlasTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasCanvas);
    gl.texParameteri(gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
  }

  setupFramebuffers(width, height) {
    if (this.fbWidth === width && this.fbHeight === height) return;
    this.fbWidth = width;
    this.fbHeight = height;

    this.disposeFramebuffers();

    // 1. Create main render target (effect output)
    this.effectRT = this.createRenderTarget(width, height);
    // 2. Create bloom threshold render target
    this.bloomThresholdRT = this.createRenderTarget(width, height);
    // 3. Create bloom blur render target (ping-pong)
    this.bloomBlurRT = this.createRenderTarget(width, height);
  }

  createRenderTarget(w, h) {
    const gl = this.gl;
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return { framebuffer: fb, texture: tex };
  }

  disposeFramebuffers() {
    const gl = this.gl;
    const rts = [this.effectRT, this.bloomThresholdRT, this.bloomBlurRT];
    rts.forEach(rt => {
      if (rt) {
        gl.deleteFramebuffer(rt.framebuffer);
        gl.deleteTexture(rt.texture);
      }
    });
  }

  uploadMedia(mediaElement) {
    const gl = this.gl;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, this.mediaTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mediaElement);
  }

  render(mediaElement, settings, deltaTime, mouse = { x: 0.5, y: 0.5, active: 0.0 }) {
    this.time += deltaTime;
    const gl = this.gl;
    
    if (!mediaElement) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }

    // Get media dimensions
    let mediaW = 640;
    let mediaH = 480;
    if (mediaElement instanceof HTMLImageElement) {
      mediaW = mediaElement.naturalWidth;
      mediaH = mediaElement.naturalHeight;
    } else if (mediaElement instanceof HTMLVideoElement) {
      mediaW = mediaElement.videoWidth;
      mediaH = mediaElement.videoHeight;
    }

    if (mediaW === 0 || mediaH === 0) return;

    // Output dimension setup (scale down output width if configured)
    let outputW = settings.width || mediaW;
    let outputH = settings.height || mediaH;
    
    if (settings.ascii?.outputWidth > 0 && settings.activeEffect === 'ascii') {
      const scaleFactor = settings.ascii.outputWidth / mediaW;
      outputW = settings.ascii.outputWidth;
      outputH = Math.round(mediaH * scaleFactor);
    }
    
    // Keep canvas display matches output dimensions
    if (this.canvas.width !== outputW || this.canvas.height !== outputH) {
      this.canvas.width = outputW;
      this.canvas.height = outputH;
    }

    this.setupFramebuffers(outputW, outputH);
    this.uploadMedia(mediaElement);

    // Bind Vertex Array Object
    gl.bindVertexArray(this.vao);

    // ==========================================
    // PASS 1: Render retro effect to effectRT
    // ==========================================
    const effectProg = this.getEffectProgram(settings.activeEffect);
    gl.useProgram(effectProg);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.effectRT.framebuffer);
    gl.viewport(0, 0, outputW, outputH);

    // Bind texture 0: source media
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.mediaTexture);
    this.setUniform1i(effectProg, 'inputTexture', 0);
    
    // Bind texture 1: font atlas (if active effect requires it)
    if (settings.activeEffect === 'ascii' || settings.activeEffect === 'matrixRain') {
      const activeCharset = settings.activeEffect === 'ascii' ? settings.ascii.chars : settings.matrixRain.chars;
      this.updateFontAtlas(activeCharset);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.fontAtlasTexture);
      this.setUniform1i(effectProg, 'fontAtlas', 1);
    }

    this.setUniform2f(effectProg, 'resolution', outputW, outputH);
    this.setUniform1f(effectProg, 'time', this.time);
    
    // Pass mouse coordinate uniforms
    this.setUniform2f(effectProg, 'uMouse', mouse.x, mouse.y);
    this.setUniform1f(effectProg, 'uMouseActive', mouse.active);
    
    // Set shader uniforms based on active effect settings
    this.applyEffectUniforms(effectProg, settings);

    // Drawfullscreen triangle
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // ==========================================
    // PASS 2: Bloom (if enabled)
    // ==========================================
    let isBloomActive = settings.postprocess.bloomEnabled && settings.postprocess.bloomIntensity > 0.0;
    if (isBloomActive) {
      // Extract bright pixels to bloomThresholdRT
      gl.useProgram(this.bloomThresholdProgram);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomThresholdRT.framebuffer);
      gl.viewport(0, 0, outputW, outputH);
      
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.effectRT.texture);
      this.setUniform1i(this.bloomThresholdProgram, 'inputTexture', 0);
      this.setUniform1f(this.bloomThresholdProgram, 'threshold', 0.55); // fixed bright threshold
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Horizontal blur to bloomBlurRT
      gl.useProgram(this.bloomBlurProgram);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomBlurRT.framebuffer);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.bloomThresholdRT.texture);
      this.setUniform1i(this.bloomBlurProgram, 'inputTexture', 0);
      this.setUniform2f(this.bloomBlurProgram, 'resolution', outputW, outputH);
      this.setUniform2f(this.bloomBlurProgram, 'direction', 1.0, 0.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Vertical blur back to bloomThresholdRT
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomThresholdRT.framebuffer);
      gl.bindTexture(gl.TEXTURE_2D, this.bloomBlurRT.texture);
      this.setUniform2f(this.bloomBlurProgram, 'direction', 0.0, 1.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // ==========================================
    // PASS 3: Postprocessing and CRT layout (drawn on canvas)
    // ==========================================
    gl.useProgram(this.postprocessProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); // Render direct to screen
    gl.viewport(0, 0, outputW, outputH);

    // Bind texture 0: effectRT result
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.effectRT.texture);
    this.setUniform1i(this.postprocessProgram, 'inputTexture', 0);

    // Bind texture 1: bloomBlurred result
    if (isBloomActive) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.bloomThresholdRT.texture);
      this.setUniform1i(this.postprocessProgram, 'bloomTexture', 1);
    }
    this.setUniform1i(this.postprocessProgram, 'bloomEnabled', isBloomActive ? 1 : 0);
    this.setUniform1f(this.postprocessProgram, 'bloomIntensity', settings.postprocess.bloomIntensity);

    // CRT and Phosphor settings
    const p = settings.postprocess;
    this.setUniform2f(this.postprocessProgram, 'resolution', outputW, outputH);
    this.setUniform1f(this.postprocessProgram, 'time', this.time);
    
    this.setUniform1i(this.postprocessProgram, 'crtEnabled', p.crtEnabled ? 1 : 0);
    this.setUniform1f(this.postprocessProgram, 'crtAmount', p.crtAmount);
    
    this.setUniform1i(this.postprocessProgram, 'chromaticEnabled', p.chromaticEnabled ? 1 : 0);
    this.setUniform1f(this.postprocessProgram, 'chromaticOffset', p.chromaticOffset);

    this.setUniform1i(this.postprocessProgram, 'scanlinesEnabled', p.scanlinesEnabled ? 1 : 0);
    this.setUniform1f(this.postprocessProgram, 'scanlinesOpacity', p.scanlinesOpacity);
    this.setUniform1f(this.postprocessProgram, 'scanlinesSpacing', p.scanlinesSpacing);

    this.setUniform1i(this.postprocessProgram, 'grainEnabled', p.grainEnabled ? 1 : 0);
    this.setUniform1f(this.postprocessProgram, 'grainIntensity', p.grainIntensity);
    this.setUniform1f(this.postprocessProgram, 'grainSize', p.grainSize);
    this.setUniform1f(this.postprocessProgram, 'grainSpeed', p.grainSpeed);

    this.setUniform1i(this.postprocessProgram, 'vignetteEnabled', p.vignetteEnabled ? 1 : 0);
    this.setUniform1f(this.postprocessProgram, 'vignetteIntensity', p.vignetteIntensity);
    this.setUniform1f(this.postprocessProgram, 'vignetteRadius', p.vignetteRadius);

    this.setUniform1i(this.postprocessProgram, 'phosphorEnabled', p.phosphorEnabled ? 1 : 0);
    const phosphorRGB = this.hexToRgb(p.phosphorColor || '#00ff00');
    this.setUniform3f(this.postprocessProgram, 'phosphorColor', phosphorRGB.r, phosphorRGB.g, phosphorRGB.b);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  applyEffectUniforms(prog, settings) {
    const fx = settings.activeEffect;
    const s = settings[fx];
    if (!s) return;

    // Apply brightness and contrast universally
    this.setUniform1f(prog, 'brightness', s.brightness !== undefined ? s.brightness : 0.0);
    this.setUniform1f(prog, 'contrast', s.contrast !== undefined ? s.contrast : 0.0);
    this.setUniform1f(prog, 'invert', s.invert ? 1.0 : 0.0);

    // Apply colors if custom mono color mode is selected
    if (s.fgColor) {
      const rgb = this.hexToRgb(s.fgColor);
      this.setUniform3f(prog, 'fgColor', rgb.r, rgb.g, rgb.b);
    }
    if (s.bgColor) {
      const rgb = this.hexToRgb(s.bgColor);
      this.setUniform3f(prog, 'bgColor', rgb.r, rgb.g, rgb.b);
    }
    if (s.halationTint) {
      const rgb = this.hexToRgb(s.halationTint);
      this.setUniform3f(prog, 'halationTint', rgb.r, rgb.g, rgb.b);
    }
    if (s.cyanColor) {
      const rgb = this.hexToRgb(s.cyanColor);
      this.setUniform3f(prog, 'cyanColor', rgb.r, rgb.g, rgb.b);
    }
    if (s.inkColor) {
      const rgb = this.hexToRgb(s.inkColor);
      this.setUniform3f(prog, 'inkColor', rgb.r, rgb.g, rgb.b);
    }
    if (s.paperColor) {
      const rgb = this.hexToRgb(s.paperColor);
      this.setUniform3f(prog, 'paperColor', rgb.r, rgb.g, rgb.b);
    }
    if (s.colorMode !== undefined) {
      const modeInt = s.colorMode === 'custom' || s.colorMode === 'mono' || s.colorMode === 'bw' ? 0 : 1;
      this.setUniform1i(prog, 'colorMode', modeInt);
    }

    // Effect specific parameters
    if (fx === 'halation') {
      this.setUniform1f(prog, 'halationRadius', s.halationRadius);
      this.setUniform1f(prog, 'halationStrength', s.halationStrength);
      this.setUniform1f(prog, 'halationThreshold', s.halationThreshold);
    } else if (fx === 'filmGrain') {
      this.setUniform1f(prog, 'grainSize', s.grainSize);
      this.setUniform1f(prog, 'grainAmount', s.grainAmount);
      this.setUniform1f(prog, 'grainSpeed', s.grainSpeed);
      this.setUniform1i(prog, 'grainColor', s.grainColor ? 1 : 0);
    } else if (fx === 'lightLeaks') {
      this.setUniform1f(prog, 'leakIntensity', s.leakIntensity);
      this.setUniform1f(prog, 'leakSpeed', s.leakSpeed);
      this.setUniform1f(prog, 'leakScale', s.leakScale);
    } else if (fx === 'dustScratches') {
      this.setUniform1f(prog, 'dustDensity', s.dustDensity);
      this.setUniform1f(prog, 'scratchDensity', s.scratchDensity);
      if (s.noiseColor) {
        const rgb = this.hexToRgb(s.noiseColor);
        this.setUniform3f(prog, 'noiseColor', rgb.r, rgb.g, rgb.b);
      }
    } else if (fx === 'risograph') {
      this.setUniform1f(prog, 'risoGrain', s.risoGrain);
      this.setUniform1f(prog, 'risoContrast', s.risoContrast);
    } else if (fx === 'halftone') {
      this.setUniform1f(prog, 'halftoneSize', s.halftoneSize);
      this.setUniform1f(prog, 'dotAngle', s.dotAngle);
      if (s.paperColor) {
        const rgb = this.hexToRgb(s.paperColor);
        this.setUniform3f(prog, 'paperColor', rgb.r, rgb.g, rgb.b);
      }
      if (s.inkColor) {
        const rgb = this.hexToRgb(s.inkColor);
        this.setUniform3f(prog, 'inkColor', rgb.r, rgb.g, rgb.b);
      }
    } else if (fx === 'filmBurn') {
      this.setUniform1f(prog, 'burnIntensity', s.burnIntensity);
      this.setUniform1f(prog, 'burnSpeed', s.burnSpeed);
      this.setUniform1f(prog, 'burnScale', s.burnScale);
    } else if (fx === 'polaroidFade') {
      this.setUniform1f(prog, 'fadeAmount', s.fadeAmount);
      this.setUniform1f(prog, 'vignette', s.vignette);
      this.setUniform1f(prog, 'tintWarmth', s.tintWarmth);
    } else if (fx === 'crtScanlines') {
      this.setUniform1f(prog, 'scanlineOpacity', s.scanlineOpacity);
      this.setUniform1f(prog, 'scanlineDensity', s.scanlineDensity);
      this.setUniform1f(prog, 'phosphorStrength', s.phosphorStrength);
    } else if (fx === 'cmykMisregistration' || fx === 'cmykShift') {
      this.setUniform1f(prog, 'offsetCyan', s.offsetCyan);
      this.setUniform1f(prog, 'offsetMagenta', s.offsetMagenta);
      this.setUniform1f(prog, 'offsetYellow', s.offsetYellow);
    } else if (fx === 'newspaper') {
      this.setUniform1f(prog, 'dotDensity', s.dotDensity);
      if (s.paperColor) {
        const rgb = this.hexToRgb(s.paperColor);
        this.setUniform3f(prog, 'paperColor', rgb.r, rgb.g, rgb.b);
      }
      if (s.inkColor) {
        const rgb = this.hexToRgb(s.inkColor);
        this.setUniform3f(prog, 'inkColor', rgb.r, rgb.g, rgb.b);
      }
    } else if (fx === 'photocopy') {
      this.setUniform1f(prog, 'tonerDarkness', s.tonerDarkness);
      this.setUniform1f(prog, 'smearAmount', s.smearAmount);
      this.setUniform1f(prog, 'noiseLevel', s.noiseLevel);
      this.setUniform1f(prog, 'contrastLimit', s.contrastLimit);
      this.setUniform1f(prog, 'tonerScarcity', s.tonerScarcity);
      this.setUniform1f(prog, 'scannerLight', s.scannerLight);
    } else if (fx === 'paperAging') {
      this.setUniform1f(prog, 'yellowing', s.yellowing);
      this.setUniform1f(prog, 'edgeDarkening', s.edgeDarkening);
      this.setUniform1f(prog, 'wearAndTear', s.wearAndTear);
    } else if (fx === 'inkBleed') {
      this.setUniform1f(prog, 'bleedRadius', s.bleedRadius);
      this.setUniform1f(prog, 'inkAbsorption', s.inkAbsorption);
    } else if (fx === 'cyanotype') {
      this.setUniform1f(prog, 'blueIntensity', s.blueIntensity);
      this.setUniform1f(prog, 'stainAmount', s.stainAmount);
      this.setUniform1f(prog, 'exposure', s.exposure);
    } else if (fx === 'screenPrint') {
      this.setUniform1f(prog, 'colorCount', s.colorCount);
      this.setUniform1f(prog, 'meshDensity', s.meshDensity);
      this.setUniform1f(prog, 'inkBleed', s.inkBleed);
    } else if (fx === 'thermalReceipt') {
      this.setUniform1f(prog, 'fading', s.fading);
      this.setUniform1f(prog, 'bandingIntensity', s.bandingIntensity);
      this.setUniform1f(prog, 'paperGloss', s.paperGloss);
    } else if (fx === 'dotMatrix') {
      this.setUniform1f(prog, 'dotResolution', s.dotResolution);
      this.setUniform1f(prog, 'ribbonWear', s.ribbonWear);
      this.setUniform1f(prog, 'horizontalBanding', s.horizontalBanding);
    } else if (fx === 'linoCut') {
      this.setUniform1f(prog, 'gougeDirection', s.gougeDirection);
      this.setUniform1f(prog, 'edgeRoughness', s.edgeRoughness);
      this.setUniform1f(prog, 'inkSplatter', s.inkSplatter);
      this.setUniform1f(prog, 'woodGrain', s.woodGrain);
      this.setUniform1f(prog, 'carvingDepth', s.carvingDepth);
    } else if (fx === 'carbonCopy') {
      this.setUniform1f(prog, 'ghostingOffset', s.ghostingOffset);
      this.setUniform1f(prog, 'smudgeAmount', s.smudgeAmount);
      this.setUniform1f(prog, 'penPressure', s.penPressure);
    } else if (fx === 'typewriter') {
      this.setUniform1f(prog, 'ribbonInk', s.ribbonInk);
      this.setUniform1f(prog, 'strikeMessiness', s.strikeMessiness);
      this.setUniform1f(prog, 'paperGrain', s.paperGrain);
      this.setUniform1f(prog, 'letterTilt', s.letterTilt);
      this.setUniform1f(prog, 'doubleStrike', s.doubleStrike);
    } else if (fx === 'mimeograph') {
      this.setUniform1f(prog, 'rollerMarks', s.rollerMarks);
      this.setUniform1f(prog, 'inkSoak', s.inkSoak);
      this.setUniform1f(prog, 'violetTint', s.violetTint);
    } else if (fx === 'chromolithograph') {
      this.setUniform1f(prog, 'stippleDensity', s.stippleDensity);
      this.setUniform1f(prog, 'varnishYellowing', s.varnishYellowing);
      this.setUniform1f(prog, 'colorShift', s.colorShift);
    } else if (fx === 'tintype') {
      this.setUniform1f(prog, 'chemicalSwirl', s.chemicalSwirl);
      this.setUniform1f(prog, 'edgeBlur', s.edgeBlur);
      this.setUniform1f(prog, 'silverContrast', s.silverContrast);
    }
  }

  // Uniform setters helpers
  setUniform1i(prog, name, val) {
    const loc = this.gl.getUniformLocation(prog, name);
    if (loc) this.gl.uniform1i(loc, val);
  }
  setUniform1f(prog, name, val) {
    const loc = this.gl.getUniformLocation(prog, name);
    if (loc) this.gl.uniform1f(loc, val);
  }
  setUniform2f(prog, name, x, y) {
    const loc = this.gl.getUniformLocation(prog, name);
    if (loc) this.gl.uniform2f(loc, x, y);
  }
  setUniform3f(prog, name, x, y, z) {
    const loc = this.gl.getUniformLocation(prog, name);
    if (loc) this.gl.uniform3f(loc, x, y, z);
  }

  hexToRgb(hex) {
    const cleanHex = hex.replace('#', '');
    const num = parseInt(cleanHex, 16);
    return {
      r: ((num >> 16) & 255) / 255,
      g: ((num >> 8) & 255) / 255,
      b: (num & 255) / 255
    };
  }

  dispose() {
    this.disposeFramebuffers();
    this.gl.deleteTexture(this.mediaTexture);
    this.gl.deleteTexture(this.fontAtlasTexture);
    this.gl.deleteVertexArray(this.vao);
    this.programs.forEach(prog => this.gl.deleteProgram(prog));
    this.gl.deleteProgram(this.postprocessProgram);
    this.gl.deleteProgram(this.bloomThresholdProgram);
    this.gl.deleteProgram(this.bloomBlurProgram);
  }
}
