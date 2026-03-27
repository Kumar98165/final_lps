import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration."""
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    
    # DB configuration
    SQLALCHEMY_DATABASE_URI = (
        f"postgresql://{os.getenv('DB_USER', 'postgres')}:"
        f"{os.getenv('DB_PASSWORD', '98165mkm')}@"
        f"{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}/"
        f"{os.getenv('DB_NAME', 'lps_db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # High-performance DB pooling
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 100,
        "max_overflow": 500,
        "pool_timeout": 30,
        "pool_recycle": 1800
    }
    
    # JWT configuration
    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY", "c0952ea4fa34d504723dc418f2d153ebf63c3a713200833209b11cff13bd1f1c"
    )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config_by_name = {
    "dev": DevelopmentConfig,
    "prod": ProductionConfig
}
