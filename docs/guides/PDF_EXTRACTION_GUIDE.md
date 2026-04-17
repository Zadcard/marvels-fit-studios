# PDF Client Data Extraction Guide

## Quick Start

### Step 1: Install Python Dependencies

```bash
pip install pdfplumber openpyxl
```

**Optional (for scanned PDFs with OCR):**
```bash
pip install pytesseract pillow
# Also install Tesseract OCR: https://github.com/UB-Mannheim/tesseract/wiki
```

### Step 2: Extract Client Data from PDF

```bash
python3 scripts/extract_pdf_clients.py your_file.pdf clients.csv
```

**For scanned PDFs:**
```bash
python3 scripts/extract_pdf_clients.py your_scanned.pdf clients.csv --ocr
```

**Verbose output (see extracted data):**
```bash
python3 scripts/extract_pdf_clients.py your_file.pdf clients.csv --verbose
```

### Step 3: Review Generated CSV

The script creates `clients.csv` with columns:
```
fullName,phone
John Doe,+201012345678
Jane Smith,+201098765432
...
```

### Step 4: Use in Admin Panel

When the Admin Bulk Import UI is built:
1. Navigate to Admin → Bulk Import
2. Upload the CSV file
3. Review import report
4. System auto-generates Client IDs and passwords
5. Export credentials to distribute to clients

---

## How the Extractor Works

### Text-Based PDFs (Most Common)
1. Opens PDF with `pdfplumber`
2. Extracts tables (if present)
3. Uses regex patterns to find phone numbers
4. Extracts client names near phone numbers
5. Cleans and normalizes data
6. Removes duplicates (by phone number)

### Scanned PDFs
1. Converts each page to image
2. Runs OCR (Tesseract) on image
3. Extracts text from OCR results
4. Applies same extraction logic as text PDFs
5. Returns deduplicated results

### Extraction Patterns

**Phone Patterns Supported:**
- `+20 1234567890` - International with space
- `+201234567890` - International without space
- `+1 1234567890` - Other international formats
- `01234567890` - Egyptian format (0-prefix)
- `(123) 456-7890` - US format with parentheses

**Name Extraction:**
- Capitalized words: `John Doe`, `Ahmed El-Sayed`
- Multiple names: `John Michael Smith`
- Extracted from text near phone numbers

---

## CSV Format Requirements

For bulk import, the CSV must have these columns:

```csv
fullName,phone
```

### Column Rules:
- **fullName** (Required): Client's full name (2-100 characters)
- **phone** (Required): Phone number (8+ characters)
- **email** (Optional): Email address
- **group** (Optional): Group/membership type

### Valid Examples:
```csv
fullName,phone,email
John Doe,+201012345678,john@example.com
Jane Smith,+201098765432,jane@example.com
Ahmed Hassan,+20 101 234 5678,
```

### Invalid Examples:
```csv
fullName,phone
J,12345              # Name too short, phone too short
John Doe,wrong       # Invalid phone number
,+201012345678       # Missing name
```

---

## Troubleshooting

### Script Not Found
```bash
# Make it executable
chmod +x scripts/extract_pdf_clients.py

# Run with python
python3 scripts/extract_pdf_clients.py clients.pdf output.csv
```

### pdfplumber Not Installed
```bash
pip install pdfplumber
```

### PDF Extraction Returns Empty
1. Check if PDF is text-based or scanned:
   - Text-based: Try regular extraction
   - Scanned: Use `--ocr` flag

2. Try with `--verbose` flag to see debug output:
   ```bash
   python3 scripts/extract_pdf_clients.py clients.pdf output.csv --verbose
   ```

3. If PDF is encrypted, unencrypt it first:
   - Use online tool: https://smallpdf.com/unlock-pdf
   - Or: `pip install pypdf && python3 -c "..."`

### OCR Not Working
1. Install Tesseract OCR:
   - **Windows**: Download from https://github.com/UB-Mannheim/tesseract/wiki
   - **Mac**: `brew install tesseract`
   - **Linux**: `sudo apt-get install tesseract-ocr`

2. Install Python wrapper:
   ```bash
   pip install pytesseract pillow
   ```

3. Run extraction:
   ```bash
   python3 scripts/extract_pdf_clients.py scanned.pdf output.csv --ocr
   ```

### Data Quality Issues
- **Missing phones**: Script extracts phone numbers using regex patterns. If phone format is unusual, it may be missed.
- **Wrong names**: Script looks for capitalized words. Names in CAPS or lowercase may be missed.
- **Duplicates**: Script removes duplicates by phone number. Same client with different number will be treated as separate.

**Manual cleanup tips:**
1. Open generated CSV in Excel
2. Delete invalid rows
3. Fix phone number formats (ensure they're consistent)
4. Fix names (proper capitalization)
5. Re-save as CSV

---

## Example Workflow

### PDF with Structured Tables

**Input PDF:**
```
Client List
-----------
Name          | Phone
John Doe      | +20 101 234 5678
Jane Smith    | 02 105 321 4876
Ahmed Hassan  | +201011223344
```

**Extract:**
```bash
python3 scripts/extract_pdf_clients.py clients.pdf output.csv --verbose
```

**Output CSV:**
```
fullName,phone
John Doe,+20101234567
Jane Smith,02105321487
Ahmed Hassan,+201011223344
```

---

## Integration with Bulk Import

Once the Admin Bulk Import UI is built, the workflow will be:

```
1. Have PDF with client data
   ↓
2. Run extraction script
   python3 scripts/extract_pdf_clients.py data.pdf clients.csv
   ↓
3. Review clients.csv (optional manual fixes)
   ↓
4. Login to admin panel
   ↓
5. Navigate to Admin → Bulk Import
   ↓
6. Upload clients.csv
   ↓
7. Review import report
   Success: 95 clients
   Failed: 5 clients (see reasons)
   ↓
8. Download credentials.csv
   ↓
9. Distribute credentials to clients
   ↓
10. Clients login with Client ID + Password
```

---

## CSV Preview in Excel

Before uploading to bulk import:

1. Open Excel
2. File → Open → Select `clients.csv`
3. Review data
4. Check for:
   - Invalid phone numbers
   - Missing names
   - Duplicate entries
   - Correct formatting
5. Make corrections if needed
6. Save as CSV (ensure encoding is UTF-8)
7. Upload to admin panel

---

## Advanced Options

### Custom Name Pattern
```bash
python3 scripts/extract_pdf_clients.py clients.pdf output.csv \
  --name-pattern "([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)"
```

### Custom Phone Pattern
```bash
python3 scripts/extract_pdf_clients.py clients.pdf output.csv \
  --phone-pattern "(\+?\d{10,})"
```

### Debug Mode
```bash
python3 scripts/extract_pdf_clients.py clients.pdf output.csv \
  --verbose --debug
```

---

## Command Reference

```bash
python3 scripts/extract_pdf_clients.py <input.pdf> <output.csv> [options]

Options:
  --ocr              Use OCR for scanned PDFs
  --verbose          Show extracted data samples
  --help             Show help message

Examples:
  # Basic extraction
  python3 scripts/extract_pdf_clients.py data.pdf clients.csv

  # Scanned PDF with OCR
  python3 scripts/extract_pdf_clients.py scan.pdf clients.csv --ocr

  # With verbose output
  python3 scripts/extract_pdf_clients.py data.pdf clients.csv --verbose

  # All options
  python3 scripts/extract_pdf_clients.py data.pdf clients.csv --ocr --verbose
```

---

## Sample Output

### Console Output
```
🔍 Marvel Fitness Studios - Client Data Extractor
==================================================
📄 Extracting from 15 pages...
   Progress: 5/15 pages processed...
   Progress: 10/15 pages processed...
   Progress: 15/15 pages processed...

✅ Exported 98 clients to: clients.csv

📊 Summary:
  • Input: clients.pdf
  • Output: clients.csv
  • Clients extracted: 98

📋 Sample data (first 5):
  • John Doe - +201012345678
  • Jane Smith - +201098765432
  • Ahmed Hassan - +20 101 1223344
  • Fatima Ali - 02105321498
  • Mohamed Hassan - +201012223344

✨ Done! CSV ready for bulk import.
```

---

## Next Steps

After extraction:

1. ✅ Extract data: `python3 scripts/extract_pdf_clients.py your.pdf clients.csv`
2. ⏳ Wait for Admin Bulk Import UI to be built
3. ⏳ Upload CSV through admin panel
4. ⏳ Review import report
5. ⏳ Download credentials
6. ⏳ Distribute to clients

---

## Support

For issues with extraction:
1. Check this guide's Troubleshooting section
2. Run with `--verbose` flag for more details
3. Manually clean CSV if needed
4. Try different PDF (ensure it's valid)

**Common Issues:**
- PDF is image-based → Use `--ocr` flag
- Phone format unusual → Manually add to CSV
- Name format wrong → Edit CSV in Excel
- Empty extraction → Check PDF is readable
