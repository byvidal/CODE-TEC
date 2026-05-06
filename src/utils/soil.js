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
