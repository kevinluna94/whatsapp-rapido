const form = document.querySelector("#form");
const phone = document.querySelector("#phone");
const message = document.querySelector("#message");
const error = document.querySelector("#error");
const shareOptions = document.querySelector("#share-options");
const shareEmail = document.querySelector("#share-email");
const shareInstagram = document.querySelector("#share-instagram");
const shareTiktok = document.querySelector("#share-tiktok");
const shareWebsite = document.querySelector("#share-website");
const shareLinkedin = document.querySelector("#share-linkedin");
const shareBank = document.querySelector("#share-bank");
const myPhone = document.querySelector("#my-phone");
const qrMessage = document.querySelector("#qr-message");
const qrStatus = document.querySelector("#qr-status");
const saveProfileButton = document.querySelector("#save-profile");
const profileSaveStatus = document.querySelector("#profile-save-status");
const profileFields = ["name", "email", "my-phone", "qr-message", "instagram", "tiktok", "website", "linkedin", "bank", "holder", "alias", "cbu"];
const chips = [...document.querySelectorAll(".chips button")];
const customList = document.querySelector("#custom-links-list");
const shareCustom = document.querySelector("#share-custom-links");
let customLinks = [];
const checkedCustom = new Set();

function readProfile() {
  return Object.fromEntries(profileFields.map((id) => [id, document.querySelector(`#${id}`).value.trim()]));
}

function newLinkId() {
  return `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function renderCustomRows() {
  customList.replaceChildren();
  customLinks.forEach((link) => {
    const row = document.createElement("div");
    row.className = "custom-link-row";
    const name = document.createElement("input");
    name.className = "profile-input link-name";
    name.placeholder = "Nombre (ej: Formulario)";
    name.maxLength = 40;
    name.setAttribute("aria-label", "Nombre del enlace");
    name.value = link.name;
    const url = document.createElement("input");
    url.className = "profile-input link-url";
    url.placeholder = "https://...";
    url.inputMode = "url";
    url.setAttribute("aria-label", "Enlace");
    url.value = link.url;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "✕";
    remove.setAttribute("aria-label", "Eliminar enlace");
    const onChange = () => {
      link.name = name.value.trim();
      link.url = url.value.trim();
      markPending();
      updateShareOptions();
    };
    name.addEventListener("input", onChange);
    url.addEventListener("input", onChange);
    remove.addEventListener("click", () => {
      customLinks = customLinks.filter((item) => item !== link);
      checkedCustom.delete(link.id);
      renderCustomRows();
      markPending();
      updateShareOptions();
    });
    row.append(name, url, remove);
    customList.append(row);
  });
}

function markPending() {
  profileSaveStatus.textContent = "Hay cambios pendientes. Tocá “Guardar mis datos” para conservarlos.";
  profileSaveStatus.classList.remove("save-error");
}

document.querySelector("#add-custom-link").addEventListener("click", () => {
  customLinks.push({ id: newLinkId(), name: "", url: "" });
  renderCustomRows();
  customList.querySelector(".custom-link-row:last-child .link-name").focus();
});

function validCustomLinks() {
  return customLinks.filter((link) => link.name && formatLink(link.url));
}

try {
  const saved = JSON.parse(localStorage.getItem("whatsapp-rapido-profile") || "{}");
  if (saved["contact-photo-data"]) {
    delete saved["contact-photo-data"];
    localStorage.setItem("whatsapp-rapido-profile", JSON.stringify(saved));
  }
  profileFields.forEach((id) => {
    if (typeof saved[id] === "string") document.querySelector(`#${id}`).value = saved[id];
  });
  if (Array.isArray(saved.customLinks)) {
    customLinks = saved.customLinks
      .filter((item) => item && typeof item.name === "string" && typeof item.url === "string")
      .map((item) => ({ id: typeof item.id === "string" ? item.id : newLinkId(), name: item.name, url: item.url }));
  }
} catch {
  // The form remains usable when browser storage is unavailable.
}
renderCustomRows();

function persistProfile() {
  try {
    localStorage.setItem("whatsapp-rapido-profile", JSON.stringify({ ...readProfile(), customLinks }));
    return true;
  } catch {
    return false;
  }
}

saveProfileButton.addEventListener("click", () => {
  const saved = persistProfile();
  profileSaveStatus.textContent = saved
    ? "¡Listo! Tus datos quedaron guardados en este navegador y dispositivo."
    : "No se pudieron guardar. Revisá el espacio disponible del navegador e intentá otra vez.";
  profileSaveStatus.classList.toggle("save-error", !saved);
});

function updateShareOptions() {
  const profile = readProfile();
  const hasLinks = Boolean(profile.email || profile.instagram || profile.tiktok || profile.website || profile.linkedin) || validCustomLinks().length > 0;
  const hasBank = Boolean(profile.bank || profile.holder || profile.alias || profile.cbu);
  shareOptions.hidden = !(hasLinks || hasBank);
  document.querySelector("#share-email-option").hidden = !profile.email;
  document.querySelector("#share-instagram-option").hidden = !profile.instagram;
  document.querySelector("#share-tiktok-option").hidden = !profile.tiktok;
  document.querySelector("#share-website-option").hidden = !profile.website;
  document.querySelector("#share-linkedin-option").hidden = !profile.linkedin;
  shareBank.closest("label").hidden = !hasBank;
  shareCustom.replaceChildren();
  validCustomLinks().forEach((link) => {
    const label = document.createElement("label");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = checkedCustom.has(link.id);
    box.addEventListener("change", () => (box.checked ? checkedCustom.add(link.id) : checkedCustom.delete(link.id)));
    label.append(box, ` ${link.name}`);
    shareCustom.append(label);
  });
}

document.querySelectorAll(".profile-input").forEach((input) => {
  input.addEventListener("input", () => {
    if (input.id === "my-phone") input.value = input.value.replace(/\D/g, "").slice(0, 10);
    profileSaveStatus.textContent = "Hay cambios pendientes. Tocá “Guardar mis datos” para conservarlos.";
    profileSaveStatus.classList.remove("save-error");
    updateShareOptions();
    renderProfileQrs();
  });
});
updateShareOptions();
renderProfileQrs();

phone.addEventListener("input", () => {
  phone.value = phone.value.replace(/\D/g, "");
  error.hidden = true;
});

chips.forEach((chip) => chip.addEventListener("click", () => {
  const name = readProfile().name;
  message.value = chip.dataset.msg.replace("{intro}", name ? `Soy ${name}. ` : "Nos conocimos recién. ");
  chips.forEach((item) => item.classList.toggle("active", item === chip));
  message.focus();
}));
message.addEventListener("input", () => chips.forEach((chip) => chip.classList.remove("active")));

function formatLink(value) {
  if (!value) return "";
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function escapeVCard(value) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
}

function renderQr(container, value) {
  container.replaceChildren();
  if (!window.qrcode) return false;
  try {
    const qr = window.qrcode(0, "M");
    qr.addData(value, "Byte");
    qr.make();
    container.innerHTML = qr.createSvgTag({ cellSize: 5, margin: 4, scalable: true });
    return true;
  } catch {
    return false;
  }
}

function renderProfileQrs() {
  const whatsappQr = document.querySelector("#whatsapp-qr");
  const contactQr = document.querySelector("#contact-qr");
  const profile = readProfile();
  const digits = profile["my-phone"].replace(/\D/g, "");
  const readyPhone = /^\d{10}$/.test(digits);
  const readyContact = readyPhone && Boolean(profile.name);
  let whatsappGenerated = false;
  let contactGenerated = false;

  if (readyPhone) {
    const text = profile["qr-message"] || "¡Hola! Vi tu QR y quería contactarte.";
    const chatUrl = `https://wa.me/549${digits}?text=${encodeURIComponent(text)}`;
    whatsappGenerated = renderQr(whatsappQr, chatUrl);
  } else {
    whatsappQr.replaceChildren();
  }

  if (readyContact) {
    const name = escapeVCard(profile.name);
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:;${name};;;`,
      `FN:${name}`,
      `TEL;TYPE=CELL:+549${digits}`,
    ];
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(profile.email)}`);
    lines.push("END:VCARD");
    contactGenerated = renderQr(contactQr, lines.join("\r\n"));
  } else {
    contactQr.replaceChildren();
  }

  if (!window.qrcode) {
    qrStatus.textContent = "No se pudo cargar el generador de QR. Conectate a internet y recargá la página.";
  } else if (!readyPhone) {
    qrStatus.textContent = "Completá tu WhatsApp con 10 dígitos en “Tu perfil” para crear tus códigos.";
  } else if (!readyContact) {
    qrStatus.textContent = "El QR de WhatsApp ya está listo. Agregá tu nombre para crear también la tarjeta de contacto.";
  } else if (!contactGenerated) {
    qrStatus.textContent = "No se pudo generar el QR de agenda. Revisá tu nombre, WhatsApp y correo.";
  } else {
    qrStatus.textContent = profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)
      ? "El QR está listo. Revisá el correo: no tiene un formato válido y no se agregará a la tarjeta."
      : "Tus códigos se generan en este dispositivo; tus datos no se envían a un generador externo.";
  }
}

function profileMessage(profile) {
  const links = [
    ["Instagram", profile.instagram, shareInstagram.checked, "\u{1F4F8}"],
    ["TikTok", profile.tiktok, shareTiktok.checked, "\u{1F3B5}"],
    ["Web", profile.website, shareWebsite.checked, "\u{1F310}"],
    ["LinkedIn", profile.linkedin, shareLinkedin.checked, "\u{1F91D}"],
  ].map(([label, value, selected, emoji]) => selected && formatLink(value)
    ? { label, emoji, url: formatLink(value) }
    : null).filter(Boolean);
  validCustomLinks().filter((link) => checkedCustom.has(link.id)).forEach((link) => {
    links.push({ label: link.name, emoji: "\u{1F517}", url: formatLink(link.url), custom: true });
  });
  if (shareEmail.checked && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    links.push({ label: "Correo", emoji: "\u{2709}", url: profile.email });
  }
  const bank = shareBank.checked ? [
    profile.bank && `Banco/billetera: ${profile.bank}`,
    profile.holder && `Titular: ${profile.holder}`,
    profile.alias && `Alias: ${profile.alias}`,
    profile.cbu && `CBU/CVU: ${profile.cbu}`,
  ].filter(Boolean) : [];
  const intros = [];
  if (links.length === 1) {
    const { label, emoji, custom } = links[0];
    intros.push(custom ? `¡Hola! Te dejo este enlace: ${label} ${emoji}` : label === "Instagram" ? `¡Hola! Te dejo mi Instagram para que me sigas ${emoji} ${"\u{1F60A}"}`
      : label === "TikTok" ? `¡Hola! Te dejo mi TikTok para que me sigas ${emoji}`
        : label === "LinkedIn" ? `¡Hola! Te dejo mi LinkedIn para que conectemos ${emoji}`
          : label === "Correo" ? `¡Hola! Te dejo mi correo para que me escribas ${emoji}`
            : `¡Hola! Te dejo mi web para que la visites ${emoji}`);
  } else if (links.length && bank.length) {
    intros.push(`¡Hola! Te dejo mis enlaces y mis datos bancarios por si te sirven ${"\u{1F60A}"}${"\u{1F4B8}"}`);
  } else if (links.length > 1) {
    intros.push(`¡Hola! Te dejo mis redes y mi web para que sigamos en contacto ${"\u{1F60A}"}${"\u{2728}"}`);
  } else if (bank.length) {
    intros.push(`¡Hola! Te dejo mis datos bancarios por si los necesitás ${"\u{1F4B8}"}${"\u{1F60A}"}`);
  }
  const parts = [...intros, ...links.map(({ label, url }) => `${label}: ${url}`)];
  if (bank.length) parts.push(`Datos bancarios:\n${bank.join("\n")}`);
  return parts;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const digits = phone.value.trim();
  if (!/^\d{10}$/.test(digits)) {
    error.textContent = "Revisá el número: ingresá los 10 dígitos, sin 0 ni 15.";
    error.hidden = false;
    phone.focus();
    return;
  }
  const profile = readProfile();
  const selectedExtras = profileMessage(profile);
  const text = [message.value.trim(), ...selectedExtras].filter(Boolean).join("\n\n");
  const url = `https://wa.me/549${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
  window.location.assign(url);
});
