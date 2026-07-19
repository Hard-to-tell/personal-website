(function () {
  const comments = document.querySelector("#comments");
  const content = comments && comments.querySelector(".comment-content");
  if (!content) return;

  const status = document.createElement("p");
  status.className = "nemo-comment-status";
  status.setAttribute("role", "status");
  status.textContent = "留言区正在加载…";
  content.prepend(status);

  function improveFields() {
    const textarea = comments.querySelector(".tk-input textarea");
    if (!textarea) return false;

    comments.querySelectorAll(".tk-meta-input .el-input").forEach((wrapper) => {
      const input = wrapper.querySelector("input");
      const label = wrapper.querySelector(".el-input-group__prepend");
      if (!input || !label) return;

      const required = input.placeholder === "必填";
      input.setAttribute(
        "aria-label",
        `${label.textContent.trim()}（${required ? "必填" : "选填"}）`
      );
      if (required) input.setAttribute("aria-required", "true");
    });

    textarea.setAttribute("aria-label", "留言内容（必填）");
    textarea.setAttribute("aria-required", "true");
    if (!textarea.placeholder) {
      textarea.placeholder = "写下想说的话…";
    }

    status.remove();
    return true;
  }

  const observer = new MutationObserver(improveFields);
  observer.observe(content, { childList: true, subtree: true });
  improveFields();

  window.setTimeout(() => {
    if (!status.isConnected) return;
    status.classList.add("is-stalled");
    status.textContent = "留言区暂时没有加载出来，请稍后刷新重试。";
  }, 8000);
})();
