hexo.extend.injector.register(
  "head_end",
  () => `<link rel="stylesheet" href="${hexo.config.root}css/custom.css">`,
  "default"
);
