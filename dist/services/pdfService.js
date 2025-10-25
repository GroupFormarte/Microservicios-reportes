"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfService = exports.PdfService = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const pdf_lib_1 = require("pdf-lib");
const logger_1 = require("../utils/logger");
const renderService_1 = require("./renderService");
class PdfService {
    constructor() {
        this.browser = null;
        this.renderService = new renderService_1.RenderService();
        this.pdfsDir = path_1.default.join(__dirname, '../../public/pdfs');
        this.ensurePdfsDirectory();
    }
    async ensurePdfsDirectory() {
        try {
            await promises_1.default.access(this.pdfsDir);
        }
        catch {
            await promises_1.default.mkdir(this.pdfsDir, { recursive: true });
            logger_1.logger.info('Created PDFs directory', { path: this.pdfsDir });
        }
    }
    async getBrowser() {
        if (!this.browser) {
            logger_1.logger.info('Launching Puppeteer browser');
            this.browser = await puppeteer_1.default.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--allow-running-insecure-content',
                    '--disable-extensions-except',
                    '--disable-extensions'
                ]
            });
        }
        return this.browser;
    }
    async analyzePageBreaks(data, options = {}) {
        let page = null;
        try {
            const pdfData = { ...data, forPdf: true };
            const renderResult = await this.renderService.renderPage(pdfData);
            const browser = await this.getBrowser();
            page = await browser.newPage();
            await page.setViewport({ width: 1200, height: 1600 });
            const htmlContent = this.inlineResources(renderResult.html);
            await page.setContent(htmlContent, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            // Medir altura del contenido
            const measurements = await page.evaluate(() => {
                const body = document.body;
                const html = document.documentElement;
                const contentHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
                // Altura aproximada de página A4 en píxeles (96 DPI)
                const a4HeightPx = options.orientation === 'landscape' ? 842 : 595;
                const estimatedPages = Math.ceil(contentHeight / a4HeightPx);
                return {
                    contentHeight,
                    estimatedPages,
                    willHavePageBreaks: estimatedPages > 1
                };
            });
            return measurements;
        }
        catch (error) {
            throw new Error(`Failed to analyze page breaks: ${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            if (page)
                await page.close();
        }
    }
    inlineResources(html) {
        // Simplificado - en la práctica usarías el mismo código de generatePdf
        return html;
    }
    static estimateContentSize(data) {
        let estimatedHeight = 200; // Header base
        // Estimar altura basada en componentes
        for (const component of data.components) {
            switch (component.type) {
                case 'bar-chart-with-title':
                case 'bar-chart-simple':
                    estimatedHeight += 400; // Charts son altos
                    break;
                case 'tabla-dificultad-analisis':
                    // Basado en número de filas
                    const rows = component.data?.tableData?.length || 10;
                    estimatedHeight += Math.max(300, rows * 30);
                    break;
                case 'comparativo-puntaje':
                    estimatedHeight += 250;
                    break;
                case 'tabla-estudiantes':
                    const studentRows = component.data?.students?.length || 20;
                    estimatedHeight += Math.max(400, studentRows * 25);
                    break;
                case 'portada':
                    estimatedHeight += 600;
                    break;
                default:
                    estimatedHeight += 200;
            }
        }
        // A4 portrait ≈ 842px altura útil
        const pageHeight = data.layout === 'horizontal' ? 595 : 842;
        return {
            estimatedHeight,
            likelyMultiPage: estimatedHeight > pageHeight
        };
    }
    async generatePdf(data, options = {}) {
        const startTime = Date.now();
        let page = null;
        try {
            logger_1.logger.info('Starting PDF generation', {
                layout: data.layout,
                componentCount: data.components.length,
                institution: data.headerInfo.institucion
            });
            // Generate HTML content with PDF flag
            const pdfData = { ...data, forPdf: true };
            const renderResult = await this.renderService.renderPage(pdfData);
            // Get browser and create page
            const browser = await this.getBrowser();
            page = await browser.newPage();
            // Configure page for better PDF rendering
            await page.setViewport({ width: 1200, height: 1600 });
            // Set default PDF options
            const defaultOptions = {
                format: 'A4',
                orientation: data.layout === 'horizontal' ? 'landscape' : 'portrait',
                margin: {
                    top: '0cm',
                    right: '0cm',
                    bottom: '0cm',
                    left: '0cm'
                },
                printBackground: true,
                displayHeaderFooter: false,
                scale: 0.75
            };
            const pdfOptions = { ...defaultOptions, ...options };
            // Load HTML content directly with inline resources
            logger_1.logger.info('Loading HTML content for PDF generation');
            // Read and inline CSS files
            const layoutCSS = data.layout === 'horizontal' ? 'horizontal-layout.css' : 'vertical-layout.css';
            const cssFiles = [
                path_1.default.join(__dirname, '../../public/css/variables.css'),
                path_1.default.join(__dirname, '../../public/css/base.css'),
                path_1.default.join(__dirname, `../../public/css/${layoutCSS}`)
            ];
            let inlineCSS = '';
            for (const cssFile of cssFiles) {
                try {
                    const cssContent = await promises_1.default.readFile(cssFile, 'utf-8');
                    inlineCSS += cssContent + '\n';
                }
                catch (error) {
                    logger_1.logger.warn(`Could not read CSS file: ${cssFile}`, { error: error.message });
                }
            }
            // Convert images to base64 and replace in HTML
            let htmlWithInlineCSS = renderResult.html;
            // Define image paths to convert
            const imagePaths = [
                '/api/reports/assets/PNG/Logo horizontal.png',
                '/api/reports/assets/PNG/Institucion.png',
                '/api/reports/assets/PNG/Evaluacion.png',
                '/api/reports/assets/PNG/Municipio.png',
                '/api/reports/assets/PNG/Fecha.png'
            ];
            // Convert images to base64
            for (const imagePath of imagePaths) {
                try {
                    const fullImagePath = path_1.default.join(__dirname, '../../..', 'Recursos/assets', imagePath.split('/assets/')[1]);
                    const imageBuffer = await promises_1.default.readFile(fullImagePath);
                    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
                    // Replace all occurrences of the image path
                    const regex = new RegExp(imagePath.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'g');
                    htmlWithInlineCSS = htmlWithInlineCSS.replace(regex, base64Image);
                }
                catch (error) {
                    logger_1.logger.warn(`Could not convert image to base64: ${imagePath}`, { error: error.message });
                }
            }
            // Inject inline CSS into HTML
            htmlWithInlineCSS = htmlWithInlineCSS.replace('</head>', `<style>${inlineCSS}</style></head>`);
            // Try setContent first, fallback to data URL if it fails
            try {
                await page.setContent(htmlWithInlineCSS, {
                    waitUntil: 'domcontentloaded',
                    timeout: 120000
                });
            }
            catch (timeoutError) {
                logger_1.logger.warn('setContent timed out, trying alternative approach');
                // Fallback: use data URL approach
                const dataUrl = `data:text/html;base64,${Buffer.from(htmlWithInlineCSS).toString('base64')}`;
                await page.goto(dataUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 60000
                });
            }
            // Wait for all resources to load and charts to render
            logger_1.logger.info('Waiting for charts and resources to load');
            await page.evaluate(() => {
                return new Promise((resolve) => {
                    let chartsReady = false;
                    let resourcesReady = false;
                    // Check for charts
                    const checkCharts = () => {
                        if (typeof window.Chart !== 'undefined') {
                            // Wait for all charts to be rendered - increased timeout for better reliability
                            setTimeout(() => {
                                chartsReady = true;
                                if (resourcesReady)
                                    resolve();
                            }, 8000);
                        }
                        else {
                            chartsReady = true;
                            if (resourcesReady)
                                resolve();
                        }
                    };
                    // Check for resources
                    const checkResources = () => {
                        if (document.readyState === 'complete') {
                            resourcesReady = true;
                            if (chartsReady)
                                resolve();
                        }
                    };
                    checkCharts();
                    if (document.readyState === 'complete') {
                        checkResources();
                    }
                    else {
                        window.addEventListener('load', checkResources);
                    }
                    // Fallback timeout
                    setTimeout(() => resolve(), 15000);
                });
            });
            // Add CSS for better PDF rendering
            await page.addStyleTag({
                content: `
          @media print {
            body { -webkit-print-color-adjust: exact; color-adjust: exact;    margin: 0;
            padding: 0; }
            .chart-container canvas { max-width: 100% !important; height: auto !important; }
            .component-bar-chart-with-title, .component-bar-chart-simple { 
              page-break-inside: avoid; 
              margin-bottom: 20px;
            }
            .component-tabla-dificultad-analisis, .component-comparativo-puntaje {
              page-break-inside: avoid;
              margin-bottom: 30px;
            }

        
          }
        `
            });
            logger_1.logger.info('Generating PDF with options', pdfOptions);
            // Generate PDF
            const pdf = await page.pdf({
                format: pdfOptions.format,
                landscape: pdfOptions.orientation === 'landscape',
                margin: pdfOptions.margin,
                printBackground: pdfOptions.printBackground,
                displayHeaderFooter: pdfOptions.displayHeaderFooter,
                headerTemplate: pdfOptions.headerTemplate || '',
                footerTemplate: pdfOptions.footerTemplate || '',
                scale: pdfOptions.scale,
                preferCSSPageSize: false
            });
            const renderTime = Date.now() - startTime;
            logger_1.logger.info(`PDF generated successfully in ${renderTime}ms`, {
                size: pdf.length,
                format: pdfOptions.format,
                orientation: pdfOptions.orientation
            });
            return pdf;
        }
        catch (error) {
            // Clear cache on error to prevent memory leaks
            try {
                this.renderService.clearCache();
                logger_1.logger.info('Cache cleared after PDF generation error');
            }
            catch (cacheError) {
                logger_1.logger.warn('Failed to clear cache after PDF error', {
                    cacheError: cacheError.message
                });
            }
            logger_1.logger.error('Error generating PDF', {
                error: error.message,
                stack: error.stack,
                data: {
                    layout: data.layout,
                    componentCount: data.components.length
                }
            });
            throw new Error(`Failed to generate PDF: ${error.message}`);
        }
        finally {
            if (page) {
                await page.close();
            }
        }
    }
    async savePdf(data, options = {}) {
        const pdf = await this.generatePdf(data, options);
        const fileName = `reporte_${data.headerInfo.institucion.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
        const filePath = path_1.default.join(this.pdfsDir, fileName);
        await promises_1.default.writeFile(filePath, pdf);
        logger_1.logger.info('PDF saved to file', { fileName, path: filePath, size: pdf.length });
        return fileName;
    }
    async mergePdfs(pdfFiles, outputFileName) {
        try {
            logger_1.logger.info('Starting PDF merge process', {
                fileCount: pdfFiles.length,
                outputFileName
            });
            const mergedPdf = await pdf_lib_1.PDFDocument.create();
            for (const fileName of pdfFiles) {
                const filePath = path_1.default.join(this.pdfsDir, fileName);
                const pdfBytes = await promises_1.default.readFile(filePath);
                const pdf = await pdf_lib_1.PDFDocument.load(pdfBytes);
                const pageIndices = pdf.getPageIndices();
                const pages = await mergedPdf.copyPages(pdf, pageIndices);
                pages.forEach((page) => mergedPdf.addPage(page));
                logger_1.logger.info(`Merged PDF: ${fileName}`, { pages: pageIndices.length });
            }
            const mergedPdfBytes = await mergedPdf.save();
            const outputPath = path_1.default.join(this.pdfsDir, outputFileName);
            await promises_1.default.writeFile(outputPath, mergedPdfBytes);
            logger_1.logger.info('PDF merge completed', {
                outputFileName,
                outputPath,
                size: mergedPdfBytes.length
            });
            return outputFileName;
        }
        catch (error) {
            logger_1.logger.error('Error merging PDFs', {
                error: error instanceof Error ? error.message : String(error),
                pdfFiles,
                outputFileName
            });
            throw new Error(`Failed to merge PDFs: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async generatePdfFromTemplate(templateName, data, options = {}) {
        const browser = await this.getBrowser();
        let page = null;
        try {
            page = await browser.newPage();
            // Configure page
            await page.setViewport({ width: 1200, height: 800 });
            // Render template with data
            const html = await this.renderService.renderTemplate(templateName, data);
            // Set content
            await page.setContent(html, {
                waitUntil: 'networkidle0', // Wait for all network requests to finish
                timeout: 60000
            });
            // Wait for images to load
            await page.evaluate(() => {
                return Promise.all(Array.from(document.images).map(img => {
                    if (img.complete)
                        return Promise.resolve();
                    return new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        setTimeout(reject, 10000); // 10 second timeout per image
                    });
                }));
            }).catch(error => {
                console.error('Some images failed to load:', error);
            });
            // Generate PDF
            const pdfOptions = {
                format: options.format || 'A4',
                landscape: options.orientation === 'landscape',
                margin: options.margin || { top: '0.5cm', right: '0.5cm', bottom: '0.5cm', left: '0.5cm' },
                printBackground: options.printBackground ?? true,
                scale: options.scale || 0.75,
                displayHeaderFooter: options.displayHeaderFooter || false,
                headerTemplate: options.headerTemplate || '',
                footerTemplate: options.footerTemplate || ''
            };
            const pdfBuffer = await page.pdf(pdfOptions);
            logger_1.logger.info('PDF generated from template', {
                templateName,
                size: pdfBuffer.length,
                options: pdfOptions
            });
            return pdfBuffer;
        }
        catch (error) {
            logger_1.logger.error('Error generating PDF from template', {
                error: error instanceof Error ? error.message : String(error),
                templateName
            });
            throw new Error(`Failed to generate PDF from template: ${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            if (page)
                await page.close();
        }
    }
    async deletePdfs(fileNames) {
        try {
            await Promise.all(fileNames.map(async (fileName) => {
                const filePath = path_1.default.join(this.pdfsDir, fileName);
                try {
                    await promises_1.default.unlink(filePath);
                    logger_1.logger.info(`Deleted PDF file: ${fileName}`);
                }
                catch (error) {
                    logger_1.logger.warn(`Failed to delete PDF file: ${fileName}`, {
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
            }));
        }
        catch (error) {
            logger_1.logger.error('Error deleting PDF files', {
                error: error instanceof Error ? error.message : String(error),
                fileNames
            });
        }
    }
    async closeBrowser() {
        if (this.browser) {
            logger_1.logger.info('Closing Puppeteer browser');
            await this.browser.close();
            this.browser = null;
        }
    }
    // Cleanup method for graceful shutdown
    async cleanup() {
        await this.closeBrowser();
    }
}
exports.PdfService = PdfService;
// Singleton instance
exports.pdfService = new PdfService();
// Graceful shutdown handling
process.on('SIGTERM', async () => {
    logger_1.logger.info('SIGTERM received, cleaning up PDF service');
    await exports.pdfService.cleanup();
});
process.on('SIGINT', async () => {
    logger_1.logger.info('SIGINT received, cleaning up PDF service');
    await exports.pdfService.cleanup();
});
