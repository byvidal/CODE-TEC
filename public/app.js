const mainForm = document.querySelector("#mainForm");
const locationButton = document.querySelector("#locationButton");
const coordsText = document.querySelector("#coordsText");
const statusText = document.querySelector("#connectionStatus");
const toast = document.querySelector("#toast");
const emptyState = document.querySelector("#emptyState");
const results = document.querySelector("#results");
const cropSearchInput = document.querySelector("#cropSearchInput");
const cropDropdown = document.querySelector("#cropDropdown");
const selectedCropId = document.querySelector("#selectedCropId");
const selectedCropName = document.querySelector("#selectedCropName");
const pdfButton = document.querySelector("#pdfButton");
const miniMapDiv = document.querySelector("#miniMap");
const mapOverlay = document.querySelector("#mapOverlay");
const addressText = document.querySelector("#addressText");
let allCrops = [];
let lastReportRequest = null;
let map = null;
let mapMarker = null;
let mapAccuracyCircle = null;
let reverseLookupTimer = null;
let reverseLookupRequestId = 0;
const LOCATION_DEBOUNCE_MS = 700;
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const LOCATION_BUTTON_LABEL = "Usar ubicacion actual";
const LOCATION_BUTTON_LOADING_LABEL = "Localizando...";

const fields = {
  latitude: document.querySelector("#latitude"),
  longitude: document.querySelector("#longitude"),
  soilType: document.querySelector("#soilType"),
  fertilityLevel: document.querySelector("#fertilityLevel"),
  landSizeHa: document.querySelector("#landSizeHa")
};

/**
 * Actualiza el estado de conexión mostrado en la interfaz
 * @param {string} message - Mensaje de estado
 */
function setStatus(message) {
  statusText.textContent = message;
}

/**
 * Muestra una notificación temporal
 * @param {string} message - Mensaje a mostrar
 */
function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  window.setTimeout(() => toast.classList.add("hidden"), 5200);
}

/**
 * Habilita/deshabilita el formulario durante carga
 * @param {boolean} isLoading - Estado de carga
 */
function setLoading(isLoading) {
  const submitButton = mainForm.querySelector("button[type='submit']");
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Analizando..." : "Generar plan agricola";
  setStatus(isLoading ? "Consultando" : "Listo");
}

function setLocationButtonLoading(isLoading) {
  locationButton.disabled = isLoading;
  const label = isLoading ? LOCATION_BUTTON_LOADING_LABEL : LOCATION_BUTTON_LABEL;
  locationButton.innerHTML = `<span aria-hidden="true">GPS</span> ${label}`;
}

function setCoordsText(latitude, longitude, accuracy) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    coordsText.textContent = "Sin ubicacion";
    return;
  }

  const accuracyText = Number.isFinite(accuracy) ? ` (±${Math.round(accuracy)} m)` : "";
  coordsText.textContent = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}${accuracyText}`;
}

function setAddressText(message) {
  addressText.textContent = message;
}

function toggleMapOverlay(isVisible) {
  mapOverlay.classList.toggle("hidden", !isVisible);
}

/**
 * Formatea un número con locale de México
 * @param {number|null} value - Valor a formatear
 * @param {number} digits - Dígitos decimales (default 1)
 * @returns {string} Número formateado o "-"
 */
function formatNumber(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return Number(value).toLocaleString("es-MX", {
    maximumFractionDigits: digits
  });
}

/**
 * Rellena una lista HTML con items
 * @param {string} elementId - ID del elemento lista
 * @param {string[]} items - Items a mostrar
 */
function fillList(elementId, items) {
  const element = document.querySelector(`#${elementId}`);
  if (!element) {
    console.warn(`Elemento #${elementId} no encontrado`);
    return;
  }
  element.innerHTML = "";

  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    element.appendChild(li);
  });
}

function renderForecast(forecast) {
  const container = document.querySelector("#forecastList");
  container.innerHTML = "";

  if (!forecast?.length) {
    container.innerHTML = "<p class='muted'>Pronostico no disponible.</p>";
    return;
  }

  forecast.forEach((day) => {
    const row = document.createElement("div");
    row.className = "forecast-day";
    row.innerHTML = `
      <strong>${day.date}</strong>
      <span>${formatNumber(day.temperatureMin)}-${formatNumber(day.temperatureMax)} C - lluvia ${formatNumber(day.rainProbability, 0)}%</span>
    `;
    container.appendChild(row);
  });
}

function renderFertilization(dates) {
  const list = document.querySelector("#fertilizationDates");
  list.innerHTML = "";

  dates.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.date}: ${item.task}`;
    list.appendChild(li);
  });
}

function renderResults(data) {
  emptyState.classList.add("hidden");
  results.classList.remove("hidden");
  pdfButton.classList.remove("hidden");

  document.querySelector("#cropName").textContent = data.crop.name;
  document.querySelector("#cropMeta").textContent = `${data.crop.waterRequirement} - ${data.crop.growthTimeDays} dias de crecimiento - fuente: ${data.cropSource}`;
  document.querySelector("#productionTotal").textContent = formatNumber(data.production.totalTon, 2);
  document.querySelector("#temperature").textContent = `${formatNumber(data.weather.current.temperature)} C`;
  document.querySelector("#humidity").textContent = `${formatNumber(data.weather.current.humidity, 0)}%`;
  document.querySelector("#rainProbability").textContent = `${formatNumber(data.weather.current.rainProbability, 0)}%`;
  document.querySelector("#climateLabel").textContent = data.climate.label;
  document.querySelector("#irrigationPlan").textContent = data.plan.irrigation;
  document.querySelector("#yieldValue").textContent = `${formatNumber(data.production.theoreticalYieldTonHa, 2)} ton/ha`;
  document.querySelector("#ccValue").textContent = data.production.climateCoefficient;
  document.querySelector("#cfValue").textContent = `${data.production.soilCoefficient} (${data.soil.fertilityLevel})`;

  fillList("recommendations", data.recommendations);
  renderFertilization(data.plan.fertilizationDates);
  renderForecast(data.weather.forecast);

  if (data.cropWarning) {
    showToast(`Perenual no respondio; usando catalogo local. ${data.cropWarning}`);
  }
}

/**
 * Carga la lista de cultivos y configura el buscador
 */
async function loadAndSetupCrops() {
  try {
    const response = await fetch("/api/crops");
    const data = await response.json();
    allCrops = data.crops || [];
  } catch (error) {
    console.error("Error al cargar cultivos:", error);
    allCrops = [];
  }
}

/**
 * Filtra cultivos basado en el texto de búsqueda
 * @param {string} searchText - Texto a buscar
 * @returns {array} Cultivos que coinciden
 */
function filterCrops(searchText) {
  if (!searchText.trim()) {
    return allCrops.slice(0, 8); // Mostrar primeros 8 si está vacío
  }
  
  const search = searchText.toLowerCase().trim();
  return allCrops.filter(crop => 
    crop.name.toLowerCase().includes(search) || 
    crop.id.toLowerCase().includes(search)
  );
}

/**
 * Renderiza el dropdown de cultivos
 * @param {array} crops - Cultivos a mostrar
 */
function renderCropDropdown(crops) {
  cropDropdown.innerHTML = "";
  
  if (crops.length === 0) {
    const emptyOption = document.createElement("div");
    emptyOption.style.cssText = "padding: 10px 12px; color: var(--muted); font-size: 0.9rem;";
    emptyOption.textContent = "No se encontraron cultivos";
    cropDropdown.appendChild(emptyOption);
    return;
  }
  
  crops.forEach(crop => {
    const option = document.createElement("div");
    option.style.cssText = `
      padding: 10px 12px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.2s;
    `;
    option.textContent = crop.name;
    option.onmouseover = () => {
      option.style.backgroundColor = "#f5f7f2";
    };
    option.onmouseout = () => {
      option.style.backgroundColor = "white";
    };
    option.onclick = () => selectCrop(crop);
    cropDropdown.appendChild(option);
  });
}

/**
 * Selecciona un cultivo del dropdown
 * @param {object} crop - Cultivo seleccionado
 */
function selectCrop(crop) {
  cropSearchInput.value = crop.name;
  selectedCropId.value = crop.id;
  selectedCropName.value = crop.name;
  cropDropdown.style.display = "none";
}

// Event listener para búsqueda de cultivos
cropSearchInput.addEventListener("input", (e) => {
  const searchText = e.target.value;
  const filtered = filterCrops(searchText);
  renderCropDropdown(filtered);
  
  if (searchText.trim()) {
    cropDropdown.style.display = "block";
  } else {
    cropDropdown.style.display = "none";
  }
  
  // Limpiar selección si el usuario modifica el texto
  if (e.target.value !== selectedCropName.value) {
    selectedCropId.value = "";
    selectedCropName.value = "";
  }
});

// Mostrar dropdown al hacer focus
cropSearchInput.addEventListener("focus", () => {
  if (cropSearchInput.value.trim() || allCrops.length > 0) {
    const filtered = filterCrops(cropSearchInput.value);
    renderCropDropdown(filtered);
    cropDropdown.style.display = "block";
  }
});

// Cerrar dropdown al hacer click afuera
document.addEventListener("click", (e) => {
  if (!e.target.closest(".wide")) {
    cropDropdown.style.display = "none";
  }
});

// Cargar cultivos cuando carga la página
document.addEventListener("DOMContentLoaded", () => {
  loadAndSetupCrops();
  initializeMap();
});

/**
 * Inicializa el mapa de Leaflet
 */
function initializeMap() {
  if (map !== null) return; // Ya inicializado
  
  // Crear mapa centrado en México por defecto
  map = L.map(miniMapDiv).setView([23.6345, -102.5528], 5);
  
  // Agregar tiles de OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  map.on("click", (event) => {
    const { lat, lng } = event.latlng;
    applyCoordinates(lat, lng, { source: "map" });
  });

  toggleMapOverlay(true);
}

/**
 * Actualiza el mapa con las coordenadas actuales
 */
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
      applyCoordinates(lat, lng, { source: "marker" });
    });
  }

  if (Number.isFinite(accuracy) && accuracy > 0) {
    if (mapAccuracyCircle) {
      mapAccuracyCircle.setLatLng([latNum, lonNum]);
      mapAccuracyCircle.setRadius(accuracy);
    } else {
      mapAccuracyCircle = L.circle([latNum, lonNum], {
        radius: accuracy,
        color: "#256a8a",
        fillColor: "#256a8a",
        fillOpacity: 0.15
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
    void fetchReverseGeocode(lat, lon);
  }, LOCATION_DEBOUNCE_MS);
}

async function fetchReverseGeocode(lat, lon) {
  const requestId = ++reverseLookupRequestId;
  setAddressText("Ubicacion aproximada: buscando...");

  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lon);
    url.searchParams.set("zoom", "14");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url, {
      headers: {
        "Accept-Language": "es"
      },
      referrerPolicy: "no-referrer-when-downgrade"
    });

    if (!response.ok) {
      throw new Error("No se pudo obtener la ubicacion.");
    }

    const payload = await response.json();
    if (requestId !== reverseLookupRequestId) return;

    const name = payload.display_name || "Ubicacion no disponible";
    setAddressText(`Ubicacion aproximada: ${name}`);
  } catch (error) {
    if (requestId !== reverseLookupRequestId) return;
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

  if (options.showToast) {
    showToast("Ubicacion actualizada en el mapa.");
  }
}

locationButton.addEventListener("click", () => {
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
      const errorMessage = error?.code === 1
        ? "Permiso denegado para la ubicacion. Activa el GPS o ingresa coordenadas."
        : error?.code === 2
          ? "No se pudo determinar la ubicacion. Intenta de nuevo."
          : "Tiempo de espera agotado. Ingresa latitud y longitud manualmente.";
      showToast(errorMessage);
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000
    }
  );
});

function handleManualCoordinateInput() {
  const latitude = Number(fields.latitude.value);
  const longitude = Number(fields.longitude.value);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    setCoordsText(null, null);
    setAddressText("Ubicacion aproximada: -");
    toggleMapOverlay(true);
    return;
  }

  applyCoordinates(latitude, longitude, { updateFields: false });
}

// Actualizar mapa cuando el usuario modifica latitud o longitud
fields.latitude.addEventListener("input", handleManualCoordinateInput);
fields.longitude.addEventListener("input", handleManualCoordinateInput);

/**
 * Obtiene los valores actuales del formulario
 * @returns {object} Objeto con los datos del formulario
 */
function getFormData() {
  return {
    latitude: fields.latitude.value,
    longitude: fields.longitude.value,
    soilType: fields.soilType.value,
    fertilityLevel: fields.fertilityLevel.value,
    landSizeHa: fields.landSizeHa.value,
    cropId: selectedCropId.value,
    customCrop: cropSearchInput.value
  };
}

mainForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  
  const formData = getFormData();
  
  // Validar coordenadas
  const latitude = parseFloat(formData.latitude);
  const longitude = parseFloat(formData.longitude);
  
  if (isNaN(latitude) || isNaN(longitude)) {
    showToast("Por favor ingresa coordenadas válidas (latitud y longitud).");
    return;
  }
  
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    showToast("Las coordenadas no son válidas. Latitud: -90 a 90, Longitud: -180 a 180.");
    return;
  }

  // Validar que los demás campos requeridos están llenos
  if (!formData.soilType || !formData.fertilityLevel || !formData.landSizeHa) {
    showToast("Por favor completa todos los campos del suelo y tamaño del terreno.");
    return;
  }

  // Validar que seleccione o escriba un cultivo
  if (!formData.customCrop.trim()) {
    showToast("Por favor busca y selecciona un cultivo o escribe uno.");
    return;
  }
  
  setLoading(true);

  try {
    // Preparar datos para enviar
    const requestData = {
      latitude: latitude,
      longitude: longitude,
      soilType: formData.soilType,
      fertilityLevel: formData.fertilityLevel
    };

    // Si tiene ID de cultivo, usarlo; si no, enviar el nombre personalizado
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

    lastReportRequest = {
      latitude: latitude,
      longitude: longitude,
      soilType: formData.soilType,
      fertilityLevel: formData.fertilityLevel,
      landSizeHa: formData.landSizeHa
    };

    renderCropAnalysis(payload);
    showToast("Análisis completado.");
  } catch (error) {
    showToast(error.message || "Error de conexión. Intenta de nuevo.");
    console.error("Error:", error);
  } finally {
    setLoading(false);
  }
});

pdfButton.addEventListener("click", async () => {
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
      throw new Error("El PDF generado está vacío.");
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

/**
 * Muestra el análisis detallado de un cultivo específico
 * @param {object} data - Datos del análisis
 */
function renderCropAnalysis(data) {
  emptyState.classList.add("hidden");
  results.classList.remove("hidden");
  pdfButton.classList.remove("hidden");

  // Limpiar resultados previos
  results.innerHTML = `
    <section class="summary-band">
      <div>
        <p class="eyebrow">Cultivo analizado</p>
        <h2 id="analysisCropName">${data.crop.name}</h2>
        <p id="analysisCropScore">Compatibilidad: ${data.score}/100</p>
      </div>
      <div class="production-number">
        <span id="analysisClimate">${data.climate.label}</span>
        <small>Condición climática</small>
      </div>
    </section>

    <div class="dashboard-grid">
      <article class="metric-card">
        <p>Temperatura</p>
        <strong id="analysisTemp">-</strong>
        <small id="analysisTempStatus" style="color: var(--muted); font-size: 0.75rem;"></small>
      </article>
      <article class="metric-card">
        <p>Humedad</p>
        <strong id="analysisHumidity">-</strong>
        <small id="analysisHumidityStatus" style="color: var(--muted); font-size: 0.75rem;"></small>
      </article>
      <article class="metric-card">
        <p>Lluvia</p>
        <strong id="analysisRain">-</strong>
        <small id="analysisRainStatus" style="color: var(--muted); font-size: 0.75rem;"></small>
      </article>
      <article class="metric-card">
        <p>Coeficiente</p>
        <strong id="analysisCoef">-</strong>
        <small>Fertilidad del suelo</small>
      </article>
    </div>

    <section class="content-grid">
      <article class="info-block">
        <h3>Información del Cultivo</h3>
        <dl class="plan-list">
          <dt>Ciclo de crecimiento</dt>
          <dd>${data.crop.growthTimeDays} días</dd>
          <dt>Requerimiento de agua</dt>
          <dd>${data.crop.waterRequirement}</dd>
          <dt>Rendimiento teórico</dt>
          <dd>${data.crop.theoreticalYieldTonHa} ton/ha</dd>
        </dl>
      </article>

      <article class="info-block">
        <h3>Recomendaciones</h3>
        <ul id="analysisList"></ul>
      </article>

      <article class="info-block">
        <h3>Plan de Riego y Fertilización</h3>
        <dl class="plan-list">
          <dt>Riego</dt>
          <dd id="analysisPlanIrrigation">-</dd>
          <dt>Fertilización</dt>
          <dd>
            <ul id="analysisFertilization"></ul>
          </dd>
        </dl>
      </article>

      <article class="info-block">
        <h3>Cuidados Especiales</h3>
        <ul id="analysisCare"></ul>
      </article>

      <article class="info-block">
        <h3>Pronóstico 5 días</h3>
        <div class="forecast-list" id="analysisForecast"></div>
      </article>

      <article class="info-block">
        <h3>Datos del Suelo y Ubicación</h3>
        <dl class="calc-list">
          <div>
            <dt>Tipo de suelo</dt>
            <dd>${data.soil.soilLabel}</dd>
          </div>
          <div>
            <dt>Fertilidad</dt>
            <dd>${data.soil.fertilityLevel}</dd>
          </div>
          <div>
            <dt>Latitud</dt>
            <dd>${formatNumber(data.weather.latitude, 4)}</dd>
          </div>
          <div>
            <dt>Longitud</dt>
            <dd>${formatNumber(data.weather.longitude, 4)}</dd>
          </div>
        </dl>
      </article>
    </section>
  `;

  // Llenar datos
  document.querySelector("#analysisTemp").textContent = `${formatNumber(data.weather.current.temperature)} °C`;
  document.querySelector("#analysisTempStatus").textContent = data.analysis.temperatureStatus.status.toUpperCase();
  
  document.querySelector("#analysisHumidity").textContent = `${formatNumber(data.weather.current.humidity, 0)}%`;
  document.querySelector("#analysisHumidityStatus").textContent = data.analysis.humidityStatus.status.toUpperCase();
  
  document.querySelector("#analysisRain").textContent = `${formatNumber(data.weather.current.rainProbability, 0)}%`;
  document.querySelector("#analysisRainStatus").textContent = data.analysis.rainStatus.status.toUpperCase();
  
  document.querySelector("#analysisCoef").textContent = `${data.soil.coefficient}`;
  document.querySelector("#analysisPlanIrrigation").textContent = data.plan.irrigation;

  // Llenar listas
  fillList("analysisList", data.recommendations);
  
  const fertList = document.querySelector("#analysisFertilization");
  fertList.innerHTML = "";
  data.plan.fertilizationDates.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.date}: ${item.task}`;
    fertList.appendChild(li);
  });

  fillList("analysisCare", data.plan.care);
  
  // Pronóstico
  const forecastContainer = document.querySelector("#analysisForecast");
  forecastContainer.innerHTML = "";
  if (!data.weather.forecast?.length) {
    forecastContainer.innerHTML = "<p class='muted'>Pronostico no disponible.</p>";
  } else {
    data.weather.forecast.forEach((day) => {
      const row = document.createElement("div");
      row.className = "forecast-day";
      row.innerHTML = `
        <strong>${day.date}</strong>
        <span>${formatNumber(day.temperatureMin)}-${formatNumber(day.temperatureMax)} C - lluvia ${formatNumber(day.rainProbability, 0)}%</span>
      `;
      forecastContainer.appendChild(row);
    });
  }

  if (data.cropWarning) {
    showToast(`Usando catálogo local: ${data.cropWarning}`);
  }
}
