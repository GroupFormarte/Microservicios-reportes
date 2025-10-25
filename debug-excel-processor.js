// Debug script to test excelDataProcessor with saber.json

const fs = require('fs');

// Simular la función extraerAreasUnicas
function extraerAreasUnicas(simulationData) {
  const areasSet = new Set();

  if (!simulationData.students || simulationData.students.length === 0) {
    console.log('❌ No hay estudiantes');
    return [];
  }

  console.log(`✅ Estudiantes encontrados: ${simulationData.students.length}`);

  simulationData.students.forEach((student, idx) => {
    console.log(`\nEstudiante ${idx + 1}: ${student.name}`);

    if (student.examenes_asignados && student.examenes_asignados.length > 0) {
      console.log(`  ✅ Tiene examenes_asignados: ${student.examenes_asignados.length}`);

      student.examenes_asignados.forEach((examen, examIdx) => {
        console.log(`  Examen ${examIdx + 1}:`);

        if (examen.materias && examen.materias.length > 0) {
          console.log(`    ✅ Tiene materias: ${examen.materias.length}`);

          examen.materias.forEach((materia) => {
            if (materia.name) {
              console.log(`      - ${materia.name}: ${materia.porcentaje}%`);
              areasSet.add(materia.name);
            }
          });
        } else {
          console.log(`    ❌ No tiene materias`);
        }
      });
    } else {
      console.log(`  ❌ No tiene examenes_asignados`);
    }
  });

  const areas = Array.from(areasSet).sort();
  console.log(`\n📊 Áreas únicas extraídas: ${areas.length}`);
  console.log(areas);

  return areas;
}

// Leer saber.json
const data = JSON.parse(fs.readFileSync('./saber.json', 'utf8'));

console.log('=== INICIANDO DEBUG DE PROCESAMIENTO ===\n');

const areasUnicas = extraerAreasUnicas(data);

console.log('\n=== RESULTADO FINAL ===');
console.log(`Total de áreas: ${areasUnicas.length}`);
console.log(`Áreas: ${JSON.stringify(areasUnicas, null, 2)}`);
