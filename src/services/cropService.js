const fallbackCrops = require("../data/crops");

const FGFARM_API_URL = process.env.FGFARM_API_URL;
const FGFARM_API_KEY = process.env.FGFARM_API_KEY;

function normalizeCrop(rawCrop) {
  return {
    id: rawCrop.id || rawCrop.slug || rawCrop.name?.toLowerCase().replace(/\s+/g, "-"),
    name: rawCrop.name || rawCrop.nombre || "Cultivo",
    optimalConditions: rawCrop.optimalConditions || rawCrop.condicionesOptimas || {
      temperatureMin: rawCrop.temperatureMin ?? 15,
      temperatureMax: rawCrop.temperatureMax ?? 30,
      humidityMin: rawCrop.humidityMin ?? 40,
      humidityMax: rawCrop.humidityMax ?? 75,
      soilTypes: rawCrop.soilTypes || rawCrop.suelos || ["franco"]
    },
    waterRequirement: rawCrop.waterRequirement || rawCrop.requerimientoAgua || "No especificado",
    growthTimeDays: Number(rawCrop.growthTimeDays || rawCrop.tiempoCrecimiento || 100),
    theoreticalYieldTonHa: Number(rawCrop.theoreticalYieldTonHa || rawCrop.rendimientoTeorico || 1),
    care: rawCrop.care || rawCrop.cuidados || []
  };
}

async function fetchFgFarmCrops() {
  if (!FGFARM_API_URL) {
    return null;
  }

  const headers = {
    Accept: "application/json"
  };

  if (FGFARM_API_KEY) {
    headers.Authorization = `Bearer ${FGFARM_API_KEY}`;
  }

  const response = await fetch(FGFARM_API_URL, { headers });

  if (!response.ok) {
    throw new Error(`FgFarm respondio con estado ${response.status}.`);
  }

  const payload = await response.json();
  const items = Array.isArray(payload) ? payload : payload.crops || payload.data || [];

  return items.map(normalizeCrop).filter((crop) => crop.name && crop.theoreticalYieldTonHa);
}

async function getCrops() {
  try {
    const apiCrops = await fetchFgFarmCrops();
    if (apiCrops?.length) {
      return {
        source: "FgFarm",
        crops: apiCrops
      };
    }
  } catch (error) {
    return {
      source: "catalogo-local",
      warning: error.message,
      crops: fallbackCrops
    };
  }

  return {
    source: "catalogo-local",
    crops: fallbackCrops
  };
}

module.exports = {
  getCrops
};
