#!/usr/bin/env python3
"""
Script to convert PROJECT_DOCUMENTATION.md to PDF
Requirements: markdown2, pdfkit, wkhtmltopdf
"""

import os
import subprocess
import sys
from pathlib import Path

def check_dependencies():
    """Check if required packages are installed"""
    try:
        import markdown2
        import pdfkit
        print("✓ Required Python packages found")
        return True
    except ImportError as e:
        print(f"✗ Missing package: {e}")
        print("\nInstalling required packages...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "markdown2", "pdfkit"])
        print("✓ Packages installed successfully")
        return True

def convert_markdown_to_pdf():
    """Convert markdown documentation to PDF"""
    
    # File paths
    project_root = Path(__file__).parent
    md_file = project_root / "PROJECT_DOCUMENTATION.md"
    pdf_file = project_root / "PROJECT_DOCUMENTATION.pdf"
    html_temp = project_root / "temp_doc.html"
    
    print(f"Project root: {project_root}")
    print(f"Reading: {md_file}")
    
    if not md_file.exists():
        print(f"✗ Error: {md_file} not found")
        return False
    
    try:
        # Read markdown file
        with open(md_file, 'r', encoding='utf-8') as f:
            md_content = f.read()
        
        print(f"✓ Read markdown file ({len(md_content)} characters)")
        
        # Convert markdown to HTML
        import markdown2
        html_content = markdown2.markdown(md_content, extras=['tables', 'fenced-code-blocks', 'toc', 'footnotes'])
        
        # Create styled HTML document
        html_doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Projet Vélib - Project Documentation</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 40px;
            max-width: 1000px;
            margin: 0 auto;
        }}
        
        h1 {{
            color: #1FA971;
            border-bottom: 3px solid #1FA971;
            padding-bottom: 10px;
            margin: 30px 0 20px 0;
            font-size: 2.2em;
            page-break-after: avoid;
        }}
        
        h2 {{
            color: #1FA971;
            margin: 25px 0 15px 0;
            font-size: 1.8em;
            page-break-after: avoid;
        }}
        
        h3 {{
            color: #2d5a3d;
            margin: 20px 0 10px 0;
            font-size: 1.4em;
            page-break-after: avoid;
        }}
        
        h4, h5, h6 {{
            color: #2d5a3d;
            margin: 15px 0 10px 0;
            page-break-after: avoid;
        }}
        
        p {{
            margin: 12px 0;
            text-align: justify;
        }}
        
        a {{
            color: #1FA971;
            text-decoration: none;
            border-bottom: 1px dotted #1FA971;
        }}
        
        a:hover {{
            text-decoration: underline;
        }}
        
        ul, ol {{
            margin: 15px 0 15px 30px;
        }}
        
        li {{
            margin: 8px 0;
        }}
        
        code {{
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }}
        
        pre {{
            background: #f9f9f9;
            border-left: 4px solid #1FA971;
            padding: 15px;
            margin: 15px 0;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.85em;
            page-break-inside: avoid;
        }}
        
        pre code {{
            background: none;
            padding: 0;
            border-radius: 0;
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            page-break-inside: avoid;
        }}
        
        th {{
            background: #1FA971;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #1FA971;
        }}
        
        td {{
            padding: 10px;
            border: 1px solid #ddd;
        }}
        
        tr:nth-child(even) {{
            background: #f9f9f9;
        }}
        
        blockquote {{
            border-left: 4px solid #1FA971;
            padding-left: 20px;
            margin: 15px 0;
            color: #666;
            font-style: italic;
        }}
        
        .toc {{
            background: #f0f7f4;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #1FA971;
            page-break-inside: avoid;
        }}
        
        .toc h2 {{
            margin-top: 0;
        }}
        
        .toc ul {{
            margin-left: 20px;
        }}
        
        .page-break {{
            page-break-after: always;
        }}
        
        hr {{
            border: none;
            border-top: 2px solid #1FA971;
            margin: 30px 0;
        }}
        
        strong {{
            color: #1FA971;
            font-weight: 600;
        }}
        
        em {{
            font-style: italic;
            color: #2d5a3d;
        }}
        
        .version-table {{
            margin: 20px 0;
        }}
        
        .info-box {{
            background: #e8f5e9;
            border-left: 4px solid #1FA971;
            padding: 15px;
            margin: 15px 0;
            border-radius: 3px;
        }}
        
        .warning-box {{
            background: #fff3e0;
            border-left: 4px solid #ff9800;
            padding: 15px;
            margin: 15px 0;
            border-radius: 3px;
        }}
        
        header {{
            text-align: center;
            border-bottom: 2px solid #1FA971;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        
        footer {{
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }}
        
        @media print {{
            body {{
                padding: 20px;
            }}
            
            h1, h2, h3 {{
                page-break-after: avoid;
            }}
            
            table, pre {{
                page-break-inside: avoid;
            }}
        }}
    </style>
</head>
<body>
    {html_content}
    <footer>
        <p>Projet Vélib - Comprehensive Project Documentation</p>
        <p>Generated on January 16, 2026 | Version 1.0</p>
    </footer>
</body>
</html>
"""
        
        # Write temporary HTML file
        with open(html_temp, 'w', encoding='utf-8') as f:
            f.write(html_doc)
        
        print(f"✓ Generated HTML file ({len(html_doc)} characters)")
        
        # Convert HTML to PDF using pdfkit
        try:
            import pdfkit
            
            options = {
                'page-size': 'A4',
                'margin-top': '1cm',
                'margin-right': '1cm',
                'margin-bottom': '1cm',
                'margin-left': '1cm',
                'encoding': "UTF-8",
                'no-outline': None,
                'enable-local-file-access': None,
            }
            
            pdfkit.from_file(str(html_temp), str(pdf_file), options=options)
            print(f"✓ PDF created successfully: {pdf_file}")
            
        except Exception as e:
            print(f"⚠ Note: pdfkit/wkhtmltopdf not available. Using alternative method...")
            print(f"  Error: {e}")
            print(f"  Saving HTML version only: {html_temp}")
            return False
        
        # Clean up temporary file
        if html_temp.exists():
            html_temp.unlink()
            print("✓ Cleaned up temporary files")
        
        return True
        
    except Exception as e:
        print(f"✗ Error during conversion: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Projet Vélib - Markdown to PDF Converter")
    print("=" * 60)
    
    # Check dependencies
    check_dependencies()
    
    # Convert
    print("\nStarting conversion...")
    success = convert_markdown_to_pdf()
    
    if success:
        print("\n" + "=" * 60)
        print("✓ Documentation successfully converted to PDF!")
        print("=" * 60)
        sys.exit(0)
    else:
        print("\n" + "=" * 60)
        print("⚠ Conversion completed with some issues")
        print("=" * 60)
        sys.exit(1)
