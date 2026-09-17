(() => {
  if (!document.documentElement.classList.contains("nemo-home")) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const header = document.querySelector("#header");
  const title = document.querySelector("#header-title h1");
  if (!header || !title) return;

  const canvas = document.createElement("canvas");
  canvas.className = "nemo-title-erosion";
  canvas.setAttribute("aria-hidden", "true");
  header.append(canvas);
  const context = canvas.getContext("2d");
  let particles = [];
  let titleImage = null;
  let originX = 0;
  let originY = 0;
  let imageWidth = 0;
  let imageHeight = 0;
  let scheduled = false;

  const hash = (value) => {
    const number = Math.sin(value * 91.733) * 43758.5453;
    return number - Math.floor(number);
  };

  const prepare = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(header.clientWidth * ratio);
    canvas.height = Math.round(header.clientHeight * ratio);
    canvas.style.width = `${header.clientWidth}px`;
    canvas.style.height = `${header.clientHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const titleBox = title.getBoundingClientRect();
    const headerBox = header.getBoundingClientRect();
    const style = getComputedStyle(title);
    const padding = 20;
    imageWidth = Math.ceil(titleBox.width + padding * 2);
    imageHeight = Math.ceil(titleBox.height + padding * 2);
    originX = titleBox.left - headerBox.left - padding;
    originY = titleBox.top - headerBox.top - padding;

    titleImage = document.createElement("canvas");
    titleImage.width = imageWidth;
    titleImage.height = imageHeight;
    const mask = titleImage.getContext("2d");
    mask.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    mask.textAlign = "center";
    mask.textBaseline = "middle";
    mask.fillStyle = "#fff";
    mask.shadowColor = "rgba(4, 10, 20, .55)";
    mask.shadowBlur = 12;
    mask.fillText(title.textContent.trim(), imageWidth / 2, imageHeight / 2);

    const pixels = mask.getImageData(0, 0, imageWidth, imageHeight).data;
    particles = [];
    const step = header.clientWidth < 600 ? 4 : 3;
    let index = 0;
    for (let y = 0; y < imageHeight; y += step) {
      for (let x = 0; x < imageWidth; x += step) {
        if (pixels[(y * imageWidth + x) * 4 + 3] < 90) continue;
        const seed = index++;
        particles.push({
          x,
          y,
          delay: hash(seed + 2) * 0.34,
          dx: 36 + hash(seed + 7) * 150,
          dy: (hash(seed + 13) - 0.52) * 76,
          size: 0.7 + hash(seed + 19) * 1.25,
        });
      }
    }
    document.documentElement.classList.add("nemo-erosion-ready");
    draw();
  };

  const draw = () => {
    scheduled = false;
    if (!titleImage) return;
    const progress = Math.min(1, Math.max(0, window.scrollY / (header.clientHeight * 0.56)));
    const eased = progress * progress * (3 - 2 * progress);
    context.clearRect(0, 0, header.clientWidth, header.clientHeight);
    context.globalAlpha = Math.max(0, 1 - eased * 1.5);
    context.drawImage(titleImage, originX, originY, imageWidth, imageHeight);
    context.globalAlpha = 1;
    context.fillStyle = "rgba(244, 247, 250, .92)";
    particles.forEach((particle) => {
      const local = Math.min(1, Math.max(0, (eased - particle.delay) / (1 - particle.delay)));
      if (local <= 0 || local >= 0.98) return;
      const drift = local * local;
      context.globalAlpha = (1 - local) * Math.min(1, local * 7);
      context.fillRect(
        originX + particle.x + particle.dx * drift,
        originY + particle.y + particle.dy * drift,
        particle.size,
        particle.size
      );
    });
    context.globalAlpha = 1;
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(draw);
  };
  const resize = () => {
    window.clearTimeout(resize.timer);
    resize.timer = window.setTimeout(prepare, 120);
  };

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(prepare);
  else prepare();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", resize);
})();
