import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

class AIFormatterService {
  constructor() {
    this.isAvailable = !!config.geminiApiKey && config.geminiApiKey !== 'YOUR_API_KEY_HERE';
    if (this.isAvailable) {
      this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
      this.modelInstance = this.genAI.getGenerativeModel({ model: config.aiModel });
      logger.info(`✅ AI Model ${config.aiModel} is available`);
    } else {
       logger.warn(`⚠️ Gemini API Key not found. Please add to .env!`);
    }
  }

  async structureDocument(rawText, options = {}) {
    const startTime = Date.now();
    
    if (!this.isAvailable) {
      logger.warn('AI not available, using fallback');
      return this.fallbackFormatting(rawText);
    }

    const prompt = this.buildPrompt(rawText, options);
    
    try {
      const result = await this.modelInstance.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
              temperature: options.temperature || 0.3,
              maxOutputTokens: options.maxTokens || 4000,
              topP: 0.9,
          }
      });
      const response = await result.response;
      const textResponse = response.text();
      const html = this.cleanAIOutput(textResponse);
      const processingTime = Date.now() - startTime;

      logger.info(`AI formatted ${rawText.length} chars in ${processingTime}ms`);

      return {
        success: true,
        html,
        model: config.aiModel,
        tokensUsed: 0, // Not easily accessible directly from standard generateContent in this SDK version without usageMetadata
        processingTime,
        raw: textResponse
      };
    } catch (error) {
      logger.error('AI formatting error:', error);
      return this.fallbackFormatting(rawText);
    }
  }

  buildPrompt(rawText, options) {
    const docType = options.documentType || 'general';
    
    return `You are a document formatter. Convert the following text into clean, well-structured HTML.

Document Type: ${docType}

Formatting Rules:
1. Identify and use proper heading hierarchy (h1, h2, h3)
2. Make important terms and emphasis bold using <strong>
3. Convert lists to <ul>/<ol> with <li>
4. Format code blocks with <pre><code>
5. Add appropriate paragraph spacing
6. Remove AI artifacts like "Certainly!", "As an AI", etc.
7. Use semantic HTML5 tags where appropriate
8. Transform any structured or tabular data into proper HTML <table> format with <thead>, <tbody>, <tr>, <th>, and <td>.
9. DO NOT output any markdown format (like | column | column |). Convert ALL markdown tables directly into standard HTML <table> markup.
10. Format all code blocks with <pre><code class="language-[language_name]">, ensuring the language name (like javascript, python, css) is populated for syntax highlighting!

Return ONLY the HTML, no explanations or markdown codeblocks.

Text to format:
${rawText}

Formatted HTML:`;
  }

  cleanAIOutput(html) {
    html = html.replace(/```html?\n?/gi, '');
    html = html.replace(/```xml?\n?/gi, '');
    html = html.replace(/```\n?/g, '');
    html = html.trim();
    if (!html.startsWith('<')) {
      html = `<div class="ai-formatted-document">\n${html}\n</div>`;
    }
    return html;
  }

  fallbackFormatting(text) {
    // Basic Markdown Table Parser
    text = text.replace(/(?:\|.*?\|\n)+/g, (match) => {
        let rows = match.trim().split('\n');
        let html = '<table class="fallback-table">';
        rows.forEach((row, i) => {
            if (row.match(/^[|\s:-]+$/)) return; // Skip Markdown divider rows
            let tag = (i === 0 || i === 1 && rows[0].match(/^[|\s:-]+$/)) ? 'th' : 'td';
            let cells = row.split('|').map(c => c.trim()).filter((c, idx, arr) => !(idx === 0 && c === '') && !(idx === arr.length - 1 && c === ''));
            if (cells.length > 0) {
              html += '<tr>' + cells.map(c => `<${tag}>${c}</${tag}>`).join('') + '</tr>\n';
            }
        });
        html += '</table>';
        return html + '\n\n';
    });

    let html = text
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
          return `<pre><code class="language-${lang || 'javascript'}">${code.trim()}</code></pre>`;
      })
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .split('\n\n')
      .map(para => {
         const t = para.trim();
         return t ? ((t.startsWith('<table') || t.startsWith('<pre')) ? t : `<p>${t}</p>`) : '';
      })
      .join('\n');
    
    return {
      success: false,
      html: `<div class="fallback-document">${html}</div>`,
      fallback: true,
      processingTime: 0
    };
  }

  async enhanceFormatting(html, instructions) {
    if (!this.isAvailable) return html;
    const prompt = `Enhance this HTML document: ${instructions}\n\n${html}\n\nReturn ONLY HTML.`;
    
    const result = await this.modelInstance.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }
    });
    
    return this.cleanAIOutput(result.response.text());
  }
}

export default new AIFormatterService();
