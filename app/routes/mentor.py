from bson import ObjectId
from fastapi import APIRouter, HTTPException, status, Form, File, UploadFile, Body
from datetime import datetime, timedelta
from app.database import db
import base64
import secrets
import re


from app.email_service import send_approval_email
router = APIRouter(tags=["Mentor Application"])
@router.get("/mentors")
async def get_mentors():
    mentors = await db["mentors"].find({"accepted": "pending"}).to_list(length=10) # Adjust the length as needed
    for mentor in mentors:
        # Convert ObjectId to string for JSON serialization
        mentor["_id"] = str(mentor["_id"])
        if mentor.get("profilePic"):
            # Convert the profile picture to base64 string
            mentor["profilePic"] = base64.b64encode(mentor["profilePic"]).decode("utf-8")
    return {"data" : mentors,"message":"successfully fetched mentors"}
@router.get("/mentors/{id}")
async def get_mentor(id: str):
    print(f"mentor id : {id}")
    query = {"$or": [{"_id": ObjectId(id)}, {"_id": id}, {"email": id}]} if ObjectId.is_valid(id) else {"$or": [{"_id": id}, {"email": id}]}
    mentor = await db["mentors"].find_one(query)
    if not mentor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mentor not found")
    
    # Convert ObjectId to string for JSON serialization
    mentor["_id"] = str(mentor["_id"])
    if mentor.get("profilePic"):
        if isinstance(mentor["profilePic"], bytes):
            mentor["profilePic"] = base64.b64encode(mentor["profilePic"]).decode("utf-8")
    
    return {"data": mentor, "message": "successfully fetched mentor"}
@router.post("/mentors/{id}/approve")
async def approve_mentor(id: str):
    query = {"_id": ObjectId(id)} if ObjectId.is_valid(id) else {"_id": id}
    mentor = await db["mentors"].find_one(query)
    if not mentor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mentor not found")
    await db["mentors"].update_one(query, {"$set": {"accepted": "true"}})
    # Send approval email
    try:
        await send_approval_email(mentor["email"])
    except Exception as e:
        print("Approval email error:", e)
    return {"message": "Mentor approved successfully"}  


#accepted mentors
@router.get("/accepted-mentors")
async def get_accepted_mentors():

    mentors = await db["mentors"].find({
        "accepted": "true"
    }).to_list(length=100)

    for mentor in mentors:

        # Convert ObjectId to string
        mentor["_id"] = str(mentor["_id"])

        # Convert profile picture to Base64
        if mentor.get("profilePic"):
            if isinstance(mentor["profilePic"], bytes):
                mentor["profilePic"] = base64.b64encode(
                    mentor["profilePic"]
                ).decode("utf-8")

    return {
        "data": mentors,
        "message": "Successfully fetched accepted mentors"
    }

@router.get("/rejected-mentors")
async def get_rejected_mentors():
    mentors = await db["mentors"].find({
        "accepted": "rejected"
    }).to_list(length=100)

    for mentor in mentors:
        mentor["_id"] = str(mentor["_id"])

        if mentor.get("profilePic"):
            if isinstance(mentor["profilePic"], bytes):
                mentor["profilePic"] = base64.b64encode(
                    mentor["profilePic"]
                ).decode("utf-8")

    return {
        "data": mentors,
        "message": "Successfully fetched rejected mentors"
    }

@router.post("/mentors/{id}/reject")
async def reject_mentor(id: str):

    mentor = await db["mentors"].find_one({
        "_id": ObjectId(id)
    })

    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor not found"
        )

    await db["mentors"].update_one(
        {"_id": ObjectId(id)},
        {"$set": {"accepted": "rejected"}}
    )

    return {
        "message": "Mentor rejected successfully"
    }
    
@router.get("/mentors/pending/count")
async def get_pending_mentor_count():
    try:
        count = await db["mentors"].count_documents({
            "accepted": "pending"
        })

        return {
            "count": count,
            "message": "Successfully fetched pending mentor count"
        }

    except Exception as e:
        print("Error getting pending mentor count:", e)
        raise HTTPException(
            status_code=500,
            detail="Failed to get pending mentor count"
        )


# =====================================================
# MENTOR DASHBOARD & PROFILE
# =====================================================

@router.get("/mentor/{id}/dashboard")
async def get_mentor_dashboard(id: str):
    """Fetch real-time dashboard data for a mentor from MongoDB."""
    try:
        mentor = None
        if ObjectId.is_valid(id):
            mentor = await db["mentors"].find_one({"_id": ObjectId(id)})
        if not mentor:
            mentor = await db["mentors"].find_one({"email": id})
        if not mentor:
            mentor = await db["mentors"].find_one({"_id": id})

        mentor_id_str = str(mentor["_id"]) if mentor else id
        mentor_email = mentor.get("email") if mentor else (id if "@" in id else None)
        mentor_name = f"{mentor.get('firstName', '')} {mentor.get('lastName', '')}".strip() if mentor else ""

        mentor_or = [{"mentor_id": mentor_id_str}]
        if ObjectId.is_valid(mentor_id_str):
            mentor_or.append({"mentor_id": ObjectId(mentor_id_str)})
        if mentor_email:
            mentor_or.append({"mentor_email": mentor_email})
        if mentor_name:
            mentor_or.append({"mentor_name": mentor_name})

        mentor_filter = {"$or": mentor_or}

        # 1. Community details
        community = await db["communities"].find_one(mentor_filter)
        if community:
            community["_id"] = str(community["_id"])
            if isinstance(community.get("created_at"), datetime):
                community["created_at"] = community["created_at"].isoformat()
        total_communities = await db["communities"].count_documents(mentor_filter)

        # 2. Active unique mentees
        active_mentees = await db["subscriptions"].distinct("mentee_email", {
            "$and": [mentor_filter, {"status": "active"}]
        })
        active_mentee_count = len(active_mentees)
        if community and community.get("current_members", 0) > active_mentee_count:
            active_mentee_count = community.get("current_members", 0)

        # 3. Upcoming sessions
        upcoming_sessions = await db["sessions"].find({
            "$and": [mentor_filter, {"status": {"$in": ["upcoming", "live"]}}]
        }).sort("created_at", -1).to_list(10)

        for s in upcoming_sessions:
            s["_id"] = str(s["_id"])
            if isinstance(s.get("created_at"), datetime):
                s["created_at"] = s["created_at"].isoformat()

        # 4. Total earnings from successful payments
        pay_or = [{"mentor_id": mentor_id_str}]
        if mentor_email:
            pay_or.append({"mentor_email": mentor_email})
        payments = await db["payments"].find({
            "$and": [
                {"$or": pay_or},
                {"status": {"$in": ["success", "Completed", "completed"]}}
            ]
        }).to_list(1000)

        total_earnings = sum(p.get("amount", 0) for p in payments)
        if total_earnings == 0 and active_mentee_count > 0 and community and community.get("monthly_fee"):
            total_earnings = active_mentee_count * community.get("monthly_fee", 0)

        # 5. Reviews & Average Rating
        reviews = await db["reviews"].find(mentor_filter).to_list(200)
        avg_rating = 5.0
        if reviews:
            avg_rating = round(sum(r.get("rating", 5) for r in reviews) / len(reviews), 1)
        elif mentor and mentor.get("rating"):
            avg_rating = float(mentor.get("rating"))
        total_reviews = len(reviews) if reviews else (mentor.get("total_reviews", 0) if mentor else 0)

        # 6. Recent subscriptions / mentees
        recent_subs = await db["subscriptions"].find(mentor_filter).sort("created_at", -1).to_list(10)
        recent_mentees_list = []
        for sub in recent_subs:
            sub["_id"] = str(sub["_id"])
            created_at_str = "Recently"
            if isinstance(sub.get("created_at"), datetime):
                created_at_str = sub["created_at"].strftime("%b %d, %Y")
            elif isinstance(sub.get("created_at"), str):
                created_at_str = sub["created_at"][:10]

            name = sub.get("mentee_name") or "Mentee"
            initials = "".join([w[0] for w in name.split()[:2]]).upper() or "M"
            recent_mentees_list.append({
                "_id": sub["_id"],
                "name": name,
                "email": sub.get("mentee_email"),
                "initials": initials,
                "joined": created_at_str,
                "community": sub.get("community_name") or (community.get("name") if community else "Mentorship Community"),
                "status": sub.get("status", "active")
            })

        # Also check session attendees if no subscriptions yet
        if not recent_mentees_list:
            all_sessions = await db["sessions"].find(mentor_filter).to_list(50)
            seen_emails = set()
            for sess in all_sessions:
                for att in sess.get("attendees", []):
                    email = att.get("email")
                    if email and email not in seen_emails:
                        seen_emails.add(email)
                        name = att.get("name") or email.split("@")[0].capitalize()
                        initials = "".join([w[0] for w in name.split()[:2]]).upper() or "M"
                        recent_mentees_list.append({
                            "_id": email,
                            "name": name,
                            "email": email,
                            "initials": initials,
                            "joined": "Recent",
                            "community": community.get("name") if community else "Mentorship Community",
                            "status": "active"
                        })

        return {
            "data": {
                "total_communities": total_communities,
                "active_mentees": active_mentee_count,
                "total_sessions": len(upcoming_sessions),
                "upcoming_sessions": upcoming_sessions,
                "total_earnings": total_earnings,
                "average_rating": avg_rating,
                "total_reviews": total_reviews,
                "community": community,
                "recent_mentees": recent_mentees_list,
                "recent_subscriptions": recent_subs
            },
            "message": "Mentor dashboard data fetched successfully"
        }
    except Exception as e:
        print("Error fetching mentor dashboard:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch mentor dashboard")


@router.put("/mentors/{id}")
@router.put("/mentor/{id}/profile")
async def update_mentor_profile(id: str, profile_data: dict):
    """Update mentor profile in MongoDB."""
    try:
        if not ObjectId.is_valid(id):
            raise HTTPException(status_code=400, detail="Invalid mentor ID")

        # Exclude sensitive/immutable fields
        clean_data = {k: v for k, v in profile_data.items() if k not in ["_id", "password", "email", "accepted"]}

        result = await db["mentors"].update_one(
            {"_id": ObjectId(id)},
            {"$set": clean_data}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Mentor not found")

        updated = await db["mentors"].find_one({"_id": ObjectId(id)}, {"password": 0})
        updated["_id"] = str(updated["_id"])
        if updated.get("profilePic"):
            updated["profilePic"] = base64.b64encode(updated["profilePic"]).decode("utf-8")

        return {"data": updated, "message": "Mentor profile updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print("Error updating mentor profile:", e)
        raise HTTPException(status_code=500, detail="Failed to update mentor profile")


@router.get("/mentor/{id}/mentees")
async def get_mentor_mentees(id: str):
    """Fetch active community members, pending applications, and platform mentees."""
    try:
        mentor_filter = [{"mentor_id": id}, {"mentor_id": str(id)}]
        if ObjectId.is_valid(id):
            mentor_filter.append({"mentor_id": ObjectId(id)})

        # 1. Fetch active subscriptions for this mentor
        subs = await db["subscriptions"].find({
            "$and": [{"$or": mentor_filter}, {"status": "active"}]
        }).sort("created_at", -1).to_list(100)

        mentees_list = []
        enrolled_emails = set()

        for s in subs:
            s["_id"] = str(s["_id"])
            m_email = s.get("mentee_email")
            if m_email:
                enrolled_emails.add(m_email.lower())

            # Enrich with profile from users collection if available
            u_doc = None
            if s.get("mentee_id") and ObjectId.is_valid(s["mentee_id"]):
                u_doc = await db["users"].find_one({"_id": ObjectId(s["mentee_id"])}, {"password": 0})
            if not u_doc and m_email:
                u_doc = await db["users"].find_one({"email": m_email}, {"password": 0})

            name = (u_doc.get("username") or u_doc.get("userName") if u_doc else None) or s.get("mentee_name") or "Community Member"
            initials = "".join([w[0] for w in name.split()][:2]).upper() or "M"

            mentees_list.append({
                "subscription_id": s["_id"],
                "mentee_id": str(u_doc["_id"]) if u_doc and "_id" in u_doc else s.get("mentee_id"),
                "name": name,
                "initials": initials,
                "email": m_email,
                "community": s.get("community_name") or "Mentorship Community",
                "joined": s.get("start_date") or "Recently",
                "status": "active",
                "phone": u_doc.get("phone", "") if u_doc else "",
                "bio": u_doc.get("bio", "") if u_doc else "",
                "skills": u_doc.get("skills", "") if u_doc else "",
                "education": u_doc.get("education", "") if u_doc else "",
                "experience": u_doc.get("experience", "") if u_doc else "",
            })

        # 2. Fetch pending mentorship/community applications for this mentor
        apps = await db["mentorship_applications"].find({
            "$and": [{"$or": mentor_filter}, {"status": "pending"}]
        }).sort("created_at", -1).to_list(100)

        for a in apps:
            a_email = a.get("mentee_email", "")
            if a_email and a_email.lower() in enrolled_emails:
                continue
            if a_email:
                enrolled_emails.add(a_email.lower())

            created_str = "Recently"
            if isinstance(a.get("created_at"), datetime):
                created_str = a["created_at"].strftime("%d %b %Y")

            name = a.get("mentee_name") or "Mentee Applicant"
            initials = "".join([w[0] for w in name.split()][:2]).upper() or "M"

            mentees_list.append({
                "application_id": str(a["_id"]),
                "mentee_id": a.get("mentee_id"),
                "name": name,
                "initials": initials,
                "email": a_email,
                "community": a.get("community_name") or "Mentorship Community",
                "joined": created_str,
                "status": "pending",
                "message": a.get("message", ""),
                "plan": a.get("plan", "Community"),
            })

        # 3. Fetch pending subscriptions for this mentor's community
        pending_subs = await db["subscriptions"].find({
            "$and": [{"$or": mentor_filter}, {"status": "pending"}]
        }).sort("created_at", -1).to_list(100)

        for ps in pending_subs:
            p_email = ps.get("mentee_email", "")
            if p_email and p_email.lower() in enrolled_emails:
                continue
            if p_email:
                enrolled_emails.add(p_email.lower())

            created_str = "Recently"
            if isinstance(ps.get("created_at"), datetime):
                created_str = ps["created_at"].strftime("%d %b %Y")

            p_name = ps.get("mentee_name") or "Community Applicant"
            initials = "".join([w[0] for w in p_name.split()][:2]).upper() or "M"

            mentees_list.append({
                "subscription_id": str(ps["_id"]),
                "mentee_id": ps.get("mentee_id"),
                "name": p_name,
                "initials": initials,
                "email": p_email,
                "community": ps.get("community_name") or "Mentorship Community",
                "joined": created_str,
                "status": "pending",
                "message": "Requested to join community",
                "plan": "Community",
            })

        # 3. If there are registered platform users not yet enrolled, show them so mentor can accept them
        users = await db["users"].find({"email": {"$nin": list(enrolled_emails)}}, {"password": 0}).to_list(30)
        for u in users:
            u_email = u.get("email", "")
            u_name = u.get("username") or u.get("userName") or "Registered Mentee"
            initials = "".join([w[0] for w in u_name.split()][:2]).upper() or "M"
            created_str = "Recently"
            if isinstance(u.get("created_at"), datetime):
                created_str = u["created_at"].strftime("%d %b %Y")

            mentees_list.append({
                "mentee_id": str(u["_id"]),
                "name": u_name,
                "initials": initials,
                "email": u_email,
                "community": "Mentorship Community",
                "joined": created_str,
                "status": "pending_invite",
                "phone": u.get("phone", ""),
                "bio": u.get("bio", ""),
                "skills": u.get("skills", ""),
                "education": u.get("education", ""),
                "experience": u.get("experience", ""),
            })

        return {"data": mentees_list, "message": "Mentor mentees fetched successfully"}
    except Exception as e:
        print("Error fetching mentor mentees:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch mentees")


@router.post("/mentor/{id}/mentees/accept")
async def accept_mentee_to_community(id: str, payload: dict = Body(...)):
    """Mentor accepts a mentee to join their community."""
    try:
        mentee_id = payload.get("mentee_id")
        mentee_email = payload.get("mentee_email")
        mentee_name = payload.get("mentee_name")
        application_id = payload.get("application_id")
        subscription_id = payload.get("subscription_id")

        # Find mentor's community
        query = {"mentor_id": id}
        if ObjectId.is_valid(id):
            query = {"$or": [{"mentor_id": id}, {"mentor_id": ObjectId(id)}, {"_id": ObjectId(id)}]}
        comm = await db["communities"].find_one(query)
        if not comm:
            comm = await db["communities"].find_one({"mentor_id": str(id)})
        if not comm:
            mentor_doc = await db["mentors"].find_one({"_id": ObjectId(id)} if ObjectId.is_valid(id) else {"email": id})
            if mentor_doc:
                m_name = f"{mentor_doc.get('firstName', '')} {mentor_doc.get('lastName', '')}".strip()
                comm = await db["communities"].find_one({"mentor_name": m_name})

        if not comm:
            raise HTTPException(status_code=404, detail="Community not found for this mentor")

        # Check capacity
        capacity = comm.get("capacity", 30)
        current_members = comm.get("current_members", 0)
        if current_members >= capacity:
            raise HTTPException(
                status_code=400,
                detail=f"Community is at full capacity ({capacity} members). Please increase capacity in Community Settings to accept more members."
            )

        # Resolve mentee details from users collection if available
        user_doc = None
        if mentee_id and ObjectId.is_valid(mentee_id):
            user_doc = await db["users"].find_one({"_id": ObjectId(mentee_id)})
        if not user_doc and mentee_email:
            user_doc = await db["users"].find_one({"email": {"$regex": f"^{re.escape(mentee_email)}$", "$options": "i"}})

        if user_doc:
            mentee_id = str(user_doc["_id"])
            mentee_name = mentee_name or user_doc.get("username") or user_doc.get("userName") or "Mentee"
            mentee_email = mentee_email or user_doc.get("email")

        if not mentee_email:
            raise HTTPException(status_code=400, detail="Mentee email is required")

        # Check if already active
        existing_sub = await db["subscriptions"].find_one({
            "community_id": str(comm["_id"]),
            "$or": [
                {"mentee_email": mentee_email},
                {"mentee_email": {"$regex": f"^{re.escape(mentee_email)}$", "$options": "i"}},
                {"mentee_id": mentee_id}
            ],
            "status": "active"
        })

        if existing_sub:
            existing_sub["_id"] = str(existing_sub["_id"])
            return {"data": existing_sub, "message": "Mentee is already an active member of this community"}

        now = datetime.utcnow()

        # Check if there is a pending subscription to activate
        pending_sub_query = {
            "community_id": str(comm["_id"]),
            "$or": [
                {"mentee_email": mentee_email},
                {"mentee_email": {"$regex": f"^{re.escape(mentee_email)}$", "$options": "i"}},
                {"mentee_id": mentee_id}
            ],
            "status": "pending"
        }
        if subscription_id and ObjectId.is_valid(subscription_id):
            pending_sub_query = {"_id": ObjectId(subscription_id)}

        pending_sub = await db["subscriptions"].find_one(pending_sub_query)
        if pending_sub:
            await db["subscriptions"].update_one(
                {"_id": pending_sub["_id"]},
                {"$set": {
                    "status": "active",
                    "mentee_id": mentee_id,
                    "mentee_name": mentee_name,
                    "mentee_email": mentee_email,
                    "mentor_id": str(id),
                    "mentor_name": comm.get("mentor_name", "Mentor"),
                    "community_name": comm.get("name", "Mentorship Community"),
                    "updated_at": now
                }}
            )
            sub_doc = pending_sub
            sub_doc["status"] = "active"
            sub_doc["_id"] = str(sub_doc["_id"])
        else:
            sub_doc = {
                "mentee_id": mentee_id or mentee_email,
                "mentee_name": mentee_name or "Mentee",
                "mentee_email": mentee_email,
                "mentor_id": str(id),
                "mentor_name": comm.get("mentor_name", "Mentor"),
                "community_id": str(comm["_id"]),
                "community_name": comm.get("name", "Mentorship Community"),
                "payment_id": f"ACCEPT_{secrets.token_hex(6).upper()}",
                "amount": 0,
                "start_date": now.strftime("%d %b %Y"),
                "end_date": (now + timedelta(days=365)).strftime("%d %b %Y"),
                "status": "active",
                "created_at": now
            }
            sub_result = await db["subscriptions"].insert_one(sub_doc)
            sub_doc["_id"] = str(sub_result.inserted_id)

        # Increment community member count
        new_count = current_members + 1
        update_dict = {"current_members": new_count}
        if new_count >= capacity:
            update_dict["status"] = "full"
        await db["communities"].update_one({"_id": comm["_id"]}, {"$set": update_dict})

        # Update application status if application exists
        if application_id and ObjectId.is_valid(application_id):
            await db["mentorship_applications"].update_one(
                {"_id": ObjectId(application_id)},
                {"$set": {"status": "accepted", "accepted_at": now}}
            )
        elif mentee_email:
            await db["mentorship_applications"].update_many(
                {
                    "$or": [{"mentor_id": id}, {"mentor_id": str(comm.get("mentor_id"))}],
                    "mentee_email": {"$regex": f"^{re.escape(mentee_email)}$", "$options": "i"},
                    "status": "pending"
                },
                {"$set": {"status": "accepted", "accepted_at": now}}
            )

        # Send notification to mentee
        await db["notifications"].insert_one({
            "recipient_id": mentee_id,
            "recipient_email": mentee_email,
            "title": "Accepted to Community! 🎉",
            "message": f"Congratulations! Mentor {comm.get('mentor_name')} has accepted your request to join {comm.get('name')}.",
            "type": "community_accepted",
            "created_at": now
        })

        return {"data": sub_doc, "message": f"{mentee_name} has been accepted into your community!"}
    except HTTPException:
        raise
    except Exception as e:
        print("Error accepting mentee to community:", e)
        raise HTTPException(status_code=500, detail="Failed to accept mentee to community")


@router.post("/mentorship/apply")
async def apply_for_mentorship(payload: dict = Body(...)):
    """Mentee submits an application to join a mentor's community / mentorship program."""
    try:
        mentor_id = str(payload.get("mentor_id"))
        mentee_name = payload.get("mentee_name") or "Applicant"
        mentee_email = payload.get("mentee_email")
        plan = payload.get("plan", "standard")
        message = payload.get("message", "")
        preferred_timing = payload.get("preferred_timing", "")

        mentor = None
        if ObjectId.is_valid(mentor_id):
            mentor = await db["mentors"].find_one({"_id": ObjectId(mentor_id)})
        if not mentor:
            mentor = await db["mentors"].find_one({"email": mentor_id})

        comm = await db["communities"].find_one({"mentor_id": mentor_id})
        if not comm and mentor:
            comm = await db["communities"].find_one({
                "mentor_name": f"{mentor.get('firstName', '')} {mentor.get('lastName', '')}".strip()
            })

        app_doc = {
            "mentor_id": mentor_id,
            "mentor_name": f"{mentor.get('firstName', '')} {mentor.get('lastName', '')}".strip() if mentor else "Mentor",
            "community_id": str(comm["_id"]) if comm else None,
            "community_name": comm.get("name") if comm else "Mentorship Community",
            "mentee_name": mentee_name,
            "mentee_email": mentee_email,
            "plan": plan,
            "message": message,
            "preferred_timing": preferred_timing,
            "status": "pending",
            "created_at": datetime.utcnow()
        }
        res = await db["mentorship_applications"].insert_one(app_doc)
        app_doc["_id"] = str(res.inserted_id)

        # Notification for mentor
        await db["notifications"].insert_one({
            "recipient_id": mentor_id,
            "title": "New Mentee Application",
            "message": f"{mentee_name} has requested to join your mentorship community!",
            "type": "mentorship_application",
            "created_at": datetime.utcnow()
        })

        return {"data": app_doc, "message": "Application submitted successfully"}
    except Exception as e:
        print("Error submitting mentorship application:", e)
        raise HTTPException(status_code=500, detail="Failed to submit application")



@router.get("/mentor/{id}/earnings")
async def get_mentor_earnings(id: str):
    """Fetch payments and financial records for a mentor."""
    try:
        payments = await db["payments"].find({
            "mentor_id": id
        }).sort("created_at", -1).to_list(200)

        for p in payments:
            p["_id"] = str(p["_id"])
            if "created_at" in p and isinstance(p["created_at"], datetime):
                p["created_at"] = p["created_at"].isoformat()

        total_revenue = sum(p.get("amount", 0) for p in payments if p.get("status") == "success")

        return {
            "data": {
                "total_earnings": total_revenue,
                "payments_count": len(payments),
                "transactions": payments
            },
            "message": "Mentor earnings fetched successfully"
        }
    except Exception as e:
        print("Error fetching mentor earnings:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch earnings")


@router.get("/mentor/{id}/reviews")
async def get_mentor_reviews(id: str):
    """Fetch all reviews for a mentor."""
    try:
        reviews = await db["reviews"].find({
            "mentor_id": id
        }).sort("created_at", -1).to_list(200)

        for r in reviews:
            r["_id"] = str(r["_id"])
            if "created_at" in r and isinstance(r["created_at"], datetime):
                r["created_at"] = r["created_at"].isoformat()

        avg_rating = 5.0
        if reviews:
            avg_rating = round(sum(r.get("rating", 5) for r in reviews) / len(reviews), 1)

        return {
            "data": {
                "reviews": reviews,
                "total_reviews": len(reviews),
                "average_rating": avg_rating
            },
            "message": "Mentor reviews fetched successfully"
        }
    except Exception as e:
        print("Error fetching mentor reviews:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch reviews")


@router.get("/mentor/{id}/sessions")
async def get_mentor_sessions_list(id: str):
    """Fetch all scheduled, live, and upcoming sessions for a mentor."""
    try:
        mentor = None
        if ObjectId.is_valid(id):
            mentor = await db["mentors"].find_one({"_id": ObjectId(id)})
        if not mentor:
            mentor = await db["mentors"].find_one({"email": id})
        mentor_id_str = str(mentor["_id"]) if mentor else id
        mentor_email = mentor.get("email") if mentor else (id if "@" in id else None)

        mentor_or = [{"mentor_id": mentor_id_str}]
        if ObjectId.is_valid(mentor_id_str):
            mentor_or.append({"mentor_id": ObjectId(mentor_id_str)})
        if mentor_email:
            mentor_or.append({"mentor_email": mentor_email})

        sessions = await db["sessions"].find({"$or": mentor_or}).sort("created_at", -1).to_list(100)
        for s in sessions:
            s["_id"] = str(s["_id"])
            if "created_at" in s and isinstance(s["created_at"], datetime):
                s["created_at"] = s["created_at"].isoformat()
        return {"data": sessions, "message": "Mentor sessions fetched successfully"}
    except Exception as e:
        print("Error fetching mentor sessions:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch sessions")


@router.get("/mentor/{id}/community")
async def get_mentor_community_details(id: str):
    """Fetch or generate active community workspace for a mentor."""
    try:
        query = {"mentor_id": id}
        comm = await db["communities"].find_one(query)
        if not comm and ObjectId.is_valid(id):
            comm = await db["communities"].find_one({"_id": ObjectId(id)})

        if not comm:
            mentor = await db["mentors"].find_one(
                {"$or": [{"_id": ObjectId(id)}, {"_id": id}, {"email": id}]} if ObjectId.is_valid(id) else {"email": id}
            )
            if mentor:
                m_name = f"{mentor.get('firstName', '')} {mentor.get('lastName', '')}".strip()
                comm = await db["communities"].find_one({"mentor_name": m_name})
                if not comm:
                    # Auto-provision initial community workspace for verified mentor
                    comm_doc = {
                        "name": f"{m_name}'s Mentorship Community",
                        "description": mentor.get("bio") or "Official mentorship community for live sessions, code reviews, and career guidance.",
                        "mentor_id": str(mentor["_id"]),
                        "mentor_name": m_name,
                        "mentor_role": mentor.get("jobTitle", "Mentor"),
                        "category": mentor.get("category", "Software Development"),
                        "monthly_fee": mentor.get("monthly_fee", 499),
                        "capacity": 30,
                        "current_members": 0,
                        "status": "active",
                        "created_at": datetime.utcnow()
                    }
                    new_comm = await db["communities"].insert_one(comm_doc)
                    comm_doc["_id"] = str(new_comm.inserted_id)
                    comm = comm_doc

        if comm:
            comm["_id"] = str(comm["_id"])
            if "created_at" in comm and isinstance(comm["created_at"], datetime):
                comm["created_at"] = comm["created_at"].isoformat()

            # Include only real subscribed members with enriched profile data from users collection
            comm_id_str = str(comm["_id"])
            comm_or = [{"community_id": comm_id_str}]
            if ObjectId.is_valid(comm_id_str):
                comm_or.append({"community_id": ObjectId(comm_id_str)})
            if comm.get("mentor_id"):
                comm_or.append({"mentor_id": str(comm["mentor_id"])})
                if ObjectId.is_valid(str(comm["mentor_id"])):
                    comm_or.append({"mentor_id": ObjectId(str(comm["mentor_id"]))})

            subs = await db["subscriptions"].find({
                "$and": [{"$or": comm_or}, {"status": "active"}]
            }).to_list(100)

            members_list = []
            seen_emails = set()
            for s in subs:
                m_email = s.get("mentee_email", "")
                m_id = str(s.get("mentee_id", ""))
                dedup_key = m_email.lower() if m_email else m_id
                if dedup_key in seen_emails:
                    continue
                seen_emails.add(dedup_key)

                user_doc = None
                if ObjectId.is_valid(m_id):
                    user_doc = await db["users"].find_one({"_id": ObjectId(m_id)}, {"password": 0})
                if not user_doc and m_email:
                    user_doc = await db["users"].find_one({"email": m_email}, {"password": 0})

                m_name = (user_doc.get("username") or user_doc.get("userName") if user_doc else None) or s.get("mentee_name") or "Member"
                initials = "".join([w[0] for w in m_name.split()][:2]).upper() or "M"

                prof_pic = None
                if user_doc and user_doc.get("profilePic"):
                    if isinstance(user_doc["profilePic"], bytes):
                        prof_pic = base64.b64encode(user_doc["profilePic"]).decode("utf-8")
                    elif isinstance(user_doc["profilePic"], str):
                        prof_pic = user_doc["profilePic"]

                members_list.append({
                    "mentee_id": str(user_doc["_id"]) if user_doc and "_id" in user_doc else m_id,
                    "name": m_name,
                    "email": m_email,
                    "initials": initials,
                    "phone": user_doc.get("phone", "") if user_doc else "",
                    "bio": user_doc.get("bio", "Community Member") if user_doc else "Community Member",
                    "jobTitle": user_doc.get("jobTitle", "Student / Aspiring Developer") if user_doc else "Student / Aspiring Developer",
                    "skills": user_doc.get("skills", "") if user_doc else "",
                    "education": user_doc.get("education", "") if user_doc else "",
                    "experience": user_doc.get("experience", "") if user_doc else "",
                    "interests": user_doc.get("interests", "") if user_doc else "",
                    "social_links": user_doc.get("social_links", "") if user_doc else "",
                    "location": user_doc.get("location", "") if user_doc else "",
                    "profilePic": prof_pic,
                    "profilePicType": user_doc.get("profilePicType", "image/png") if user_doc else "image/png",
                    "joined": s.get("start_date", "Active")
                })

            comm["members"] = members_list
            comm["current_members"] = len(members_list)
            # Synchronize count in DB if needed
            await db["communities"].update_one(
                {"_id": ObjectId(comm["_id"]) if ObjectId.is_valid(comm["_id"]) else comm["_id"]},
                {"$set": {"current_members": len(members_list)}}
            )

        return {"data": comm, "message": "Mentor community fetched successfully"}
    except Exception as e:
        print("Error fetching mentor community:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch community")


@router.put("/mentor/{id}/community")
async def update_mentor_community(id: str, payload: dict):
    """Update mentor's community settings (name, description, monthly_fee, capacity, etc.)."""
    try:
        query = {"mentor_id": id}
        if ObjectId.is_valid(id):
            query = {"$or": [{"mentor_id": id}, {"mentor_id": ObjectId(id)}, {"_id": ObjectId(id)}]}
        comm = await db["communities"].find_one(query)
        if not comm:
            comm = await db["communities"].find_one({"mentor_id": str(id)})

        if not comm:
            raise HTTPException(status_code=404, detail="Community not found")

        update_fields = {}
        for k in ["name", "description", "category", "monthly_fee", "capacity", "rules", "status"]:
            if k in payload and payload[k] is not None:
                update_fields[k] = payload[k]

        update_fields["updated_at"] = datetime.utcnow()
        await db["communities"].update_one({"_id": comm["_id"]}, {"$set": update_fields})
        updated = await db["communities"].find_one({"_id": comm["_id"]})
        updated["_id"] = str(updated["_id"])
        return {"data": updated, "message": "Community settings updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print("Error updating mentor community:", e)
        raise HTTPException(status_code=500, detail="Failed to update community")


@router.post("/mentor/{id}/community/kick")
async def mentor_kick_community_member(id: str, kick_data: dict):
    """Mentor kicks out a member from their community, decrements capacity and notifies the member."""
    try:
        member_email = kick_data.get("member_email")
        member_id = kick_data.get("member_id")
        if not member_email and not member_id:
            raise HTTPException(status_code=400, detail="Member email or ID is required")

        query = {"mentor_id": id}
        if ObjectId.is_valid(id):
            query = {"$or": [{"mentor_id": id}, {"mentor_id": ObjectId(id)}, {"_id": ObjectId(id)}]}
        comm = await db["communities"].find_one(query)
        comm_id = str(comm["_id"]) if comm else None

        sub_query = {}
        if comm_id:
            sub_query["community_id"] = comm_id
        or_conds = []
        if member_email:
            or_conds.append({"mentee_email": member_email})
        if member_id:
            or_conds.append({"mentee_id": member_id})
        sub_query["$or"] = or_conds

        await db["subscriptions"].delete_many(sub_query)
        if comm:
            await db["subscriptions"].delete_many({
                "mentor_id": str(comm.get("mentor_id")),
                "$or": or_conds
            })

            curr = comm.get("current_members", 0)
            new_count = max(0, curr - 1)
            await db["communities"].update_one(
                {"_id": comm["_id"]},
                {"$set": {"current_members": new_count, "status": "active"}}
            )

        # Send notification to mentee
        await db["notifications"].insert_one({
            "recipient_id": member_id or member_email,
            "recipient_email": member_email,
            "role": "mentee",
            "title": "Community Membership Notice",
            "message": f"You have been removed from the community by the mentor.",
            "type": "kick_out",
            "read": False,
            "created_at": datetime.utcnow()
        })

        return {
            "message": f"Member {member_email or member_id} was kicked out of the community.",
            "status": "success"
        }
    except HTTPException:
        raise
    except Exception as e:
        print("Error kicking member:", e)
        raise HTTPException(status_code=500, detail="Failed to kick member")
