const data = require('./sab.json');
const student = data.students[0];
const examen = student.examenes_asignados[0];

console.log('Total sesiones:', examen.respuesta_sesion.length);

examen.respuesta_sesion.slice(0, 2).forEach((session, idx) => {
  console.log('\nSesion', idx + 1);
  console.log('  respuestas.length:', session.respuestas?.length || 0);

  if (session.respuestas && session.respuestas.length > 0) {
    const indexes = session.respuestas.map(r => parseInt(r.index_question));
    console.log('  Min index:', Math.min(...indexes));
    console.log('  Max index:', Math.max(...indexes));
    console.log('  Primeros 5 indexes:', indexes.slice(0, 5));
  }
});

// Simular la lógica del código
const sessionesToProcess = examen.respuesta_sesion.slice(0, 2);
const sessionesToProcessAux = [];
for (const session of sessionesToProcess) {
  if (session.respuestas !== null && session.respuestas !== undefined) {
    sessionesToProcessAux.push(session);
  }
}
console.log('\nSesiones validas:', sessionesToProcessAux.length);

// Simular el Map
const respuestasMap = new Map();
sessionesToProcessAux.forEach((session) => {
  session.respuestas.forEach((respuesta) => {
    const indexQuestion = parseInt(respuesta.index_question) || 0;
    respuestasMap.set(indexQuestion, {
      letra: respuesta.letra || 'NR'
    });
  });
});

console.log('\nTotal respuestas en Map:', respuestasMap.size);
console.log('Indices en Map (primeros 10):', Array.from(respuestasMap.keys()).sort((a,b) => a-b).slice(0, 10));
console.log('Indices en Map (ultimos 10):', Array.from(respuestasMap.keys()).sort((a,b) => a-b).slice(-10));
