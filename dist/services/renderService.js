"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderService = void 0;
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const logger_1 = require("../utils/logger");
class RenderService {
    constructor() {
        this.viewsPath = path_1.default.join(__dirname, '../../views');
    }
    async renderBarChart(data) {
        const startTime = Date.now();
        try {
            const templatePath = path_1.default.join(this.viewsPath, 'components/bar_chart_with_title.ejs');
            const html = await ejs_1.default.renderFile(templatePath, data);
            const renderTime = Date.now() - startTime;
            logger_1.logger.debug(`Bar chart rendered in ${renderTime}ms`, { chartId: data.chartId });
            return {
                html,
                metadata: {
                    renderTime,
                    componentCount: 1,
                    cacheKey: `bar_chart_${data.chartId}`
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error rendering bar chart', { error: error.message, data });
            throw new Error(`Failed to render bar chart: ${error.message}`);
        }
    }
    async renderTable(data) {
        const startTime = Date.now();
        try {
            const templatePath = path_1.default.join(this.viewsPath, 'components/tabla-dificultad-analisis.ejs');
            // Ajustar estructura de datos para el template
            const templateData = data.tableData ? data : { tableData: data };
            const html = await ejs_1.default.renderFile(templatePath, templateData);
            const renderTime = Date.now() - startTime;
            logger_1.logger.debug(`Table rendered in ${renderTime}ms`);
            return {
                html,
                metadata: {
                    renderTime,
                    componentCount: 1,
                    cacheKey: `table_${templateData.tableData?.subject || 'default'}`
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error rendering table', { error: error.message, data });
            throw new Error(`Failed to render table: ${error.message}`);
        }
    }
    async renderComparative(data) {
        const startTime = Date.now();
        try {
            // Validar y proporcionar valores por defecto para chartData
            const defaultChartData = {
                labels: data.subjects || ["Matemáticas", "Lenguaje", "Ciencias", "Sociales", "Inglés"],
                datasets: data.chartData?.datasets || []
            };
            // Si no hay datasets, crear datasets por defecto basados en tableData
            if (defaultChartData.datasets.length === 0 && data.tableData && data.tableData.length > 0) {
                const colors = ['#d88008', '#bd5785', '#4b3e7a', '#27a1db', '#4c8631'];
                defaultChartData.datasets = data.tableData.map((row, index) => ({
                    label: row.label,
                    data: row.values.map(val => typeof val === 'number' ? val : parseInt(val.toString()) || 0),
                    backgroundColor: colors[index % colors.length],
                    borderColor: '#333'
                }));
            }
            logger_1.logger.debug('Comparative chart data validation', {
                hasLabels: defaultChartData.labels.length > 0,
                datasetCount: defaultChartData.datasets.length,
                chartId: data.chartId
            });
            const templatePath = path_1.default.join(this.viewsPath, 'components/comparativo-puntaje.ejs');
            const html = await ejs_1.default.renderFile(templatePath, {
                ...data,
                chartData: defaultChartData,
                chartConfig: data.chartConfig || {}
            });
            const renderTime = Date.now() - startTime;
            logger_1.logger.debug(`Comparative chart rendered in ${renderTime}ms`, { chartId: data.chartId });
            return {
                html,
                metadata: {
                    renderTime,
                    componentCount: 1,
                    cacheKey: `comparative_${data.chartId || 'default'}`
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error rendering comparative chart', { error: error.message, data });
            throw new Error(`Failed to render comparative chart: ${error.message}`);
        }
    }
    async renderLayout(data) {
        const startTime = Date.now();
        try {
            let content = data.content || '';
            // Render components if provided
            if (data.components && data.components.length > 0) {
                const componentPromises = data.components.map(async (component) => {
                    switch (component.type) {
                        case 'bar_chart_with_title':
                            const barResult = await this.renderBarChart(component.data);
                            return barResult.html;
                        case 'bar_chart_simple':
                            const barSimpleResult = await this.renderBarChartSimple(component.data);
                            return barSimpleResult.html;
                        case 'tabla_dificultad_analisis':
                            const tableResult = await this.renderTable(component.data);
                            return tableResult.html;
                        case 'comparativo_puntaje':
                            const compResult = await this.renderComparative(component.data);
                            return compResult.html;
                        case 'score_distribution':
                            const scoreResult = await this.renderScoreDistribution(component.data);
                            return scoreResult.html;
                        case 'score_distribution_horizontal':
                            const scoreHorizontalResult = await this.renderScoreDistributionHorizontal(component.data);
                            return scoreHorizontalResult.html;
                        case 'competencias_chart':
                            const competenciasResult = await this.renderCompetenciasChart(component.data);
                            return competenciasResult.html;
                        default:
                            logger_1.logger.warn(`Unknown component type: ${component.type}`);
                            return '';
                    }
                });
                const componentHtmls = await Promise.all(componentPromises);
                content += componentHtmls.join('\n');
            }
            // Determine layout template
            const layoutMap = {
                horizontal: 'layouts/horizontal.ejs',
                vertical: 'layouts/vertical.ejs',
                base: 'layouts/base.ejs'
            };
            const layout = data.layout || 'base';
            const templatePath = path_1.default.join(this.viewsPath, layoutMap[layout]);
            const html = await ejs_1.default.renderFile(templatePath, {
                ...data,
                content
            });
            const renderTime = Date.now() - startTime;
            const componentCount = (data.components?.length || 0) + 1;
            logger_1.logger.debug(`Layout rendered in ${renderTime}ms`, {
                layout,
                componentCount
            });
            return {
                html,
                metadata: {
                    renderTime,
                    componentCount,
                    cacheKey: `layout_${layout}_${componentCount}`
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error rendering layout', { error: error.message, data });
            throw new Error(`Failed to render layout: ${error.message}`);
        }
    }
    async renderMultipleCharts(charts) {
        const startTime = Date.now();
        try {
            const chartPromises = charts.map(chart => this.renderBarChart(chart));
            const results = await Promise.all(chartPromises);
            const html = results.map(result => result.html).join('\n');
            const totalRenderTime = Date.now() - startTime;
            logger_1.logger.debug(`Multiple charts rendered in ${totalRenderTime}ms`, {
                count: charts.length
            });
            return {
                html,
                metadata: {
                    renderTime: totalRenderTime,
                    componentCount: charts.length,
                    cacheKey: `multi_charts_${charts.length}`
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error rendering multiple charts', { error: error.message });
            throw new Error(`Failed to render multiple charts: ${error.message}`);
        }
    }
    async renderScoreDistribution(data) {
        const startTime = Date.now();
        try {
            const templatePath = path_1.default.join(this.viewsPath, 'components/score_distribution.ejs');
            const html = await ejs_1.default.renderFile(templatePath, data);
            const renderTime = Date.now() - startTime;
            logger_1.logger.debug(`Score distribution rendered in ${renderTime}ms`);
            return {
                html,
                metadata: {
                    renderTime,
                    componentCount: 1,
                    cacheKey: `score_distribution_${data.subjects?.[0]?.chartId || 'default'}`
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error rendering score distribution', { error: error.message, data });
            throw new Error(`Failed to render score distribution: ${error.message}`);
        }
    }
    async renderScoreDistributionHorizontal(data) {
        const startTime = Date.now();
        try {
            const templatePath = path_1.default.join(this.viewsPath, 'components/score_distribution_horizontal.ejs');
            const html = await ejs_1.default.renderFile(templatePath, data);
            const renderTime = Date.now() - startTime;
            logger_1.logger.debug(`Score distribution horizontal rendered in ${renderTime}ms`);
            return {
                html,
                metadata: {
                    renderTime,
                    componentCount: 1,
                    cacheKey: `score_distribution_horizontal_${data.subjects?.[0]?.chartId || 'default'}`
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error rendering score distribution horizontal', { error: error.message, data });
            throw new Error(`Failed to render score distribution horizontal: ${error.message}`);
        }
    }
    async renderBarChartSimple(data) {
        const startTime = Date.now();
        try {
            const templatePath = path_1.default.join(this.viewsPath, 'components/bar_chart_simple.ejs');
            const html = await ejs_1.default.renderFile(templatePath, data);
            const renderTime = Date.now() - startTime;
            logger_1.logger.debug(`Bar chart simple rendered in ${renderTime}ms`, { chartId: data.chartId });
            return {
                html,
                metadata: {
                    renderTime,
                    componentCount: 1,
                    cacheKey: `bar_chart_simple_${data.chartId}`
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error rendering bar chart simple', { error: error.message, data });
            throw new Error(`Failed to render bar chart simple: ${error.message}`);
        }
    }
    async renderCompetenciasChart(data) {
        const startTime = Date.now();
        try {
            const templatePath = path_1.default.join(this.viewsPath, 'components/competencias_chart.ejs');
            const html = await ejs_1.default.renderFile(templatePath, data);
            const renderTime = Date.now() - startTime;
            logger_1.logger.debug(`Competencias chart rendered in ${renderTime}ms`, { chartId: data.chartId });
            return {
                html,
                metadata: {
                    renderTime,
                    componentCount: 1,
                    cacheKey: `competencias_chart_${data.chartId || 'default'}`
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error rendering competencias chart', { error: error.message, data });
            throw new Error(`Failed to render competencias chart: ${error.message}`);
        }
    }
    async renderPage(data) {
        const startTime = Date.now();
        try {
            // Check if this is a single portada component - render directly without layout
            if (data.components && data.components.length === 1 && data.components[0].type === 'portada') {
                const portadaResult = await this.renderPortada(data.components[0].data);
                const renderTime = Date.now() - startTime;
                logger_1.logger.info(`Portada page rendered directly`, {
                    renderTime,
                    institucion: data.headerInfo.institucion
                });
                return {
                    html: portadaResult.html,
                    metadata: {
                        renderTime,
                        componentCount: 1,
                        cacheKey: `portada_direct`
                    }
                };
            }
            let content = '';
            // Render all components (normal flow for non-portada pages)
            if (data.components && data.components.length > 0) {
                const componentPromises = data.components.map(async (component) => {
                    let componentHtml = '';
                    switch (component.type) {
                        case 'bar_chart_with_title':
                            const barResult = await this.renderBarChart(component.data);
                            componentHtml = barResult.html;
                            break;
                        case 'bar_chart_simple':
                            const barSimpleResult = await this.renderBarChartSimple(component.data);
                            componentHtml = barSimpleResult.html;
                            break;
                        case 'tabla_dificultad_analisis':
                            const tableResult = await this.renderTable(component.data);
                            componentHtml = tableResult.html;
                            break;
                        case 'comparativo_puntaje':
                            const compResult = await this.renderComparative(component.data);
                            componentHtml = compResult.html;
                            break;
                        case 'score_distribution':
                            const scoreResult = await this.renderScoreDistribution(component.data);
                            componentHtml = scoreResult.html;
                            break;
                        case 'score_distribution_horizontal':
                            const scoreHorizontalResult = await this.renderScoreDistributionHorizontal(component.data);
                            componentHtml = scoreHorizontalResult.html;
                            break;
                        case 'tabla_con_puntaje':
                            const tablaPuntajeResult = await this.renderTablaPuntaje(component.data);
                            componentHtml = tablaPuntajeResult.html;
                            break;
                        case 'competencias_chart':
                            const competenciasResult = await this.renderCompetenciasChart(component.data);
                            componentHtml = competenciasResult.html;
                            break;
                        default:
                            logger_1.logger.warn(`Unknown component type: ${component.type}`);
                            return '';
                    }
                    // Wrap component with grid class for CSS styling
                    return `<div class="component-${component.type.replace(/_/g, '-')}">\n${componentHtml}\n</div>`;
                });
                const componentHtmls = await Promise.all(componentPromises);
                content = componentHtmls.join('\n');
            }
            // Determine layout template based on layout type
            const layoutTemplate = data.layout === 'horizontal' ? 'layouts/horizontal.ejs' : 'layouts/vertical.ejs';
            const templatePath = path_1.default.join(this.viewsPath, layoutTemplate);
            // Check if this is for PDF generation (we'll add a flag)
            const isPdfGeneration = data.forPdf || false;
            const baseUrl = isPdfGeneration ? (process.env.BASE_URL || 'http://localhost:3001') : '';
            const html = await ejs_1.default.renderFile(templatePath, {
                headerInfo: data.headerInfo,
                content,
                chartTitle: data.chartTitle,
                subTitle: data.subTitle,
                title: `Reporte ${data.headerInfo.evaluacion}`,
                logoPath: '/assets/images/logo.png',
                logoAlt: 'Logo Institución',
                baseUrl,
                isPdfGeneration
            });
            const renderTime = Date.now() - startTime;
            const componentCount = data.components?.length || 0;
            logger_1.logger.info(`Page rendered successfully`, {
                layout: data.layout,
                componentCount,
                renderTime,
                institucion: data.headerInfo.institucion
            });
            return {
                html,
                metadata: {
                    renderTime,
                    componentCount,
                    cacheKey: `page_${data.layout}_${componentCount}`
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error rendering page', {
                error: error.message,
                layout: data.layout,
                componentCount: data.components?.length || 0
            });
            throw new Error(`Failed to render page: ${error.message}`);
        }
    }
    async renderPortada(data) {
        const startTime = Date.now();
        try {
            const templatePath = path_1.default.join(this.viewsPath, 'components/portada.ejs');
            const html = await ejs_1.default.renderFile(templatePath, data);
            const renderTime = Date.now() - startTime;
            logger_1.logger.debug(`Portada rendered in ${renderTime}ms`);
            return {
                html,
                metadata: {
                    renderTime,
                    componentCount: 1,
                    cacheKey: `portada_${data.campus || 'default'}`
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error rendering portada', { error: error.message, data });
            throw new Error(`Failed to render portada: ${error.message}`);
        }
    }
    async renderTablaPuntaje(data) {
        const startTime = Date.now();
        try {
            const templatePath = path_1.default.join(this.viewsPath, 'components/tabla_con_puntaje.ejs');
            const html = await ejs_1.default.renderFile(templatePath, data);
            const renderTime = Date.now() - startTime;
            logger_1.logger.debug(`Tabla con puntaje rendered in ${renderTime}ms`, {
                studentCount: data.estudiantes?.length || 0,
                competenciesCount: data.competencias?.length || 0
            });
            return {
                html,
                metadata: {
                    renderTime,
                    componentCount: 1,
                    cacheKey: `tabla_puntaje_${data.estudiantes?.length || 0}_students`
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error rendering tabla con puntaje', { error: error.message, data });
            throw new Error(`Failed to render tabla con puntaje: ${error.message}`);
        }
    }
}
exports.RenderService = RenderService;
