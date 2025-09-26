import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createError } from './errorHandler';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      throw createError(`Validation error: ${errorMessages.join(', ')}`, 400);
    }
    
    next();
  };
};

// Common validation schemas
export const schemas = {
  barChart: Joi.object({
    title: Joi.string().required().max(100),
    chartId: Joi.string().required().max(50),
    ranges: Joi.array().items(
      Joi.object({
        percentage: Joi.number().required().min(0).max(100),
        count: Joi.number().required().min(0)
      })
    ).required().min(1).max(10),
    chartData: Joi.object({
      labels: Joi.array().items(Joi.string()).required(),
      values: Joi.array().items(Joi.number()).required(),
      colors: Joi.array().items(Joi.string()).required()
    }).required(),
    barThickness: Joi.number().optional().min(10).max(100),
    maxValue: Joi.number().optional().min(1).max(1000),
    stepSize: Joi.number().optional().min(1).max(100)
  }),

  tableData: Joi.object({
    tableData: Joi.object({
      prueba: Joi.string().optional(),
      subject: Joi.string().optional(),
      options: Joi.array().items(Joi.string()).optional(),
      questions: Joi.array().items(
        Joi.object({
          number: Joi.number().optional(),
          competence: Joi.string().optional(),
          component: Joi.string().optional(),
          percentages: Joi.array().items(Joi.number()).optional(),
          correctAnswer: Joi.number().optional(),
          id: Joi.string().optional()
        })
      ).optional()
    }).required()
  }),

  page: Joi.object({
    layout: Joi.string().valid('horizontal', 'vertical').required(),
    headerInfo: Joi.object({
      institucion: Joi.string().required(),
      evaluacion: Joi.string().required(),
      municipio: Joi.string().required(),
      fecha: Joi.string().required()
    }).required(),
    components: Joi.array().items(
      Joi.object({
        type: Joi.string().valid(
          'bar_chart_with_title',
          'bar_chart_simple',
          'tabla_dificultad_analisis',
          'comparativo_puntaje',
          'score_distribution'
        ).required(),
        data: Joi.object().required()
      })
    ).required().min(1)
  }),

  pdf: Joi.object({
    layout: Joi.string().valid('horizontal', 'vertical').required(),
    chartTitle: Joi.string().optional(),
    headerInfo: Joi.object({
      institucion: Joi.string().required(),
      evaluacion: Joi.string().required(),
      municipio: Joi.string().required(),
      fecha: Joi.string().required()
    }).required(),
    components: Joi.array().items(
      Joi.object({
        type: Joi.string().valid(
          'bar_chart_with_title',
          'bar_chart_simple',
          'tabla_dificultad_analisis',
          'comparativo_puntaje',
          'score_distribution'
        ).required(),
        data: Joi.object().required()
      })
    ).required().min(1),
    options: Joi.object({
      format: Joi.string().valid('A4', 'A3', 'Letter', 'Legal').optional(),
      orientation: Joi.string().valid('portrait', 'landscape').optional(),
      margin: Joi.object({
        top: Joi.string().optional(),
        right: Joi.string().optional(),
        bottom: Joi.string().optional(),
        left: Joi.string().optional()
      }).optional(),
      displayHeaderFooter: Joi.boolean().optional(),
      headerTemplate: Joi.string().optional(),
      footerTemplate: Joi.string().optional(),
      printBackground: Joi.boolean().optional(),
      scale: Joi.number().min(0.1).max(2).optional()
    }).optional()
  }),

  simulation: Joi.object({
    campus: Joi.string().required().min(1).max(200),
    course: Joi.string().required().min(1).max(200),
    programName: Joi.string().required().min(1).max(200),
    tipe_inform: Joi.string().required().min(1).max(50).not(""),
    code: Joi.string().required().min(1).max(50),
    simulationId: Joi.string().required().min(1).max(100),
    results: Joi.array().items(
      Joi.object().pattern(
        Joi.string(),
        Joi.object({
          position: Joi.number().required(),
          score: Joi.number().required(),
          totalStudents: Joi.number().required(),
          correctAnswers: Joi.number().required(),
          incorrectAnswers: Joi.number().required(),
          totalAnswered: Joi.number().required()
        })
      )
    ).required().min(1),
    students: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        id_estudiante: Joi.number().required(),
        id_campus: Joi.number().required(),
        course_id: Joi.number().required(),
        document: Joi.string().required(),
        program_id: Joi.number().allow(null).optional(),
        examenes_asignados: Joi.array().items(
          Joi.object({
            index: Joi.number().required(),
            id_simulacro: Joi.string().required(),
            score: Joi.number().required(),
            position: Joi.number().required(),
            respuesta_sesion: Joi.array().items(
              Joi.object({
                session: Joi.number().required(),
                respuestas: Joi.array().items(
                  Joi.object({
                    id_pregunta: Joi.string().required(),
                    id_respuesta: Joi.string().allow(null),
                    letra: Joi.string().required(),
                    es_correcta: Joi.boolean().required()
                  })
                ).required(),
                status: Joi.boolean().required(),
                tiempo_trancurrido: Joi.string().required()
              })
            ).optional(),
            materias: Joi.array().items(
              Joi.object({
                name: Joi.string().required(),
                porcentaje: Joi.number().required(),
                components: Joi.array().items(
                  Joi.object({
                    name: Joi.string().required(),
                    skills: Joi.array().items(
                      Joi.object({
                        name: Joi.string().required(),
                        porcentaje: Joi.number().required()
                      })
                    ).required()
                  })
                ).optional(),
                competencies: Joi.array().items(
                  Joi.object({
                    name: Joi.string().required(),
                    skills: Joi.array().items(
                      Joi.object({
                        name: Joi.string().required(),
                        porcentaje: Joi.number().required()
                      })
                    ).required()
                  })
                ).optional(),
                correct_answers: Joi.number().required(),
                incorrect_answers: Joi.number().required()
              })
            ).optional()
          })
        ).optional(),
        promedio: Joi.any().allow(null).optional(),
        evaluaciones: Joi.any().allow(null).optional(),
        proceso: Joi.any().allow(null).optional()
      })
    ).required().min(1)
  })
};