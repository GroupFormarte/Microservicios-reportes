/**
 * Utilidades para cálculos matemáticos en los reportes
 */

/**
 * Calcula el número de preguntas correctas a partir de un porcentaje.
 * 
 * @param porcentaje - Porcentaje de aciertos (0-100)
 * @param totalPreguntas - Número total de preguntas
 * @returns Número de preguntas correctas
 */
export function calcularPreguntas(porcentaje: number, totalPreguntas: number): number {
  if (porcentaje < 0 || porcentaje > 100) {
    throw new Error("El porcentaje debe estar entre 0 y 100");
  }
  if (totalPreguntas <= 0) {
    throw new Error("El número total de preguntas debe ser mayor que 0");
  }

  // cálculo
  const correctas = (porcentaje / 100) * totalPreguntas;

  // redondeamos al entero más cercano
  return Math.round(correctas);
}

/**
 * Calcula el porcentaje a partir del número de respuestas correctas.
 * 
 * @param correctas - Número de respuestas correctas
 * @param totalPreguntas - Número total de preguntas
 * @returns Porcentaje (0-100)
 */
export function calcularPorcentaje(correctas: number, totalPreguntas: number): number {
  if (correctas < 0 || totalPreguntas <= 0) {
    throw new Error("Los valores deben ser positivos");
  }
  if (correctas > totalPreguntas) {
    throw new Error("Las respuestas correctas no pueden superar el total");
  }

  return Math.round((correctas / totalPreguntas) * 100);
}

/**
 * Clasifica el nivel de competencia según respuestas correctas (UDEA).
 * 
 * @param correctAnswers - Número de respuestas correctas
 * @returns Nivel de competencia ('I', 'II', 'III' o '')
 */
export function clasificarNivelUdea(correctAnswers: number): string {
  if (correctAnswers >= 0 && correctAnswers <= 10) {
    return 'I';
  } else if (correctAnswers >= 11 && correctAnswers <= 25) {
    return 'II';
  } else if (correctAnswers >= 26 && correctAnswers <= 40) {
    return 'III';
  }
  return '';
}