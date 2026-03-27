import os
from app import create_app, seed_database

# Determine config from environment
env = os.getenv('FLASK_ENV', 'development')
config_name = 'dev' if env == 'development' else 'prod'

app = create_app(config_name)

if __name__ == '__main__':
    seed_database(app)
    
    port = int(os.getenv('FLASK_PORT', 5000))
    
    if env == 'development':
        print(f"  http://127.0.0.1:{port} (Development Mode - Modular)")
        app.run(host='0.0.0.0', port=port, debug=True)
    else:
        from waitress import serve
        print(f"  http://127.0.0.1:{port} (Production Mode - Modular)")
        serve(app, host='0.0.0.0', port=port, threads=500, connection_limit=5000)
else:
    seed_database(app)
