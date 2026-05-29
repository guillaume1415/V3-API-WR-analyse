# proxy.py — à lancer avec: python proxy.py
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.request import urlopen
from urllib.error import HTTPError

BASE = "https://world-rowing-api.soticcloud.net"

class P(BaseHTTPRequestHandler):
    def do_GET(self):
        target = BASE + self.path
        try:
            with urlopen(target, timeout=30) as r:
                data = r.read()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(data)
        except HTTPError as e:
            self.send_response(e.code)
            self.end_headers()
    def log_message(self, *a): pass

HTTPServer(("127.0.0.1", 8765), P).serve_forever()