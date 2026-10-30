"""Serve the actual TV UI and the retained design gallery on this Mac."""
import argparse
import io
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit, parse_qs
from urllib.request import Request, build_opener, HTTPRedirectHandler
from font_assets import font_overlay
from online_assets import online_overlay

ROOT = Path(__file__).resolve().parents[1]

# Development-only CORS bridge. TV packages fetch these HTTPS origins directly.
DAILY_HOSTS = {'commons.wikimedia.org', 'upload.wikimedia.org', 'thumb.wikimedia.org', 'science.nasa.gov',
               'assets.science.nasa.gov', 'apod.nasa.gov', 'esawebb.org',
               'www.esawebb.org', 'cdn.esawebb.org', 'esahubble.org',
               'www.esahubble.org', 'cdn.esahubble.org', 'www.bing.com', 'pixabay.com', 'cdn.pixabay.com'}


def daily_url_allowed(url):
    try:
        u = urlsplit(url)
        return u.scheme == 'https' and u.hostname in DAILY_HOSTS and u.port in (None, 443) and not u.username and not u.password
    except ValueError:
        return False


class DailyRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not daily_url_allowed(newurl):
            raise ValueError('Disallowed redirect')
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class PreviewServer(ThreadingHTTPServer):
    request_queue_size = 128


class Preview(SimpleHTTPRequestHandler):
    def send_head(self):
        route = unquote(urlsplit(self.path).path)
        if route == '/home/daily-config.js':
            try:
                content = online_overlay(include_private=self.server.include_private_fonts)['daily-config.js']
            except ValueError:
                self.send_error(500, 'Invalid local picture configuration')
                return None
            self.send_response(200)
            self.send_header('Content-Type', 'text/javascript')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            return io.BytesIO(content)
        if route in ['/home/assets/font-catalog.js', '/home/assets/private-fonts.css'] or route.startswith('/home/assets/private-fonts/'):
            source = font_overlay(include_private=self.server.include_private_fonts).get(route[len('/home/'):])
            if source is None:
                self.send_error(404, 'File not found')
                return None
            content = source.read_bytes() if isinstance(source, Path) else source
            self.send_response(200)
            self.send_header('Content-Type', self.guess_type(route))
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            return io.BytesIO(content)
        return super().send_head()

    def translate_path(self, path):
        route = urlsplit(path).path
        # Serve only the packaged UI and offline material-builder inputs.
        if route == '/' or route == '/home':
            return str(ROOT / 'app/index.html')
        if route.startswith('/home/'):
            self.directory = str(ROOT / 'app')
            return super().translate_path(route[5:])
        if route.startswith('/build/'):
            self.directory = str(ROOT / 'scripts/materials')
            return super().translate_path(route[6:])
        self.directory = str(ROOT / 'app')
        return super().translate_path(route)

    def do_GET(self):
        if urlsplit(self.path).path == '/daily-fetch':
            url = parse_qs(urlsplit(self.path).query).get('url', [''])[0]
            if self.headers.get('X-CleanFrame-Preview') != 'daily' or self.headers.get('Sec-Fetch-Site', 'same-origin') not in ('same-origin', 'none') or not daily_url_allowed(url):
                self.send_error(403, 'Origin not allowed')
                return
            try:
                request = Request(url, headers={'User-Agent': 'CleanFramePreview/0.6 (personal image background preview)'})
                with build_opener(DailyRedirect()).open(request, timeout=20) as response:
                    content = response.read(8 * 1024 * 1024 + 1)
                    content_type = response.headers.get('Content-Type', 'application/octet-stream')
                if len(content) > 8 * 1024 * 1024:
                    raise ValueError('Response too large')
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', str(len(content)))
                self.send_header('X-Content-Type-Options', 'nosniff')
                self.end_headers()
                self.wfile.write(content)
            except Exception:
                self.send_error(502, 'Image source unavailable')
            return
        if urlsplit(self.path).path == '/':
            self.send_response(302)
            self.send_header('Location', '/home/')
            self.end_headers()
            return
        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_request(self, code='-', size='-'):
        # Provider requests can contain an owner's API key. Never log their URL.
        if urlsplit(self.path).path == '/daily-fetch':
            self.log_message('daily-fetch %s %s', code, size)
        else:
            super().log_request(code, size)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=4795)
    parser.add_argument('--public-fonts', action='store_true', help='Use only the fonts distributed with the source')
    args = parser.parse_args()
    server = PreviewServer(('127.0.0.1', args.port), Preview)
    server.include_private_fonts = not args.public_fonts
    print('CleanFrame preview: http://127.0.0.1:' + str(server.server_port) + '/home/', flush=True)
    server.serve_forever()
