const form = document.querySelector("#recommendationForm");
const locationButton = document.querySelector("#locationButton");
const coordsText = document.querySelector("#coordsText");
const statusText = document.querySelector("#connectionStatus");
const toast = document.querySelector("#toast");
const emptyState = document.querySelector("#emptyState");
const results = document.querySelector("#results");

const fields = {
  latitude: document.querySelector("#latitude"),
  longitude: document.querySelector("#longitude"),
  soilType: document.querySelector("#soilType"),
  fertilityLevel: document.querySelector("#fertilityLevel"),
  landSizeHa: document.querySelector("#landSizeHa")
};

function setStatus(message) {
  statusText.textContent = message;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  window.setTimeout(() => toast.classList.add("hidden"), 5200);
}

function setLoading(isLoading) {
  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Analizando..." : "Generar plan agricola";
  setStatus(isLoading ? "Consultando" : "Listo");
}

function formatNumber(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return Number(value).toLocaleString("es-MX", {
    maximumFractionDigits: digits
  });
}

function fillList(elementId, items) {
  const element = document.querySelector(`#${elementId}`);
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

  forecast.forEach((day) => {
    const row = document.createElement("div");
    row.className = "forecast-day";
    row.innerHTML = `
      <strong>${day.date}</strong>
      <span>${formatNumber(day.temperatureMin)}-${formatNumber(day.temperatureMax)} C · lluvia ${formatNumber(day.rainProbability, 0)}%</span>
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

  document.querySelector("#cropName").textContent = data.crop.name;
  document.querySelector("#cropMeta").textContent = `${data.crop.waterRequirement} · ${data.crop.growthTimeDays} dias de crecimiento · fuente: ${data.cropSource}`;
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
    showToast(`FgFarm no respondio; usando catalogo local. ${data.cropWarning}`);
  }
}

locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showToast("Tu navegador no soporta geolocalizacion.");
    return;
  }

  setStatus("Ubicando");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      fields.latitude.value = latitude.toFixed(6);
      fields.longitude.value = longitude.toFixed(6);
      coordsText.textContent = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      setStatus("Listo");
    },
    () => {
      setStatus("Listo");
      showToast("No se pudo obtener la ubicacion. Ingresa latitud y longitud manualmente.");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setLoading(true);

  try {
    const response = await fetch("/api/recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        latitude: fields.latitude.value,
        longitude: fields.longitude.value,
        soilType: fields.soilType.value,
        fertilityLevel: fields.fertilityLevel.value,
        landSizeHa: fields.landSizeHa.value
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "No se pudo generar la recomendacion.");
    }

    renderResults(payload);
  } catch (error) {
    showToast(error.message || "Error de conexion. Intenta de nuevo.");
  } finally {
    setLoading(false);
  }
});
