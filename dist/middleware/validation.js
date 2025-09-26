"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemas = exports.validate = void 0;
const joi_1 = __importDefault(require("joi"));
const errorHandler_1 = require("./errorHandler");
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message);
            throw (0, errorHandler_1.createError)(`Validation error: ${errorMessages.join(', ')}`, 400);
        }
        next();
    };
};
exports.validate = validate;
// Common validation schemas
exports.schemas = {
    barChart: joi_1.default.object({
        title: joi_1.default.string().required().max(100),
        chartId: joi_1.default.string().required().max(50),
        ranges: joi_1.default.array().items(joi_1.default.object({
            percentage: joi_1.default.number().required().min(0).max(100),
            count: joi_1.default.number().required().min(0)
        })).required().min(1).max(10),
        chartData: joi_1.default.object({
            labels: joi_1.default.array().items(joi_1.default.string()).required(),
            values: joi_1.default.array().items(joi_1.default.number()).required(),
            colors: joi_1.default.array().items(joi_1.default.string()).required()
        }).required(),
        barThickness: joi_1.default.number().optional().min(10).max(100),
        maxValue: joi_1.default.number().optional().min(1).max(1000),
        stepSize: joi_1.default.number().optional().min(1).max(100)
    }),
    tableData: joi_1.default.object({
        tableData: joi_1.default.object({
            prueba: joi_1.default.string().optional(),
            subject: joi_1.default.string().optional(),
            options: joi_1.default.array().items(joi_1.default.string()).optional(),
            questions: joi_1.default.array().items(joi_1.default.object({
                number: joi_1.default.number().optional(),
                competence: joi_1.default.string().optional(),
                component: joi_1.default.string().optional(),
                percentages: joi_1.default.array().items(joi_1.default.number()).optional(),
                correctAnswer: joi_1.default.number().optional(),
                id: joi_1.default.string().optional()
            })).optional()
        }).required()
    }),
    page: joi_1.default.object({
        layout: joi_1.default.string().valid('horizontal', 'vertical').required(),
        headerInfo: joi_1.default.object({
            institucion: joi_1.default.string().required(),
            evaluacion: joi_1.default.string().required(),
            municipio: joi_1.default.string().required(),
            fecha: joi_1.default.string().required()
        }).required(),
        components: joi_1.default.array().items(joi_1.default.object({
            type: joi_1.default.string().valid('bar_chart_with_title', 'bar_chart_simple', 'tabla_dificultad_analisis', 'comparativo_puntaje', 'score_distribution').required(),
            data: joi_1.default.object().required()
        })).required().min(1)
    }),
    pdf: joi_1.default.object({
        layout: joi_1.default.string().valid('horizontal', 'vertical').required(),
        chartTitle: joi_1.default.string().optional(),
        headerInfo: joi_1.default.object({
            institucion: joi_1.default.string().required(),
            evaluacion: joi_1.default.string().required(),
            municipio: joi_1.default.string().required(),
            fecha: joi_1.default.string().required()
        }).required(),
        components: joi_1.default.array().items(joi_1.default.object({
            type: joi_1.default.string().valid('bar_chart_with_title', 'bar_chart_simple', 'tabla_dificultad_analisis', 'comparativo_puntaje', 'score_distribution').required(),
            data: joi_1.default.object().required()
        })).required().min(1),
        options: joi_1.default.object({
            format: joi_1.default.string().valid('A4', 'A3', 'Letter', 'Legal').optional(),
            orientation: joi_1.default.string().valid('portrait', 'landscape').optional(),
            margin: joi_1.default.object({
                top: joi_1.default.string().optional(),
                right: joi_1.default.string().optional(),
                bottom: joi_1.default.string().optional(),
                left: joi_1.default.string().optional()
            }).optional(),
            displayHeaderFooter: joi_1.default.boolean().optional(),
            headerTemplate: joi_1.default.string().optional(),
            footerTemplate: joi_1.default.string().optional(),
            printBackground: joi_1.default.boolean().optional(),
            scale: joi_1.default.number().min(0.1).max(2).optional()
        }).optional()
    }),
    simulation: joi_1.default.object({
        campus: joi_1.default.string().required().min(1).max(200),
        course: joi_1.default.string().required().min(1).max(200),
        programName: joi_1.default.string().required().min(1).max(200),
        tipe_inform: joi_1.default.string().required().min(1).max(50).not(""),
        code: joi_1.default.string().required().min(1).max(50),
        simulationId: joi_1.default.string().required().min(1).max(100),
        results: joi_1.default.array().items(joi_1.default.object().pattern(joi_1.default.string(), joi_1.default.object({
            position: joi_1.default.number().required(),
            score: joi_1.default.number().required(),
            totalStudents: joi_1.default.number().required(),
            correctAnswers: joi_1.default.number().required(),
            incorrectAnswers: joi_1.default.number().required(),
            totalAnswered: joi_1.default.number().required()
        }))).required().min(1),
        students: joi_1.default.array().items(joi_1.default.object({
            id: joi_1.default.string().required(),
            id_estudiante: joi_1.default.number().required(),
            id_campus: joi_1.default.number().required(),
            course_id: joi_1.default.number().required(),
            document: joi_1.default.string().required(),
            program_id: joi_1.default.number().allow(null).optional(),
            examenes_asignados: joi_1.default.array().items(joi_1.default.object({
                index: joi_1.default.number().required(),
                id_simulacro: joi_1.default.string().required(),
                score: joi_1.default.number().required(),
                position: joi_1.default.number().required(),
                respuesta_sesion: joi_1.default.array().items(joi_1.default.object({
                    session: joi_1.default.number().required(),
                    respuestas: joi_1.default.array().items(joi_1.default.object({
                        id_pregunta: joi_1.default.string().required(),
                        id_respuesta: joi_1.default.string().allow(null),
                        letra: joi_1.default.string().required(),
                        es_correcta: joi_1.default.boolean().required()
                    })).required(),
                    status: joi_1.default.boolean().required(),
                    tiempo_trancurrido: joi_1.default.string().required()
                })).optional(),
                materias: joi_1.default.array().items(joi_1.default.object({
                    name: joi_1.default.string().required(),
                    porcentaje: joi_1.default.number().required(),
                    components: joi_1.default.array().items(joi_1.default.object({
                        name: joi_1.default.string().required(),
                        skills: joi_1.default.array().items(joi_1.default.object({
                            name: joi_1.default.string().required(),
                            porcentaje: joi_1.default.number().required()
                        })).required()
                    })).optional(),
                    competencies: joi_1.default.array().items(joi_1.default.object({
                        name: joi_1.default.string().required(),
                        skills: joi_1.default.array().items(joi_1.default.object({
                            name: joi_1.default.string().required(),
                            porcentaje: joi_1.default.number().required()
                        })).required()
                    })).optional(),
                    correct_answers: joi_1.default.number().required(),
                    incorrect_answers: joi_1.default.number().required()
                })).optional()
            })).optional(),
            promedio: joi_1.default.any().allow(null).optional(),
            evaluaciones: joi_1.default.any().allow(null).optional(),
            proceso: joi_1.default.any().allow(null).optional()
        })).required().min(1)
    })
};
