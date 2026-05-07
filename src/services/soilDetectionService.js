const SOILGRIDS_API_URL =
  process.env.SOILGRIDS_API_URL || "https://rest.isric.org/soilgrids/v2.0/properties/query";
const REQUEST_TIMEOUT_MS = Number(process.env.SOILGRIDS_TIMEOUT_MS || 6500);

const DEPTH = "0-30cm";
const VALUE = "mean";
const PROPERTIES = ["sand", "silt", "clay", "soc", "cec", "phh2o"];

const VALID_SOIL_TYPES = new Set(["arenoso", "arcilloso", "limoso", "franco"]);
const VALID_FERTILITY_LEVELS = new Set(["pobre", "medio", "bueno"]);

function assertCoordinates(latitudeInput, longitudeInput) {
  const latitude = Number(latitudeInput);
  const longitude = Number(longitudeInput);

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error("Latitud invalida.");
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error("Longitud invalida.");
  }

  return { latitude, longitude };
}

function buildSoilGridsUrl(latitude, longitude) {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude)
  });

  PROPERTIES.forEach((property) => params.append("property", property));
  params.append("depth", DEPTH);
  params.append("value", VALUE);

  return `${SOILGRIDS_API_URL}?${params.toString()}`;
}

async function fetchWithTimeout(url) {
  if (typeof fetch !== "function") {
    throw new Error("fetch no esta disponible. Usa Node.js 18 o superior.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "PDA-CODE-TEC/1.0"
      }
    });

    if (!response.ok) {
      const error = new Error(`SoilGrids respondio con estado ${response.status}.`);
      error.statusCode = response.status;
      throw error;
    }

    return response.json();
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("La consulta a SoilGrids tardo demasiado.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function getLayer(payload, name) {
  return payload?.properties?.layers?.find((layer) => layer.name === name) || null;
}

function getLayerValue(payload, name) {
  const layer = getLayer(payload, name);
  const depth = layer?.depths?.find((item) => item.label === DEPTH) || layer?.depths?.[0];
  const rawValue = depth?.values?.[VALUE] ?? depth?.values?.["Q0.5"];

  if (!Number.isFinite(Number(rawValue))) {
    return null;
  }

  const factor = Number(layer?.unit_measure?.d_factor || 1);
  return Number(rawValue) / (Number.isFinite(factor) && factor > 0 ? factor : 1);
}

function normalizeTexture({ sand, silt, clay }) {
  const values = [sand, silt, clay].map(Number);

  if (!values.every(Number.isFinite)) {
    return { sand, silt, clay };
  }

  const total = values[0] + values[1] + values[2];

  if (!Number.isFinite(total) || total <= 0) {
    return { sand, silt, clay };
  }

  return {
    sand: (values[0] / total) * 100,
    silt: (values[1] / total) * 100,
    clay: (values[2] / total) * 100
  };
}

function classifyTexture(texture) {
  const { sand, silt, clay } = normalizeTexture(texture);

  if (![sand, silt, clay].every(Number.isFinite)) {
    return "franco";
  }

  if (sand >= 70 && clay < 20) {
    return "arenoso";
  }

  if (clay >= 35 || (clay >= 30 && clay > sand && clay > silt)) {
    return "arcilloso";
  }

  if (silt >= 50 && clay < 27) {
    return "limoso";
  }

  return "franco";
}

function classifyFertility({ soc, cec, phh2o }) {
  let score = 0;

  if (Number.isFinite(soc)) {
    if (soc >= 25) score += 2;
    else if (soc >= 12) score += 1;
  }

  if (Number.isFinite(cec)) {
    if (cec >= 20) score += 2;
    else if (cec >= 10) score += 1;
  }

  if (Number.isFinite(phh2o)) {
    if (phh2o >= 5.8 && phh2o <= 7.8) score += 2;
    else if (phh2o >= 5.2 && phh2o <= 8.4) score += 1;
  }

  if (score >= 5) return "bueno";
  if (score >= 3) return "medio";
  return "pobre";
}

function fallbackSoilByCoordinates(latitude, longitude, error) {
  const isDryNorth = latitude >= 23;
  const isHumidSouth = latitude <= 18;
  const isGulfOrCaribbean = longitude >= -98 && latitude <= 23;

  let soilType = "franco";

  if (isDryNorth) soilType = "arenoso";
  if (isHumidSouth || isGulfOrCaribbean) soilType = "limoso";

  return {
    soilType,
    fertilityLevel: "medio",
    confidence: 0.35,
    source: "estimacion-local",
    warning: null,
    properties: null
  };
}

function buildSuggestionFromSoilGrids(payload) {
  const properties = {
    sand: getLayerValue(payload, "sand"),
    silt: getLayerValue(payload, "silt"),
    clay: getLayerValue(payload, "clay"),
    soc: getLayerValue(payload, "soc"),
    cec: getLayerValue(payload, "cec"),
    phh2o: getLayerValue(payload, "phh2o")
  };

  if (![properties.sand, properties.silt, properties.clay].every(Number.isFinite)) {
    throw new Error("SoilGrids no devolvio textura suficiente para clasificar el suelo.");
  }

  const soilType = classifyTexture(properties);
  const fertilityLevel = classifyFertility(properties);

  if (!VALID_SOIL_TYPES.has(soilType) || !VALID_FERTILITY_LEVELS.has(fertilityLevel)) {
    throw new Error("La clasificacion automatica del suelo no fue valida.");
  }

  return {
    soilType,
    fertilityLevel,
    confidence: 0.82,
    source: "SoilGrids",
    warning: null,
    properties
  };
}

async function detectSoilByLocation(latitudeInput, longitudeInput) {
  const { latitude, longitude } = assertCoordinates(latitudeInput, longitudeInput);

  try {
    const url = buildSoilGridsUrl(latitude, longitude);
    const payload = await fetchWithTimeout(url);
    return buildSuggestionFromSoilGrids(payload);
  } catch (error) {
    // Fallback silencioso: evita mostrar falsos positivos al usuario.
return fallbackSoilByCoordinates(latitude, longitude, error);
  }
}

module.exports = {
  detectSoilByLocation,
  classifyTexture,
  classifyFertility,
  normalizeTexture
};