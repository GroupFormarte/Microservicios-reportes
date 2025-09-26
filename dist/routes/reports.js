"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportsController_1 = require("../controllers/reportsController");
const router = (0, express_1.Router)();
// 🎯 NEW ENDPOINT - Process simulation data
router.post('/simulation', reportsController_1.processSimulationData);
exports.default = router;
