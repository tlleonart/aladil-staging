/**
 * Convert a country code to a flag emoji
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "AR", "BR", "MX")
 * @returns Flag emoji string
 */
export const getCountryFlag = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) {
    return "🏳️";
  }

  const code = countryCode.toUpperCase();
  const offset = 127397; // Regional indicator symbol offset

  const flag = String.fromCodePoint(
    ...code.split("").map((char) => char.charCodeAt(0) + offset),
  );

  return flag;
};

/**
 * Get country name from country code
 */
export const getCountryName = (countryCode: string): string => {
  const countries: Record<string, string> = {
    AR: "Argentina",
    BO: "Bolivia",
    BR: "Brasil",
    CL: "Chile",
    CO: "Colombia",
    CR: "Costa Rica",
    CU: "Cuba",
    DO: "República Dominicana",
    EC: "Ecuador",
    SV: "El Salvador",
    GT: "Guatemala",
    HN: "Honduras",
    MX: "México",
    NI: "Nicaragua",
    PA: "Panamá",
    PY: "Paraguay",
    PE: "Perú",
    PR: "Puerto Rico",
    UY: "Uruguay",
    VE: "Venezuela",
    ES: "España",
    US: "Estados Unidos",
  };

  return countries[countryCode?.toUpperCase()] || countryCode;
};
