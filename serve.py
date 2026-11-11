"""로컬 확인용 서버: 레포 루트를 띄우고 브라우저가 파일을 캐시하지 않게 함 (고친 JS가 바로 반영되도록)
실행: python serve.py  →  http://localhost:8770/booth-motion/
"""
import http.server
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8770


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


with Server(('', PORT), NoCache) as httpd:
    print(f'http://localhost:{PORT}/booth-motion/', flush=True)
    httpd.serve_forever()
