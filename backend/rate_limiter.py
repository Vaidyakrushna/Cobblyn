import os
from slowapi import Limiter
from slowapi.util import get_remote_address

def get_ip_or_bypass(request):
    if os.environ.get("TESTING") == "true":
        return None
    return get_remote_address(request)

# Define the global rate limiter with a high default threshold
limiter = Limiter(key_func=get_ip_or_bypass, default_limits=["200/minute"])
