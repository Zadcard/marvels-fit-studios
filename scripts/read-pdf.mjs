import { PDFParse } from 'pdf-parse';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { resolve, dirname, join } from 'path';
import { tmpdir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const defaultPdfPath = resolve(__dirname, '..', 'docs', 'references', 'MarvelStudios 2026.pdf');
const inputOverride = process.argv[2] ?? process.env.PDF_INPUT_PATH;
const outputOverride = process.argv[3] ?? process.env.PDF_OUTPUT_PATH;
const pdfPath = inputOverride ? resolve(process.cwd(), inputOverride) : defaultPdfPath;
const outputPath = outputOverride ? resolve(process.cwd(), outputOverride) : join(tmpdir(), 'pdf-out.txt');
const data = readFileSync(pdfPath);

const parser = new PDFParse({ data: new Uint8Array(data), verbosity: -1 });
const rawText = await parser.getText();
await parser.destroy();

// rawText has shape { pages: [{text: string}], text: string, total: number }
const allText = rawText.pages.map(p => p.text).join('\n\n--- PAGE BREAK ---\n\n');
writeFileSync(outputPath, allText, 'utf8');
console.log('Total pages:', rawText.pages.length);
console.log('Total chars:', allText.length);
console.log('Output file:', outputPath);
console.log(allText);
