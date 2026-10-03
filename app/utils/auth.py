from datetime import datetime,timedelta,timezone
from jose import JWTError,jwt
ACCESS_TOKEN_EXPIRE_MINUTES = 60
ALGORITHM = "HS256"
SECRET_KEY = "change this random key to super secure one"

def create_access_token(email:str ,user_type:str):
    expire = datetime.now(timezone.utc) + timedelta(minutes = ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "email":email,
        "user_type":user_type,
        "exp":expire
    }

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    return token