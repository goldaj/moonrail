from __future__ import annotations

import contextlib
import http.server
import socket
import socketserver
import threading
import webbrowser
from pathlib import Path


ROOT = Path(__file__).resolve().parent


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format: str, *args) -> None:
        pass

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


class ReusableServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


def available_port() -> int:
    for port in range(8765, 8785):
        with contextlib.closing(socket.socket()) as probe:
            try:
                probe.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    raise RuntimeError("Aucun port local disponible pour lancer Moonrail.")


def main() -> None:
    port = available_port()
    url = f"http://127.0.0.1:{port}/app/"
    with ReusableServer(("127.0.0.1", port), QuietHandler) as server:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
        print(f"Moonrail est lancé : {url}")
        print("Vous pouvez fermer cette fenêtre après la démonstration.")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
