(() => {
  "use strict";

  const config = window.__NEMO_LIVE2D__;
  if (!config || document.getElementById("nemo-live2d-widget")) return;

  const root = config.root.endsWith("/") ? config.root : `${config.root}/`;
  const isPage = config.surface === "page";
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const connection = navigator.connection;
  const lowPowerMobile =
    isMobile &&
    (screen.width < 360 ||
      connection?.saveData === true ||
      (navigator.deviceMemory && navigator.deviceMemory < 4) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4));

  if ((!isPage && lowPowerMobile) || !supportsWebGL()) return;

  const hiddenKey = isPage
    ? "nemo-live2d-page-hidden"
    : "nemo-live2d-hidden";
  const modelKey = "nemo-live2d-model";
  const models = [
    {
      id: "asuna",
      name: "亚丝娜",
      outfits: [
        {
          name: "血盟骑士团制服",
          source: `${root}live2d/models/asuna/asuna_01.json`,
        },
        {
          name: "浅色便装",
          source: `${root}live2d/models/asuna/index.json`,
        },
        {
          name: "暖黄毛衣",
          source: `${root}live2d/models/asuna/asuna_03.json`,
        },
        {
          name: "学院制服",
          source: `${root}live2d/models/asuna/asuna_04.json`,
        },
      ],
      fit: { x: 0.5, y: 0.9, scale: 1.45, scaleY: 1.236 },
      motions: { head: "", body: "", lower: "" },
      dialogues: {
        head: [
          "轻一点，头发会乱的。",
          "在想什么？我有在听。",
          "今天的发带还整齐吗？",
          "被你发现我走神了。",
          "嗯……偶尔这样也不坏。",
          "盯着我看这么久……Hentai。",
          "再碰头发，我的怒气槽要满了。",
          "这是摸头杀？对我可不一定有效。",
          "笨蛋，这里又不是触摸屏攻略游戏。",
          "好感度没有这么容易刷啦。",
          "你该不会在等隐藏剧情吧？",
          "警告：连续摸头可能触发反击动作。",
        ],
        body: [
          "这篇文章，你读到哪里了？",
          "坐久了记得起来活动一下。",
          "别只顾着点我，正文还没看完呢。",
          "你今天过得还顺利吗？",
          "如果累了，就在这里停一会儿。",
          "喂，视线往上移一点，Hentai！",
          "这里只是普通互动区域，别想歪了。",
          "攻略选项选错了，读档重来吧。",
          "勇者大人，先把正文主线推进一下。",
          "你以为多点几次就能解锁 CG 吗？",
          "系统提示：好感度增加了……才怪。",
          "检测到可疑点击，已加入观察名单。",
        ],
        lower: [
          "注意到了吗？这套衣服是随机挑的。",
          "下次见面，可能又换了一身。",
          "这套更像亚丝娜，还是上一套？",
          "别一直盯着衣服看啦。",
          "衣角没有压皱吧？",
          "喂，Hentai！你在看哪里？",
          "这不是换装鉴赏模式啦。",
          "想看下一套？先切走再回来。",
          "抽卡没有保底，衣服也是随机的。",
          "这套皮肤不提供属性加成哦。",
          "再点下去，我就把鼠标没收了。",
          "隐藏剧情不存在，请专心看文章。",
        ],
      },
      idle: [
        "安静读一会儿也很好，我会陪着你的。",
        "这一段看完，要不要休息一下眼睛？",
        "今天还有什么想记录下来的事吗？",
        "不用急，文章不会跑掉。",
        "窗外现在是什么天气呢？",
        "要是碰到喜欢的句子，记得把它留下来。",
        "如果这里是异世界，你会选什么职业？",
        "今日任务：读完一篇文章，奖励是一点满足感。",
        "没有 BGM 的时候，风声也很像片尾曲。",
        "好感度正在缓慢上升，请勿使用连点器。",
      ],
    },
    {
      id: "hiyori",
      name: "桃濑日和",
      source: `${root}live2d/models/hiyori/hiyori_free_t08.model3.json`,
      fit: {
        x: 0.5,
        y: 0.535,
        scale: 0.97,
        pageY: 0.8,
        pageScale: 1.5,
      },
      motions: { head: "Flick", body: "Tap@Body", lower: "FlickDown" },
      dialogues: {
        head: [
          "头顶被发现啦。",
          "今天也请多关照。",
          "头发没有翘起来吧？",
          "是在叫我吗？",
          "再摸一下，我就要收门票啦。",
          "摸头次数过多，今日份已经到账。",
          "别把我的发型变成 SSR 爆炸头。",
          "好感度加一，不过离满级还早。",
          "这是来自异世界的问候方式吗？",
          "再摸就要收摩拉……不对，收门票。",
          "我可不是桌面宠物……好吧，暂时算是。",
          "你不会在测试隐藏触摸事件吧？",
        ],
        body: [
          "要一起把这篇文章读完吗？",
          "别忘了偶尔眺望一下远处。",
          "这个动作看起来怎么样？",
          "你是不是又坐了很久？",
          "读累了就和我说说话吧。",
          "你点得这么认真，是在做支线任务吗？",
          "系统提示：这里没有宝箱。",
          "想触发彩蛋？先回答今天喝水了吗？",
          "你的鼠标比剧情推进得还快。",
          "这不是连点器挑战啦。",
          "再点一下，也不会掉落 SSR 哦。",
          "任务更新：回到正文继续阅读。",
        ],
        lower: [
          "站久了也要活动一下哦。",
          "我会在这里安静陪你。",
          "鞋带有好好系紧，不会摔倒的。",
          "再往下看，就快到文章底部啦。",
          "别担心，我没有挡住正文。",
          "喂，Hentai！视线管理一下。",
          "脚边没有隐藏道具啦。",
          "再往下点就要掉出屏幕了。",
          "本区域没有传送门。",
          "你在找像素级彩蛋吗？",
          "鞋子是普通装备，不加暴击率。",
          "连续点击不会解锁新立绘。",
        ],
      },
      idle: [
        "你在认真看文章吗？那我小声一点。",
        "偶尔发发呆，也不算浪费时间。",
        "今天的进度，做到自己满意就好。",
        "要不要喝口水再继续？",
        "这里很安静，我还挺喜欢的。",
        "等你看完这一段，再来找我玩吧。",
        "支线任务刷新：起来喝口水。",
        "SSR 不会从文章里掉出来，但好句子会。",
        "这一页的 BGM，应该是安静的钢琴曲吧。",
        "检测到发呆状态……要继续吗？",
      ],
    },
  ];

  let app;
  let currentModel;
  let currentDefinition;
  let currentOutfit;
  let lastAsunaSource;
  let loadingPromise;
  let messageTimer;
  let idleTalkTimer;
  let resizeObserver;

  const widget = document.createElement("aside");
  widget.id = "nemo-live2d-widget";
  widget.className = `nemo-live2d-widget${isPage ? " is-page" : ""}`;
  widget.setAttribute("aria-label", isPage ? "看板娘" : "文章看板娘");
  widget.innerHTML = `
    <div class="nemo-live2d-message" role="status" aria-live="polite"></div>
    <div class="nemo-live2d-stage">
      <canvas class="nemo-live2d-canvas" aria-hidden="true"></canvas>
      <div class="nemo-live2d-tap-zones" aria-label="与看板娘互动">
        <button type="button" data-tap-area="head" aria-label="摸摸看板娘的头"></button>
        <button type="button" data-tap-area="body" aria-label="点击看板娘的身体"></button>
        <button type="button" data-tap-area="lower" aria-label="点击看板娘的下方"></button>
      </div>
    </div>
    <div class="nemo-live2d-tools" aria-label="看板娘工具">
      <button type="button" data-action="hitokoto" aria-label="显示一言" title="一言">言</button>
      <button type="button" data-action="switch" aria-label="切换角色" title="切换角色">换</button>
      <button type="button" data-action="hide" aria-label="隐藏看板娘" title="隐藏">×</button>
    </div>
    <button class="nemo-live2d-wake" type="button" aria-label="显示看板娘">看板娘</button>
  `;
  document.body.appendChild(widget);

  const stage = widget.querySelector(".nemo-live2d-stage");
  const canvas = widget.querySelector(".nemo-live2d-canvas");
  const tapZones = widget.querySelector(".nemo-live2d-tap-zones");
  const message = widget.querySelector(".nemo-live2d-message");
  const hitokotoButton = widget.querySelector('[data-action="hitokoto"]');
  const switchButton = widget.querySelector('[data-action="switch"]');
  const hideButton = widget.querySelector('[data-action="hide"]');
  const wakeButton = widget.querySelector(".nemo-live2d-wake");

  hitokotoButton.addEventListener("click", showHitokoto);
  switchButton.addEventListener("click", switchModel);
  hideButton.addEventListener("click", hideWidget);
  wakeButton.addEventListener("click", showWidget);
  tapZones.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tap-area]");
    if (button) handleModelTap(button.dataset.tapArea);
  });
  document.addEventListener("visibilitychange", handleVisibilityChange);

  if (localStorage.getItem(hiddenKey) === "1") {
    widget.classList.add("is-hidden");
  } else {
    scheduleLoad();
  }

  function supportsWebGL() {
    try {
      const probe = document.createElement("canvas");
      const context =
        probe.getContext("webgl2") || probe.getContext("webgl");
      context?.getExtension("WEBGL_lose_context")?.loseContext();
      return Boolean(context);
    } catch {
      return false;
    }
  }

  function scheduleLoad() {
    const load = () => ensureLoaded().catch(handleLoadError);
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(load, { timeout: 1800 });
    } else {
      window.setTimeout(load, 700);
    }
  }

  function loadScript(src) {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      return existing.dataset.loaded === "true"
        ? Promise.resolve()
        : new Promise((resolve, reject) => {
            existing.addEventListener("load", resolve, { once: true });
            existing.addEventListener("error", reject, { once: true });
          });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.addEventListener(
        "load",
        () => {
          script.dataset.loaded = "true";
          resolve();
        },
        { once: true }
      );
      script.addEventListener("error", reject, { once: true });
      document.head.appendChild(script);
    });
  }

  function ensureLoaded() {
    if (loadingPromise) return loadingPromise;

    widget.classList.add("is-loading");
    showMessage("正在赶来……", 0);
    const vendor = `${root}live2d/vendor/`;
    loadingPromise = Promise.all([
      loadScript(`${vendor}pixi-6.5.10.min.js`),
      loadScript(`${vendor}live2d-cubism2.min.js`),
      loadScript(`${vendor}live2dcubismcore.min.js`),
    ])
      .then(() => loadScript(`${vendor}pixi-live2d-display-0.4.0.min.js`))
      .then(createRenderer)
      .then(() => loadModel(getSavedModel()))
      .then(() => {
        widget.classList.remove("is-loading");
        showMessage(getTimeGreeting(), 4200);
      })
      .catch((error) => {
        loadingPromise = undefined;
        throw error;
      });

    return loadingPromise;
  }

  function createRenderer() {
    if (app) return;

    const resolution = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 2);
    app = new window.PIXI.Application({
      view: canvas,
      transparent: true,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution,
    });
    app.ticker.maxFPS = isMobile ? 30 : 45;
    window.PIXI.Ticker.shared.maxFPS = isMobile ? 30 : 45;
    window.PIXI.live2d.Live2DModel.registerTicker(window.PIXI.Ticker);

    resizeObserver = new ResizeObserver(resizeRenderer);
    resizeObserver.observe(stage);
    resizeRenderer();
  }

  function getSavedModel() {
    const saved = localStorage.getItem(modelKey);
    return models.find((item) => item.id === saved) || models[0];
  }

  async function loadModel(definition) {
    switchButton.disabled = true;
    const modelSource = pickModelSource(definition);
    if (currentModel) {
      app.stage.removeChild(currentModel);
      currentModel.destroy({ children: true, texture: true, baseTexture: true });
      currentModel = undefined;
    }

    try {
      const model = await window.PIXI.live2d.Live2DModel.from(
        modelSource.source,
        {
          autoInteract: true,
          autoUpdate: true,
          motionPreload: "IDLE",
        }
      );
      currentModel = model;
      currentDefinition = definition;
      currentOutfit = definition.id === "asuna" ? modelSource : undefined;
      widget.dataset.model = definition.id;
      app.stage.addChild(model);
      model.interactive = true;
      model.buttonMode = true;
      fitModel();
      localStorage.setItem(modelKey, definition.id);
    } finally {
      switchButton.disabled = false;
    }
  }

  function pickModelSource(definition) {
    if (!definition.outfits) {
      return { name: definition.name, source: definition.source };
    }

    const unused = definition.outfits.filter(
      (outfit) => outfit.source !== lastAsunaSource
    );
    const outfit = pickRandom(unused.length ? unused : definition.outfits);
    lastAsunaSource = outfit.source;
    return outfit;
  }

  function resizeRenderer() {
    if (!app) return;
    const bounds = stage.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    app.renderer.resize(width, height);
    fitModel();
  }

  function fitModel() {
    if (!app || !currentModel) return;
    currentModel.scale.set(1);
    const widthScale = (app.screen.width * 0.98) / currentModel.width;
    const heightScale = (app.screen.height * 0.98) / currentModel.height;
    const fit = currentDefinition?.fit || {};
    const pageScale = isPage ? fit.pageScale || 1 : 1;
    const scale =
      Math.min(widthScale, heightScale) * (fit.scale || 1) * pageScale;
    currentModel.scale.set(scale, scale * (fit.scaleY || 1));
    currentModel.anchor.set(0.5, 0.5);
    currentModel.position.set(
      app.screen.width * (isPage ? fit.pageX ?? fit.x ?? 0.5 : fit.x ?? 0.5),
      app.screen.height * (isPage ? fit.pageY ?? fit.y ?? 0.5 : fit.y ?? 0.5)
    );
  }

  function handleModelTap(area) {
    if (!currentModel || !currentDefinition) return;

    const definition = currentDefinition;
    const lines = definition.dialogues[area];
    showMessage(lines[Math.floor(Math.random() * lines.length)], 4300);

    const motion = definition.motions[area];
    Promise.resolve(currentModel.motion(motion)).catch(() => {});
  }

  async function switchModel() {
    try {
      await ensureLoaded();
      const index = models.indexOf(currentDefinition);
      const next = models[(index + 1) % models.length];
      showMessage(`正在切换到${next.name}……`, 0);
      await loadModel(next);
      const outfit =
        next.id === "asuna" && currentOutfit
          ? `，这次是${currentOutfit.name}`
          : "";
      showMessage(`现在是${next.name}${outfit}。`, 3800);
    } catch (error) {
      handleLoadError(error);
    }
  }

  async function showHitokoto() {
    hitokotoButton.disabled = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6500);

    try {
      const response = await fetch("https://v1.hitokoto.cn/?encode=json", {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Hitokoto ${response.status}`);
      const result = await response.json();
      const source = result.from ? ` ——《${result.from}》` : "";
      showMessage(`${result.hitokoto}${source}`, 7000);
    } catch {
      const fallback = [
        "愿你在自己的节奏里，慢慢抵达想去的地方。",
        "偶尔停下来，也是在认真生活。",
        "今天读到这里，已经很好了。",
      ];
      showMessage(fallback[Math.floor(Math.random() * fallback.length)], 6500);
    } finally {
      window.clearTimeout(timeout);
      hitokotoButton.disabled = false;
    }
  }

  function showMessage(text, duration) {
    window.clearTimeout(messageTimer);
    window.clearTimeout(idleTalkTimer);
    message.textContent = text;
    message.classList.add("is-visible");
    if (duration > 0) {
      messageTimer = window.setTimeout(
        () => {
          message.classList.remove("is-visible");
          scheduleIdleTalk();
        },
        duration
      );
    }
  }

  function scheduleIdleTalk() {
    window.clearTimeout(idleTalkTimer);
    if (
      !currentDefinition ||
      document.hidden ||
      widget.classList.contains("is-hidden")
    ) {
      return;
    }

    const delay = 32000 + Math.random() * 28000;
    idleTalkTimer = window.setTimeout(() => {
      showMessage(pickRandom(currentDefinition.idle), 5200);
    }, delay);
  }

  function getTimeGreeting() {
    const hour = new Date().getHours();
    if (hour < 6) return "这么晚还没睡？看完这一段就休息吧。";
    if (hour < 11) return "早上好。新的一天，从喜欢的文章开始吧。";
    if (hour < 14) return "中午好。读文章之前，也别忘了按时吃饭。";
    if (hour < 18) return "下午好。容易犯困的话，先起来活动一下吧。";
    if (hour < 22) return "晚上好。今天过得怎么样？";
    return "已经很晚了，记得让眼睛也休息一下。";
  }

  function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function hideWidget() {
    window.clearTimeout(idleTalkTimer);
    localStorage.setItem(hiddenKey, "1");
    widget.classList.add("is-hidden");
    updatePlayback();
  }

  function showWidget() {
    localStorage.removeItem(hiddenKey);
    widget.classList.remove("is-hidden");
    ensureLoaded()
      .then(() => {
        updatePlayback();
        showMessage("我回来啦。", 2600);
      })
      .catch(handleLoadError);
  }

  function updatePlayback() {
    if (!app || !currentModel) return;
    const shouldPlay =
      !document.hidden && !widget.classList.contains("is-hidden");
    currentModel.autoUpdate = shouldPlay;
    if (shouldPlay) app.start();
    else app.stop();
  }

  function handleVisibilityChange() {
    updatePlayback();
    if (document.hidden) {
      window.clearTimeout(idleTalkTimer);
    } else if (!widget.classList.contains("is-hidden") && currentModel) {
      showMessage("你回来啦，刚才读到哪里了？", 3200);
    }
  }

  function handleLoadError(error) {
    widget.classList.remove("is-loading");
    showMessage("看板娘加载失败，可以稍后再试。", 5000);
    console.warn("[nemo-live2d]", error);
  }
})();
