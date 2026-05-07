const express = require("express");

const { getWeather } = require("../services/weatherService");
const { getCrops } = require("../services/cropService");
const { reverseGeocode } = require("../services/locationService");
const {
  generateRecommendation,
  analyzeCropConditions
} = require("../services/recommendationService");
const { createAgriculturalReportPdf } = require("../services/pdfService");
const { detectSoilByLocation } = require("../services/soilDetectionService");
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

router.get("/crops", async (_request, response, next) => {
  try {
    const result = await getCrops();
    response.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/geocode/reverse", async (request, response, next) => {
  try {
    const { latitude, longitude } = request.body;

    if (isMissing(latitude) || isMissing(longitude)) {
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

router.post("/soil/detect", async (request, response, next) => {
  try {
    const { latitude, longitude } = request.body;

    if (isMissing(latitude) || isMissing(longitude)) {
      return response.status(400).json({
        error: "Latitud y longitud son obligatorias para detectar el suelo."
      });
    }

    const detection = await detectSoilByLocation(latitude, longitude);
    response.json(detection);
  } catch (error) {
    next(error);
  }
});

router.post("/crop-care", async (request, response, next) => {
  try {
    const {
      latitude,
      longitude,
      cropId,
      customCrop,
      soilType,
      fertilityLevel,
      landSizeHa
    } = request.body;

    if (isMissing(latitude) || isMissing(longitude)) {
      return response.status(400).json({
        error: "Latitud y longitud son obligatorias."
      });
    }

    if (!cropId && isMissing(customCrop)) {
      return response.status(400).json({
        error: "Debes proporcionar cropId o escribir un cultivo personalizado (customCrop)."
      });
    }

    const [weather, cropResult, soilSelection] = await Promise.all([
      getWeather(latitude, longitude),
      getCrops(),
      resolveSoilForRequest({ latitude, longitude, soilType, fertilityLevel })
    ]);

    const selectedCrop = resolveSelectedCrop(cropResult.crops, { cropId, customCrop });

    if (!selectedCrop) {
      const cropLabel = cropId ? `ID '${cropId}'` : `'${customCrop}'`;
      return response.status(404).json({
        error: `No se encontro informacion para el cultivo ${cropLabel}.`
      });
    }

    const analysis = analyzeCropConditions({
      crop: selectedCrop,
      weather,
      soilType: soilSelection.soilType,
      fertilityLevel: soilSelection.fertilityLevel,
      landSizeHa
    });

    response.json({
      weather,
      cropSource: cropResult.source,
      cropWarning: cropResult.warning || null,
      soilDetection: soilSelection.soilDetection,
      ...analysis
    });
  } catch (error) {
    next(error);
  }
});

router.get("/weather", async (request, response, next) => {
  try {
    const { latitude, longitude } = request.query;

    if (isMissing(latitude) || isMissing(longitude)) {
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

    if (isMissing(latitude) || isMissing(longitude) || isMissing(landSizeHa)) {
      return response.status(400).json({
        error: "Latitud, longitud y tamano del terreno son obligatorios."
      });
    }

    const [weather, cropResult, soilSelection] = await Promise.all([
      getWeather(latitude, longitude),
      getCrops(),
      resolveSoilForRequest({ latitude, longitude, soilType, fertilityLevel })
    ]);

    const recommendation = generateRecommendation({
      crops: cropResult.crops,
      weather,
      soilType: soilSelection.soilType,
      fertilityLevel: soilSelection.fertilityLevel,
      landSizeHa
    });

    response.json({
      weather,
      cropSource: cropResult.source,
      cropWarning: cropResult.warning || null,
      soilDetection: soilSelection.soilDetection,
      ...recommendation
    });
  } catch (error) {
    next(error);
  }
});

router.post("/reports/pdf", async (request, response, next) => {
  try {
    const {
      latitude,
      longitude,
      soilType,
      fertilityLevel,
      landSizeHa,
      cropId,
      customCrop
    } = request.body;

    if (isMissing(latitude) || isMissing(longitude) || isMissing(landSizeHa)) {
      return response.status(400).json({
        error: "Latitud, longitud y tamano del terreno son obligatorios."
      });
    }

    const [weather, cropResult, soilSelection] = await Promise.all([
      getWeather(latitude, longitude),
      getCrops(),
      resolveSoilForRequest({ latitude, longitude, soilType, fertilityLevel })
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
            soilType: soilSelection.soilType,
            fertilityLevel: soilSelection.fertilityLevel,
            landSizeHa
          })
        }
      : generateRecommendation({
          crops: cropResult.crops,
          weather,
          soilType: soilSelection.soilType,
          fertilityLevel: soilSelection.fertilityLevel,
          landSizeHa
        });

    const reportData = {
      weather,
      cropSource: cropResult.source,
      cropWarning: cropResult.warning || null,
      soilDetection: soilSelection.soilDetection,
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

function isMissing(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wantsAutomaticSoil(soilType, fertilityLevel) {
  return (
    isMissing(soilType) ||
    isMissing(fertilityLevel) ||
    normalizeText(soilType) === "auto" ||
    normalizeText(fertilityLevel) === "auto"
  );
}

async function resolveSoilForRequest({ latitude, longitude, soilType, fertilityLevel }) {
  if (wantsAutomaticSoil(soilType, fertilityLevel)) {
    const detection = await detectSoilByLocation(latitude, longitude);

    return {
      soilType: detection.soilType,
      fertilityLevel: detection.fertilityLevel,
      soilDetection: detection
    };
  }

  return {
    soilType,
    fertilityLevel,
    soilDetection: {
      soilType,
      fertilityLevel,
      confidence: 1,
      source: "manual",
      warning: null,
      properties: null
    }
  };
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
      "Proporcionar riego regular segun clima.",
      "Monitorear plagas y enfermedades."
    ]
  };
}

module.exports = router;