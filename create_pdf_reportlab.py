#!/usr/bin/env python3
"""
Convert PROJECT_DOCUMENTATION.md to PDF using reportlab
"""

import subprocess
import sys
from pathlib import Path

def install_reportlab():
    """Install reportlab if not available"""
    try:
        import reportlab
        print("✓ reportlab already installed")
        return True
    except ImportError:
        print("Installing reportlab...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab", "markdown"])
        print("✓ reportlab installed successfully")
        return True

def convert_to_pdf():
    """Convert markdown to PDF using reportlab"""
    from reportlab.lib.pagesizes import A4, letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, cm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Preformatted
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
    import markdown
    
    # File paths
    project_root = Path(__file__).parent
    md_file = project_root / "PROJECT_DOCUMENTATION.md"
    pdf_file = project_root / "PROJECT_DOCUMENTATION.pdf"
    
    print(f"Reading markdown: {md_file}")
    
    if not md_file.exists():
        print(f"✗ File not found: {md_file}")
        return False
    
    # Read markdown
    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    print(f"✓ Read {len(md_content)} characters")
    
    # Create PDF
    doc = SimpleDocTemplate(
        str(pdf_file),
        pagesize=A4,
        rightMargin=1.5*cm,
        leftMargin=1.5*cm,
        topMargin=1.5*cm,
        bottomMargin=1.5*cm
    )
    
    # Define styles
    styles = getSampleStyleSheet()
    
    # Custom colors
    primary_green = colors.HexColor("#1FA971")
    secondary_green = colors.HexColor("#2d5a3d")
    
    # Create custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=primary_green,
        spaceAfter=20,
        fontName='Helvetica-Bold',
        borderPadding=10,
        borderWidth=2,
        borderColor=primary_green,
    )
    
    heading2_style = ParagraphStyle(
        'CustomHeading2',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=primary_green,
        spaceAfter=12,
        spaceBefore=12,
        fontName='Helvetica-Bold',
    )
    
    heading3_style = ParagraphStyle(
        'CustomHeading3',
        parent=styles['Heading3'],
        fontSize=13,
        textColor=secondary_green,
        spaceAfter=10,
        spaceBefore=10,
        fontName='Helvetica-Bold',
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=11,
        alignment=TA_JUSTIFY,
        spaceAfter=12,
    )
    
    # Build story
    story = []
    
    # Add title
    story.append(Paragraph("Projet Vélib", title_style))
    story.append(Paragraph("Comprehensive Project Documentation", heading2_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Add metadata
    meta_text = "<b>Version:</b> 1.0<br/><b>Date:</b> January 16, 2026<br/><b>Project Type:</b> Paris Bike-Sharing Analytics Platform"
    story.append(Paragraph(meta_text, body_style))
    story.append(Spacer(1, 0.2*inch))
    story.append(PageBreak())
    
    # Parse markdown and convert to reportlab elements
    lines = md_content.split('\n')
    
    for line in lines:
        if not line.strip():
            story.append(Spacer(1, 0.1*inch))
            continue
        
        # Heading 1
        if line.startswith('# '):
            title = line[2:].strip()
            story.append(Paragraph(title, title_style))
            story.append(Spacer(1, 0.1*inch))
        
        # Heading 2
        elif line.startswith('## '):
            title = line[3:].strip()
            if title not in ['Table of Contents']:
                story.append(PageBreak())
            story.append(Paragraph(title, heading2_style))
            story.append(Spacer(1, 0.1*inch))
        
        # Heading 3
        elif line.startswith('### '):
            title = line[4:].strip()
            story.append(Paragraph(title, heading3_style))
            story.append(Spacer(1, 0.05*inch))
        
        # Code blocks
        elif line.startswith('```'):
            continue
        
        # Regular text
        elif line.strip() and not line.startswith('|'):
            # Handle bold and italic
            text = line.replace('**', '<b>').replace('**', '</b>')
            text = text.replace('__', '<b>').replace('__', '</b>')
            text = text.replace('*', '<i>').replace('*', '</i>')
            text = text.replace('`', '<font face="Courier"><b>')
            text = text.replace('`', '</b></font>')
            
            try:
                story.append(Paragraph(text, body_style))
            except:
                # Fallback for problematic text
                story.append(Paragraph(line.strip()[:200], body_style))
            
            story.append(Spacer(1, 0.05*inch))
    
    # Build PDF
    try:
        doc.build(story)
        print(f"✓ PDF created successfully: {pdf_file}")
        
        # Get file size
        pdf_size = pdf_file.stat().st_size / (1024*1024)
        print(f"✓ File size: {pdf_size:.2f} MB")
        
        return True
    except Exception as e:
        print(f"✗ Error building PDF: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Projet Vélib - Documentation to PDF Converter")
    print("=" * 60)
    
    # Install dependencies
    install_reportlab()
    
    print("\nConverting markdown to PDF...")
    success = convert_to_pdf()
    
    if success:
        print("\n" + "=" * 60)
        print("✓ SUCCESS! Documentation converted to PDF")
        print("=" * 60)
        sys.exit(0)
    else:
        print("\n" + "=" * 60)
        print("✗ Conversion failed")
        print("=" * 60)
        sys.exit(1)
