const express = require("express");
const { getWeather } = require("../services/weatherService");
const { getCrops } = require("../services/cropService");
const { reverseGeocode } = require("../services/locationService");
const { generateRecommendation, analyzeCropConditions } = require("../services/recommendationService");
const { createAgriculturalReportPdf } = require("../services/pdfService");
const { soilProfiles } = require("../utils/soil");

const router = express.Router();

router.get("/health", (_request, response) => {
  response.json({
    ok: true,
    app: "PDA",
    timestamp: new Date().toISOString()
  });
});

router.get("/soil-types", (_request, response) => {
  response.json({
    soilTypes: soilProfiles
  });
});

router.get("/crops", async (_request, response) => {
  const result = await getCrops();
  response.json(result);
});

router.post("/geocode/reverse", async (request, response, next) => {
  try {
    const { latitude, longitude } = request.body;

    if (!latitude || !longitude) {
      return response.status(400).json({
        error: "Latitud y longitud son obligatorias."
      });
    }

    const location = await reverseGeocode(latitude, longitude);
    response.json(location);
  } catch (error) {
    next(error);
  }
});

router.post("/crop-care", async (request, response, next) => {
  try {
    const { latitude, longitude, cropId, customCrop, soilType, fertilityLevel, landSizeHa } = request.body;
    
    // Validación básica de entrada
    if (!latitude || !longitude || !soilType || !fertilityLevel) {
      return response.status(400).json({
        error: "Todos los parametros de ubicacion (latitude, longitude, soilType, fertilityLevel) son obligatorios."
      });
    }

    if (!cropId && !customCrop) {
      return response.status(400).json({
        error: "Debes proporcionar cropId o escribir un cultivo personalizado (customCrop)."
      });
    }
    
    const [weather, cropResult] = await Promise.all([
      getWeather(latitude, longitude),
      getCrops()
    ]);

    const selectedCrop = resolveSelectedCrop(cropResult.crops, { cropId, customCrop });

    if (!selectedCrop) {
      const cropLabel = cropId ? `ID '${cropId}'` : `'${customCrop}'`;
      return response.status(404).json({
        error: `No se encontro informacion para el cultivo ${cropLabel}.`
      });
    }

    // Analizar el cultivo en las condiciones locales
    const analysis = analyzeCropConditions({
      crop: selectedCrop,
      weather,
      soilType,
      fertilityLevel,
      landSizeHa
    });

    response.json({
      weather,
      cropSource: cropResult.source,
      cropWarning: cropResult.warning || null,
      ...analysis
    });
  } catch (error) {
    next(error);
  }
});

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCropSearchValues(crop) {
  return [
    crop.id,
    crop.name,
    crop.scientificName,
    crop.externalName,
    crop.perenual?.commonName
  ]
    .filter(Boolean)
    .map(normalizeText);
}

function findCropById(crops, cropId) {
  const normalizedId = normalizeText(cropId);
  return crops.find((crop) => normalizeText(crop.id) === normalizedId);
}

function findCropByName(crops, cropName) {
  const normalizedName = normalizeText(cropName);
  if (!normalizedName) {
    return null;
  }

  return (
    crops.find((crop) => getCropSearchValues(crop).some((value) => value === normalizedName)) ||
    crops.find((crop) => getCropSearchValues(crop).some((value) => value.includes(normalizedName)))
  );
}

function resolveSelectedCrop(crops, { cropId, customCrop }) {
  if (cropId) {
    const crop = findCropById(crops, cropId);
    if (crop) {
      return crop;
    }
  }

  if (customCrop) {
    return findCropByName(crops, customCrop) || createGenericCrop(customCrop);
  }

  return null;
}

/**
 * Crea un cultivo generico cuando el usuario escribe un cultivo personalizado
 * @param {string} cropName - Nombre del cultivo
 * @returns {object} Cultivo generico con condiciones por defecto
 */
function createGenericCrop(cropName) {
  return {
    id: `custom-${Date.now()}`,
    name: cropName,
    scientificName: "Cultivo personalizado",
    optimalConditions: {
      temperatureMin: 15,
      temperatureMax: 28,
      humidityMin: 40,
      humidityMax: 75,
      soilTypes: ["franco", "limoso", "arcilloso"]
    },
    waterRequirement: "500-800 mm por ciclo",
    growthTimeDays: 120,
    theoreticalYieldTonHa: 5,
    care: [
      "Mantener humedad consistente del suelo.",
      "Proporcionar riego regular según clima.",
      "Monitorear plagas y enfermedades."
    ]
  };
}

router.get("/weather", async (request, response, next) => {
  try {
    const { latitude, longitude } = request.query;
    
    if (!latitude || !longitude) {
      return response.status(400).json({
        error: "Latitud y longitud son obligatorias."
      });
    }
    
    const weather = await getWeather(latitude, longitude);
    response.json(weather);
  } catch (error) {
    next(error);
  }
});

router.post("/recommendations", async (request, response, next) => {
  try {
    const { latitude, longitude, soilType, fertilityLevel, landSizeHa } = request.body;
    
    // Validacion basica de entrada
    if (!latitude || !longitude || !soilType || !fertilityLevel || !landSizeHa) {
      return response.status(400).json({
        error: "Todos los parametros (latitude, longitude, soilType, fertilityLevel, landSizeHa) son obligatorios."
      });
    }
    
    const [weather, cropResult] = await Promise.all([
      getWeather(latitude, longitude),
      getCrops()
    ]);

    const recommendation = generateRecommendation({
      crops: cropResult.crops,
      weather,
      soilType,
      fertilityLevel,
      landSizeHa
    });

    response.json({
      weather,
      cropSource: cropResult.source,
      cropWarning: cropResult.warning || null,
      ...recommendation
    });
  } catch (error) {
    next(error);
  }
});

router.post("/reports/pdf", async (request, response, next) => {
  try {
    const { latitude, longitude, soilType, fertilityLevel, landSizeHa, cropId, customCrop } = request.body;
    
    // Validacion basica de entrada
    if (!latitude || !longitude || !soilType || !fertilityLevel || !landSizeHa) {
      return response.status(400).json({
        error: "Todos los parametros (latitude, longitude, soilType, fertilityLevel, landSizeHa) son obligatorios."
      });
    }
    
    const [weather, cropResult] = await Promise.all([
      getWeather(latitude, longitude),
      getCrops()
    ]);

    const selectedCrop = resolveSelectedCrop(cropResult.crops, { cropId, customCrop });
    if ((cropId || customCrop) && !selectedCrop) {
      const cropLabel = cropId ? `ID '${cropId}'` : `'${customCrop}'`;
      return response.status(404).json({
        error: `No se encontro informacion para el cultivo ${cropLabel}.`
      });
    }

    const recommendation = selectedCrop
      ? {
          reportMode: "selected",
          ...analyzeCropConditions({
            crop: selectedCrop,
            weather,
            soilType,
            fertilityLevel,
            landSizeHa
          })
        }
      : generateRecommendation({
          crops: cropResult.crops,
          weather,
          soilType,
          fertilityLevel,
          landSizeHa
        });

    const reportData = {
      weather,
      cropSource: cropResult.source,
      cropWarning: cropResult.warning || null,
      ...recommendation
    };

    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", 'attachment; filename="reporte-pda.pdf"');

    const pdf = createAgriculturalReportPdf(reportData);
    pdf.pipe(response);
    pdf.end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
