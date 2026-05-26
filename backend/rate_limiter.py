from slowapi import Limiter
from slowapi.util import get_remote_address

# Define the global rate limiter with a high default threshold
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
