"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const reportsController_1 = require("../controllers/reportsController");
const router = (0, express_1.Router)();
// 🎯 NEW ENDPOINT - Process simulation data
router.post('/simulation', reportsController_1.processSimulationData);
// 🔄 REGENERATE ENDPOINT - Regenerate reports from report_data
router.post('/regenerate', reportsController_1.regenerateReport);
// 📊 EXCEL ENDPOINT - Generate Excel report from simulation data (scores)
router.post('/excel-puntajes', reportsController_1.generateExcelReport);
// 📝 EXCEL ANSWERS ENDPOINT - Generate Excel report with student answers
router.post('/excel-respuestas', reportsController_1.generateExcelAnswers);
// 🧪 TEST ENDPOINT - WebSocket test page
router.get('/test-websocket', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../public/test-websocket.html'));
});
exports.default = router;
