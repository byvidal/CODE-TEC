const NOMINATIM_BASE_URL = process.env.NOMINATIM_BASE_URL || "https://nominatim.openstreetmap.org/reverse";
const NOMINATIM_USER_AGENT =
  process.env.NOMINATIM_USER_AGENT || "PDA/1.0 (https://github.com/byvidal/CODE-TEC)";

/**
 * Valida y convierte coordenadas geográficas
 * @param {number|string} latitude - Latitud (-90 a 90)
 * @param {number|string} longitude - Longitud (-180 a 180)
 * @returns {{latitude: number, longitude: number}} Coordenadas validadas
 * @throws {Error} Si las coordenadas son inválidas
 */
function assertCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("Latitud y longitud son obligatorias.");
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error("Coordenadas fuera de rango.");
  }

  return { latitude: lat, longitude: lon };
}

/**
 * Obtiene una ubicación aproximada desde Nominatim.
 * @param {number|string} latitudeInput - Latitud del lugar
 * @param {number|string} longitudeInput - Longitud del lugar
 * @returns {Promise<{source: string, latitude: number, longitude: number, displayName: string | null, address: object | null}>}
 */
async function reverseGeocode(latitudeInput, longitudeInput) {
  const { latitude, longitude } = assertCoordinates(latitudeInput, longitudeInput);
  const url = new URL(NOMINATIM_BASE_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", latitude);
  url.searchParams.set("lon", longitude);
  url.searchParams.set("zoom", "14");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "es",
      "User-Agent": NOMINATIM_USER_AGENT
    }
  });

  if (!response.ok) {
    const error = new Error(`Nominatim respondio con estado ${response.status}.`);
    error.statusCode = response.status;
    throw error;
  }

  const payload = await response.json();

  return {
    source: "Nominatim",
    latitude,
    longitude,
    displayName: payload.display_name || null,
    address: payload.address || null
  };
}

module.exports = {
  reverseGeocode
};
