/**
 * Configuration for adaptive font sizing based on text length
 */
interface FontSizeConfig {
  level: 'normal' | 'medium' | 'small' | 'tiny';
  maxLength: number;
  fontSize: number;
}

/**
 * Adaptive font sizing based on text length
 * Allows text to fit better in PDF fields by reducing font size as content grows
 * 
 * @param text - The text to be displayed
 * @param normalConfig - {fontSize: number, maxLength: number} for normal text length
 * @param mediumConfig - {fontSize: number, maxLength: number} for medium text length (optional)
 * @param smallConfig - {fontSize: number, maxLength: number} for small text length (optional)
 * @param tinyConfig - {fontSize: number, maxLength: number} for tiny text length (optional)
 * @returns The appropriate font size for the given text length
 * 
 * @example
 * // Simple two-level: 10pt for <=20 chars, 8pt for >20 chars
 * getAdaptiveFontSize(text, { fontSize: 10, maxLength: 20 }, { fontSize: 8, maxLength: 999 })
 * 
 * // Three-level: 10pt (0-20), 9pt (21-40), 8pt (41+)
 * getAdaptiveFontSize(
 *   text,
 *   { fontSize: 10, maxLength: 20 },
 *   { fontSize: 9, maxLength: 40 },
 *   { fontSize: 8, maxLength: 999 }
 * )
 * 
 * // Four-level with extreme cases
 * getAdaptiveFontSize(
 *   text,
 *   { fontSize: 10, maxLength: 20 },
 *   { fontSize: 9, maxLength: 40 },
 *   { fontSize: 8, maxLength: 70 },
 *   { fontSize: 6, maxLength: 999 }
 * )
 */
export const getAdaptiveFontSize = (
  text: string,
  normalConfig: { fontSize: number; maxLength: number },
  mediumConfig?: { fontSize: number; maxLength: number },
  smallConfig?: { fontSize: number; maxLength: number },
  tinyConfig?: { fontSize: number; maxLength: number }
): number => {
  const textLength = text.length;

  // Build config array with provided levels
  const configs: FontSizeConfig[] = [
    { level: 'normal', fontSize: normalConfig.fontSize, maxLength: normalConfig.maxLength },
  ];

  if (mediumConfig) {
    configs.push({ level: 'medium', fontSize: mediumConfig.fontSize, maxLength: mediumConfig.maxLength });
  }

  if (smallConfig) {
    configs.push({ level: 'small', fontSize: smallConfig.fontSize, maxLength: smallConfig.maxLength });
  }

  if (tinyConfig) {
    configs.push({ level: 'tiny', fontSize: tinyConfig.fontSize, maxLength: tinyConfig.maxLength });
  }

  // Sort by maxLength to ensure proper matching
  configs.sort((a, b) => a.maxLength - b.maxLength);

  // Find the appropriate font size based on text length
  for (const config of configs) {
    if (textLength <= config.maxLength) {
      return config.fontSize;
    }
  }

  // Return the smallest font size if text exceeds all thresholds
  return configs[configs.length - 1].fontSize;
};
