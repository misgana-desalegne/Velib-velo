import os
import sys
import subprocess
import time
import webbrowser
import platform

# --- CONFIGURATION ---
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
# Use the workspace frontend folder
REACT_DIR = os.path.join(ROOT_DIR, "frontend")
# Use the repository requirements.txt
REQUIREMENTS_FILE = os.path.join(ROOT_DIR, "requirements.txt")


def clear_screen():
    os.system("cls" if os.name == "nt" else "clear")


def print_banner():
    print("=" * 60)
    print("      🚀 RENOVATE APP LAUNCHER V2 (AUTO-INSTALL EDITION)")
    print("      Tayier Nimait - Renovate Energy (Brevet 2026)")
    print("      Hybrid Architecture: Django (8000) + React (3000)")
    print("=" * 60)


def install_python_deps():
    print("\n[PHASE 0] 🐍 Vérification des dépendances Python (PyQt6, etc.)...")

    # Check if we can import key packages
    missing_packages = []
    try:
        import PyQt6
    except ImportError:
        missing_packages.append("PyQt6")

    try:
        import django
    except ImportError:
        missing_packages.append("Django")

    if missing_packages:
        print(f"   ⚠️  Composants manquants détectés : {', '.join(missing_packages)}")
        print("   📦 INSTALLATION AUTOMATIQUE... (Cela peut prendre 1 minute)")

        try:
            # Upgrade pip first just in case
            subprocess.check_call(
                [sys.executable, "-m", "pip", "install", "--upgrade", "pip"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )

            # Install from requirements.txt
            subprocess.check_call(
                [sys.executable, "-m", "pip", "install", "-r", REQUIREMENTS_FILE]
            )
            print("   ✅ Installation réussie !")
        except Exception as e:
            print(f"   ❌ Erreur lors de l'installation : {e}")
            print("   Essayez de lancer 'pip install -r requirements.txt' manuellement.")
            input("Appuyez sur Entrée pour quitter...")
            sys.exit(1)
    else:
        print("   ✅ Tous les modules Python sont présents.")


def start_services():
    print("\n[PHASE 1] ⚙️  Lancement des Moteurs...")

    python_exec = sys.executable
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"

    # 1. Start Django (Daemon mode)
    print("   🌐 Démarrage TAYIER OS (Backend)...")
    try:
        django_process = subprocess.Popen(
            [python_exec, "manage.py", "runserver", "8000"], cwd=ROOT_DIR
        )
    except Exception as e:
        print(f"   ❌ Erreur lancement Django: {e}")

    # 2. Check React Dependencies
    if not os.path.isdir(os.path.join(REACT_DIR, "node_modules")):
        print("   📦 Installation des dépendances React (Première fois)...")
        subprocess.run([npm_cmd, "install"], cwd=REACT_DIR, shell=True)

    # 3. Start React
    print("   🚲 Démarrage VELOS UI V2 (Frontend)...")
    try:
        react_process = subprocess.Popen([
            npm_cmd, "run", "dev"
        ], cwd=REACT_DIR)
        return django_process, react_process
    except Exception as e:
        print(f"   ❌ Erreur lancement React: {e}")
        return django_process, None


def open_dashboard():
    print("\n[PHASE 2] 🌍 Ouverture du Dashboard...")
    time.sleep(5)  # Wait for warm up
    webbrowser.open("http://localhost:3000")


if __name__ == "__main__":
    clear_screen()
    print_banner()

    # STEP 0: Auto-Fix Dependencies (PyQt6, Django...)
    install_python_deps()

    django_proc = None
    react_proc = None
    try:
        django_proc, react_proc = start_services()
        open_dashboard()

        print("\n" + "=" * 60)
        print("      ✅ SYSTÈME OPÉRATIONNEL")
        print("      Laissez cette fenêtre ouverte.")
        print("      CTRL+C pour tout arrêter.")
        print("=" * 60)

        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n\n🛑 Arrêt des services demandé...")
    finally:
        def _terminate(p, name):
            try:
                if p is not None and p.poll() is None:
                    print(f"Stopping {name} (pid={p.pid})...")
                    p.terminate()
                    # wait briefly
                    try:
                        p.wait(timeout=5)
                    except Exception:
                        try:
                            p.kill()
                        except Exception:
                            pass
            except Exception:
                pass

        _terminate(react_proc, 'React')
        _terminate(django_proc, 'Django')
        sys.exit(0)
