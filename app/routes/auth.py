from fastapi import APIRouter, HTTPException, status, Form, File, UploadFile 
from app.database import db 
from app.schema import UserAuth 
from app.schema import LoginModel 
from app.schema import VerifyOTPRequest 
from app.schema import MentorApplication 
from app.security import hash_password, verify_password 
from secrets import randbelow 
from datetime import datetime, timedelta 
from app.email_service import send_otp 
from app.utils.auth import create_access_token 
 
router = APIRouter(tags=["Authentication"]) 
 
#login page  
@router.post("/login") 
async def login(user_data: LoginModel): 
    print(f"The frontend data is :{user_data}") 
    email_clean = user_data.email.strip()
    email_regex = {"$regex": f"^{email_clean}$", "$options": "i"}

    if user_data.userType == "mentee": 
        user = await db["users"].find_one({"email": email_regex}) 
        if not user:
            # Check if this email is registered as an accepted mentor
            mentor_check = await db["mentors"].find_one({"email": email_regex})
            if mentor_check:
                pwd_match = False
                stored_pwd = mentor_check.get("password")
                if stored_pwd:
                    if stored_pwd == user_data.password:
                        pwd_match = True
                    else:
                        try:
                            pwd_match = verify_password(user_data.password, stored_pwd)
                        except Exception:
                            pwd_match = False
                if pwd_match:
                    mentor_id_str = str(mentor_check["_id"])
                    return {
                        "message": "Mentor login successfully",
                        "token": create_access_token(email=mentor_check["email"], user_type="mentor"),
                        "mentorId": mentor_id_str,
                        "mentor": {
                            "id": mentor_id_str,
                            "_id": mentor_id_str,
                            "email": mentor_check["email"],
                            "name": f"{mentor_check.get('firstName', '')} {mentor_check.get('lastName', '')}".strip() or "Mentor",
                            "firstName": mentor_check.get("firstName", ""),
                            "lastName": mentor_check.get("lastName", ""),
                            "jobTitle": mentor_check.get("jobTitle", ""),
                            "company": mentor_check.get("company", ""),
                            "role": "mentor"
                        }
                    }
                return {"message": "Invalid mentor credentials"}
            return {"message": "Invalid mentee credentials"}

        pwd_match = False
        stored_pwd = user.get("password")
        if stored_pwd:
            if stored_pwd == user_data.password:
                pwd_match = True
            else:
                try:
                    pwd_match = verify_password(user_data.password, stored_pwd)
                except Exception:
                    pwd_match = False

        if not pwd_match:
            return {"message": "Invalid mentee credentials"} 

        token = create_access_token(email=user["email"], user_type="mentee") 
        user_name_val = user.get("name") or user.get("userName") or user.get("username") or (user.get("email", "").split("@")[0] if user.get("email") else "User")
        return { 
                "message": "User login successfully", 
                "token": token, 
                "userId": str(user["_id"]),
                "userName": user_name_val,
                "user": { 
                    "id": str(user["_id"]),
                    "email": user["email"], 
                    "name": user_name_val,
                    "username": user_name_val,
                    "userName": user_name_val,
                    "bio": user.get("bio", ""),
                    "phone": user.get("phone", ""),
                    "location": user.get("location", ""),
                    "skills": user.get("skills", ""),
                    "role": "mentee"
                    } 
                } 
    elif user_data.userType == "mentor": 
        mentor = await db["mentors"].find_one({"email": email_regex}) 
        if not mentor:
            # Check if this email is registered as a mentee
            user_check = await db["users"].find_one({"email": email_regex})
            if user_check:
                pwd_match = False
                stored_pwd = user_check.get("password")
                if stored_pwd:
                    if stored_pwd == user_data.password:
                        pwd_match = True
                    else:
                        try:
                            pwd_match = verify_password(user_data.password, stored_pwd)
                        except Exception:
                            pwd_match = False
                if pwd_match:
                    token = create_access_token(email=user_check["email"], user_type="mentee")
                    user_name_val = user_check.get("name") or user_check.get("userName") or user_check.get("username") or (user_check.get("email", "").split("@")[0] if user_check.get("email") else "User")
                    return {
                        "message": "User login successfully",
                        "token": token,
                        "userId": str(user_check["_id"]),
                        "userName": user_name_val,
                        "user": {
                            "id": str(user_check["_id"]),
                            "email": user_check["email"],
                            "name": user_name_val,
                            "username": user_name_val,
                            "userName": user_name_val,
                            "role": "mentee"
                        }
                    }
                return {"message": "Invalid mentee credentials"}
            return {"message": "Invalid mentor credentials"}

        # Check approval status
        mentor_status = str(mentor.get("accepted", "")).lower()
        if mentor_status == "pending":
            return {"message": "Your mentor application is pending review by the admin team."}
        if mentor_status == "rejected":
            return {"message": "Your mentor application was not approved."}

        pwd_match = False
        stored_pwd = mentor.get("password")
        if stored_pwd:
            if stored_pwd == user_data.password:
                pwd_match = True
            else:
                try:
                    pwd_match = verify_password(user_data.password, stored_pwd)
                except Exception:
                    pwd_match = False
        
        if not pwd_match:
            return {"message": "Invalid mentor credentials"}     
        
        mentor_id_str = str(mentor["_id"])
        return { 
                "message": "Mentor login successfully", 
                "token": create_access_token(email=mentor["email"], user_type="mentor"), 
                "mentorId": mentor_id_str,
                "mentor": {
                    "id": mentor_id_str,
                    "_id": mentor_id_str,
                    "email": mentor["email"],
                    "name": f"{mentor.get('firstName', '')} {mentor.get('lastName', '')}".strip() or "Mentor",
                    "firstName": mentor.get("firstName", ""),
                    "lastName": mentor.get("lastName", ""),
                    "jobTitle": mentor.get("jobTitle", ""),
                    "company": mentor.get("company", ""),
                    "role": "mentor"
                }
                } 
    elif user_data.userType == "admin": 
        admin = await db["admins"].find_one({"email": email_regex}) 
        if not admin or (user_data.password != admin["password"] and not verify_password(user_data.password, admin["password"])): 
            return {"message": "Invalid admin credentials"} 
        token = create_access_token(email=admin["email"], user_type="admin") 
        return {
            "message": "Admin login successfully",
            "token": token,
            "adminId": str(admin["_id"])
        } 

     
     
    # Combine the checks to prevent user enumeration (good security practice) 
    # if not user or not verify_password(user_data.password, user["password"]) or user_data.userType != "mentee": 
    #     raise HTTPException(status_code=401, detail="Invalid email or password") 
 
    #     if not user.get("is_verified", False): 
    #     raise HTTPException( 
    #         status_code=403, 
    #         detail="Your email is not verified. Please verify your OTP before logging in." 
    #     ) 
     
 
#register page  
@router.post("/register") 
async def register(user_data: UserAuth): 
    #print(user_data) 
    # Check if user already exists 
    existing_user = await db["users"].find_one({"email": user_data.email}) 
    if existing_user: 
        return { 
            "message": "User already exists" 
        } 
    else: 
        user_dict = user_data.model_dump() 
        user_dict["username"] = user_dict["userName"] 
        user_dict["email"] = user_dict["email"] 
        user_dict["password"] = hash_password(user_dict["password"]) 
        user_dict["is_verified"] = False 
        user_dict["created_at"] = datetime.utcnow() 
 
        await db["users"].insert_one(user_dict) 
 
        existing_otp = await db["otp"].find_one({ 
            "email": user_data.email 
        }) 
 
        if existing_otp: 
            if datetime.utcnow() < existing_otp["expires_at"]: 
                raise HTTPException( 
                    status_code=400, 
                    detail="A valid OTP has already been sent. Please check your email or wait until it expires." 
                ) 
            await db["otp"].delete_one({"email": user_data.email}) 
 
        otp = "".join(str(randbelow(10)) for _ in range(6)) 
 
        await db["otp"].insert_one({ 
            "email": user_data.email, 
            "otp": otp, 
            "created_at": datetime.utcnow(), 
            "expires_at": datetime.utcnow() + timedelta(minutes=5), 
            "attempts": 0 
        }) 
        await send_otp(user_data.email,otp) 
        return { 
            "message": "OTP send successfully", 
            #"otp":otp 
        } 
 
#varify otp 
@router.post("/verify-otp") 
async def verify_otp(data: VerifyOTPRequest): 
    otp_record = await db["otp"].find_one({"email": data.email}) 
     
    if not otp_record or otp_record["otp"] != data.otp: 
        raise HTTPException( 
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid OTP code" 
        ) 

    await db["users"].update_one( 
        {"email": data.email}, 
        {"$set": {"is_verified": True}} 
    ) 

    await db["otp"].delete_one({"email": data.email}) 
 
    return {"message": "OTP verified successfully"} 
 
#mentor_register 
@router.post("/mentor/apply") 
async def apply( 
    firstName: str = Form(...), 
    lastName: str = Form(...), 
    email: str = Form(...), 
    password: str = Form(...), 
    jobTitle: str = Form(...), 
    company: str = Form(...), 
    location: str = Form(...), 
    category: str = Form(...), 
    skills: str = Form(...), 
    bio: str = Form(...), 
    linkedin: str = Form(...), 
    website: str = Form(...), 
    whyMentor: str = Form(...), 
    achievement: str = Form(...), 
    profilePic: UploadFile = File(...) 
): 
 
    print("Name:", firstName, lastName) 
    print("Email:", email) 
    print("Image:", profilePic.filename) 
    print("Image type:", profilePic.content_type) 
 
    existing_mentor = await db["mentors"].find_one({ 
        "email": email 
    }) 
 
    if existing_mentor: 
        return { 
            "message": "Mentor already exists" 
        } 
 
    image_data = await profilePic.read() 
 
    mentor_data = { 
        "firstName": firstName, 
        "lastName": lastName, 
        "email": email, 
        "password": hash_password(password), 
        "jobTitle": jobTitle, 
        "company": company, 
        "location": location, 
        "category": category, 
        "skills": skills, 
        "bio": bio, 
        "linkedin": linkedin, 
        "website": website, 
        "whyMentor": whyMentor, 
        "achievement": achievement, 
 
        "profilePic": image_data, 
        "profilePicName": profilePic.filename, 
        "profilePicType": profilePic.content_type, 
 
        "accepted": "pending", 
        "created_at": datetime.utcnow() 
    } 
 
    result = await db["mentors"].insert_one(mentor_data) 
 
    return { 
        "message": "Mentor application submitted successfully", 
        "id": str(result.inserted_id) 
    }