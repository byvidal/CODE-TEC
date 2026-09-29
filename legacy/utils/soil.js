const soilProfiles = {
  arenoso: {
    label: "Arenoso",
    fertility: {
      pobre: 0.5,
      medio: 0.7,
      bueno: 0.9
    },
    defaultFertilityLevel: "medio"
  },
  arcilloso: {
    label: "Arcilloso",
    fertility: {
      pobre: 0.5,
      medio: 0.7,
      bueno: 0.9
    },
    defaultFertilityLevel: "bueno"
  },
  limoso: {
    label: "Limoso",
    fertility: {
      pobre: 0.5,
      medio: 0.7,
      bueno: 0.9
    },
    defaultFertilityLevel: "bueno"
  },
  franco: {
    label: "Franco",
    fertility: {
      pobre: 0.5,
      medio: 0.7,
      bueno: 0.9
    },
    defaultFertilityLevel: "bueno"
  }
};

/**
 * Obtiene el coeficiente de fertilidad para un tipo de suelo
 * @param {string} soilType - Tipo de suelo (arenoso, arcilloso, limoso, franco)
 * @param {string} fertilityLevel - Nivel de fertilidad (pobre, medio, bueno)
 * @returns {object|null} Datos del coeficiente o null si son inválidos
 */
function getSoilCoefficient(soilType, fertilityLevel) {
  const profile = soilProfiles[soilType];

  if (!profile) {
    return null;
  }

  const selectedLevel = fertilityLevel || profile.defaultFertilityLevel;
  const coefficient = profile.fertility[selectedLevel];

  if (!coefficient) {
    return null;
  }

  return {
    soilType,
    soilLabel: profile.label,
    fertilityLevel: selectedLevel,
    coefficient
  };
}

module.exports = {
  soilProfiles,
  getSoilCoefficient
};
