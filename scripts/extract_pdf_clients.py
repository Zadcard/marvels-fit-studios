#!/usr/bin/env python3
"""
PDF Client Data Extractor for Marvel Fitness Studios

Extracts client names and phone numbers from PDF and outputs as CSV.
Supports both text-based PDFs and scanned PDFs (with OCR).

Usage:
    python3 extract_pdf_clients.py <input.pdf> <output.csv> [--ocr]

Requirements:
    pip install pdfplumber openpyxl
    (For OCR: pip install pytesseract pillow)

Examples:
    # Extract from text-based PDF
    python3 extract_pdf_clients.py clients.pdf clients.csv

    # Extract from scanned PDF using OCR
    python3 extract_pdf_clients.py scanned_clients.pdf clients.csv --ocr

    # Use specific patterns for name/phone extraction
    python3 extract_pdf_clients.py clients.pdf clients.csv --name-pattern "([A-Za-z\s]+)" --phone-pattern "(\+?\d{10,})"
"""

import sys
import csv
import re
import argparse
from pathlib import Path
from typing import List, Tuple, Optional, Dict

try:
    import pdfplumber
except ImportError:
    print("Error: pdfplumber not installed. Install with: pip install pdfplumber")
    sys.exit(1)


class ClientExtractor:
    """Extract client data (name, phone) from PDF files."""

    def __init__(self, pdf_path: str):
        """Initialize with PDF file path."""
        self.pdf_path = Path(pdf_path)
        if not self.pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    def extract_from_text_pdf(self) -> List[Dict[str, str]]:
        """Extract client data from text-based PDF."""
        clients = []

        try:
            with pdfplumber.open(self.pdf_path) as pdf:
                total_pages = len(pdf.pages)
                print(f"📄 Extracting from {total_pages} pages...")

                for page_num, page in enumerate(pdf.pages, 1):
                    text = page.extract_text()
                    if not text:
                        continue

                    # Try to extract from tables first
                    tables = page.extract_tables()
                    if tables:
                        for table in tables:
                            clients.extend(self._extract_from_table(table))

                    # Then extract from plain text
                    clients.extend(self._extract_from_text(text))

                    if page_num % 5 == 0:
                        print(f"   Progress: {page_num}/{total_pages} pages processed...")

        except Exception as e:
            print(f"Error reading PDF: {e}")
            return []

        return self._deduplicate_clients(clients)

    def extract_from_scanned_pdf(self) -> List[Dict[str, str]]:
        """Extract client data from scanned PDF using OCR."""
        try:
            from PIL import Image
            import pytesseract
        except ImportError:
            print("Error: pytesseract or PIL not installed.")
            print("Install with: pip install pytesseract pillow")
            print("\nAlso install Tesseract OCR: https://github.com/UB-Mannheim/tesseract/wiki")
            return []

        clients = []

        try:
            with pdfplumber.open(self.pdf_path) as pdf:
                total_pages = len(pdf.pages)
                print(f"📄 Extracting from {total_pages} scanned pages using OCR...")

                for page_num, page in enumerate(pdf.pages, 1):
                    # Convert page to image
                    im = page.to_image()

                    # Extract text using OCR
                    text = pytesseract.image_to_string(im.original)
                    if text.strip():
                        clients.extend(self._extract_from_text(text))

                    if page_num % 5 == 0:
                        print(f"   Progress: {page_num}/{total_pages} pages processed...")

        except Exception as e:
            print(f"Error with OCR: {e}")
            return []

        return self._deduplicate_clients(clients)

    def _extract_from_table(self, table: List[List[str]]) -> List[Dict[str, str]]:
        """Extract client data from PDF table."""
        clients = []

        # Find column indices for name and phone
        header = table[0] if table else []
        name_col = None
        phone_col = None

        for idx, cell in enumerate(header):
            cell_lower = str(cell).lower()
            if any(term in cell_lower for term in ['name', 'client', 'fullname', 'full name']):
                name_col = idx
            if any(term in cell_lower for term in ['phone', 'number', 'contact', 'mobile']):
                phone_col = idx

        # If columns not found, skip this table
        if name_col is None and phone_col is None:
            return clients

        # Extract rows
        for row in table[1:]:  # Skip header
            try:
                name = str(row[name_col]).strip() if name_col is not None else ""
                phone = str(row[phone_col]).strip() if phone_col is not None else ""

                if name and phone:
                    phone = self._clean_phone(phone)
                    if phone:  # Only add if phone is valid
                        clients.append({
                            'fullName': name,
                            'phone': phone
                        })
            except (IndexError, TypeError):
                continue

        return clients

    def _extract_from_text(self, text: str) -> List[Dict[str, str]]:
        """Extract client names and phones from plain text using regex."""
        clients = []

        # Common phone patterns
        phone_patterns = [
            r'\+20\s?\d{10}',           # +20 1234567890 or +201234567890
            r'\+\d{1,3}\s?\d{7,}',      # +1 1234567890
            r'0\d{10}',                  # 01234567890 (Egyptian)
            r'\(\d{3}\)\s?\d{3}-\d{4}',  # (123) 456-7890
        ]

        # Common name patterns (capitalized words)
        name_pattern = r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'

        # Try to find pairs of names and phones
        lines = text.split('\n')

        for i, line in enumerate(lines):
            line = line.strip()
            if not line or len(line) < 5:
                continue

            # Look for phone number in this line
            phone = None
            for pattern in phone_patterns:
                match = re.search(pattern, line)
                if match:
                    phone = match.group(0)
                    break

            if phone:
                # Extract name (usually before or after phone)
                name_match = re.search(name_pattern, line)
                if name_match:
                    name = name_match.group(0)
                    phone = self._clean_phone(phone)
                    if phone:
                        clients.append({
                            'fullName': name,
                            'phone': phone
                        })
                else:
                    # Check previous line for name
                    if i > 0:
                        prev_line = lines[i-1].strip()
                        name_match = re.search(name_pattern, prev_line)
                        if name_match:
                            name = name_match.group(0)
                            phone = self._clean_phone(phone)
                            if phone:
                                clients.append({
                                    'fullName': name,
                                    'phone': phone
                                })

        return clients

    def _clean_phone(self, phone: str) -> str:
        """Clean and normalize phone number."""
        # Remove spaces and hyphens
        clean = re.sub(r'[\s\-()]', '', phone)

        # Ensure it's numeric or has + prefix
        if not re.match(r'^\+?\d+$', clean):
            return ""

        # Check minimum length (6 digits)
        digits_only = re.sub(r'\D', '', clean)
        if len(digits_only) < 6:
            return ""

        return clean

    def _deduplicate_clients(self, clients: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Remove duplicate clients (same phone number)."""
        seen = {}
        unique = []

        for client in clients:
            phone = client['phone']
            if phone not in seen:
                seen[phone] = True
                unique.append(client)

        return unique


def save_to_csv(clients: List[Dict[str, str]], output_path: str) -> int:
    """Save extracted clients to CSV file."""
    if not clients:
        print("❌ No clients extracted!")
        return 0

    try:
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['fullName', 'phone'])
            writer.writeheader()
            writer.writerows(clients)

        print(f"\n✅ Exported {len(clients)} clients to: {output_path}")
        return len(clients)

    except Exception as e:
        print(f"❌ Error saving CSV: {e}")
        return 0


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Extract client data from PDF and save to CSV',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 extract_pdf_clients.py clients.pdf clients.csv
  python3 extract_pdf_clients.py scan.pdf clients.csv --ocr
        """
    )

    parser.add_argument('input_pdf', help='Input PDF file path')
    parser.add_argument('output_csv', help='Output CSV file path')
    parser.add_argument('--ocr', action='store_true', help='Use OCR for scanned PDFs')
    parser.add_argument('--verbose', action='store_true', help='Verbose output')

    args = parser.parse_args()

    print("\n🔍 Marvel Fitness Studios - Client Data Extractor")
    print("=" * 50)

    try:
        extractor = ClientExtractor(args.input_pdf)

        # Extract clients
        if args.ocr:
            print("Using OCR mode for scanned documents...")
            clients = extractor.extract_from_scanned_pdf()
        else:
            print("Using text extraction mode...")
            clients = extractor.extract_from_text_pdf()

        if not clients:
            print("❌ Failed to extract clients from PDF")
            return 1

        # Save to CSV
        count = save_to_csv(clients, args.output_csv)

        # Show summary
        print("\n📊 Summary:")
        print(f"  • Input: {args.input_pdf}")
        print(f"  • Output: {args.output_csv}")
        print(f"  • Clients extracted: {count}")

        if args.verbose and clients:
            print("\n📋 Sample data (first 5):")
            for client in clients[:5]:
                print(f"  • {client['fullName']} - {client['phone']}")

        print("\n✨ Done! CSV ready for bulk import.\n")
        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        return 1


if __name__ == '__main__':
    sys.exit(main())
