import http.server
import socketserver
import os
import cgi
import json
from urllib.parse import urlparse

PORT = 5000
UPLOAD_DIR = "uploads"

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

class FileHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path == '/upload':
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={'REQUEST_METHOD': 'POST', 'CONTENT_TYPE': self.headers['Content-Type']}
            )

            if 'file' in form:
                file_item = form['file']
                file_name = file_item.filename
                file_data = file_item.file.read()
                
                # Save file
                file_path = os.path.join(UPLOAD_DIR, file_name)
                with open(file_path, 'wb') as f:
                    f.write(file_data)
                
                self.send_response(200)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                response = {'status': 'success', 'filename': file_name, 'url': f'http://localhost:{PORT}/uploads/{file_name}'}
                self.wfile.write(json.dumps(response).encode())
            else:
                self.send_error(400, "No file uploaded")
        else:
            self.send_error(404)

    def do_GET(self):
        if self.path.startswith('/uploads/'):
            from urllib.parse import unquote
            file_name = unquote(os.path.basename(self.path))
            file_path = os.path.join(UPLOAD_DIR, file_name)
            
            if os.path.exists(file_path):
                ext = os.path.splitext(file_name)[1].lower()
                
                # Image MIME types (Case-insensitive)
                mime_types = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.webp': 'image/webp',
                    '.gif': 'image/gif',
                    '.svg': 'image/svg+xml'
                }
                
                self.send_response(200)
                self.send_header('Access-Control-Allow-Origin', '*')
                
                if ext in mime_types:
                    # Serve images for display
                    self.send_header('Content-Type', mime_types[ext])
                elif ext in ['.stl', '.obj', '.ply', '.zip']:
                    # Force download for CAD/Archive files
                    self.send_header('Content-Disposition', f'attachment; filename="{file_name}"')
                    self.send_header('Content-Type', 'application/octet-stream')
                else:
                    # General fallback
                    self.send_header('Content-Type', 'application/octet-stream')
                
                with open(file_path, 'rb') as f:
                    self.end_headers()
                    self.wfile.write(f.read())
            else:
                self.send_error(404, "File not found")
        else:
            self.send_error(404)

print(f"Kael Backend starting on http://localhost:{PORT}")
with socketserver.TCPServer(("", PORT), FileHandler) as httpd:
    httpd.serve_forever()
