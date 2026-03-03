import { QuestionGenerationOptions, QuestionForPdf, ProcessedQuestion, DeltaOperation } from '../types/questions';
// import { renderService } from './renderService';
import { PdfService } from './pdfService';
import { websocketService } from './websocketService';
import { fileCleanupService } from './fileCleanupService';
import fs from 'fs/promises';
import path from 'path';

export class QuestionsPdfService {
  private pdfService: PdfService;

  constructor() {
    this.pdfService = new PdfService();
  }

  async generatePdf(options: QuestionGenerationOptions, baseUrl?: string): Promise<{ fileName: string; url: string; downloadUrl: string }> {
    const { questions, title, options: pdfOptions, sessionId } = options;
    
    try {
      // Process questions to HTML
      const processedQuestions = await this.processQuestions(questions, sessionId);
      
      // Prepare data for template
      const templateData = {
        title,
        questions: processedQuestions,
        totalQuestions: questions.length,
        timestamp: new Date().toLocaleString('es-ES'),
      };

      // Generate PDF using the existing PDF service
      const fileName = this.generateFileName(title);
      const pdfBuffer = await this.pdfService.generatePdfFromTemplate(
        'questions',
        templateData,
        {
          format: pdfOptions?.format || 'A4',
          orientation: pdfOptions?.orientation || 'portrait',
          margin: pdfOptions?.margins || { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
          printBackground: pdfOptions?.printBackground ?? true,
          scale: pdfOptions?.scale || 0.75
        }
      );

      // Save PDF file
      const pdfPath = path.join(process.cwd(), 'public', 'pdfs', fileName);
      await fs.writeFile(pdfPath, pdfBuffer);

      // Programar eliminación automática después del tiempo configurado (30 minutos)
      fileCleanupService.schedulePdfDeletion(fileName);

      // Use provided baseUrl or fallback to environment variable
      const url = baseUrl || process.env.BASE_URL || 'http://localhost:3001';

      return {
        fileName,
        url: `${url}/api/reports/pdfs/${fileName}`,
        downloadUrl: `${url}/api/reports/pdfs/${fileName}?download=true`
      };

    } catch (error) {
      console.error('Error in QuestionsPdfService:', error);
      throw error;
    }
  }

  private async processQuestions(questions: QuestionForPdf[], sessionId?: string): Promise<ProcessedQuestion[]> {
    const processed: ProcessedQuestion[] = [];
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      if (sessionId) {
        websocketService.emitProgress({
          sessionId,
          stage: 'processing_question',
          progress: 40 + Math.round((i / questions.length) * 40),
          message: `Processing question ${i + 1} of ${questions.length}: ${question.codigo}`,
          timestamp: new Date()
        });
      }

      try {
        const preguntaHtml = await this.deltaToHtml(question.deltaPregunta);
        const respuestasHtml: string[] = [];

        for (let j = 0; j < question.deltaRespuestas.length; j++) {
          const respuestaHtml = await this.deltaToHtml(question.deltaRespuestas[j]);
          respuestasHtml.push(respuestaHtml);
        }

        processed.push({
          codigo: question.codigo,
          preguntaHtml,
          respuestasHtml,
          imagenesUsadas: [] // Images are now embedded in Delta operations
        });

      } catch (error) {
        console.error(`Error processing question ${question.codigo}:`, error);
        // Continue with next question instead of failing completely
        processed.push({
          codigo: question.codigo,
          preguntaHtml: `<p>Error processing question content: ${question.codigo}</p>`,
          respuestasHtml: ['<p>Error processing answer content</p>'],
          imagenesUsadas: []
        });
      }
    }
    
    return processed;
  }

  private async deltaToHtml(delta: DeltaOperation[]): Promise<string> {
    if (!Array.isArray(delta)) {
      console.warn('Delta is not an array:', delta);
      return '<p>Invalid Delta format</p>';
    }

    let html = '';
    let listStack: { type: string; items: string[] }[] = [];

    try {
      for (const op of delta) {
        if (!op || typeof op !== 'object') {
          console.warn('Invalid Delta operation:', op);
          continue;
        }

        const insert = op.insert;
        const attrs = op.attributes || {};

        // Handle different types of inserts
        if (typeof insert === 'string') {
          // Handle block-level elements
          if (attrs.block) {
            const trimmedText = insert.trim();
            if (!trimmedText && attrs.block !== 'code') continue;

            switch (attrs.block) {
              case 'ul':
              case 'ol':
                this.handleList(listStack, attrs.block, trimmedText);
                break;
              case 'cl':
                html += this.finalizeLists(listStack);
                html += `<div class="checklist-item">
                  <input type="checkbox" disabled> ${this.escapeHtml(trimmedText)}
                </div>`;
                break;
              case 'quote':
                html += this.finalizeLists(listStack);
                html += `<blockquote>${this.escapeHtml(trimmedText)}</blockquote>`;
                break;
              case 'code':
                html += this.finalizeLists(listStack);
                html += `<pre><code>${this.escapeHtml(trimmedText || insert)}</code></pre>`;
                break;
              default:
                html += this.finalizeLists(listStack);
                html += this.formatInlineText(insert, attrs);
            }
          } else {
            // Regular text with inline formatting
            html += this.formatInlineText(insert, attrs);
          }
        } else if (typeof insert === 'object' && insert !== null) {
          // Handle embeds (images, formulas, etc.)
          html += this.finalizeLists(listStack);
          
          // Check for image with flexible conditions
          const isImage = insert._type === 'image' || 
                         insert.source_type === 'url' || 
                         (insert.source && insert.source.includes('image')) ||
                         (insert.name && insert.name.match(/\.(png|jpg|jpeg|gif|webp)$/i));
          
          if (isImage && insert.source) {
            // Handle image embeds from Delta operations
            const imageUrl = this.processImageUrl(insert.source);
            const altText = insert.name || insert.alt || 'Question image';
            
            // Handle different size formats
            let size = 'max-width: 100%;';
            if (insert.size) {
              if (typeof insert.size === 'number') {
                size = `max-width: ${insert.size}px;`;
              } else if (typeof insert.size === 'object' && insert.size.w) {
                size = `max-width: ${insert.size.w}px;`;
              }
            }
            
            const imgTag = `<div class="image-container"><img src="${imageUrl}" alt="${this.escapeHtml(altText)}" style="${size} height: auto; margin: 10px 0; display: block;" /></div>`;
            html += imgTag;
          } else if (insert._type === 'hr') {
            html += '<hr>';
          } else if (insert._type === 'formula' && insert.formula) {
            // Handle LaTeX formulas (basic support)
            html += `<span class="formula" style="font-family: 'Times New Roman', serif; font-style: italic;">${this.escapeHtml(insert.formula)}</span>`;
          } else {
            // Generic object handling - only log if it might be an unhandled image
            if (insert.source && !isImage) {
              console.log('Unknown embed type with source:', insert);
            }
          }
        }
      }

      // Finalize any remaining lists
      html += this.finalizeLists(listStack);

    } catch (error) {
      console.error('Error processing Delta operations:', error);
      html += '<p>Error processing content</p>';
    }

    return html;
  }

  private handleList(listStack: { type: string; items: string[] }[], type: string, text: string) {
    const currentList = listStack[listStack.length - 1];
    
    if (!currentList || currentList.type !== type) {
      // Start new list
      listStack.push({ type, items: [text] });
    } else {
      // Add to current list
      currentList.items.push(text);
    }
  }

  private finalizeLists(listStack: { type: string; items: string[] }[]): string {
    let html = '';
    
    while (listStack.length > 0) {
      const list = listStack.pop()!;
      const tag = list.type === 'ol' ? 'ol' : 'ul';
      const items = list.items.map(item => `<li>${this.escapeHtml(item)}</li>`).join('');
      html += `<${tag}>${items}</${tag}>`;
    }
    
    return html;
  }

  private formatInlineText(text: string, attrs: any): string {
    // Handle line breaks - convert multiple line breaks to single breaks
    let result = this.escapeHtml(text);
    
    // Clean up excessive line breaks
    result = result.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive line breaks
    result = result.replace(/\n{2}/g, '<br/><br/>'); // Double line breaks to paragraph breaks
    result = result.replace(/\n/g, '<br/>'); // Single line breaks
    
    // Remove leading/trailing breaks
    result = result.replace(/^(<br\/>)+|(<br\/>)+$/g, '');
    
    // Apply inline styles
    if (attrs.bold || attrs.b) result = `<strong>${result}</strong>`;
    if (attrs.italic || attrs.i) result = `<em>${result}</em>`;
    if (attrs.underline || attrs.u) result = `<u>${result}</u>`;
    if (attrs.strike || attrs.s) result = `<s>${result}</s>`;
    
    // Handle colors
    if (attrs.color) {
      result = `<span style="color: ${attrs.color}">${result}</span>`;
    }
    if (attrs.background || attrs.bg) {
      result = `<span style="background-color: ${attrs.background || attrs.bg}">${result}</span>`;
    }
    
    // Handle font styles
    if (attrs.font) {
      result = `<span style="font-family: ${attrs.font}">${result}</span>`;
    }
    if (attrs.size) {
      result = `<span style="font-size: ${attrs.size}px">${result}</span>`;
    }
    
    // Handle mathematical symbols and subscripts/superscripts
    if (attrs.script) {
      if (attrs.script === 'sub') {
        result = `<sub>${result}</sub>`;
      } else if (attrs.script === 'super') {
        result = `<sup>${result}</sup>`;
      }
    }
    
    // Handle headings
    if (attrs.heading) {
      const level = Math.min(Math.max(attrs.heading, 1), 6);
      result = `<h${level}>${result}</h${level}>`;
    }
    
    // Handle alignment
    if (attrs.align && attrs.align !== 'left') {
      result = `<div style="text-align: ${attrs.align}">${result}</div>`;
    }
    
    // Handle indentation
    if (attrs.indent) {
      const indentSize = attrs.indent * 20;
      result = `<div style="margin-left: ${indentSize}px">${result}</div>`;
    }
    
    // Handle links
    if (attrs.link) {
      result = `<a href="${this.escapeHtml(attrs.link)}" target="_blank">${result}</a>`;
    }

    return result;
  }

  private processImageUrl(url: string): string {
    if (!url) {
      console.error('Empty URL provided to processImageUrl');
      return '';
    }
    
    // Handle trusted domains and proxy logic similar to Flutter code
    const trustedDomains = [
      'app.formarte.co',
      'assets.formarte.edu.co',
      'api.plataformapodium.com',
      'formarte.co'
    ];

    const isTrusted = trustedDomains.some(domain => url.includes(domain));
    
    if (isTrusted) {
      // Ensure https for trusted domains
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
      } else {
        return url.replace('http://', 'https://');
      }
    } else {
      // Use proxy for untrusted domains
      const proxyUrl = 'https://dev-mongo.plataformapodium.com/images/proxy-image?url=';
      return `${proxyUrl}${encodeURIComponent(url)}`;
    }
  }

  private escapeHtml(text: string): string {
    const div = { innerHTML: '' } as any;
    div.textContent = text;
    return div.innerHTML || text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private generateFileName(title: string): string {
    const timestamp = Date.now();
    const cleanTitle = title
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase();
    
    return `preguntas_${cleanTitle}_${timestamp}.pdf`;
  }

  async listPdfs(): Promise<string[]> {
    try {
      const pdfsDir = path.join(process.cwd(), 'public', 'pdfs');
      const files = await fs.readdir(pdfsDir);
      return files.filter(file => file.endsWith('.pdf') && file.startsWith('preguntas_'));
    } catch (error) {
      console.error('Error listing PDFs:', error);
      return [];
    }
  }

  async deletePdf(fileName: string): Promise<void> {
    try {
      const pdfPath = path.join(process.cwd(), 'public', 'pdfs', fileName);
      await fs.unlink(pdfPath);
    } catch (error) {
      console.error('Error deleting PDF:', error);
      throw error;
    }
  }
}