const express = require("express");
const { getWeather } = require("../services/weatherService");
const { getCrops } = require("../services/cropService");
const { generateRecommendation } = require("../services/recommendationService");
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

router.get("/weather", async (request, response, next) => {
  try {
    const weather = await getWeather(request.query.latitude, request.query.longitude);
    response.json(weather);
  } catch (error) {
    next(error);
  }
});

router.post("/recommendations", async (request, response, next) => {
  try {
    const { latitude, longitude, soilType, fertilityLevel, landSizeHa } = request.body;
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

module.exports = router;
