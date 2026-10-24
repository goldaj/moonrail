from __future__ import annotations

import contextlib
import http.server
import os
import socket
import socketserver
import threading
import urllib.parse
import urllib.error
import urllib.request
import webbrowser
from pathlib import Path


ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORTS = range(8765, 8785)
MOONRAIL_MARKER = b"<title>Moonrail"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    # Serve game assets, never repository sources or private product documents.
    PUBLIC_PREFIXES = ("/app/", "/assets/", "/data/")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_head(self):
        path = urllib.parse.unquote(urllib.parse.urlsplit(self.path).path)
        if (".." in path.split("/")
                or not (path == "/app" or path.startswith(self.PUBLIC_PREFIXES))):
            self.send_error(403, "Only Moonrail game assets are public")
            return None
        return super().send_head()

    def log_message(self, format: str, *args) -> None:
        pass

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


class ReusableServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def moonrail_url(port: int) -> str | None:
    url = f"http://{HOST}:{port}/app/"
    try:
        with urllib.request.urlopen(f"{url}index.html", timeout=0.25) as response:
            payload = response.read(16_384)
            if response.status == 200 and MOONRAIL_MARKER in payload:
                return url
    except (OSError, urllib.error.URLError):
        pass
    return None


def existing_moonrail_url() -> str | None:
    for port in PORTS:
        if url := moonrail_url(port):
            return url
    return None


def open_game(url: str) -> None:
    if os.environ.get("MOONRAIL_NO_BROWSER") != "1":
        webbrowser.open(url)


def available_port() -> int:
    for port in PORTS:
        with contextlib.closing(socket.socket()) as probe:
            try:
                probe.bind((HOST, port))
                return port
            except OSError:
                continue
    raise RuntimeError("Aucun port local disponible pour lancer Moonrail.")


def main() -> None:
    if url := existing_moonrail_url():
        open_game(url)
        return
    port = available_port()
    url = f"http://{HOST}:{port}/app/"
    with ReusableServer((HOST, port), QuietHandler) as server:
        threading.Timer(0.6, lambda: open_game(url)).start()
        print(f"Moonrail est lancé : {url}")
        print("Vous pouvez fermer cette fenêtre après la démonstration.")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
