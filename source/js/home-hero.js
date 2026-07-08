(() => {
  if (!document.documentElement.classList.contains("nemo-home")) return;

  const updateNav = () => {
    document.documentElement.classList.toggle("nemo-scrolled", window.scrollY > 40);
  };

  updateNav();
  window.addEventListener("scroll", updateNav, { passive: true });
})();
