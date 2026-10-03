from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from datetime import datetime
import re
from app.database import db

router = APIRouter(tags=["Mentees"])



# =====================================================
# GET ALL MENTEES
# =====================================================

@router.get("/mentees")
async def get_mentees():

    try:

        # TEMPORARILY FETCH ALL USERS
        # because your existing users may not have
        # a "role": "mentee" field yet.

        mentees = await db["users"].find(
            {},
            {
                "password": 0
            }
        ).to_list(length=100)

        # Convert ObjectId to string
        for mentee in mentees:
            if "_id" in mentee:
                mentee["_id"] = str(
                    mentee["_id"]
                )

        print(
            "Mentees fetched:",
            len(mentees)
        )

        return {
            "data": mentees,
            "message": "Successfully fetched mentees"
        }

    except Exception as e:

        print(
            "Error fetching mentees:",
            e
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch mentees"
        )


# =====================================================
# GET SINGLE MENTEE (FOR ADMIN & PROFILE)
# =====================================================

@router.get("/mentees/{mentee_id}")
async def get_single_mentee(mentee_id: str):
    try:
        query = {}
        if ObjectId.is_valid(mentee_id):
            query = {"$or": [{"_id": ObjectId(mentee_id)}, {"_id": mentee_id}, {"email": mentee_id}]}
        else:
            query = {"$or": [{"_id": mentee_id}, {"email": mentee_id}]}

        user = await db["users"].find_one(query, {"password": 0})
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mentee not found")

        user["_id"] = str(user["_id"])
        return {"data": user, "message": "Successfully fetched mentee profile"}
    except HTTPException:
        raise
    except Exception as e:
        print("Error fetching single mentee:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch mentee profile")


# =====================================================
# BLOCK MENTEE
# =====================================================

@router.post("/mentees/{mentee_id}/block")
async def block_mentee(
    mentee_id: str
):

    try:

        # Validate ObjectId

        if not ObjectId.is_valid(
            mentee_id
        ):

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid mentee ID"
            )

        # Update user status

        result = await db["users"].update_one(
            {
                "_id": ObjectId(
                    mentee_id
                )
            },
            {
                "$set": {
                    "status": "blocked"
                }
            }
        )

        # User not found

        if result.matched_count == 0:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mentee not found"
            )

        return {
            "message": "Mentee blocked successfully"
        }

    except HTTPException:
        raise

    except Exception as e:

        print(
            "Error blocking mentee:",
            e
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to block mentee"
        )


# =====================================================
# UNBLOCK MENTEE
# =====================================================

@router.post("/mentees/{mentee_id}/unblock")
async def unblock_mentee(
    mentee_id: str
):

    try:

        # Validate ObjectId

        if not ObjectId.is_valid(
            mentee_id
        ):

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid mentee ID"
            )

        # Update user status

        result = await db["users"].update_one(
            {
                "_id": ObjectId(
                    mentee_id
                )
            },
            {
                "$set": {
                    "status": "active"
                }
            }
        )

        # User not found

        if result.matched_count == 0:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mentee not found"
            )

        return {
            "message": "Mentee unblocked successfully"
        }

    except HTTPException:
        raise

    except Exception as e:
        print("Error unblocking mentee:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unblock mentee"
        )


# =====================================================
# MENTEE PROFILE & DASHBOARD
# =====================================================

@router.get("/mentee/profile/{id}")
async def get_mentee_profile(id: str):
    """Fetch complete mentee profile by ID or email."""
    try:
        query = {}
        if ObjectId.is_valid(id):
            query = {"_id": ObjectId(id)}
        else:
            query = {"email": id}

        user = await db["users"].find_one(query, {"password": 0})
        if not user:
            raise HTTPException(status_code=404, detail="Mentee profile not found")

        user["_id"] = str(user["_id"])
        return {"data": user, "message": "Mentee profile fetched successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print("Error fetching mentee profile:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch profile")


@router.put("/mentee/profile/{id}")
async def update_mentee_profile(id: str, profile_data: dict):
    """Update mentee profile in MongoDB."""
    try:
        query = {}
        if ObjectId.is_valid(id):
            query = {"_id": ObjectId(id)}
        else:
            query = {"email": id}

        # Prevent updating sensitive fields directly
        update_fields = {k: v for k, v in profile_data.items() if k not in ["_id", "password", "email", "role"]}
        update_fields["updated_at"] = datetime.utcnow()

        result = await db["users"].update_one(query, {"$set": update_fields})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Mentee not found")

        updated_user = await db["users"].find_one(query, {"password": 0})
        updated_user["_id"] = str(updated_user["_id"])
        return {"data": updated_user, "message": "Profile updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print("Error updating profile:", e)
        raise HTTPException(status_code=500, detail="Failed to update profile")


@router.get("/mentee/{id}/dashboard")
async def get_mentee_dashboard(id: str, email: str | None = None, user_id: str | None = None):
    """Fetch real-time dashboard data for a mentee: subscribed communities, upcoming sessions, notifications."""
    try:
        id_list = [id]
        if email:
            id_list.append(email)
            id_list.append(email.lower())
        if user_id and user_id not in id_list:
            id_list.append(user_id)

        # Resolve user doc from users collection
        user_doc = None
        if ObjectId.is_valid(id):
            user_doc = await db["users"].find_one({"_id": ObjectId(id)})
        elif user_id and ObjectId.is_valid(user_id):
            user_doc = await db["users"].find_one({"_id": ObjectId(user_id)})
        elif "@" in id:
            user_doc = await db["users"].find_one({"email": {"$regex": f"^{re.escape(id)}$", "$options": "i"}})
        elif email:
            user_doc = await db["users"].find_one({"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}})

        if user_doc:
            id_list.append(str(user_doc["_id"]))
            if user_doc.get("email"):
                id_list.append(user_doc["email"])
                id_list.append(user_doc["email"].lower())

        sub_or = [
            {"mentee_id": {"$in": id_list}},
            {"mentee_email": {"$in": id_list}}
        ]
        target_email = email or (user_doc.get("email") if user_doc else None) or (id if "@" in id else None)
        if target_email:
            sub_or.append({"mentee_email": {"$regex": f"^{re.escape(target_email)}$", "$options": "i"}})

        subs = await db["subscriptions"].find({
            "$or": sub_or,
            "status": "active"
        }).to_list(100)

        for s in subs:
            s["_id"] = str(s["_id"])
            # Enrich with community details if needed
            comm_id = s.get("community_id")
            if comm_id and ObjectId.is_valid(comm_id):
                comm_doc = await db["communities"].find_one({"_id": ObjectId(comm_id)})
                if comm_doc:
                    if not s.get("community_name") or s.get("community_name") == "Mentorship Community":
                        s["community_name"] = comm_doc.get("name", s.get("community_name"))
                    if not s.get("category"):
                        s["category"] = comm_doc.get("category", "General")
                    if not s.get("mentor_name"):
                        s["mentor_name"] = comm_doc.get("mentor_name", "Mentor")
                    if not s.get("mentor_id"):
                        s["mentor_id"] = str(comm_doc.get("mentor_id", ""))

        community_ids = [s.get("community_id") for s in subs if s.get("community_id")]

        # Upcoming sessions for those communities
        sessions_query = {}
        if community_ids:
            sessions_query = {
                "$or": [
                    {"community_id": {"$in": community_ids}},
                    {"attendees.email": id}
                ],
                "status": {"$in": ["upcoming", "live"]}
            }
        else:
            sessions_query = {
                "attendees.email": id,
                "status": {"$in": ["upcoming", "live"]}
            }

        sessions = await db["sessions"].find(sessions_query).sort("created_at", -1).to_list(10)
        for sess in sessions:
            sess["_id"] = str(sess["_id"])

        # Notifications
        notifs = await db["notifications"].find({
            "$or": [{"recipient_id": id}, {"recipient_email": id}]
        }).sort("created_at", -1).to_list(10)

        for n in notifs:
            n["_id"] = str(n["_id"])

        user_info = None
        if user_doc:
            user_info = {
                "id": str(user_doc["_id"]),
                "name": user_doc.get("name") or user_doc.get("userName") or user_doc.get("username") or "",
                "username": user_doc.get("userName") or user_doc.get("username") or "",
                "userName": user_doc.get("userName") or user_doc.get("username") or "",
                "email": user_doc.get("email", "")
            }

        return {
            "data": {
                "user": user_info,
                "joined_communities_count": len(subs),
                "communities": subs,
                "upcoming_sessions_count": len(sessions),
                "sessions": sessions,
                "notifications": notifs,
                "unread_notifications": len([n for n in notifs if not n.get("read", False)])
            },
            "message": "Mentee dashboard data fetched successfully"
        }
    except Exception as e:
        print("Error fetching mentee dashboard:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard")


@router.get("/mentee/{id}/communities")
async def get_mentee_communities(id: str):
    """Fetch communities that the mentee is actively subscribed to."""
    try:
        subs = await db["subscriptions"].find({
            "$or": [{"mentee_id": id}, {"mentee_email": id}],
            "status": "active"
        }).to_list(100)

        community_ids = [ObjectId(s["community_id"]) for s in subs if ObjectId.is_valid(s.get("community_id"))]
        communities = []
        if community_ids:
            communities = await db["communities"].find({"_id": {"$in": community_ids}}).to_list(100)
            for c in communities:
                c["_id"] = str(c["_id"])

        return {"data": communities, "message": "Subscribed communities fetched"}
    except Exception as e:
        print("Error fetching mentee communities:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch communities")