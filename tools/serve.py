#!/usr/bin/env python3
"""
Parton – helyi fejlesztői szerver.

A Cloudflare Pages viselkedését utánozza, hogy a helyi címek pontosan
ugyanúgy nézzenek ki, mint élesben:

    /                -> index.html
    /helyszin        -> helyszin.html
    /helyszin.html   -> átirányít a /helyszin címre
    nem létező út    -> 404.html

Futtatás a projekt gyökeréből:

    python tools/serve.py

Ezután nyisd meg: http://localhost:5500
(A Live Server helyett ezt használd, mert az nem tudja a kiterjesztés
nélküli címeket kiszolgálni.)
"""

import http.server
import os
import socketserver
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5500


class PagesHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]

        # /valami.html -> /valami  (mint a Cloudflare Pages)
        if path.endswith(".html") and path != "/index.html":
            self.send_response(301)
            self.send_header("Location", path[:-5])
            self.end_headers()
            return
        if path == "/index.html":
            self.send_response(301)
            self.send_header("Location", "/")
            self.end_headers()
            return

        # kiterjesztés nélküli út -> a megfelelő .html fájl
        if path != "/" and "." not in Path(path).name:
            candidate = ROOT / (path.lstrip("/") + ".html")
            if candidate.is_file():
                self.path = path + ".html"

        return super().do_GET()

    def send_error(self, code, message=None, explain=None):
        if code == 404 and (ROOT / "404.html").is_file():
            self.error_message_format = (ROOT / "404.html").read_text(encoding="utf-8")
        return super().send_error(code, message, explain)

    def end_headers(self):
        # fejlesztés közben ne gyorsítótárazzon
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("  %s\n" % (fmt % args))


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    os.chdir(ROOT)
    with Server(("127.0.0.1", PORT), PagesHandler) as httpd:
        print(f"Parton – helyi szerver fut:  http://localhost:{PORT}")
        print(f"Könyvtár: {ROOT}")
        print("Leállítás: Ctrl+C\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nLeállítva.")
