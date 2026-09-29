const installButton = document.querySelector("#install-app");
const installHelp = document.querySelector("#install-help");
let installPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
  installButton.textContent = "Instalar app";
  installHelp.hidden = true;
});

installButton.addEventListener("click", async () => {
  if (!installPrompt) {
    const isApple = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isAndroid = /android/i.test(navigator.userAgent);
    installHelp.textContent = isApple
      ? "En Safari: tocá Compartir y luego ‘Agregar a pantalla de inicio’."
      : isAndroid
        ? "En Chrome: tocá ⋮ y elegí ‘Instalar app’ o ‘Agregar a pantalla principal’. Si abriste este enlace desde otra app, abrilo primero en Chrome."
        : "Abrí este enlace en Chrome o Edge y elegí ‘Instalar app’ en el menú del navegador.";
    installHelp.hidden = false;
    return;
  }

  installPrompt.prompt();
  const { outcome } = await installPrompt.userChoice;
  installPrompt = null;
  if (outcome === "accepted") installButton.hidden = true;
});

window.addEventListener("appinstalled", () => {
  installButton.hidden = true;
  installHelp.hidden = true;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js", { scope: "./" }).catch(() => {});
  });
}

