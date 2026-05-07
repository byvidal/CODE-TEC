const mainForm = document.querySelector("#mainForm");
const locationButton = document.querySelector("#locationButton");
const detectSoilButton = document.querySelector("#detectSoilButton");
const coordsText = document.querySelector("#coordsText");
const statusText = document.querySelector("#connectionStatus");
const toast = document.querySelector("#toast");
const emptyState = document.querySelector("#emptyState");
const results = document.querySelector("#results");
const cropSearchInput = document.querySelector("#cropSearchInput");
const cropDropdown = document.querySelector("#cropDropdown");
const cropSearchHelp = document.querySelector("#cropSearchHelp");
const cropClearButton = document.querySelector("#cropClearButton");
const selectedCropId = document.querySelector("#selectedCropId");
const selectedCropName = document.querySelector("#selectedCropName");
const pdfButton = document.querySelector("#pdfButton");
const miniMapDiv = document.querySelector("#miniMap");
const mapOverlay = document.querySelector("#mapOverlay");
const addressText = document.querySelector("#addressText");

const fields = {
  latitude: document.querySelector("#latitude"),
  longitude: document.querySelector("#longitude"),
  soilType: document.querySelector("#soilType"),
  fertilityLevel: document.querySelector("#fertilityLevel"),
  landSizeHa: document.querySelector("#landSizeHa")
};

const soilUi = {
  status: document.querySelector("#soilAutoStatus"),
  source: document.querySelector("#soilAutoSource"),
  texture: document.querySelector("#soilAutoTexture"),
  fertility: document.querySelector("#soilAutoFertility"),
  confidence: document.querySelector("#soilAutoConfidence"),
  hint: document.querySelector("#soilAutoHint"),
  properties: document.querySelector("#soilAutoProperties")
};

let allCrops = [];
let lastReportRequest = null;
let lastSoilDetection = null;
let soilAutoMode = true;
let isApplyingSoilSuggestion = false;

let map = null;
let mapMarker = null;
let mapAccuracyCircle = null;

let reverseLookupTimer = null;
let reverseLookupRequestId = 0;
let manualInputTimer = null;
let soilDetectionTimer = null;
let soilDetectionRequestId = 0;

const LOCATION_DEBOUNCE_MS = 700;
const MANUAL_INPUT_DEBOUNCE_MS = 500;
const SOIL_DETECTION_DEBOUNCE_MS = 750;
const REVERSE_GEOCODE_ENDPOINT = "/api/geocode/reverse";
const SOIL_DETECTION_ENDPOINT = "/api/soil/detect";
const LOCATION_BUTTON_LABEL = "Usar ubicacion actual";
const LOCATION_BUTTON_LOADING_LABEL = "Localizando...";
const GEOLOCATION_TIMEOUT_MS = 15000;
const GEOLOCATION_MAX_AGE_MS = 30000;

const SOIL_LABELS = {
  auto: "Automatico",
  franco: "Franco",
  arenoso: "Arenoso",
  arcilloso: "Arcilloso",
  limoso: "Limoso"
};

const FERTILITY_LABELS = {
  auto: "Automatica",
  bueno: "Bueno",
  medio: "Medio",
  pobre: "Pobre"
};

document.addEventListener("DOMContentLoaded", () => {
  loadAndSetupCrops();
  initializeMap();
  updateCropClearButton();
  updateSoilAutoCardFromManual();
});

function setStatus(message) {
  if (statusText) {
    statusText.textContent = message;
  }
}

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove("hidden");
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => toast.classList.add("hidden"), 5400);
}

function setLoading(isLoading) {
  const submitButton = mainForm?.querySelector("button[type='submit']");

  if (submitButton) {
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? "Analizando parcela..." : "Generar plan agricola";
  }

  setStatus(isLoading ? "Consultando" : "Listo");
}

function setLocationButtonLoading(isLoading) {
  if (!locationButton) return;

  locationButton.disabled = isLoading;
  const label = isLoading ? LOCATION_BUTTON_LOADING_LABEL : LOCATION_BUTTON_LABEL;
  locationButton.innerHTML = `<span aria-hidden="true">GPS</span> ${label}`;
}

function setSoilDetectionLoading(isLoading) {
  if (!detectSoilButton) return;

  detectSoilButton.disabled = isLoading;
  detectSoilButton.textContent = isLoading ? "Detectando..." : "Detectar suelo";
}

function setCoordsText(latitude, longitude, accuracy) {
  if (!coordsText) return;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    coordsText.textContent = "Sin ubicacion";
    return;
  }

  const accuracyText = Number.isFinite(accuracy) ? ` (±${Math.round(accuracy)} m)` : "";
  coordsText.textContent = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}${accuracyText}`;
}

function setAddressText(message) {
  if (addressText) {
    addressText.textContent = message;
  }
}

function toggleMapOverlay(isVisible) {
  mapOverlay?.classList.toggle("hidden", !isVisible);
}

function formatNumber(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return Number(value).toLocaleString("es-MX", {
    maximumFractionDigits: digits
  });
}

function formatPercent(value) {
  if (!Number.isFinite(Number(value))) {
    return "-";
  }

  return `${Math.round(Number(value) * 100)}%`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fillList(elementId, items) {
  const element = document.querySelector(`#${elementId}`);

  if (!element) {
    return;
  }

  element.innerHTML = "";

  if (!items?.length) {
    const li = document.createElement("li");
    li.textContent = "Sin datos disponibles.";
    element.appendChild(li);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    element.appendChild(li);
  });
}

async function loadAndSetupCrops() {
  if (cropSearchHelp) {
    cropSearchHelp.textContent = "Cargando catalogo de cultivos...";
  }

  try {
    const response = await fetch("/api/crops");

    if (!response.ok) {
      throw new Error("No se pudo cargar el catalogo.");
    }

    const data = await response.json();
    allCrops = sortCrops(data.crops || []);

    const sourceLabel =
      data.source === "catalogo-local+Perenual"
        ? "catalogo local con datos Perenual"
        : "catalogo local";

    if (cropSearchHelp) {
      cropSearchHelp.textContent = `${allCrops.length} cultivos disponibles desde ${sourceLabel}.`;
    }
  } catch (error) {
    console.error("Error al cargar cultivos:", error);
    allCrops = [];

    if (cropSearchHelp) {
      cropSearchHelp.textContent = "No se pudo cargar el catalogo. Puedes escribir el cultivo manualmente.";
    }
  }
}

function normalizeSearchValue(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCropSearchText(crop) {
  return [
    crop.name,
    crop.id,
    crop.scientificName,
    crop.externalName,
    crop.perenual?.commonName
  ]
    .filter(Boolean)
    .join(" ");
}

function sortCrops(crops) {
  return [...crops].sort((a, b) => a.name.localeCompare(b.name, "es-MX"));
}

function rankCropMatch(crop, search) {
  const name = normalizeSearchValue(crop.name);
  const id = normalizeSearchValue(crop.id);

  if (name === search || id === search) return 0;
  if (name.startsWith(search)) return 1;
  if (id.startsWith(search)) return 2;

  return 3;
}

function filterCrops(searchText) {
  const search = normalizeSearchValue(searchText);

  if (!search) {
    return allCrops;
  }

  return allCrops
    .filter((crop) => normalizeSearchValue(getCropSearchText(crop)).includes(search))
    .sort(
      (a, b) =>
        rankCropMatch(a, search) - rankCropMatch(b, search) ||
        a.name.localeCompare(b.name, "es-MX")
    );
}

function setCropDropdownVisible(isVisible) {
  if (!cropDropdown || !cropSearchInput) return;

  cropDropdown.classList.toggle("hidden", !isVisible);
  cropSearchInput.setAttribute("aria-expanded", String(isVisible));
}

function updateCropClearButton() {
  cropClearButton?.classList.toggle("hidden", !cropSearchInput?.value.trim());
}

function buildCropMeta(crop) {
  const parts = [];

  if (crop.growthTimeDays) {
    parts.push(`${crop.growthTimeDays} dias`);
  }

  if (crop.waterRequirement) {
    parts.push(crop.waterRequirement);
  }

  return parts.join(" - ");
}

function renderCropDropdown(crops) {
  if (!cropDropdown) return;

  cropDropdown.innerHTML = "";

  if (crops.length === 0) {
    const emptyOption = document.createElement("div");
    emptyOption.className = "crop-empty-option";
    emptyOption.textContent =
      "No se encontro en el catalogo. Puedes enviar el nombre escrito como cultivo personalizado.";
    cropDropdown.appendChild(emptyOption);
    return;
  }

  crops.slice(0, 24).forEach((crop) => {
    const option = document.createElement("button");
    const main = document.createElement("span");
    const name = document.createElement("span");
    const tag = document.createElement("span");
    const meta = document.createElement("span");

    option.type = "button";
    option.className = "crop-option";
    option.setAttribute("role", "option");
    option.setAttribute("aria-label", `Seleccionar ${crop.name}`);

    main.className = "crop-option-main";
    name.className = "crop-name";
    name.textContent = crop.name;
    tag.className = "crop-tag";
    tag.textContent = crop.perenual ? "Perenual" : "Local";
    meta.className = "crop-meta";
    meta.textContent = buildCropMeta(crop);

    main.append(name, tag);
    option.append(main, meta);
    option.onclick = () => selectCrop(crop);
    cropDropdown.appendChild(option);
  });
}

function selectCrop(crop) {
  cropSearchInput.value = crop.name;
  selectedCropId.value = crop.id;
  selectedCropName.value = crop.name;
  setCropDropdownVisible(false);
  updateCropClearButton();
}

cropSearchInput?.addEventListener("input", (event) => {
  const searchText = event.target.value;
  const filtered = filterCrops(searchText);

  renderCropDropdown(filtered);
  updateCropClearButton();
  setCropDropdownVisible(Boolean(searchText.trim()) || allCrops.length > 0);

  if (event.target.value !== selectedCropName.value) {
    selectedCropId.value = "";
    selectedCropName.value = "";
  }
});

cropSearchInput?.addEventListener("focus", () => {
  if (cropSearchInput.value.trim() || allCrops.length > 0) {
    renderCropDropdown(filterCrops(cropSearchInput.value));
    setCropDropdownVisible(true);
  }
});

cropClearButton?.addEventListener("click", () => {
  cropSearchInput.value = "";
  selectedCropId.value = "";
  selectedCropName.value = "";
  updateCropClearButton();
  renderCropDropdown(filterCrops(""));
  setCropDropdownVisible(allCrops.length > 0);
  cropSearchInput.focus();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".crop-field")) {
    setCropDropdownVisible(false);
  }
});

function initializeMap() {
  if (map !== null || !miniMapDiv) return;

  if (typeof L === "undefined") {
    miniMapDiv.innerHTML = `<div class="map-fallback">Mapa no disponible. Usa GPS o escribe coordenadas.</div>`;
    toggleMapOverlay(false);
    return;
  }

  map = L.map(miniMapDiv, {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView([23.6345, -102.5528], 5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19
  }).addTo(map);

  map.on("click", (event) => {
    const { lat, lng } = event.latlng;
    applyCoordinates(lat, lng, { source: "map", showToast: true });
  });

  toggleMapOverlay(true);
}

function updateMapLocation(lat, lon, accuracy = null) {
  if (map === null) return;

  const latNum = Number(lat);
  const lonNum = Number(lon);

  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
    return;
  }

  if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
    return;
  }

  map.setView([latNum, lonNum], 13, { animate: true });

  if (mapMarker) {
    mapMarker.setLatLng([latNum, lonNum]);
  } else {
    mapMarker = L.marker([latNum, lonNum], {
      title: "Tu ubicacion",
      draggable: true
    }).addTo(map);

    mapMarker.on("dragend", (event) => {
      const { lat, lng } = event.target.getLatLng();
      applyCoordinates(lat, lng, { source: "marker", showToast: true });
    });
  }

  if (Number.isFinite(accuracy)) {
    if (mapAccuracyCircle) {
      mapAccuracyCircle.setLatLng([latNum, lonNum]);
      mapAccuracyCircle.setRadius(accuracy);
    } else {
      mapAccuracyCircle = L.circle([latNum, lonNum], {
        radius: accuracy,
        color: "#1f7a4f",
        fillColor: "#1f7a4f",
        fillOpacity: 0.13
      }).addTo(map);
    }
  } else if (mapAccuracyCircle) {
    map.removeLayer(mapAccuracyCircle);
    mapAccuracyCircle = null;
  }
}

function scheduleReverseGeocode(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return;
  }

  if (reverseLookupTimer) {
    window.clearTimeout(reverseLookupTimer);
  }

  reverseLookupTimer = window.setTimeout(() => {
    fetchReverseGeocode(lat, lon);
  }, LOCATION_DEBOUNCE_MS);
}

function isStaleReverseLookup(requestId) {
  return requestId !== reverseLookupRequestId;
}

async function fetchReverseGeocode(lat, lon) {
  const requestId = ++reverseLookupRequestId;
  setAddressText("Ubicacion aproximada: buscando...");

  try {
    const response = await fetch(REVERSE_GEOCODE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ latitude: lat, longitude: lon })
    });

    if (!response.ok) {
      throw new Error("No se pudo obtener la ubicacion.");
    }

    const payload = await response.json();

    if (isStaleReverseLookup(requestId)) return;

    const name = payload.displayName || "Ubicacion no disponible";
    setAddressText(`Ubicacion aproximada: ${name}`);
  } catch (_error) {
    if (isStaleReverseLookup(requestId)) return;
    setAddressText("Ubicacion aproximada: no disponible");
  }
}

function applyCoordinates(lat, lon, options = {}) {
  const latitude = Number(lat);
  const longitude = Number(lon);
  const accuracy = options.accuracy ?? null;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    setCoordsText(null, null);
    setAddressText("Ubicacion aproximada: -");
    return;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return;
  }

  if (options.updateFields !== false) {
    fields.latitude.value = latitude.toFixed(6);
    fields.longitude.value = longitude.toFixed(6);
  }

  setCoordsText(latitude, longitude, accuracy);
  updateMapLocation(latitude, longitude, accuracy);
  toggleMapOverlay(false);
  scheduleReverseGeocode(latitude, longitude);
  scheduleSoilDetection(latitude, longitude);

  if (options.showToast) {
    showToast("Ubicacion actualizada. Detectando suelo si esta en modo automatico.");
  }
}

locationButton?.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showToast("Tu navegador no soporta geolocalizacion.");
    return;
  }

  setStatus("Ubicando");
  setLocationButtonLoading(true);

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      applyCoordinates(latitude, longitude, {
        accuracy: position.coords.accuracy,
        showToast: true
      });

      setStatus("Ubicacion obtenida");
      setLocationButtonLoading(false);
    },
    (error) => {
      setStatus("Listo");
      setLocationButtonLoading(false);

      let errorMessage = "No se pudo obtener la ubicacion. Intenta de nuevo.";

      if (error?.code === 1) {
        errorMessage = "Permiso denegado para la ubicacion. Activa el GPS o ingresa coordenadas.";
      } else if (error?.code === 2) {
        errorMessage = "No se pudo determinar la ubicacion. Intenta de nuevo.";
      } else if (error?.code === 3) {
        errorMessage = "Tiempo de espera agotado. Ingresa latitud y longitud manualmente.";
      }

      showToast(errorMessage);
    },
    {
      enableHighAccuracy: true,
      timeout: GEOLOCATION_TIMEOUT_MS,
      maximumAge: GEOLOCATION_MAX_AGE_MS
    }
  );
});

function handleManualCoordinateInput() {
  if (manualInputTimer) {
    window.clearTimeout(manualInputTimer);
  }

  if (!fields.latitude.value || !fields.longitude.value) {
    setCoordsText(null, null);
    setAddressText("Ubicacion aproximada: -");
    toggleMapOverlay(true);
    resetSoilAutoCard("Esperando coordenadas");
    return;
  }

  manualInputTimer = window.setTimeout(() => {
    const latitude = Number(fields.latitude.value);
    const longitude = Number(fields.longitude.value);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setCoordsText(null, null);
      setAddressText("Ubicacion aproximada: -");
      toggleMapOverlay(true);
      resetSoilAutoCard("Coordenadas no validas");
      return;
    }

    applyCoordinates(latitude, longitude, { updateFields: false });
  }, MANUAL_INPUT_DEBOUNCE_MS);
}

fields.latitude?.addEventListener("input", handleManualCoordinateInput);
fields.longitude?.addEventListener("input", handleManualCoordinateInput);

function getCurrentCoordinates() {
  const latitude = Number(fields.latitude.value);
  const longitude = Number(fields.longitude.value);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  return { latitude, longitude };
}

function scheduleSoilDetection(lat, lon) {
  if (!soilAutoMode) return;

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return;
  }

  if (soilDetectionTimer) {
    window.clearTimeout(soilDetectionTimer);
  }

  setSoilStatus("Detectando suelo...", "loading");

  soilDetectionTimer = window.setTimeout(() => {
    detectSoilByCoordinates();
  }, SOIL_DETECTION_DEBOUNCE_MS);
}

async function detectSoilByCoordinates(options = {}) {
  const { force = false } = options;
  const coordinates = getCurrentCoordinates();

  if (!coordinates) {
    resetSoilAutoCard("Agrega latitud y longitud para detectar el suelo.");
    if (force) showToast("Primero selecciona una ubicacion o escribe coordenadas validas.");
    return null;
  }

  if (!soilAutoMode && !force) {
    return null;
  }

  soilAutoMode = true;

  const requestId = ++soilDetectionRequestId;
  setSoilDetectionLoading(true);
  setSoilStatus("Detectando suelo...", "loading");

  try {
    const response = await fetch(SOIL_DETECTION_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(coordinates)
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "No se pudo detectar el suelo.");
    }

    if (requestId !== soilDetectionRequestId) {
      return null;
    }

    applySoilSuggestion(payload);
    return payload;
  } catch (error) {
    if (requestId !== soilDetectionRequestId) {
      return null;
    }

    lastSoilDetection = null;
    setSoilStatus("Automatico no disponible", "warning");
    setSoilHint("El analisis intentara detectar el suelo en el servidor al generar el plan.");
    showToast(error.message || "No se pudo detectar el suelo automaticamente.");
    return null;
  } finally {
    if (requestId === soilDetectionRequestId) {
      setSoilDetectionLoading(false);
    }
  }
}

detectSoilButton?.addEventListener("click", () => {
  soilAutoMode = true;
  isApplyingSoilSuggestion = true;
  fields.soilType.value = "auto";
  fields.fertilityLevel.value = "auto";
  isApplyingSoilSuggestion = false;
  detectSoilByCoordinates({ force: true });
});

fields.soilType?.addEventListener("change", handleSoilManualChange);
fields.fertilityLevel?.addEventListener("change", handleSoilManualChange);

function handleSoilManualChange() {
  if (isApplyingSoilSuggestion) {
    return;
  }

  const selectedSoil = fields.soilType.value;
  const selectedFertility = fields.fertilityLevel.value;

  soilAutoMode = selectedSoil === "auto" || selectedFertility === "auto";
  lastSoilDetection = null;

  if (soilAutoMode) {
    detectSoilByCoordinates({ force: true });
  } else {
    updateSoilAutoCardFromManual();
  }
}

function applySoilSuggestion(suggestion) {
  lastSoilDetection = suggestion;
  soilAutoMode = true;
  isApplyingSoilSuggestion = true;

  if (suggestion?.soilType && fields.soilType.querySelector(`option[value="${suggestion.soilType}"]`)) {
    fields.soilType.value = suggestion.soilType;
  }

  if (
    suggestion?.fertilityLevel &&
    fields.fertilityLevel.querySelector(`option[value="${suggestion.fertilityLevel}"]`)
  ) {
    fields.fertilityLevel.value = suggestion.fertilityLevel;
  }

  isApplyingSoilSuggestion = false;
  updateSoilAutoCardFromDetection(suggestion);

  if (suggestion.warning) {
    showToast(suggestion.warning);
  }
}

function setSoilStatus(message, tone = "ready") {
  if (!soilUi.status) return;

  soilUi.status.textContent = message;
  soilUi.status.classList.remove("is-loading", "is-ready", "is-warning", "is-manual");
  soilUi.status.classList.add(`is-${tone}`);
}

function setSoilHint(message) {
  if (soilUi.hint) {
    soilUi.hint.textContent = message;
  }
}

function resetSoilAutoCard(message) {
  setSoilStatus(message, "warning");

  if (soilUi.source) soilUi.source.textContent = "-";
  if (soilUi.texture) soilUi.texture.textContent = "-";
  if (soilUi.fertility) soilUi.fertility.textContent = "-";
  if (soilUi.confidence) soilUi.confidence.textContent = "-";
  if (soilUi.properties) soilUi.properties.innerHTML = "";
}

function updateSoilAutoCardFromManual() {
  const soilLabel = SOIL_LABELS[fields.soilType.value] || fields.soilType.value || "-";
  const fertilityLabel =
    FERTILITY_LABELS[fields.fertilityLevel.value] || fields.fertilityLevel.value || "-";

  if (soilAutoMode) {
    resetSoilAutoCard("Esperando coordenadas");
    setSoilHint("Usa GPS, escribe coordenadas o toca el mapa para detectar el suelo automaticamente.");
    return;
  }

  setSoilStatus("Seleccion manual", "manual");

  if (soilUi.source) soilUi.source.textContent = "manual";
  if (soilUi.texture) soilUi.texture.textContent = soilLabel;
  if (soilUi.fertility) soilUi.fertility.textContent = fertilityLabel;
  if (soilUi.confidence) soilUi.confidence.textContent = "100%";
  if (soilUi.properties) soilUi.properties.innerHTML = "";

  setSoilHint("Cambiaste el suelo manualmente. Pulsa Detectar suelo para volver al modo automatico.");
}

function updateSoilAutoCardFromDetection(suggestion) {
  const soilLabel = SOIL_LABELS[suggestion.soilType] || suggestion.soilType || "-";
  const fertilityLabel =
    FERTILITY_LABELS[suggestion.fertilityLevel] || suggestion.fertilityLevel || "-";
  const source = suggestion.source || "automatico";

  setSoilStatus("Detectado automaticamente", suggestion.warning ? "warning" : "ready");

  if (soilUi.source) soilUi.source.textContent = source;
  if (soilUi.texture) soilUi.texture.textContent = soilLabel;
  if (soilUi.fertility) soilUi.fertility.textContent = fertilityLabel;
  if (soilUi.confidence) soilUi.confidence.textContent = formatPercent(suggestion.confidence);

  if (soilUi.properties) {
    soilUi.properties.innerHTML = buildSoilPropertiesHtml(suggestion.properties);
  }

  const hint = suggestion.warning
    ? "Se uso una estimacion local porque SoilGrids no respondio."
    : "El tipo de suelo y fertilidad ya se aplicaron al formulario.";

  setSoilHint(hint);
}

function buildSoilPropertiesHtml(properties) {
  if (!properties) {
    return "";
  }

  const items = [
    ["Arena", properties.sand, "%"],
    ["Limo", properties.silt, "%"],
    ["Arcilla", properties.clay, "%"],
    ["pH", properties.phh2o, ""],
    ["CEC", properties.cec, ""],
    ["Carbono organico", properties.soc, ""]
  ];

  return items
    .map(
      ([label, value, suffix]) => `
        <span>
          <b>${escapeHtml(label)}</b>
          ${formatNumber(value, label === "pH" ? 1 : 0)}${suffix}
        </span>
      `
    )
    .join("");
}

function getFormData() {
  const soilType = soilAutoMode ? lastSoilDetection?.soilType || "auto" : fields.soilType.value;
  const fertilityLevel = soilAutoMode
    ? lastSoilDetection?.fertilityLevel || "auto"
    : fields.fertilityLevel.value;

  return {
    latitude: fields.latitude.value,
    longitude: fields.longitude.value,
    soilType,
    fertilityLevel,
    landSizeHa: fields.landSizeHa.value,
    cropId: selectedCropId.value,
    customCrop: cropSearchInput.value
  };
}

mainForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = getFormData();
  const latitude = Number(formData.latitude);
  const longitude = Number(formData.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    showToast("Por favor ingresa coordenadas validas.");
    return;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    showToast("Las coordenadas no son validas. Latitud: -90 a 90, Longitud: -180 a 180.");
    return;
  }

  if (!formData.landSizeHa || Number(formData.landSizeHa) <= 0) {
    showToast("Por favor ingresa el tamano del terreno en hectareas.");
    return;
  }

  if (!formData.customCrop.trim()) {
    showToast("Por favor busca y selecciona un cultivo o escribe uno.");
    return;
  }

  setLoading(true);

  try {
    const requestData = {
      latitude,
      longitude,
      soilType: formData.soilType,
      fertilityLevel: formData.fertilityLevel,
      landSizeHa: formData.landSizeHa
    };

    if (formData.cropId) {
      requestData.cropId = formData.cropId;
    } else {
      requestData.customCrop = formData.customCrop.trim();
    }

    const response = await fetch("/api/crop-care", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestData)
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "No se pudo analizar el cultivo.");
    }

    if (payload.soilDetection && payload.soilDetection.source !== "manual") {
      applySoilSuggestion(payload.soilDetection);
    }

    lastReportRequest = {
      latitude,
      longitude,
      soilType: payload.soil?.soilType || payload.soilDetection?.soilType || requestData.soilType,
      fertilityLevel:
        payload.soil?.fertilityLevel ||
        payload.soilDetection?.fertilityLevel ||
        requestData.fertilityLevel,
      landSizeHa: formData.landSizeHa,
      cropId: requestData.cropId || null,
      customCrop: requestData.customCrop || null
    };

    renderCropAnalysis(payload);
    showToast("Analisis completado.");
  } catch (error) {
    showToast(error.message || "Error de conexion. Intenta de nuevo.");
    console.error("Error:", error);
  } finally {
    setLoading(false);
  }
});

pdfButton?.addEventListener("click", async () => {
  if (!lastReportRequest) {
    showToast("Primero genera un plan agricola.");
    return;
  }

  pdfButton.disabled = true;
  pdfButton.textContent = "Generando PDF...";
  setStatus("PDF");

  try {
    const response = await fetch("/api/reports/pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(lastReportRequest)
    });

    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "No se pudo generar el PDF.");
    }

    const blob = await response.blob();

    if (!blob || blob.size === 0) {
      throw new Error("El PDF generado esta vacio.");
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "reporte-pda.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast("PDF descargado correctamente.");
  } catch (error) {
    showToast(error.message || "No se pudo descargar el PDF.");
    console.error("Error al generar PDF:", error);
  } finally {
    pdfButton.disabled = false;
    pdfButton.textContent = "Descargar PDF";
    setStatus("Listo");
  }
});

function renderCropAnalysis(data) {
  emptyState?.classList.add("hidden");
  results?.classList.remove("hidden");
  pdfButton?.classList.remove("hidden");

  const hasProduction = Boolean(data.production);
  const crop = data.crop || {};
  const soil = data.soil || {};
  const weather = data.weather || {};
  const currentWeather = weather.current || {};
  const detection = data.soilDetection || null;

  const summaryValue = hasProduction
    ? `${formatNumber(data.production.totalTon, 2)} ton`
    : escapeHtml(data.climate?.label || "-");

  const productionMeta = hasProduction
    ? `${formatNumber(data.production.landSizeHa, 2)} ha evaluadas`
    : "Fertilidad del suelo";

  const scoreText = Number.isFinite(Number(data.score))
    ? `Compatibilidad ${data.score}/100`
    : "Compatibilidad sin puntaje";

  const sourceTags = [
    weather.source || "clima",
    soil.soilLabel || SOIL_LABELS[soil.soilType] || "suelo",
    soil.fertilityLevel || "fertilidad"
  ];

  results.innerHTML = `
    <section class="summary-band reveal-card">
      <div>
        <p class="eyebrow">Cultivo analizado</p>
        <h2>${escapeHtml(crop.name || "-")}</h2>
        <p>${escapeHtml(scoreText)} · ${escapeHtml(data.climate?.label || "condicion climatica")}</p>
        <div class="summary-tags">
          ${sourceTags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
        </div>
      </div>
      <div class="production-number">
        <span>${summaryValue}</span>
        <small>${escapeHtml(productionMeta)}</small>
      </div>
    </section>

    <div class="dashboard-grid">
      <article class="metric-card metric-temperature">
        <span class="metric-icon">°C</span>
        <p>Temperatura</p>
        <strong id="analysisTemp">${formatNumber(currentWeather.temperature)} °C</strong>
        <small>${escapeHtml(data.analysis?.temperatureStatus?.status || "-")}</small>
      </article>

      <article class="metric-card metric-humidity">
        <span class="metric-icon">%</span>
        <p>Humedad</p>
        <strong id="analysisHumidity">${formatNumber(currentWeather.humidity, 0)}%</strong>
        <small>${escapeHtml(data.analysis?.humidityStatus?.status || "-")}</small>
      </article>

      <article class="metric-card metric-rain">
        <span class="metric-icon">☔</span>
        <p>Lluvia</p>
        <strong id="analysisRain">${formatNumber(currentWeather.rainProbability, 0)}%</strong>
        <small>${escapeHtml(data.analysis?.rainStatus?.status || "-")}</small>
      </article>

      <article class="metric-card metric-production">
        <span class="metric-icon">Σ</span>
        <p>${hasProduction ? "Produccion" : "Coeficiente"}</p>
        <strong id="analysisCoef">${
          hasProduction
            ? `${formatNumber(data.production.totalTon, 2)} ton`
            : formatNumber(soil.coefficient, 2)
        }</strong>
        <small>${escapeHtml(productionMeta)}</small>
      </article>
    </div>

    <section class="content-grid">
      <article class="info-block crop-block">
        <div class="info-title-row">
          <h3>Informacion del cultivo</h3>
          <span>${escapeHtml(crop.scientificName || "Catalogo")}</span>
        </div>
        <dl class="calc-list">
          <div>
            <dt>Ciclo de crecimiento</dt>
            <dd>${formatNumber(crop.growthTimeDays, 0)} dias</dd>
          </div>
          <div>
            <dt>Requerimiento de agua</dt>
            <dd>${escapeHtml(crop.waterRequirement || "-")}</dd>
          </div>
          <div>
            <dt>Rendimiento teorico</dt>
            <dd>${formatNumber(crop.theoreticalYieldTonHa, 2)} ton/ha</dd>
          </div>
        </dl>
      </article>

      <article class="info-block soil-block">
        <div class="info-title-row">
          <h3>Suelo automatico</h3>
          <span>${escapeHtml(detection?.source || "manual")}</span>
        </div>
        <dl class="calc-list">
          <div>
            <dt>Tipo de suelo</dt>
            <dd>${escapeHtml(soil.soilLabel || SOIL_LABELS[soil.soilType] || "-")}</dd>
          </div>
          <div>
            <dt>Fertilidad</dt>
            <dd>${escapeHtml(FERTILITY_LABELS[soil.fertilityLevel] || soil.fertilityLevel || "-")}</dd>
          </div>
          <div>
            <dt>Confianza</dt>
            <dd>${escapeHtml(formatPercent(detection?.confidence))}</dd>
          </div>
          <div>
            <dt>Coeficiente suelo (Cf)</dt>
            <dd>${formatNumber(soil.coefficient, 2)}</dd>
          </div>
        </dl>
        ${detection?.warning ? `<p class="inline-warning">${escapeHtml(detection.warning)}</p>` : ""}
        <div class="soil-properties">${buildSoilPropertiesHtml(detection?.properties)}</div>
      </article>

      <article class="info-block">
        <h3>Recomendaciones</h3>
        <ul id="analysisList"></ul>
      </article>

      <article class="info-block">
        <h3>Plan de riego y fertilizacion</h3>
        <dl class="plan-list">
          <dt>Riego</dt>
          <dd id="analysisPlanIrrigation">-</dd>
          <dt>Fertilizacion</dt>
          <dd>
            <ul id="analysisFertilization"></ul>
          </dd>
        </dl>
      </article>

      <article class="info-block">
        <h3>Cuidados especiales</h3>
        <ul id="analysisCare"></ul>
      </article>

      <article class="info-block">
        <h3>Pronostico 5 dias</h3>
        <div class="forecast-list" id="analysisForecast"></div>
      </article>

      <article class="info-block">
        <h3>Produccion</h3>
        <dl class="calc-list">
          <div>
            <dt>Rendimiento teorico</dt>
            <dd>${hasProduction ? `${formatNumber(data.production.theoreticalYieldTonHa, 2)} ton/ha` : "-"}</dd>
          </div>
          <div>
            <dt>Coeficiente clima (Cc)</dt>
            <dd>${hasProduction ? formatNumber(data.production.climateCoefficient, 2) : "-"}</dd>
          </div>
          <div>
            <dt>Coeficiente suelo (Cf)</dt>
            <dd>${hasProduction ? `${formatNumber(data.production.soilCoefficient, 2)} (${escapeHtml(soil.fertilityLevel || "-")})` : "-"}</dd>
          </div>
        </dl>
      </article>

      <article class="info-block location-block">
        <h3>Ubicacion evaluada</h3>
        <dl class="calc-list">
          <div>
            <dt>Latitud</dt>
            <dd>${formatNumber(weather.latitude, 5)}</dd>
          </div>
          <div>
            <dt>Longitud</dt>
            <dd>${formatNumber(weather.longitude, 5)}</dd>
          </div>
          <div>
            <dt>Fuente clima</dt>
            <dd>${escapeHtml(weather.source || "-")}</dd>
          </div>
        </dl>
      </article>
    </section>
  `;

  document.querySelector("#analysisPlanIrrigation").textContent = data.plan?.irrigation || "-";

  fillList("analysisList", data.recommendations);

  const fertList = document.querySelector("#analysisFertilization");
  if (fertList) {
    fertList.innerHTML = "";

    (data.plan?.fertilizationDates || []).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.date}: ${item.task}`;
      fertList.appendChild(li);
    });
  }

  fillList("analysisCare", data.plan?.care);

  renderForecast(data.weather?.forecast, "analysisForecast");

  if (data.cropWarning) {
    showToast(`Usando catalogo local: ${data.cropWarning}`);
  }

  if (data.weather?.warning) {
    showToast(data.weather.warning);
  }
}

function renderForecast(forecast, containerId) {
  const container = document.querySelector(`#${containerId}`);

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (!forecast?.length) {
    container.innerHTML = `<p class="muted-line">Pronostico no disponible.</p>`;
    return;
  }

  forecast.forEach((day) => {
    const row = document.createElement("div");
    row.className = "forecast-day";
    row.innerHTML = `
      <span>${escapeHtml(day.date)}</span>
      <strong>${formatNumber(day.temperatureMin)}-${formatNumber(day.temperatureMax)} °C</strong>
      <small>Lluvia ${formatNumber(day.rainProbability, 0)}%</small>
    `;
    container.appendChild(row);
  });
}