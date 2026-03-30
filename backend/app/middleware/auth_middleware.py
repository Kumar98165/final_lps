from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from app.models import User


def role_required(allowed_roles):
    """
    Decorator to restrict access based on user roles.
    Expects allowed_roles to be a list of strings.
    """

    def decorator(f):

        @wraps(f)
        def decorated_function(*args, **kwargs):

            username = get_jwt_identity()
            user = User.query.filter_by(username=username).first()

            if not user:
                return jsonify({
                    "success": False,
                    "message": "User not found"
                }), 404

            if user.role not in allowed_roles:
                return jsonify({
                    "success": False,
                    "message": (
                        "Unauthorized: Access requires one of the following roles: "
                        + ", ".join(allowed_roles)
                    )
                }), 403

            return f(*args, **kwargs)

        return decorated_function

    return decorator