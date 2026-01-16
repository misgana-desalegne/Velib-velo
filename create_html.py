#!/usr/bin/env python3
"""
Convert PROJECT_DOCUMENTATION.md to HTML
"""

import subprocess
import sys
from pathlib import Path

def create_html_version():
    """Create an HTML version of the documentation"""
    
    project_root = Path(__file__).parent
    md_file = project_root / "PROJECT_DOCUMENTATION.md"
    html_file = project_root / "PROJECT_DOCUMENTATION.html"
    
    print(f"Reading markdown: {md_file}")
    
    if not md_file.exists():
        print(f"✗ File not found: {md_file}")
        return False
    
    try:
        import markdown2
    except ImportError:
        print("Installing markdown2...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "markdown2"])
        import markdown2
    
    # Read markdown
    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    print(f"✓ Read {len(md_content)} characters")
    
    # Convert to HTML
    html_body = markdown2.markdown(
        md_content,
        extras=['tables', 'fenced-code-blocks', 'toc', 'footnotes']
    )
    
    # Create complete HTML document with styling
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
        
        html {{
            scroll-behavior: smooth;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.7;
            color: #333;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 20px;
            min-height: 100vh;
        }}
        
        .container {{
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }}
        
        header {{
            background: linear-gradient(135deg, #1FA971 0%, #157855 100%);
            color: white;
            padding: 40px;
            text-align: center;
            border-bottom: 3px solid #0d4a2d;
        }}
        
        header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }}
        
        header .subtitle {{
            font-size: 1.1em;
            opacity: 0.95;
            margin-bottom: 15px;
        }}
        
        header .metadata {{
            font-size: 0.9em;
            opacity: 0.85;
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
        }}
        
        main {{
            padding: 40px;
        }}
        
        h1 {{
            color: #1FA971;
            border-bottom: 3px solid #1FA971;
            padding-bottom: 15px;
            margin: 40px 0 20px 0;
            font-size: 2.2em;
        }}
        
        h2 {{
            color: #1FA971;
            border-bottom: 2px solid #1FA971;
            padding-bottom: 10px;
            margin: 35px 0 15px 0;
            font-size: 1.8em;
        }}
        
        h3 {{
            color: #2d5a3d;
            margin: 25px 0 12px 0;
            font-size: 1.4em;
        }}
        
        h4, h5, h6 {{
            color: #2d5a3d;
            margin: 18px 0 10px 0;
        }}
        
        p {{
            margin: 15px 0;
            text-align: justify;
            color: #555;
        }}
        
        a {{
            color: #1FA971;
            text-decoration: none;
            border-bottom: 1px solid #1FA971;
            transition: all 0.3s ease;
        }}
        
        a:hover {{
            background: #f0f7f4;
            padding: 0 3px;
            border-radius: 2px;
        }}
        
        ul, ol {{
            margin: 15px 0 15px 30px;
        }}
        
        li {{
            margin: 8px 0;
            color: #555;
        }}
        
        code {{
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            color: #d63384;
        }}
        
        pre {{
            background: #2d3436;
            border-left: 4px solid #1FA971;
            padding: 15px;
            margin: 20px 0;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.85em;
            color: #a6e22e;
            border-radius: 5px;
        }}
        
        pre code {{
            background: none;
            padding: 0;
            border-radius: 0;
            color: #a6e22e;
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 5px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }}
        
        th {{
            background: linear-gradient(135deg, #1FA971 0%, #157855 100%);
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }}
        
        td {{
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
            color: #555;
        }}
        
        tr:hover {{
            background: #f9f9f9;
        }}
        
        tr:last-child td {{
            border-bottom: none;
        }}
        
        blockquote {{
            border-left: 4px solid #1FA971;
            padding-left: 20px;
            margin: 20px 0;
            color: #666;
            font-style: italic;
            background: #f0f7f4;
            padding: 15px 20px;
            border-radius: 3px;
        }}
        
        hr {{
            border: none;
            border-top: 2px solid #1FA971;
            margin: 40px 0;
            opacity: 0.3;
        }}
        
        strong {{
            color: #1FA971;
            font-weight: 600;
        }}
        
        em {{
            font-style: italic;
            color: #2d5a3d;
        }}
        
        .info-box {{
            background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
            border-left: 4px solid #1FA971;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 5px;
            color: #1b5e20;
        }}
        
        .warning-box {{
            background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
            border-left: 4px solid #ff9800;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 5px;
            color: #e65100;
        }}
        
        .toc {{
            background: linear-gradient(135deg, #f0f7f4 0%, #e8f5e9 100%);
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #1FA971;
        }}
        
        .toc h2 {{
            margin-top: 0;
            border: none;
            padding: 0;
        }}
        
        .toc ul {{
            margin-left: 20px;
        }}
        
        .toc li {{
            margin: 5px 0;
        }}
        
        .toc a {{
            color: #1FA971;
        }}
        
        footer {{
            background: #f5f5f5;
            padding: 30px 40px;
            text-align: center;
            color: #777;
            font-size: 0.9em;
            border-top: 1px solid #e0e0e0;
        }}
        
        footer p {{
            margin: 5px 0;
        }}
        
        @media (max-width: 768px) {{
            body {{
                padding: 10px;
            }}
            
            main {{
                padding: 20px;
            }}
            
            h1 {{
                font-size: 1.8em;
                margin: 25px 0 15px 0;
            }}
            
            h2 {{
                font-size: 1.4em;
                margin: 20px 0 12px 0;
            }}
            
            header {{
                padding: 30px 20px;
            }}
            
            header h1 {{
                font-size: 1.8em;
            }}
            
            table {{
                font-size: 0.9em;
            }}
            
            th, td {{
                padding: 8px;
            }}
        }}
        
        .back-to-top {{
            display: none;
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #1FA971;
            color: white;
            padding: 12px 15px;
            border-radius: 50%;
            text-decoration: none;
            font-size: 1.2em;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(31, 169, 113, 0.4);
            z-index: 999;
            transition: all 0.3s ease;
        }}
        
        .back-to-top:hover {{
            background: #157855;
            box-shadow: 0 6px 16px rgba(31, 169, 113, 0.6);
        }}
        
        .back-to-top.show {{
            display: block;
        }}
        
        /* Print styles */
        @media print {{
            body {{
                background: white;
                padding: 0;
            }}
            
            .container {{
                box-shadow: none;
                border-radius: 0;
            }}
            
            h1, h2, h3 {{
                page-break-after: avoid;
            }}
            
            table, pre {{
                page-break-inside: avoid;
            }}
            
            a {{
                color: #1FA971;
                border: none;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Projet Vélib</h1>
            <div class="subtitle">Comprehensive Project Documentation</div>
            <div class="metadata">
                <span><strong>Version:</strong> 1.0</span>
                <span><strong>Date:</strong> January 16, 2026</span>
                <span><strong>Status:</strong> Active Development</span>
            </div>
        </header>
        
        <main>
            {html_body}
        </main>
        
        <footer>
            <p><strong>Projet Vélib</strong> - Paris Bike-Sharing Analytics Platform</p>
            <p>Generated on January 16, 2026 | Version 1.0</p>
            <p>© 2026 Projet Vélib Team - All Rights Reserved</p>
        </footer>
    </div>
    
    <a href="#" class="back-to-top" id="backToTop">↑</a>
    
    <script>
        // Back to top button
        const backToTopBtn = document.getElementById('backToTop');
        
        window.addEventListener('scroll', () => {{
            if (window.scrollY > 300) {{
                backToTopBtn.classList.add('show');
            }} else {{
                backToTopBtn.classList.remove('show');
            }}
        }});
        
        backToTopBtn.addEventListener('click', (e) => {{
            e.preventDefault();
            window.scrollTo({{
                top: 0,
                behavior: 'smooth'
            }});
        }});
        
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {{
            anchor.addEventListener('click', function (e) {{
                const href = this.getAttribute('href');
                if (href !== '#' && href !== '#backToTop') {{
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {{
                        target.scrollIntoView({{
                            behavior: 'smooth',
                            block: 'start'
                        }});
                    }}
                }}
            }});
        }});
    </script>
</body>
</html>
"""
    
    # Write HTML file
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_doc)
    
    print(f"✓ HTML created successfully: {html_file}")
    
    # Get file size
    html_size = html_file.stat().st_size / 1024
    print(f"✓ File size: {html_size:.2f} KB")
    
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("Projet Vélib - Documentation to HTML Converter")
    print("=" * 60)
    print("\nCreating HTML version...")
    
    success = create_html_version()
    
    if success:
        print("\n" + "=" * 60)
        print("✓ SUCCESS! HTML documentation created")
        print("=" * 60)
        sys.exit(0)
    else:
        print("\n" + "=" * 60)
        print("✗ Conversion failed")
        print("=" * 60)
        sys.exit(1)
