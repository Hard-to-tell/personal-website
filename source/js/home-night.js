// Home page "weathering" hero: the photo dissolves into dust on the first scroll,
// part of it settles into a faint horizon and a few grains keep floating behind the posts.
(() => {
  const root = document.documentElement;
  if (!root.classList.contains("nemo-home")) return;

  const IMAGE = innerWidth < 760 ? "/images/hero/isle-1600.webp" : "/images/hero/isle-2560.webp";
  const ANCHOR_Y = 0.62;
  // the scroll walks the picture from just before the first grains lift (FROM) to about half of it gone (TO),
  // measured against releaseAt below; past TO the rest lets go by itself. Portrait screens show the whole sky, so it starts earlier.
  const FROM = innerWidth / innerHeight < 1.1 ? 0.08 : 0.15;
  const TO = 0.28;
  const GLIDE = innerWidth < 760 ? 1300 : 1600;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

  const header = document.querySelector("#header");
  const content = document.querySelector("#content");
  if (!header || !content) return;

  const canvas = document.createElement("canvas");
  canvas.className = "nemo-night-gl";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const gl = reduce ? null : canvas.getContext("webgl2", { antialias: false, alpha: false });

  // title: inscribed by a needle of light, stays while the dust flows past it
  const title = document.createElement("div");
  title.className = "nemo-night-title";
  title.setAttribute("aria-hidden", "true");
  title.innerHTML =
    '<div class="nemo-night-title-mark"><svg viewBox="0 0 400 96"><text x="0" y="76">在流放地</text></svg><i></i></div>' +
    '<span class="nemo-night-rule"></span><span class="nemo-night-kicker">IN DER STRAFKOLONIE</span>';
  const cue = document.createElement("button");
  cue.type = "button";
  cue.className = "nemo-night-cue";
  cue.setAttribute("aria-label", "看文章");
  cue.textContent = "SCROLL";
  header.append(title, cue);
  const needle = title.querySelector("i");

  function inscribe() {
    title.classList.remove("go");
    void title.offsetWidth;
    title.classList.add("go");
    if (reduce) return;
    const svg = title.querySelector("svg");
    const t0 = performance.now();
    const dur = 3400;
    (function tick(now) {
      const k = clamp((now - t0) / dur, 0, 1);
      const r = svg.getBoundingClientRect();
      needle.style.transform = `translate(${r.width * (0.02 + 0.9 * easeInOut(k))}px, ${r.height * (0.45 + 0.28 * Math.sin(k * 46))}px)`;
      needle.style.opacity = k < 1 ? 0.55 + 0.45 * Math.sin(now / 35) : 0;
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }
  const startTitle = () => setTimeout(inscribe, 250);
  if (document.readyState === "complete") startTitle();
  else addEventListener("load", startTitle, { once: true });

  // without WebGL (or with reduced motion) the photo simply sits behind the title
  if (!gl) {
    root.classList.add("nemo-night-static", "nemo-night-in");
    header.style.setProperty("--nemo-night-image", `url(${IMAGE})`);
    return;
  }
  root.classList.add("nemo-night");

  // ---------- weathering ----------
  // p: 0 = photo intact, 1 = fully weathered. Up to TO it follows the wheel or finger (s: 0..1 of that stretch)
  // and can be undone; crossing it lets the rest go in one take and glides down to the posts.
  let p = 0;
  let target = 0;
  let s = 0;
  let state = "scrub";
  let held = false;
  let anim = null;
  const lock = (on) => root.classList.toggle("nemo-night-locked", on);
  const contentTop = () => content.getBoundingClientRect().top + scrollY - 72;

  function play(from, to, dur, ease, done) {
    const t0 = performance.now();
    anim = (now) => {
      const k = clamp((now - t0) / dur, 0, 1);
      p = from + (to - from) * ease(k);
      if (k >= 1) {
        anim = null;
        done && done();
      }
    };
  }
  function scrollToY(y, dur, done) {
    const y0 = scrollY;
    const t0 = performance.now();
    (function step(now) {
      const k = clamp((now - t0) / dur, 0, 1);
      // "instant": the theme sets scroll-behavior: smooth, which would turn every frame into its own lagging animation
      scrollTo({ top: y0 + (y - y0) * easeInOutSine(k), behavior: "instant" });
      if (k < 1) requestAnimationFrame(step);
      else done && done();
    })(t0);
  }
  function weather(glide = true) {
    if (state !== "scrub") return;
    state = "weathering";
    // finish from wherever the scrub left it, already moving
    play(p, 1, 3000, (k) => 1 - Math.pow(1 - k, 2), () => {
      state = "gone";
    });
    // the page has to be scrollable again for the glide; wheel and touch stay held only while it glides.
    // The posts start fading in before they move, so they surface out of the dust instead of arriving from below.
    held = true;
    setTimeout(() => root.classList.add("nemo-night-in"), 150);
    setTimeout(() => {
      lock(false);
      if (glide) scrollToY(contentTop(), GLIDE, () => { held = false; });
      else held = false;
    }, 250);
  }
  function reform() {
    if (state !== "gone") return;
    state = "forming";
    lock(true);
    root.classList.remove("nemo-night-in");
    play(p, 0, 1900, easeInOut, () => {
      state = "scrub";
      target = s = 0;
      inscribe();
    });
  }
  // the posts' images load before they are needed, so nothing pops in while they surface
  let warmed = false;
  function warm() {
    if (warmed) return;
    warmed = true;
    content.querySelectorAll("img.lazyload").forEach((img) => {
      if (window.lazySizes) window.lazySizes.loader.unveil(img);
      else if (img.dataset.src) {
        img.src = img.dataset.src;
        img.classList.replace("lazyload", "lazyloaded");
      }
    });
  }
  addEventListener("load", () => setTimeout(warm, 1200), { once: true });

  function nudge(ds) {
    if (state !== "scrub") return;
    warm();
    s = clamp(s + ds, 0, 1);
    target = s > 0 ? FROM + (TO - FROM) * s : 0;
    if (s >= 1) weather();
  }

  // arriving part-way down the page (reload, back button, anchor): skip straight to the night
  if (scrollY > 40 || location.hash) {
    p = target = 1;
    state = "gone";
    root.classList.add("nemo-night-in");
  } else lock(true);

  addEventListener("wheel", (e) => {
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
    if (state === "scrub") {
      e.preventDefault();
      nudge(dy / 520);
    } else if (held || state === "forming") e.preventDefault();
    else if (state === "gone" && scrollY <= 1 && dy < 0) reform();
  }, { passive: false });
  let touchY = null;
  addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  addEventListener("touchmove", (e) => {
    if (touchY === null) return;
    const y = e.touches[0].clientY;
    const dy = touchY - y;
    touchY = y;
    if (state === "scrub") {
      e.preventDefault();
      nudge(dy / (innerHeight * 0.25));
    } else if (held || state === "forming") e.preventDefault();
    else if (state === "gone" && scrollY <= 1 && dy < -6) reform();
  }, { passive: false });
  addEventListener("keydown", (e) => {
    if (state !== "scrub" || e.target.closest?.("input, textarea, [contenteditable]")) return;
    if (["ArrowDown", " "].includes(e.key)) { e.preventDefault(); nudge(0.34); }
    else if (e.key === "ArrowUp") { e.preventDefault(); nudge(-0.34); }
    else if (["PageDown", "End"].includes(e.key)) { e.preventDefault(); nudge(1); }
  });
  cue.addEventListener("click", () => nudge(1));
  // keyboard focus or the skip link heading for the posts lets the picture go at once
  content.addEventListener("focusin", () => weather(false));
  addEventListener("scroll", () => {
    if (state === "scrub" && scrollY > 4) weather(false);
    if (state === "gone" && scrollY <= 1) reform();
  }, { passive: true });

  function updateDom() {
    const s = clamp((p - 0.5) / 0.35, 0, 1);
    const vis = 1 - s * s * (3 - 2 * s);
    title.style.opacity = vis;
    title.style.transform = `translateY(${-(1 - vis) * 14}px)`;
    title.style.visibility = vis < 0.01 ? "hidden" : "visible";
    cue.style.opacity = 0.55 * (1 - clamp(p / 0.2, 0, 1));
    cue.style.visibility = p > 0.2 ? "hidden" : "visible";
  }

  const COMMON = `
    float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
    float vnoise(vec2 p){
      vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
    }
    float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += a*vnoise(p); p *= 2.03; a *= 0.5; } return s; }
    // when a cell lets go: the sky first, the ground last, along a ragged front
    const float HORIZON = -0.84;   // where the dust settles, in clip space
    float releaseAt(vec2 cell){
      float n = vnoise(cell*5.0)*0.6 + vnoise(cell*17.0)*0.4;
      return (1.0 - cell.y)*0.26 + n*0.2 + hash(cell*311.7)*0.035;
    }
  `;
  
  // night sky behind everything: fine stars at three depths plus a faint haze, slow parallax with scroll
  const skyFS = `#version 300 es
    precision highp float;
    out vec4 o; uniform vec2 uRes; uniform float uTime; uniform float uScroll; uniform float uP;
    ${COMMON}
    vec3 layer(vec2 uv, float scale, float density, float size, float seed){
      vec2 g = uv*scale; vec2 id = floor(g); vec2 f = fract(g) - 0.5;
      float h = hash(id + seed);
      if (h > density) return vec3(0);
      vec2 off = vec2(hash(id+seed+1.7), hash(id+seed+3.1)) - 0.5;
      float d = length(f - off*0.8);
      float tw = 0.6 + 0.4*sin(uTime*(0.6 + h*3.0) + h*80.0);
      float b = smoothstep(size, 0.0, d) * tw;
      vec3 tint = mix(vec3(0.75,0.83,1.0), vec3(1.0,0.9,0.78), hash(id+seed+9.0));
      return tint * b;
    }
    void main(){
      vec2 uv = (gl_FragCoord.xy - 0.5*uRes) / uRes.y;
      float y = gl_FragCoord.y / uRes.y;
      float hy = HORIZON*0.5 + 0.5;
      vec3 col = mix(vec3(0.03,0.05,0.09), vec3(0.008,0.013,0.03), smoothstep(hy, 1.0, y));
      // atmosphere lit from below the horizon, very soft
      float d = y - hy;
      col += vec3(0.10,0.12,0.17) * exp(-max(d,0.0)*9.0) * step(0.0, d) * 0.55;
      col += vec3(0.20,0.17,0.15) * exp(-abs(d)*60.0) * 0.18;
      // below the line: a darker, faintly reflective ground
      col = mix(col, vec3(0.012,0.018,0.03) + vec3(0.05,0.06,0.08)*exp(d*14.0), step(d, 0.0));
      // slow haze high up only
      vec2 hz = uv*1.2 + vec2(uTime*0.004, uScroll*0.08);
      col += vec3(0.04,0.05,0.09) * smoothstep(0.5, 0.95, fbm(hz + fbm(hz*1.7 + 4.0))) * smoothstep(hy+0.1, 0.9, y) * 0.7;
      // a thin scatter of far stars in the upper sky, nothing near the text column's middle band
      float up = smoothstep(0.55, 0.95, y);
      col += layer(uv + vec2(0.0, uScroll*0.03), 120.0, 0.12, 0.10, 1.0) * 0.35 * up;
      col += layer(uv + vec2(0.0, uScroll*0.06),  50.0, 0.05, 0.08, 7.0) * 0.55 * up;
      o = vec4(col * smoothstep(0.0, 0.4, uP), 1.0);
    }`;
  const fullVS = `#version 300 es
    in vec2 a; out vec2 vUv; uniform vec4 uCover;
    void main(){ vec2 s = a*0.5+0.5; vUv = s*uCover.xy + uCover.zw; gl_Position = vec4(a,0,1); }`;
  const quadFS = `#version 300 es
    precision highp float;
    in vec2 vUv; out vec4 o;
    uniform sampler2D uTex; uniform float uP; uniform vec2 uGrid;
    ${COMMON}
    void main(){
      vec2 cell = (floor(vUv*uGrid)+0.5)/uGrid;
      float r = releaseAt(cell);
      // the picture thins out over a short stretch instead of being punched through
      float k = smoothstep(r - 0.02, r + 0.09, uP);
      if (k >= 1.0) discard;
      vec3 c = texture(uTex, vec2(vUv.x, 1.0-vUv.y)).rgb;
      // keep it dim and even, a soft vignette at the edges
      vec2 q = vUv - 0.5;
      c *= 0.92 - dot(q, q)*0.5;
      o = vec4(c, 1.0-k);
    }`;
  const ptVS = `#version 300 es
    in vec2 aCell;
    uniform sampler2D uTex; uniform float uLod; uniform float uP; uniform float uTime;
    uniform vec4 uCover; uniform float uSize; uniform float uDpr; uniform float uAspect;
    out vec3 vCol; out float vA; out float vOcc;
    ${COMMON}
    void main(){
      float r = releaseAt(aCell);
      if (uP <= r) { gl_Position = vec4(2.0,2.0,0,1); gl_PointSize = 0.0; vA = 0.0; vOcc = 0.0; vCol = vec3(0); return; }
      float k = smoothstep(r, r + 0.5, uP);
      vec3 col = textureLod(uTex, vec2(aCell.x, 1.0-aCell.y), uLod).rgb;
  
      vec2 start = ((aCell - uCover.zw) / uCover.xy)*2.0 - 1.0;
      float h1 = hash(aCell*91.7), h2 = hash(aCell*37.3+3.1), h3 = hash(aCell*13.9+7.7), h4 = hash(aCell*5.3+1.9);
      // roles: a little floats on (C), some settles into the horizon (A), the rest falls and fades
      float floater = step(h2, 0.012);
      float settle  = step(0.012, h2) * step(h2, 0.10);
      float e = k*k*(3.0 - 2.0*k);
      // one slow river of wind, right to left, bending through mid-screen (as in the first demo)
      float river = sin(k*3.14159);
      vec2 bend = vec2(-river*(0.5 + 0.35*h3),
                       river*(0.16*sin(start.x*2.6 + uTime*0.25 + h1*6.28) + 0.1*(0.4 - start.y)));
      bend += river*0.025*vec2(sin(uTime*0.7 + h2*40.0), cos(uTime*0.6 + h1*40.0));
  
      // falling dust: carried off to the left, sinking a little, thinning out
      vec2 dust = mix(start, start + vec2(-1.5 - h3*0.9, -0.25 - h1*0.35), e) + bend;
  
      // settling: drifts down onto a thin line, a few grains hang just above it
      float lift = pow(h4, 6.0) * 0.16 + (h3 - 0.5) * 0.008;
      float shimmer = sin(uTime*0.6 + h1*40.0) * 0.002;
      vec2 line = vec2(h1*2.6 - 1.3 + sin(uTime*0.02 + h3*6.0)*0.01, HORIZON + lift + shimmer);
      vec2 settled = mix(start, line, e) + bend;
  
      // floating: wanders slowly up and sideways, wraps around the screen
      vec2 home = vec2(h1*2.4 - 1.2, h3*2.2 - 1.1);
      vec2 wander = vec2(sin(uTime*0.07 + h4*30.0)*0.06, uTime*0.012*(0.4 + h4));
      vec2 fl = home + wander * e; fl.y = mod(fl.y + 1.15, 2.3) - 1.15;
      vec2 floated = mix(start, fl, e) + bend;
  
      vec2 pos = dust;
      pos = mix(pos, settled, settle);
      pos = mix(pos, floated, floater);
  
      float tw = 0.65 + 0.35*sin(uTime*(0.5 + h3*1.8) + h1*60.0);
      vec3 warm = vec3(1.0,0.86,0.68), cool = vec3(0.78,0.86,1.0);
      // grains keep the picture's own colour while they travel; only the survivors turn to light, late
      vec3 endCol = settle > 0.5 ? mix(warm, cool, h3*0.7) : floater > 0.5 ? mix(cool, warm, h3) : col;
      vCol = mix(col, endCol, smoothstep(0.45, 0.95, k));
  
      float dustA = 0.7 * (1.0 - smoothstep(0.12, 0.7, k));
      // the line is bright at its core and dims toward the screen edges
      float edge = 1.0 - smoothstep(0.7, 1.25, abs(line.x));
      float settleA = mix(0.9, (0.22 + 0.25*h3) * mix(0.5, 1.0, edge) * (lift > 0.03 ? 0.6 : 1.0) * tw, smoothstep(0.5, 1.0, k));
      float bokeh = step(h4, 0.18);
      float floatA = mix(0.9, (bokeh > 0.5 ? 0.07 : 0.25 + 0.35*h3) * tw, smoothstep(0.5, 1.0, k));
      // fade floaters near the wrap so they never pop
      floatA *= 1.0 - smoothstep(0.95, 1.12, abs(fl.y)) * smoothstep(0.5, 1.0, k);
      vA = dustA;
      vA = mix(vA, settleA, settle);
      vA = mix(vA, floatA, floater);
      vOcc = 0.0;
      float endSize = settle > 0.5 ? mix(0.9, 1.7, h3) : floater > 0.5 ? (bokeh > 0.5 ? mix(6.0, 11.0, h3) : mix(1.3, 2.6, h3)) : uSize * 0.35;
      gl_PointSize = mix(uSize, endSize, smoothstep(0.0, 0.5, k)) * uDpr;
      gl_Position = vec4(pos, 0.0, 1.0);
    }`;
  const ptFS = `#version 300 es
    precision highp float;
    in vec3 vCol; in float vA; in float vOcc; out vec4 o;
    void main(){
      vec2 d = abs(gl_PointCoord - 0.5);
      float round_ = 1.0 - smoothstep(0.15, 0.5, length(gl_PointCoord - 0.5));
      // square while still part of the picture, round once it is dust
      float m = mix(round_, 1.0, vOcc);
      if (m <= 0.0) discard;
      float a = vA * m;
      o = vec4(vCol * a, a * vOcc);   // premultiplied: occluding early, additive later
    }`;
  
  function prog(vs, fs) {
    const mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
    const pr = gl.createProgram();
    gl.attachShader(pr, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    return pr;
  }
  const skyP = prog(fullVS, skyFS), quadP = prog(fullVS, quadFS), ptP = prog(ptVS, ptFS);
  const U = (pr, n) => gl.getUniformLocation(pr, n);
  
  const quadBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  function quadVao(pr) {
    const v = gl.createVertexArray(); gl.bindVertexArray(v);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    const l = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
    return v;
  }
  const skyVao = quadVao(skyP), imgVao = quadVao(quadP);

  const im = new Image();
  im.decoding = "async";
  im.onload = () => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const T = { w: im.width, h: im.height };
    let gridW;
    let count;
    let ptVao;
    let cover = [1, 1, 0, 0];
    let cellPx = 4;

    function layout() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(innerWidth * dpr);
      canvas.height = Math.round(innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const imgAspect = T.w / T.h;
      const viewAspect = innerWidth / innerHeight;
      // object-fit: cover (image uv has y up), anchored so the island stays in frame
      if (viewAspect > imgAspect) {
        const sy = imgAspect / viewAspect;
        cover = [1, sy, 0, (1 - sy) * (1 - ANCHOR_Y)];
      } else {
        const sx = viewAspect / imgAspect;
        cover = [sx, 1, (1 - sx) * 0.42, 0];   // portrait: keep the whole island in view
      }
      // one particle per cell of the visible part of the picture
      const cols = innerWidth < 760 ? 210 : 400;
      gridW = Math.round(cols / cover[0]);
      const gridH = Math.round(gridW / imgAspect);
      const cells = [];
      const x0 = Math.floor(cover[2] * gridW);
      const x1 = Math.ceil((cover[2] + cover[0]) * gridW);
      const y0 = Math.floor(cover[3] * gridH);
      const y1 = Math.ceil((cover[3] + cover[1]) * gridH);
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) cells.push((x + 0.5) / gridW, (y + 0.5) / gridH);
      count = cells.length / 2;
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cells), gl.STATIC_DRAW);
      ptVao = gl.createVertexArray();
      gl.bindVertexArray(ptVao);
      const l = gl.getAttribLocation(ptP, "aCell");
      gl.enableVertexAttribArray(l);
      gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
      cellPx = innerWidth / (gridW * cover[0]);
      layout.gridH = gridH;
    }
    layout();
    let resizeTimer = 0;
    addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layout, 120);
    });

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    root.classList.add("nemo-night-ready");

    function frame(now) {
      if (anim) anim(now);
      else if (state === "scrub") p += (target - p) * 0.14;
      updateDom();
      const t = now / 1000;

      gl.useProgram(skyP);
      gl.bindVertexArray(skyVao);
      gl.uniform2f(U(skyP, "uRes"), canvas.width, canvas.height);
      gl.uniform1f(U(skyP, "uTime"), t);
      gl.uniform1f(U(skyP, "uScroll"), scrollY / innerHeight);
      gl.uniform1f(U(skyP, "uP"), p);
      gl.uniform4f(U(skyP, "uCover"), 1, 1, 0, 0);
      gl.disable(gl.BLEND);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.enable(gl.BLEND);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      if (p < 0.999) {
        gl.useProgram(quadP);
        gl.bindVertexArray(imgVao);
        gl.uniform1i(U(quadP, "uTex"), 0);
        gl.uniform1f(U(quadP, "uP"), p);
        gl.uniform2f(U(quadP, "uGrid"), gridW, layout.gridH);
        gl.uniform4f(U(quadP, "uCover"), ...cover);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      if (p > 0.0001) {
        gl.useProgram(ptP);
        gl.bindVertexArray(ptVao);
        gl.uniform1i(U(ptP, "uTex"), 0);
        gl.uniform1f(U(ptP, "uLod"), Math.max(0, Math.log2(T.w / gridW)));
        gl.uniform1f(U(ptP, "uP"), p);
        gl.uniform1f(U(ptP, "uTime"), t);
        gl.uniform4f(U(ptP, "uCover"), ...cover);
        gl.uniform1f(U(ptP, "uSize"), cellPx * 1.3);
        gl.uniform1f(U(ptP, "uDpr"), canvas.width / innerWidth);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawArrays(gl.POINTS, 0, count);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };
  im.onerror = () => {
    // no picture, no weathering: just let the page be a page
    state = "gone";
    lock(false);
    root.classList.remove("nemo-night");
    root.classList.add("nemo-night-in");
  };
  im.src = IMAGE;
})();
