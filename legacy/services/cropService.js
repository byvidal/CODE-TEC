const fallbackCrops = require("../data/crops");

const PERENUAL_API_URL = process.env.PERENUAL_API_URL || "https://perenual.com/api/v2";
const PERENUAL_API_KEY = process.env.PERENUAL_API_KEY;
const PERENUAL_CROPS_ENABLED = process.env.PERENUAL_CROPS_ENABLED === "true";
const PERENUAL_MAX_RETRIES = Number(process.env.PERENUAL_MAX_RETRIES || 1);
let cachedCropResult = null;

const perenualCropQueries = [
  { query: "corn", fallbackId: "maiz" },
  { query: "bean", fallbackId: "frijol" },
  { query: "wheat", fallbackId: "trigo" },
  { query: "tomato", fallbackId: "jitomate" },
  { query: "sorghum", fallbackId: "sorgo" }
];

/**
 * Encuentra un cultivo en el catálogo local por ID
 * @param {string} fallbackId - ID del cultivo
 * @returns {object|undefined} Datos del cultivo
 */
function findFallbackProfile(fallbackId) {
  return fallbackCrops.find((crop) => crop.id === fallbackId);
}

function asTextList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return [String(value)];
}

function formatWatering(details) {
  const watering = details.watering || "No especificado";
  const benchmark = details.watering_general_benchmark;

  if (benchmark?.value && benchmark?.unit) {
    return `${watering}. Referencia Perenual: cada ${benchmark.value} ${benchmark.unit}.`;
  }

  return watering;
}

function buildCare(details, profile) {
  const care = [];
  const sunlight = asTextList(details.sunlight).join(", ");
  const soil = asTextList(details.soil).join(", ");

  if (sunlight) {
    care.push(`Luz recomendada por Perenual: ${sunlight}.`);
  }

  if (details.maintenance) {
    care.push(`Mantenimiento estimado: ${details.maintenance}.`);
  }

  if (details.growth_rate) {
    care.push(`Tasa de crecimiento: ${details.growth_rate}.`);
  }

  if (details.harvest_season) {
    care.push(`Temporada de cosecha: ${details.harvest_season}.`);
  }

  if (soil) {
    care.push(`Suelos reportados por Perenual: ${soil}.`);
  }

  return care.length ? care : profile.care;
}

function mergePerenualDetails(details, profile) {
  const commonName = details.common_name || profile.name;
  const scientificName = asTextList(details.scientific_name).join(", ");

  return {
    ...profile,
    id: profile.id,
    name: profile.name,
    scientificName: scientificName || profile.scientificName || null,
    externalName: commonName,
    imageUrl: details.default_image?.regular_url || details.default_image?.original_url || null,
    cycle: details.cycle || null,
    waterRequirement: formatWatering(details) || profile.waterRequirement,
    care: buildCare(details, profile),
    perenual: {
      id: details.id,
      commonName,
      type: details.type || null,
      edibleFruit: Boolean(details.edible_fruit),
      poisonousToHumans: Boolean(details.poisonous_to_humans),
      droughtTolerant: Boolean(details.drought_tolerant),
      saltTolerant: Boolean(details.salt_tolerant)
    }
  };
}

async function fetchJson(url) {
  const maxRetries = Math.max(1, PERENUAL_MAX_RETRIES);
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        const error = new Error(`Perenual respondio con estado ${response.status}.`);
        error.statusCode = response.status;
        throw error;
      }

      return response.json();
    } catch (error) {
      lastError = error;
      
      // Si es error 429 (rate limit) o 502 (bad gateway), reintentar
      if (error.statusCode === 429 || error.statusCode === 502) {
        if (attempt < maxRetries - 1) {
          const waitTime = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s, 16s
          console.warn(`[Reintento ${attempt + 1}/${maxRetries}] Perenual respondio con ${error.statusCode}. Esperando ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      throw error;
    }
  }

  throw lastError;
}

async function fetchPerenualDetail(queryConfig) {
  const listUrl = new URL(`${PERENUAL_API_URL}/species-list`);
  listUrl.searchParams.set("key", PERENUAL_API_KEY);
  listUrl.searchParams.set("q", queryConfig.query);
  listUrl.searchParams.set("edible", "1");

  const listPayload = await fetchJson(listUrl);
  const firstMatch = listPayload.data?.[0];

  if (!firstMatch?.id) {
    return null;
  }

  const detailsUrl = new URL(`${PERENUAL_API_URL}/species/details/${firstMatch.id}`);
  detailsUrl.searchParams.set("key", PERENUAL_API_KEY);

  return fetchJson(detailsUrl);
}

async function fetchPerenualCrops() {
  if (!PERENUAL_API_KEY || !PERENUAL_CROPS_ENABLED) {
    return null;
  }

  const crops = [];
  
  // Ejecutar secuencialmente para evitar rate limiting
  for (let i = 0; i < perenualCropQueries.length; i++) {
    const queryConfig = perenualCropQueries[i];
    const profile = findFallbackProfile(queryConfig.fallbackId);
    
    if (!profile) {
      console.warn(`Perfil local no encontrado para: ${queryConfig.fallbackId}`);
      continue;
    }
    
    try {
      const details = await fetchPerenualDetail(queryConfig);
      if (details) {
        crops.push(mergePerenualDetails(details, profile));
      }
    } catch (error) {
      if (error.statusCode === 429) {
        throw new Error("Perenual alcanzo el limite de solicitudes.");
      }

      console.warn(`Error al obtener detalles de Perenual para ${queryConfig.query}:`, error.message);
      // Continuar con el siguiente cultivo
    }
    
    // Esperar entre solicitudes para evitar rate limiting
    if (i < perenualCropQueries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 800)); // 800ms entre solicitudes
    }
  }

  if (!crops.length) {
    throw new Error("Perenual no devolvio cultivos utiles.");
  }

  return crops;
}

function mergeCatalogs(localCrops, apiCrops = []) {
  const mergedById = new Map(localCrops.map((crop) => [crop.id, crop]));

  apiCrops.forEach((crop) => {
    if (!crop?.id) {
      return;
    }

    mergedById.set(crop.id, {
      ...mergedById.get(crop.id),
      ...crop
    });
  });

  return Array.from(mergedById.values()).sort((a, b) => a.name.localeCompare(b.name, "es-MX"));
}

function buildLocalCropResult(warning = null) {
  const result = {
    source: "catalogo-local",
    crops: mergeCatalogs(fallbackCrops)
  };

  if (warning) {
    result.warning = warning;
  }

  return result;
}

/**
 * Obtiene los cultivos desde Perenual API o catálogo local como fallback
 * @returns {Promise<{source: string, crops: array, warning?: string}>} Cultivos disponibles
 */
async function getCrops() {
  if (cachedCropResult) {
    return cachedCropResult;
  }

  try {
    const apiCrops = await fetchPerenualCrops();
    if (apiCrops?.length) {
      const mergedCrops = mergeCatalogs(fallbackCrops, apiCrops);
      console.log(`✓ Cultivos cargados desde catalogo local con datos Perenual (${mergedCrops.length})`);
      cachedCropResult = {
        source: "catalogo-local+Perenual",
        crops: mergedCrops
      };
      return cachedCropResult;
    }
  } catch (error) {
    console.log(`[INFO] Usando catálogo local. Razón: ${error.message}`);
  }

  // Fallback al catálogo local
  console.log(`✓ Usando catálogo local de cultivos (${fallbackCrops.length} cultivos disponibles)`);
  cachedCropResult = buildLocalCropResult();
  return cachedCropResult;
}

module.exports = {
  getCrops
};
