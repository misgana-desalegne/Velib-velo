import sys
import os
import subprocess
import time
import socket
from PyQt6.QtWidgets import QApplication, QMainWindow
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtCore import QUrl, QTimer, pyqtSlot, QObject
from PyQt6.QtWebChannel import QWebChannel
import threading

# --- CONFIGURATION ---
# Project root (this file lives in the repository root)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = BASE_DIR

# The packaged Renovate launcher lives under app_launcher/app_launcher/
LAUNCHER_ROOT = os.path.join(BASE_DIR, "app_launcher", "app_launcher", "RenovateApp_Launcher_2")
ENGINE_DIR = os.path.join(LAUNCHER_ROOT, "engine")
VENV_PYTHON = os.path.join(ENGINE_DIR, "venv", "Scripts", "python.exe")

# Point to the Django project's manage.py at repository root
MANAGE_PY = os.path.join(PROJECT_ROOT, "manage.py")

# UI may be in `ui` or `ui2` inside the packaged launcher — prefer `ui`, fallback to `ui2`
UI_DIR = os.path.join(LAUNCHER_ROOT, "ui")
if not os.path.exists(UI_DIR):
    UI_DIR = os.path.join(LAUNCHER_ROOT, "ui2")

SERVER_HOST = "127.0.0.1"
SERVER_PORT = "8000"
DASHBOARD_URL = f"http://{SERVER_HOST}:{SERVER_PORT}/Data-Analysis-Dashboard/"
REACT_PORTS = [3000, 5174, 5173]
REACT_URLS = [f"http://127.0.0.1:{p}" for p in REACT_PORTS]


class RenovateApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Renovate Energy - Launcher")
        self.resize(1000, 700)

        # 1. Setup Navigateur
        self.browser = QWebEngineView()
        self.browser.setStyleSheet("background-color: #0f172a;")
        self.setCentralWidget(self.browser)

        # 2. Interception du signal "LANCER" via URL (Plus robuste que JS Bridge)
        self.browser.urlChanged.connect(self.check_trigger)

        # 3. Charger l'UI Locale (prefer packaged launcher HTML, fallback to project HTML)
        launcher_html = os.path.join(UI_DIR, "launcher_ui.html")

        if os.path.exists(launcher_html):
            target_html = launcher_html
        else:
            # Try repository root index.html
            proj_index = os.path.join(PROJECT_ROOT, "index.html")
            build_index = os.path.join(PROJECT_ROOT, "build", "index.html")
            react_index = os.path.join(UI_DIR, "react-app", "index.html")

            if os.path.exists(proj_index):
                target_html = proj_index
            elif os.path.exists(build_index):
                target_html = build_index
            elif os.path.exists(react_index):
                target_html = react_index
            else:
                print(
                    f"[ERROR] No UI file found. Tried: {launcher_html}, {proj_index}, {build_index}, {react_index}"
                )
                target_html = launcher_html

        print(f"[LAUNCHER] Loading UI file: {os.path.abspath(target_html)}")

        # Defer loading: try to start React dev server and load it when ready
        self._initial_target = os.path.abspath(target_html)
        QTimer.singleShot(0, self.auto_start_frontend)

    def check_trigger(self, url):
        """Détecte quand l'utilisateur clique sur le bouton (via changement d'URL)"""
        url_str = url.toString()
        if "launch-now" in url_str:
            print("[LAUNCHER] Signal de lancement reçu via URL.")
            self.start_process()

    def start_process(self):
        """Lance Django et le timer de vérification"""
        self.start_django_server()
        self.start_react_server()
        # Timer pour vérifier si le serveur répond
        self.check_server_timer = QTimer()
        self.check_server_timer.timeout.connect(self.check_server_ready)
        self.check_server_timer.start(500)  # 500ms

    def start_django_server(self):
        if not os.path.exists(MANAGE_PY):
            print(f"[ERREUR] manage.py introuvable : {MANAGE_PY}")
            return

        # If a built frontend exists, start an embedded WSGI server using waitress
        # so the client doesn't need Python/Django installed.
        built_frontend = None
        candidates = [
            os.path.join(PROJECT_ROOT, "frontend", "dist"),
            os.path.join(PROJECT_ROOT, "frontend", "build"),
            os.path.join(PROJECT_ROOT, "build"),
        ]
        for c in candidates:
            if os.path.exists(c):
                built_frontend = c
                break

        if built_frontend:
            print(f"[RENOVATE] Found built frontend at {built_frontend}, starting embedded server.")
            try:
                self.server_thread = self.start_embedded_server(built_frontend)
                print(f"[RENOVATE] Embedded server thread started: {self.server_thread.name}")
                return
            except Exception as e:
                print(f"[RENOVATE] Failed to start embedded server: {e}")

        # Fallback: start Django as subprocess (dev mode)
        python_exe = VENV_PYTHON if os.path.exists(VENV_PYTHON) else sys.executable
        try:
            subprocess.check_call([python_exe, "-c", "import django"])
        except Exception:
            print(f"[RENOVATE] Fallback sur Python Système ({sys.executable})")
            python_exe = sys.executable

        print(f"[RENOVATE] Démarrage serveur avec : {python_exe}")
        try:
            self.server_process = subprocess.Popen(
                [python_exe, MANAGE_PY, "runserver", SERVER_PORT],
                cwd=PROJECT_ROOT,
            )
            print(f"[RENOVATE] Django PID={self.server_process.pid}")
        except Exception as e:
            print(f"[RENOVATE] Failed to start Django: {e}")

    def start_embedded_server(self, static_root, host="127.0.0.1", port=8000):
        """Start Django WSGI application in-process and serve built static files via WhiteNoise.

        Returns the Thread running the server.
        """
        try:
            # Start in a background thread so the UI remains responsive
            def _run():
                # Setup Django environment
                os.environ.setdefault("DJANGO_SETTINGS_MODULE", "projet_velib.settings")
                import django

                django.setup()

                # Import WSGI application
                from projet_velib.wsgi import application as django_app

                # Wrap with WhiteNoise to serve the built frontend
                try:
                    from whitenoise import WhiteNoise
                    wsgi_app = WhiteNoise(django_app, root=static_root, index_file=True)
                except Exception:
                    # If WhiteNoise not available, fall back to django app
                    wsgi_app = django_app

                # Serve using waitress
                from waitress import serve

                serve(wsgi_app, host=host, port=port)

            t = threading.Thread(target=_run, name="embedded-django-server", daemon=True)
            t.start()
            return t
        except Exception as e:
            raise

    def start_react_server(self):
        """Start the React development server if present."""
        # Candidate react folders: prefer project root, then frontend, then packaged launcher
        react_dirs = [
            PROJECT_ROOT,
            os.path.join(PROJECT_ROOT, "frontend"),
            os.path.join(UI_DIR, "react-app"),
        ]

        react_dir = None
        for d in react_dirs:
            if os.path.exists(d):
                react_dir = d
                break

        if not react_dir:
            print(f"[RENOVATE] No React app folder found in: {react_dirs}")
            return False

        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"

        try:
            print(f"[RENOVATE] Starting React dev server in {react_dir}")
            self.react_process = subprocess.Popen(
                [npm_cmd, "run", "dev"], cwd=react_dir
            )
            print(f"[RENOVATE] React PID={self.react_process.pid}")
        except Exception as e:
            print(f"[RENOVATE] Failed to start React: {e}")
            return False
        return True

    def auto_start_frontend(self, timeout: int = 30_000):
        """Start React dev server and load it in the embedded browser when ready.

        timeout in milliseconds.
        """
        # Start react server if available
        started = self.start_react_server()

        # Wait for REACT_URL to be ready (try common ports and both hostnames)
        import urllib.request

        start_ts = time.time()
        while (time.time() - start_ts) * 1000 < timeout:
            for port in REACT_PORTS:
                for host in ("127.0.0.1", "localhost"):
                    url = f"http://{host}:{port}"
                    try:
                        resp = urllib.request.urlopen(url, timeout=1)
                        # got a response — consider server ready
                        print(f"[RENOVATE] React dev server ready at {url} (HTTP {resp.status})")
                        self.browser.setUrl(QUrl(url))
                        return
                    except Exception:
                        pass
            # process events so UI stays responsive
            QApplication.processEvents()
            time.sleep(0.25)

        # Fallback to the static target if React didn't start
        print(f"[RENOVATE] React dev server not ready after {timeout}ms, loading local file")
        self.browser.setUrl(QUrl.fromLocalFile(self._initial_target))

    def check_server_ready(self):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex((SERVER_HOST, int(SERVER_PORT)))
        sock.close()

        if result == 0:
            print("[RENOVATE] Serveur prêt ! Ouverture Chrome...")
            self.check_server_timer.stop()

            # Ouvrir Chrome
            import webbrowser

            chrome_path = None
            paths = [
                r"C:\Program Files\Google\Chrome\Application\chrome.exe",
                r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
                os.path.expanduser(
                    r"~\AppData\Local\Google\Chrome\Application\chrome.exe"
                ),
            ]
            for path in paths:
                if os.path.exists(path):
                    chrome_path = path
                    break

            target_url = DASHBOARD_URL
            if chrome_path:
                webbrowser.register(
                    "chrome", None, webbrowser.BackgroundBrowser(chrome_path)
                )
                webbrowser.get("chrome").open(target_url)
            else:
                webbrowser.open(target_url)

            # Fermer le launcher après ouverture
            QTimer.singleShot(1000, self.close)  # Petit délai pour être propre
        else:
            print("[RENOVATE] Attente serveur...")

    def closeEvent(self, event):
        # Attempt to terminate started subprocesses if they are still running
        try:
            if hasattr(self, "server_process") and self.server_process.poll() is None:
                print("[RENOVATE] Terminating Django process...")
                self.server_process.terminate()
        except Exception:
            pass

        try:
            if hasattr(self, "react_process") and self.react_process.poll() is None:
                print("[RENOVATE] Terminating React process...")
                self.react_process.terminate()
        except Exception:
            pass

        event.accept()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = RenovateApp()
    window.show()
    sys.exit(app.exec())
