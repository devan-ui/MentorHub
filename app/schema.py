from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class LoginModel(BaseModel):
    email: str
    password: str
    userType: str

class UserAuth(BaseModel):
    userName: str
    email: str
    password: str

class OTPModel(BaseModel):
    email: str
    otp: str
    created_at: datetime
    expires_at: datetime
    attempts: int = 0

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class MentorApplication(BaseModel):
    firstName: str
    lastName: str
    email: str
    password: str
    jobTitle: str
    company: str
    location: str
    category: str
    skills: str
    bio: str
    linkedin: str
    website: str
    whyMentor: str
    achievement: str

class MenteeProfileUpdate(BaseModel):
    username: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    interests: Optional[str] = None
    skills: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    social_links: Optional[str] = None
    profilePic: Optional[str] = None

class MentorProfileUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    jobTitle: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    skills: Optional[str] = None
    bio: Optional[str] = None
    linkedin: Optional[str] = None
    website: Optional[str] = None
    whyMentor: Optional[str] = None
    achievement: Optional[str] = None
    profilePic: Optional[str] = None

class CommunityCreate(BaseModel):
    mentor_id: str
    name: str
    description: str
    category: str = "Software Development"
    skills: str = ""
    monthly_fee: int = 499
    capacity: int = 20
    start_date: str = ""
    end_date: str = ""
    rules: str = "Respect fellow members, engage actively in sessions, and maintain confidentiality."

class CommunityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    skills: Optional[str] = None
    monthly_fee: Optional[int] = None
    capacity: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    rules: Optional[str] = None
    status: Optional[str] = None

class SubscriptionRequest(BaseModel):
    community_id: Optional[str] = None
    mentee_id: str
    mentee_name: str
    mentee_email: str
    payment_method: str = "Direct Member Join"
    amount: Optional[int] = None
    status: Optional[str] = None
    message: Optional[str] = None

class KickMemberRequest(BaseModel):
    member_email: str
    member_id: Optional[str] = None
    reason: Optional[str] = "Removed by mentor"

class SessionCreate(BaseModel):
    title: str
    description: str = ""
    mentor_id: str
    community_id: Optional[str] = None
    mentor_name: str = ""
    mentor_email: str = ""
    category: str = "General Mentorship"
    date: str
    time: str
    duration: str = "60 min"
    gmeet_link: str
    price: int = 199
    max_attendees: int = 50
    session_type: str = "community"  # "community" or "1-on-1"
    status: str = "upcoming"  # "upcoming", "live", "completed", "cancelled"

class SessionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    duration: Optional[str] = None
    gmeet_link: Optional[str] = None
    price: Optional[int] = None
    max_attendees: Optional[int] = None
    status: Optional[str] = None

class SessionRSVP(BaseModel):
    mentee_name: str
    mentee_email: str

class SessionPaymentRequest(BaseModel):
    mentee_id: str
    mentee_name: str
    mentee_email: str
    payment_method: str = "UPI / Razorpay Test"
    amount: int = 199

class ReviewCreate(BaseModel):
    mentor_id: str
    mentee_id: str
    mentee_name: str
    community_id: Optional[str] = ""
    community_name: Optional[str] = ""
    rating: int = Field(ge=1, le=5)
    review_text: str

class ChatMessage(BaseModel):
    community_id: str
    sender_id: str
    sender_name: str
    sender_role: str = "mentee"  # "mentor" or "mentee"
    message: str

class DirectMessageCreate(BaseModel):
    sender_id: str
    receiver_id: str
    sender_name: str
    sender_role: str = "mentee"  # "mentee" or "mentor"
    mentor_id: str = ""
    mentee_id: str = ""
    receiver_name: str = ""
    message: str

class MentorshipBooking(BaseModel):
    mentor_id: str
    mentee_name: str
    mentee_email: str
    plan: str = "standard"
    one_off: bool = False
    message: str = ""
    preferred_timing: str = ""