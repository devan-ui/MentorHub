from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, mentor, mentee, MentorCommunity, admin

app = FastAPI(title="MentorHub API")

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect the routers
app.include_router(auth.router)
app.include_router(mentor.router)
app.include_router(mentee.router)
app.include_router(MentorCommunity.router)
app.include_router(admin.router)


