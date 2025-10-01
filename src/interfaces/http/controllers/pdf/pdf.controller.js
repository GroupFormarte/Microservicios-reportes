const websocketInterface = require('../../../websocket/websocket');
const { processSimulationData } = require('../../../../controllers/reportsController');

class PdfController {

  async generateReport(req, res) {
    try {
      console.log('=== GENERACIÓN DE REPORTE INICIADA ===');

      // Notificar inicio
      websocketInterface.notifyProgress(0, 'Iniciando procesamiento del reporte...');

      const simulationData = req.body;

      // Agregar datos simulados básicos si no existen
      if (!simulationData.tipe_inform) {
        simulationData.tipe_inform = 'udea';
      }
      if (!simulationData.programName) {
        simulationData.programName = 'Programa Test';
      }
      if (!simulationData.campus) {
        simulationData.campus = 'Campus Test';
      }

      // Simular progreso durante el procesamiento
      const progressSteps = [
        { progress: 10, message: 'Validando datos de entrada...' },
        { progress: 20, message: 'Generando página de portada...' },
        { progress: 40, message: 'Procesando datos de estudiantes...' },
        { progress: 60, message: 'Creando gráficos y tablas...' },
        { progress: 80, message: 'Generando PDFs individuales...' },
        { progress: 95, message: 'Combinando PDF final...' }
      ];

      // Enviar progreso paso a paso
      for (const step of progressSteps) {
        websocketInterface.notifyProgress(step.progress, step.message);
        // Pequeña pausa para simular procesamiento
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Procesar usando el controlador existente
      // Crear un objeto de respuesta mock
      const mockRes = {
        json: (data) => {
          if (data.success) {
            // Notificar que el PDF está listo
            websocketInterface.notifyPdfReady(
              data.data.pdf.fileName,
              data.data.pdf.url
            );

            // Enviar respuesta al cliente
            res.json(data);
          } else {
            res.status(500).json(data);
          }
        },
        status: (code) => ({
          json: (data) => res.status(code).json(data)
        })
      };

      // Ejecutar el procesamiento real
      await processSimulationData(req, mockRes);

    } catch (error) {
      console.error('Error en generación de reporte:', error);

      // Notificar error via websocket
      websocketInterface.broadcast({
        status: 'error',
        message: 'Error al generar el reporte: ' + error.message,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Endpoint para obtener estado de WebSocket
  getWebSocketStatus(req, res) {
    res.json({
      success: true,
      data: {
        connectedClients: websocketInterface.getConnectedClients(),
        status: 'active'
      }
    });
  }

  // Endpoint para enviar notificación de prueba
  async sendTestNotification(req, res) {
    try {
      websocketInterface.broadcast({
        status: 'test',
        message: 'Esta es una notificación de prueba',
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: `Notificación enviada a ${websocketInterface.getConnectedClients()} clientes`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new PdfController();