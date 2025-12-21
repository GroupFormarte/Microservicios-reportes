/**
 * Chart ID Generator
 * Genera IDs únicos para gráficos, sin caracteres especiales
 */

/**
 * Sanitiza un string para usarlo como ID de gráfico
 * - Remueve acentos
 * - Convierte a minúsculas
 * - Reemplaza espacios y caracteres especiales por guiones bajos
 * - Remueve caracteres no alfanuméricos (excepto guiones bajos)
 */
export function sanitizeForChartId(text: string): string {
  if (!text) return '';

  return text
    // Convertir a minúsculas
    .toLowerCase()
    // Remover acentos
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Reemplazar espacios y guiones por guiones bajos
    .replace(/[\s\-]+/g, '_')
    // Remover caracteres especiales (mantener solo letras, números y guiones bajos)
    .replace(/[^a-z0-9_]/g, '')
    // Reemplazar múltiples guiones bajos por uno solo
    .replace(/_+/g, '_')
    // Remover guiones bajos al inicio y final
    .replace(/^_|_$/g, '');
}

/**
 * Genera un ID único para gráficos con contador opcional
 * @param baseName - Nombre base para el ID
 * @param suffix - Sufijo opcional (ej: 'competencias', 'chart')
 * @param counter - Número único para evitar duplicados
 */
export function generateChartId(
  baseName: string,
  suffix?: string,
  counter?: number
): string {
  const sanitizedBase = sanitizeForChartId(baseName);
  const parts: string[] = [sanitizedBase];

  if (suffix) {
    parts.push(sanitizeForChartId(suffix));
  }

  if (counter !== undefined) {
    parts.push(counter.toString());
  }

  return parts.filter(Boolean).join('_');
}

/**
 * Genera un ID único para gráficos combinando múltiples textos
 * @param parts - Array de strings a combinar
 * @param counter - Número único para evitar duplicados
 */
export function generateUniqueChartId(parts: string[], counter?: number): string {
  const sanitizedParts = parts.map(part => sanitizeForChartId(part)).filter(Boolean);

  if (counter !== undefined) {
    sanitizedParts.push(counter.toString());
  }

  return sanitizedParts.join('_');
}

/**
 * Mapa para rastrear IDs generados y evitar duplicados
 */
const chartIdRegistry = new Map<string, number>();

/**
 * Genera un ID único garantizado sin duplicados
 * @param baseName - Nombre base para el ID
 * @param suffix - Sufijo opcional
 */
export function generateUniqueChartIdWithRegistry(
  baseName: string,
  suffix?: string
): string {
  const baseId = generateChartId(baseName, suffix);

  if (!chartIdRegistry.has(baseId)) {
    chartIdRegistry.set(baseId, 1);
    return baseId;
  }

  // Si ya existe, agregar un número
  const count = chartIdRegistry.get(baseId)!;
  chartIdRegistry.set(baseId, count + 1);

  return `${baseId}_${count}`;
}

/**
 * Limpia el registro de IDs (útil para iniciar un nuevo reporte)
 */
export function clearChartIdRegistry(): void {
  chartIdRegistry.clear();
}

/**
 * Ejemplos de uso:
 *
 * sanitizeForChartId("Competencia Léctora")
 * // => "competencia_lectora"
 *
 * sanitizeForChartId("Matemáticas (Álgebra)")
 * // => "matematicas_algebra"
 *
 * generateChartId("Competencia Léctora", "competencias")
 * // => "competencia_lectora_competencias"
 *
 * generateChartId("Matemáticas", "chart", 1)
 * // => "matematicas_chart_1"
 *
 * generateUniqueChartId(["Competencia Léctora", "Literal"], 1)
 * // => "competencia_lectora_literal_1"
 *
 * generateUniqueChartIdWithRegistry("Matemáticas", "competencias")
 * // Primera vez: "matematicas_competencias"
 * // Segunda vez: "matematicas_competencias_1"
 * // Tercera vez: "matematicas_competencias_2"
 */
