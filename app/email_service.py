


import aiosmtplib
from email.message import EmailMessage

EMAIL = "mentorhub90@gmail.com"
PASSWORD = "bzgo dtpn lnnz kbvo"

async def send_otp(receiver_email: str, otp: str):
    message = EmailMessage()
    message["From"] = EMAIL
    message["To"] = receiver_email
    message["Subject"] = "MentorHub Email Verification"

    message.set_content(
        f"""
Hello,

Your MentorHub verification code is:

{otp}

This OTP is valid for 5 minutes.

Do not share this code with anyone.

Regards,
MentorHub Team
"""
    )

    await aiosmtplib.send(
        message,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username=EMAIL,
        password=PASSWORD,
    )
async def send_approval_email(receiver_email: str):
    message = EmailMessage()
    message["From"] = EMAIL
    message["To"] = receiver_email
    message["Subject"] = "MentorHub Approval Notification"

    message.set_content(
        f"""
Hello,

Your MentorHub application has been approved!

Congratulations!

Regards,
MentorHub Team
Go and login to your account to start mentoring.
"""
    )
#login button link can be added here if needed

    await aiosmtplib.send(
        message,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username=EMAIL,
        password=PASSWORD,
    )