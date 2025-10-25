// Script para probar los filtros de estudiantes y áreas

const testData = {
  campus: "Test Campus",
  course: "Test Course",
  programName: "Test Program",
  code: "TEST-01",
  results: {
    "student1": { position: 1, score: 450 },
    "student2": { position: 2, score: 0 },
    "student3": { position: 3, score: 380 }
  },
  students: [
    {
      id: "student1",
      name: "Juan Pérez",
      document: "1001",
      course_id: "7",
      examenes_asignados: [{
        score: 450,
        position: 1,
        materias: [
          { name: "Matemáticas", porcentaje: "80" },
          { name: "Lectura", porcentaje: "70" },
          { name: "Ciencias", porcentaje: "0" }, // Área con 0
          { name: "Inglés", porcentaje: "60" }
        ]
      }]
    },
    {
      id: "student2",
      name: "María García (AUSENTE)",
      document: "1002",
      course_id: "7",
      examenes_asignados: [{
        score: 0,
        position: 2,
        materias: [
          { name: "Matemáticas", porcentaje: "0" },
          { name: "Lectura", porcentaje: "0" },
          { name: "Ciencias", porcentaje: "0" },
          { name: "Inglés", porcentaje: "0" }
        ]
      }]
    },
    {
      id: "student3",
      name: "Carlos López",
      document: "1003",
      course_id: "7",
      examenes_asignados: [{
        score: 380,
        position: 3,
        materias: [
          { name: "Matemáticas", porcentaje: "65" },
          { name: "Lectura", porcentaje: "55" },
          { name: "Ciencias", porcentaje: "0" }, // Área con 0
          { name: "Inglés", porcentaje: "50" }
        ]
      }]
    }
  ]
};

console.log("=== DATOS DE PRUEBA ===\n");
console.log("📊 Estudiantes:");
testData.students.forEach(s => {
  console.log(`  - ${s.name}`);
  if (s.examenes_asignados[0]) {
    const materias = s.examenes_asignados[0].materias;
    const allZero = materias.every(m => parseFloat(m.porcentaje) === 0);
    console.log(`    Estado: ${allZero ? '❌ AUSENTE (todas las áreas en 0)' : '✅ PRESENTE'}`);
  }
});

console.log("\n📋 Áreas:");
const areas = ["Matemáticas", "Lectura", "Ciencias", "Inglés"];
areas.forEach(area => {
  const allZero = testData.students.every(s => {
    const materia = s.examenes_asignados[0]?.materias.find(m => m.name === area);
    return parseFloat(materia?.porcentaje || "0") === 0;
  });
  console.log(`  - ${area}: ${allZero ? '❌ NO EVALUADA (todos tienen 0)' : '✅ EVALUADA'}`);
});

console.log("\n=== RESULTADO ESPERADO ===");
console.log("Estudiantes a incluir:");
console.log("  ✅ Juan Pérez");
console.log("  ❌ María García (ausente - todas las áreas en 0)");
console.log("  ✅ Carlos López");

console.log("\nÁreas a incluir:");
console.log("  ✅ Matemáticas");
console.log("  ✅ Lectura");
console.log("  ❌ Ciencias (todos tienen 0)");
console.log("  ✅ Inglés");

console.log("\n✅ Los filtros deberían eliminar:");
console.log("  - 1 estudiante ausente (María García)");
console.log("  - 1 área sin datos (Ciencias)");
