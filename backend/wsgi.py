# wsgi.py – thin wrapper
"""WSGI entry point for the LPS backend.
All heavy lifting (app creation, configuration, blueprint registration,
and database seeding) lives in ``backend/app_factory.py``.
"""

import os
from app_factory import create_app, seed_database

app = create_app()

if __name__ == '__main__':
    seed_database(app)
    
    port = int(os.getenv('FLASK_PORT', 5000))
    
    if os.getenv('FLASK_ENV', 'development') == 'development':
        print(f"  http://127.0.0.1:{port} (Development Mode - Logging Enabled)")
        app.run(host='0.0.0.0', port=port, debug=True)
    else:
        # We use Waitress for production-ready serving instead of the Flask built-in server.
        # The default Flask dev server cannot handle high concurrency.
        from waitress import serve
        print(f"  http://127.0.0.1:{port} (Production Mode)")
        serve(app, host='0.0.0.0', port=port, threads=500, connection_limit=5000)
else:
    seed_database(app)
