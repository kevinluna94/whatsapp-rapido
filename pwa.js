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
    installHelp.textContent = /iphone|ipad|ipod/i.test(navigator.userAgent)
      ? "En Safari, tocá Compartir y elegí ‘Agregar a pantalla de inicio’."
      : "Abrí el menú del navegador y elegí ‘Instalar app’ o ‘Agregar a pantalla principal’.";
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

