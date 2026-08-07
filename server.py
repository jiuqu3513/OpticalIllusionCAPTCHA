#!/usr/bin/env python3
"""CAPTCHA test server with feedback collection.
Usage: python3 server.py [port]
Serves static files AND collects feedback via POST /feedback -> feedback.jsonl
"""
import http.server, json, sys, os, time
from pathlib import Path

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
ROOT = Path(__file__).parent
FEEDBACK_FILE = ROOT / "feedback.jsonl"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        if self.path == "/feedback":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body)
            except json.JSONDecodeError:
                self.send_response(400); self.end_headers()
                self.wfile.write(b'{"error":"invalid json"}')
                return
            # add server-side metadata
            data["_server_time"] = time.time()
            data["_ip"] = self.client_address[0]
            data["_user_agent"] = self.headers.get("User-Agent", "")
            # append as one JSON line
            with open(FEEDBACK_FILE, "a") as f:
                f.write(json.dumps(data, ensure_ascii=False) + "\n")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
        else:
            self.send_response(404); self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, fmt, *args):
        if "/feedback" in str(args):
            print(f"  📝 feedback received ({len(self.rfile.peek())} bytes)")
        else:
            super().log_message(fmt, *args)

print(f"""
╔══════════════════════════════════════════╗
║  🧠 CAPTCHA Test Server                 ║
║  http://0.0.0.0:{PORT}                     ║
║  Feedback -> {FEEDBACK_FILE.name}
║  Count: {sum(1 for _ in open(FEEDBACK_FILE)) if FEEDBACK_FILE.exists() else 0} entries
╚══════════════════════════════════════════╝
""")

http.server.HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
