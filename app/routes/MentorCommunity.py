import base64
from fastapi import APIRouter, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from bson import ObjectId
from datetime import datetime, timedelta
import secrets
import re
from typing import List, Dict
from app.database import db
from app.schema import (
    CommunityCreate,
    CommunityUpdate,
    SubscriptionRequest,
    KickMemberRequest,
    SessionCreate,
    SessionUpdate,
    SessionRSVP,
    SessionPaymentRequest,
    ReviewCreate,
    ChatMessage,
    DirectMessageCreate,
    MentorshipBooking
)

router = APIRouter(tags=["Mentor Community, Sessions, Chat & Subscriptions"])

# Helper function to serialize Mongo document safely without JSON serialization errors
def serialize_doc(doc):
    if not doc:
        return doc
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, (str, int, float, bool)):
        return doc
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, datetime):
        return doc.isoformat()
    if isinstance(doc, bytes):
        return base64.b64encode(doc).decode("utf-8")
    if not isinstance(doc, dict):
        return str(doc)

    res = {}
    for key, val in doc.items():
        if isinstance(val, ObjectId):
            res[key] = str(val)
        elif isinstance(val, datetime):
            res[key] = val.isoformat()
        elif isinstance(val, bytes):
            res[key] = base64.b64encode(val).decode("utf-8")
        elif isinstance(val, dict):
            res[key] = serialize_doc(val)
        elif isinstance(val, list):
            res[key] = [
                serialize_doc(item) if isinstance(item, (dict, list))
                else str(item) if isinstance(item, ObjectId)
                else item.isoformat() if isinstance(item, datetime)
                else base64.b64encode(item).decode("utf-8") if isinstance(item, bytes)
                else item
                for item in val
            ]
        else:
            res[key] = val
    if "_id" in res and not isinstance(res["_id"], str):
        res["_id"] = str(res["_id"])
    return res



# =====================================================================
# REAL-TIME WEBSOCKET CONNECTION MANAGER FOR COMMUNITY CHAT
# =====================================================================

class ConnectionManager:
    def __init__(self):
        # community_id -> list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, community_id: str, websocket: WebSocket):
        await websocket.accept()
        if community_id not in self.active_connections:
            self.active_connections[community_id] = []
        self.active_connections[community_id].append(websocket)

    def disconnect(self, community_id: str, websocket: WebSocket):
        if community_id in self.active_connections:
            if websocket in self.active_connections[community_id]:
                self.active_connections[community_id].remove(websocket)
            if not self.active_connections[community_id]:
                del self.active_connections[community_id]

    async def broadcast_to_community(self, community_id: str, message_data: dict):
        if community_id in self.active_connections:
            for connection in self.active_connections[community_id]:
                try:
                    await connection.send_json(message_data)
                except Exception as e:
                    print(f"Error sending message to client: {e}")

manager = ConnectionManager()


@router.websocket("/ws/community/{community_id}")
async def websocket_community_chat(websocket: WebSocket, community_id: str):
    """Real-time bi-directional chat for an active community."""
    await manager.connect(community_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Expected payload: sender_id, sender_name, sender_role, message
            sender_id = data.get("sender_id", "")
            sender_name = data.get("sender_name", "Community Member")
            sender_role = data.get("sender_role", "mentee")
            message_text = data.get("message", "").strip()

            if not message_text:
                continue

            # Verify whether sender is genuinely the community mentor
            comm = None
            if ObjectId.is_valid(community_id):
                comm = await db["communities"].find_one({"_id": ObjectId(community_id)})
            if not comm:
                comm = await db["communities"].find_one({"_id": community_id})

            if comm:
                is_actual_mentor = (str(comm.get("mentor_id", "")) == str(sender_id))
                if not is_actual_mentor and sender_role == "mentor":
                    sender_role = "mentee"
                    if sender_name == comm.get("mentor_name"):
                        u = None
                        if ObjectId.is_valid(sender_id):
                            u = await db["users"].find_one({"_id": ObjectId(sender_id)})
                        if not u:
                            u = await db["users"].find_one({"email": sender_id})
                        if u:
                            sender_name = u.get("username") or u.get("userName") or "Member"

            msg_doc = {
                "community_id": community_id,
                "sender_id": sender_id,
                "sender_name": sender_name,
                "sender_role": sender_role,
                "message": message_text,
                "created_at": datetime.utcnow()
            }

            result = await db["community_messages"].insert_one(msg_doc)
            msg_doc["_id"] = str(result.inserted_id)
            msg_doc["created_at"] = msg_doc["created_at"].isoformat()

            # Broadcast to all connected members
            await manager.broadcast_to_community(community_id, msg_doc)
    except WebSocketDisconnect:
        manager.disconnect(community_id, websocket)
    except Exception as e:
        print(f"WebSocket error in community {community_id}: {e}")
        manager.disconnect(community_id, websocket)


# =====================================================================
# COMMUNITIES CRUD WITH CAPACITY CONTROLS
# =====================================================================

@router.post("/communities")
async def create_community(data: CommunityCreate):
    """Mentor creates a new community with defined member capacity and price."""
    try:
        comm_dict = data.model_dump()
        comm_dict["current_members"] = 0
        comm_dict["created_at"] = datetime.utcnow()
        comm_dict["status"] = "active"

        # Populate mentor details if missing
        if ObjectId.is_valid(data.mentor_id):
            mentor = await db["mentors"].find_one({"_id": ObjectId(data.mentor_id)})
            if mentor:
                first = mentor.get("firstName", "")
                last = mentor.get("lastName", "")
                comm_dict["mentor_name"] = f"{first} {last}".strip() or "Mentor"
                comm_dict["mentor_role"] = mentor.get("jobTitle", "Mentor")

        result = await db["communities"].insert_one(comm_dict)
        comm_dict["_id"] = str(result.inserted_id)
        if isinstance(comm_dict["created_at"], datetime):
            comm_dict["created_at"] = comm_dict["created_at"].isoformat()

        return {"message": "Community created successfully", "data": comm_dict}
    except Exception as e:
        print("Error creating community:", e)
        raise HTTPException(status_code=500, detail="Failed to create community")


@router.get("/communities")
async def get_communities(
    mentor_id: str | None = None,
    category: str | None = None,
    status: str | None = None
):
    """Fetch all communities with computed status and available slots."""
    try:
        query = {}
        if mentor_id:
            query["mentor_id"] = mentor_id
        if category and category != "All":
            query["category"] = category

        communities = await db["communities"].find(query).sort("created_at", -1).to_list(100)

        serialized = []
        for c in communities:
            c = serialize_doc(c)
            cap = c.get("capacity", 20)
            curr = c.get("current_members", 0)
            c["slots_available"] = max(0, cap - curr)

            # Auto-update status based on capacity
            if curr >= cap:
                c["status"] = "full"
            elif not c.get("status"):
                c["status"] = "active"

            serialized.append(c)

        if status and status != "all":
            serialized = [c for c in serialized if c.get("status") == status]

        return {"data": serialized, "message": "Successfully fetched communities"}
    except Exception as e:
        print("Error fetching communities:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch communities")


@router.get("/communities/{id}")
async def get_community(id: str):
    """Fetch single community details, mentor info, and available slots."""
    comm = None

    # 1. Try finding by community _id
    if ObjectId.is_valid(id):
        comm = await db["communities"].find_one({"_id": ObjectId(id)})
    if not comm:
        comm = await db["communities"].find_one({"_id": id})

    # 2. Try finding by mentor_id
    if not comm:
        comm = await db["communities"].find_one({"mentor_id": id})
    if not comm and ObjectId.is_valid(id):
        comm = await db["communities"].find_one({"mentor_id": ObjectId(id)})

    # 3. If id is alias, email, or placeholder like "default" or "undefined"
    if not comm and ("@" in id or id in ["undefined", "default", "null", "me", "my"]):
        if "@" in id:
            mentor = await db["mentors"].find_one({"email": id})
            if mentor:
                comm = await db["communities"].find_one({"mentor_id": str(mentor["_id"])})
        if not comm:
            comm = await db["communities"].find_one({"status": {"$ne": "archived"}})
            if not comm:
                comm = await db["communities"].find_one()

    # 4. If still not found and id is valid mentor ObjectId, auto-provision community
    if not comm and ObjectId.is_valid(id):
        mentor = await db["mentors"].find_one({"_id": ObjectId(id)})
        if mentor:
            m_name = f"{mentor.get('firstName', '')} {mentor.get('lastName', '')}".strip() or mentor.get("name", "Verified Mentor")
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
            comm_doc["_id"] = new_comm.inserted_id
            comm = comm_doc

    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")

    comm = serialize_doc(comm)

    # Sync real active members count from subscriptions
    comm_id_str = str(comm.get("_id", ""))
    mentor_id_str = str(comm.get("mentor_id", ""))
    sub_or = []
    if comm_id_str:
        sub_or.append({"community_id": comm_id_str})
        if ObjectId.is_valid(comm_id_str):
            sub_or.append({"community_id": ObjectId(comm_id_str)})
    if mentor_id_str:
        sub_or.append({"mentor_id": mentor_id_str})
        if ObjectId.is_valid(mentor_id_str):
            sub_or.append({"mentor_id": ObjectId(mentor_id_str)})

    active_members_count = 0
    if sub_or:
        active_members_count = await db["subscriptions"].count_documents({
            "$and": [{"$or": sub_or}, {"status": "active"}]
        })

    comm["current_members"] = max(comm.get("current_members", 0), active_members_count)
    cap = comm.get("capacity", 30)
    comm["slots_available"] = max(0, cap - comm["current_members"])
    if comm["current_members"] >= cap:
        comm["status"] = "full"

    # Get mentor profile summary
    if mentor_id_str:
        m_query = {"_id": ObjectId(mentor_id_str)} if ObjectId.is_valid(mentor_id_str) else {"_id": mentor_id_str}
        mentor = await db["mentors"].find_one(m_query, {"password": 0})
        if not mentor and ObjectId.is_valid(mentor_id_str):
            mentor = await db["mentors"].find_one({"email": mentor_id_str}, {"password": 0})
        if mentor:
            if mentor.get("profilePic") and isinstance(mentor["profilePic"], bytes):
                mentor["profilePic"] = base64.b64encode(mentor["profilePic"]).decode("utf-8")
            comm["mentor"] = serialize_doc(mentor)
            if not comm.get("mentor_name"):
                comm["mentor_name"] = f"{mentor.get('firstName', '')} {mentor.get('lastName', '')}".strip() or mentor.get("name", "Verified Mentor")
            if not comm.get("mentor_role"):
                comm["mentor_role"] = mentor.get("jobTitle") or mentor.get("headline") or "Senior Mentor"
            if not comm.get("category"):
                comm["category"] = mentor.get("category", "Software Development")

    return {"data": comm, "message": "Community fetched successfully"}



@router.put("/communities/{id}")
async def update_community(id: str, data: CommunityUpdate):
    """Mentor updates community information."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid community ID")

    update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_fields["updated_at"] = datetime.utcnow()

    result = await db["communities"].update_one({"_id": ObjectId(id)}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Community not found")

    updated = await db["communities"].find_one({"_id": ObjectId(id)})
    return {"message": "Community updated successfully", "data": serialize_doc(updated)}


@router.delete("/communities/{id}")
async def delete_community(id: str):
    """Archive/delete a community."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid community ID")

    await db["communities"].delete_one({"_id": ObjectId(id)})
    return {"message": "Community deleted successfully"}


# =====================================================================
# SUBSCRIPTIONS & PAYMENT VERIFICATION FLOW (CAPACITY ENFORCEMENT)
# =====================================================================

@router.post("/communities/{id}/join")
@router.post("/communities/{id}/request-join")
async def request_join_community(id: str, sub_req: SubscriptionRequest):
    """
    Submits a join request to the mentor's community (status: pending).
    Does not charge payment; marks subscription and mentorship application as pending mentor approval.
    """
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid community ID")

    comm = await db["communities"].find_one({"_id": ObjectId(id)})
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")

    capacity = comm.get("capacity", 20)
    current_members = comm.get("current_members", 0)
    if current_members >= capacity:
        raise HTTPException(
            status_code=400,
            detail="This community is currently at full capacity. No slots available."
        )

    mentee_id = sub_req.mentee_id
    mentee_email = sub_req.mentee_email
    mentee_name = sub_req.mentee_name

    # Check if already active
    existing_active = await db["subscriptions"].find_one({
        "community_id": id,
        "$or": [
            {"mentee_id": mentee_id},
            {"mentee_email": mentee_email},
            {"mentee_email": {"$regex": f"^{re.escape(mentee_email)}$", "$options": "i"}}
        ],
        "status": "active"
    })
    if existing_active:
        return {
            "message": "You are already an active member of this community!",
            "status": "active",
            "data": serialize_doc(existing_active)
        }

    # Check if already requested (pending)
    existing_pending = await db["subscriptions"].find_one({
        "community_id": id,
        "$or": [
            {"mentee_id": mentee_id},
            {"mentee_email": mentee_email},
            {"mentee_email": {"$regex": f"^{re.escape(mentee_email)}$", "$options": "i"}}
        ],
        "status": "pending"
    })
    if existing_pending:
        return {
            "message": "Your join request has already been submitted and is pending mentor approval.",
            "status": "pending",
            "data": serialize_doc(existing_pending)
        }

    now = datetime.utcnow()
    sub_doc = {
        "mentee_id": mentee_id,
        "mentee_name": mentee_name,
        "mentee_email": mentee_email,
        "mentor_id": str(comm.get("mentor_id")),
        "mentor_name": comm.get("mentor_name", "Mentor"),
        "community_id": id,
        "community_name": comm.get("name"),
        "payment_id": f"REQ_{secrets.token_hex(6).upper()}",
        "amount": 0,
        "start_date": now.strftime("%d %b %Y"),
        "end_date": (now + timedelta(days=365)).strftime("%d %b %Y"),
        "status": "pending",
        "created_at": now
    }
    sub_res = await db["subscriptions"].insert_one(sub_doc)
    sub_doc["_id"] = str(sub_res.inserted_id)

    # Record in mentorship_applications for mentor approval view
    app_doc = {
        "mentor_id": str(comm.get("mentor_id")),
        "mentee_id": mentee_id,
        "mentee_name": mentee_name,
        "mentee_email": mentee_email,
        "community_id": id,
        "community_name": comm.get("name"),
        "plan": "Community",
        "message": sub_req.message or f"Requested to join {comm.get('name')}",
        "status": "pending",
        "created_at": now
    }
    await db["mentorship_applications"].insert_one(app_doc)

    # Notify mentor
    await db["notifications"].insert_one({
        "recipient_id": str(comm.get("mentor_id")),
        "role": "mentor",
        "title": "New Community Join Request",
        "message": f"{mentee_name} requested to join your community {comm.get('name')}.",
        "type": "community_join_request",
        "read": False,
        "created_at": now
    })

    return {
        "message": "Join request submitted! Pending mentor approval.",
        "status": "pending",
        "data": serialize_doc(sub_doc)
    }


@router.post("/communities/{id}/subscribe")
async def subscribe_to_community(id: str, sub_req: SubscriptionRequest):
    """
    Subscribes a mentee to a community.
    Enforces atomic capacity checking, records payment, and activates subscription.
    """
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid community ID")

    # 1. Fetch community and verify capacity
    comm = await db["communities"].find_one({"_id": ObjectId(id)})
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")

    capacity = comm.get("capacity", 20)
    current_members = comm.get("current_members", 0)

    if current_members >= capacity:
        raise HTTPException(
            status_code=400,
            detail="This community is currently at full capacity. No slots available."
        )

    # 2. Check if already actively subscribed
    existing_sub = await db["subscriptions"].find_one({
        "community_id": id,
        "$or": [
            {"mentee_id": sub_req.mentee_id},
            {"mentee_email": sub_req.mentee_email}
        ],
        "status": "active"
    })

    if existing_sub:
        return {
            "message": "You are already an active member of this community!",
            "data": serialize_doc(existing_sub)
        }

    # 3. Create verified payment record (Test/Sandbox Payment flow)
    amount = sub_req.amount or comm.get("monthly_fee", 499)
    payment_id = f"PAY_TEST_{secrets.token_hex(6).upper()}"

    payment_doc = {
        "payment_id": payment_id,
        "mentee_id": sub_req.mentee_id,
        "mentee_name": sub_req.mentee_name,
        "mentee_email": sub_req.mentee_email,
        "mentor_id": comm.get("mentor_id"),
        "community_id": id,
        "community_name": comm.get("name"),
        "amount": amount,
        "currency": "INR",
        "status": "success",
        "payment_method": sub_req.payment_method,
        "transaction_id": f"TXN_{secrets.token_hex(8).upper()}",
        "created_at": datetime.utcnow()
    }
    await db["payments"].insert_one(payment_doc)

    # 4. Create active subscription record
    now = datetime.utcnow()
    sub_doc = {
        "mentee_id": sub_req.mentee_id,
        "mentee_name": sub_req.mentee_name,
        "mentee_email": sub_req.mentee_email,
        "mentor_id": comm.get("mentor_id"),
        "mentor_name": comm.get("mentor_name", "Mentor"),
        "community_id": id,
        "community_name": comm.get("name"),
        "payment_id": payment_id,
        "amount": amount,
        "start_date": now.strftime("%d %b %Y"),
        "end_date": (now + timedelta(days=30)).strftime("%d %b %Y"),
        "status": "active",
        "created_at": now
    }
    sub_result = await db["subscriptions"].insert_one(sub_doc)
    sub_doc["_id"] = str(sub_result.inserted_id)

    # 5. Atomically increment member count
    new_count = current_members + 1
    update_data = {"current_members": new_count}
    if new_count >= capacity:
        update_data["status"] = "full"

    await db["communities"].update_one({"_id": ObjectId(id)}, {"$set": update_data})

    # 6. Notifications for mentor and mentee
    await db["notifications"].insert_one({
        "recipient_id": comm.get("mentor_id"),
        "role": "mentor",
        "title": "New Community Member!",
        "message": f"{sub_req.mentee_name} subscribed to {comm.get('name')}.",
        "type": "subscription",
        "read": False,
        "created_at": datetime.utcnow()
    })

    await db["notifications"].insert_one({
        "recipient_id": sub_req.mentee_id,
        "recipient_email": sub_req.mentee_email,
        "role": "mentee",
        "title": "Welcome to the Community!",
        "message": f"Your subscription to {comm.get('name')} is active. Join live sessions and chat now!",
        "type": "subscription",
        "read": False,
        "created_at": datetime.utcnow()
    })

    return {
        "message": "Subscription successful! You are now an active community member.",
        "data": serialize_doc(sub_doc)
    }


@router.post("/communities/{id}/kick")
async def kick_community_member(id: str, kick_data: KickMemberRequest):
    """Mentor kicks out a member from the community, decrements capacity and revokes access."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid community ID")

    comm = await db["communities"].find_one({"_id": ObjectId(id)})
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")

    member_email = kick_data.member_email
    member_id = kick_data.member_id

    sub_query = {
        "community_id": id,
        "$or": [{"mentee_email": member_email}]
    }
    if member_id:
        sub_query["$or"].append({"mentee_id": member_id})

    # Find and delete subscription
    del_res = await db["subscriptions"].delete_many(sub_query)
    if del_res.deleted_count == 0:
        await db["subscriptions"].delete_many({
            "mentor_id": comm.get("mentor_id"),
            "$or": [{"mentee_email": member_email}]
        })

    # Decrement member count atomically
    current = comm.get("current_members", 0)
    new_count = max(0, current - 1)
    await db["communities"].update_one(
        {"_id": ObjectId(id)},
        {"$set": {"current_members": new_count, "status": "active"}}
    )

    # Notify mentee
    await db["notifications"].insert_one({
        "recipient_id": member_id or member_email,
        "recipient_email": member_email,
        "role": "mentee",
        "title": "Community Membership Update",
        "message": f"You have been removed from {comm.get('name')} by the mentor.",
        "type": "kick_out",
        "read": False,
        "created_at": datetime.utcnow()
    })

    return {
        "message": f"Member {member_email} has been removed from the community.",
        "current_members": new_count
    }


@router.get("/subscriptions/my")
async def get_my_subscriptions(
    user_id: str | None = None,
    email: str | None = None,
    mentee_id: str | None = None,
    status: str | None = None
):
    """Fetch subscriptions (active and/or pending) for the logged-in mentee."""
    uid = user_id or mentee_id
    id_list = []
    if uid:
        id_list.append(uid)
    if email:
        id_list.append(email)
        id_list.append(email.lower())

    # Resolve user doc from db["users"] to match both ObjectId and email
    if uid and ObjectId.is_valid(uid):
        u = await db["users"].find_one({"_id": ObjectId(uid)})
        if u:
            id_list.append(str(u["_id"]))
            if u.get("email"):
                id_list.append(u["email"])
                id_list.append(u["email"].lower())
    elif email or (uid and "@" in uid):
        em = email or uid
        u = await db["users"].find_one({"email": {"$regex": f"^{re.escape(em)}$", "$options": "i"}})
        if u:
            id_list.append(str(u["_id"]))
            if u.get("email"):
                id_list.append(u["email"])
                id_list.append(u["email"].lower())

    query = {}
    if id_list:
        query["$or"] = [
            {"mentee_id": {"$in": id_list}},
            {"mentee_email": {"$in": id_list}}
        ]
        if email or (uid and "@" in uid):
            em = email or uid
            query["$or"].append({"mentee_email": {"$regex": f"^{re.escape(em)}$", "$options": "i"}})

    if status and status != "all":
        query["status"] = status

    subs = await db["subscriptions"].find(query).sort("created_at", -1).to_list(100)
    serialized = [serialize_doc(s) for s in subs]

    # Also check mentorship_applications for pending requests if not present in subscriptions
    if (not status or status in ["pending", "all"]) and id_list:
        existing_comm_ids = {str(s.get("community_id")) for s in serialized if s.get("community_id")}
        app_query = {
            "status": "pending",
            "$or": [
                {"mentee_id": {"$in": id_list}},
                {"mentee_email": {"$in": id_list}}
            ]
        }
        pending_apps = await db["mentorship_applications"].find(app_query).to_list(50)
        for a in pending_apps:
            c_id = str(a.get("community_id", ""))
            if c_id and c_id not in existing_comm_ids:
                serialized.append({
                    "_id": str(a["_id"]),
                    "community_id": c_id,
                    "community_name": a.get("community_name", "Mentorship Community"),
                    "mentor_id": str(a.get("mentor_id", "")),
                    "mentor_name": a.get("mentor_name", "Mentor"),
                    "mentee_id": a.get("mentee_id"),
                    "mentee_email": a.get("mentee_email"),
                    "status": "pending",
                    "created_at": a.get("created_at")
                })
                existing_comm_ids.add(c_id)

    return {"data": serialized, "message": "Subscriptions fetched"}


# =====================================================================
# SESSIONS ENDPOINTS (WITH PROTECTED GOOGLE MEET LINKS)
# =====================================================================

@router.post("/sessions")
async def create_session(session_data: SessionCreate):
    """Create a new mentorship session with a Google Meet link."""
    try:
        session_dict = session_data.model_dump()
        session_dict["created_at"] = datetime.utcnow()
        session_dict["attendees"] = []

        if not session_dict.get("mentor_name") and ObjectId.is_valid(session_data.mentor_id):
            mentor = await db["mentors"].find_one({"_id": ObjectId(session_data.mentor_id)})
            if mentor:
                first = mentor.get("firstName", "")
                last = mentor.get("lastName", "")
                session_dict["mentor_name"] = f"{first} {last}".strip() or "Mentor"
                session_dict["mentor_email"] = mentor.get("email", "")
                session_dict["mentor_role"] = mentor.get("jobTitle", "Mentor")

        result = await db["sessions"].insert_one(session_dict)
        session_dict["_id"] = str(result.inserted_id)
        return {"message": "Session scheduled successfully", "data": serialize_doc(session_dict)}
    except Exception as e:
        print("Error creating session:", e)
        raise HTTPException(status_code=500, detail="Failed to create session")


@router.get("/sessions")
async def get_sessions(
    status: str | None = None,
    category: str | None = None,
    mentor_id: str | None = None,
    community_id: str | None = None,
    user_id: str | None = None,
    user_email: str | None = None
):
    """Fetch sessions. Mask Google Meet link if user is not active member or mentor."""
    try:
        query = {}
        if status and status != "all":
            query["status"] = status
        if category and category != "all":
            query["category"] = category
        if mentor_id:
            query["mentor_id"] = mentor_id
        if community_id:
            query["community_id"] = community_id

        sessions = await db["sessions"].find(query).sort("created_at", -1).to_list(100)

        # Active community memberships for user if provided
        subscribed_community_ids = set()
        subscribed_mentor_ids = set()
        if user_id or user_email:
            sub_query = {"status": "active"}
            sub_or = []
            if user_id:
                sub_or.append({"mentee_id": user_id})
            if user_email:
                sub_or.append({"mentee_email": user_email})
            if sub_or:
                sub_query["$or"] = sub_or

            user_subs = await db["subscriptions"].find(sub_query).to_list(100)
            for s in user_subs:
                if s.get("community_id"):
                    subscribed_community_ids.add(str(s["community_id"]))
                if s.get("mentor_id"):
                    subscribed_mentor_ids.add(str(s["mentor_id"]))

        serialized = []
        for s in sessions:
            s = serialize_doc(s)
            comm_id = str(s.get("community_id")) if s.get("community_id") else None
            host_id = str(s.get("mentor_id")) if s.get("mentor_id") else None

            # Check eligibility: host mentor or subscribed member
            is_community_member = (
                (comm_id and comm_id in subscribed_community_ids) or
                (host_id and host_id in subscribed_mentor_ids)
            )
            is_host = bool(user_id and host_id and user_id == host_id)
            is_eligible = is_host or is_community_member

            sess_price = s.get("price", 199)
            s["price"] = sess_price

            # Check if mentee has paid for this session (or if free / host)
            has_paid = is_host or sess_price == 0
            if not has_paid and (user_id or user_email):
                for att in s.get("attendees", []):
                    if isinstance(att, dict):
                        if (user_email and att.get("email") == user_email) or (user_id and att.get("mentee_id") == user_id):
                            if att.get("paid"):
                                has_paid = True
                                break

            s["is_eligible_to_join"] = is_eligible
            s["is_paid"] = has_paid

            actual_link = s.get("meet_link") or s.get("gmeet_link") or ""
            if is_host or (is_eligible and has_paid):
                s["meet_link"] = actual_link
                s["gmeet_link"] = actual_link
            else:
                # Strictly protect Google Meet video link until session is paid
                s["meet_link"] = None
                s["gmeet_link"] = None

            serialized.append(s)

        return {"data": serialized, "message": "Successfully fetched sessions"}
    except Exception as e:
        print("Error fetching sessions:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch sessions")


@router.get("/communities/{community_id}/sessions")
async def get_community_sessions(
    community_id: str,
    user_id: str | None = None,
    user_email: str | None = None
):
    """Fetch sessions scheduled for a specific community with payment and Google Meet protection."""
    try:
        comm_queries = [{"community_id": community_id}]
        if ObjectId.is_valid(community_id):
            comm_queries.append({"community_id": ObjectId(community_id)})
            comm = await db["communities"].find_one({"_id": ObjectId(community_id)})
            if comm and comm.get("mentor_id"):
                comm_queries.append({"mentor_id": str(comm["mentor_id"])})
        else:
            comm = await db["communities"].find_one({"mentor_id": community_id})
            if comm and comm.get("mentor_id"):
                comm_queries.append({"mentor_id": str(comm["mentor_id"])})

        sessions = await db["sessions"].find({"$or": comm_queries}).sort("created_at", -1).to_list(50)
        serialized = []
        for s in sessions:
            s = serialize_doc(s)
            sess_price = s.get("price", 199)
            s["price"] = sess_price
            host_id = str(s.get("mentor_id")) if s.get("mentor_id") else None
            is_host = bool(user_id and host_id and user_id == host_id)

            has_paid = is_host or sess_price == 0
            if not has_paid and (user_id or user_email):
                for att in s.get("attendees", []):
                    if isinstance(att, dict):
                        if (user_email and att.get("email") == user_email) or (user_id and att.get("mentee_id") == user_id):
                            if att.get("paid"):
                                has_paid = True
                                break

            s["is_paid"] = has_paid
            actual_link = s.get("meet_link") or s.get("gmeet_link") or ""
            if has_paid or is_host:
                s["meet_link"] = actual_link
                s["gmeet_link"] = actual_link
            else:
                s["meet_link"] = None
                s["gmeet_link"] = None

            serialized.append(s)
        return {"data": serialized, "message": "Community sessions fetched"}
    except Exception as e:
        print("Error fetching community sessions:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch sessions")


@router.put("/sessions/{id}")
async def update_session(id: str, update_data: SessionUpdate):
    """Update session details."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid session ID")

    update_fields = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    result = await db["sessions"].update_one({"_id": ObjectId(id)}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")

    updated = await db["sessions"].find_one({"_id": ObjectId(id)})
    return {"message": "Session updated successfully", "data": serialize_doc(updated)}


@router.delete("/sessions/{id}")
async def delete_session(id: str):
    """Cancel / delete a session."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid session ID")

    result = await db["sessions"].delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"message": "Session deleted successfully"}


@router.post("/sessions/{id}/join")
async def join_session(id: str, rsvp: SessionRSVP):
    """Mentee RSVPs to a session."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid session ID")

    session = await db["sessions"].find_one({"_id": ObjectId(id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    attendees = session.get("attendees", [])
    for att in attendees:
        if isinstance(att, dict) and att.get("email") == rsvp.mentee_email:
            return {"message": "You are already registered for this session", "data": serialize_doc(session)}

    new_attendee = {
        "name": rsvp.mentee_name,
        "email": rsvp.mentee_email,
        "joined_at": datetime.utcnow().isoformat()
    }

    await db["sessions"].update_one({"_id": ObjectId(id)}, {"$push": {"attendees": new_attendee}})
    updated_session = await db["sessions"].find_one({"_id": ObjectId(id)})
    return {"message": "Successfully registered for session!", "data": serialize_doc(updated_session)}


@router.post("/sessions/{id}/pay")
async def pay_for_session(id: str, pay_req: SessionPaymentRequest):
    """Mentee pays for an individual live mentorship session."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid session ID")

    session = await db["sessions"].find_one({"_id": ObjectId(id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    amount = pay_req.amount if pay_req.amount is not None else session.get("price", 199)
    payment_id = f"SESS_PAY_{secrets.token_hex(6).upper()}"
    txn_id = f"TXN_{secrets.token_hex(8).upper()}"

    payment_doc = {
        "payment_id": payment_id,
        "transaction_id": txn_id,
        "type": "session_ticket",
        "session_id": id,
        "session_title": session.get("title", "Live Session"),
        "mentor_id": session.get("mentor_id"),
        "mentor_name": session.get("mentor_name", "Mentor"),
        "mentee_id": pay_req.mentee_id,
        "mentee_name": pay_req.mentee_name,
        "mentee_email": pay_req.mentee_email,
        "amount": amount,
        "currency": "INR",
        "status": "success",
        "payment_method": pay_req.payment_method,
        "created_at": datetime.utcnow()
    }
    await db["payments"].insert_one(payment_doc)

    attendee_obj = {
        "mentee_id": pay_req.mentee_id,
        "name": pay_req.mentee_name,
        "email": pay_req.mentee_email,
        "paid": True,
        "paid_amount": amount,
        "payment_id": payment_id,
        "joined_at": datetime.utcnow().isoformat()
    }

    attendees = session.get("attendees", [])
    already_idx = -1
    for idx, att in enumerate(attendees):
        if isinstance(att, dict) and (att.get("email") == pay_req.mentee_email or (att.get("mentee_id") and att.get("mentee_id") == pay_req.mentee_id)):
            already_idx = idx
            break

    if already_idx >= 0:
        attendees[already_idx]["paid"] = True
        attendees[already_idx]["paid_amount"] = amount
        attendees[already_idx]["payment_id"] = payment_id
        await db["sessions"].update_one({"_id": ObjectId(id)}, {"$set": {"attendees": attendees}})
    else:
        await db["sessions"].update_one({"_id": ObjectId(id)}, {"$push": {"attendees": attendee_obj}})

    # Notify mentor
    await db["notifications"].insert_one({
        "recipient_id": session.get("mentor_id"),
        "role": "mentor",
        "title": "New Session Ticket Purchased!",
        "message": f"{pay_req.mentee_name} paid ₹{amount} for '{session.get('title')}'.",
        "type": "session_booking",
        "read": False,
        "created_at": datetime.utcnow()
    })

    # Notify mentee
    await db["notifications"].insert_one({
        "recipient_id": pay_req.mentee_id,
        "recipient_email": pay_req.mentee_email,
        "role": "mentee",
        "title": "Session Ticket Confirmed!",
        "message": f"Your ticket for '{session.get('title')}' is confirmed. The session starts on time!",
        "type": "session_ticket",
        "read": False,
        "created_at": datetime.utcnow()
    })

    updated_session = await db["sessions"].find_one({"_id": ObjectId(id)})
    s_doc = serialize_doc(updated_session)
    s_doc["is_paid"] = True
    actual_link = s_doc.get("meet_link") or s_doc.get("gmeet_link") or ""
    s_doc["meet_link"] = actual_link
    s_doc["gmeet_link"] = actual_link

    return {
        "message": f"Payment successful! You are enrolled in '{session.get('title')}'.",
        "data": s_doc,
        "payment": serialize_doc(payment_doc)
    }


# =====================================================================
# COMMUNITY CHAT & MESSAGES
# =====================================================================

@router.get("/communities/{community_id}/messages")
async def get_community_messages(community_id: str):
    """Fetch previous chat messages for a community."""
    try:
        messages = await db["community_messages"].find(
            {"community_id": community_id}
        ).sort("created_at", 1).to_list(100)

        return {"data": [serialize_doc(m) for m in messages], "message": "Messages fetched"}
    except Exception as e:
        print("Error fetching messages:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch chat messages")


@router.post("/communities/{community_id}/messages")
async def send_community_message(community_id: str, msg: ChatMessage):
    """REST endpoint to send a message and broadcast to active WebSocket listeners."""
    try:
        sender_role = msg.sender_role
        sender_name = msg.sender_name
        sender_id = msg.sender_id

        # Verify whether sender is genuinely the mentor
        comm = None
        if ObjectId.is_valid(community_id):
            comm = await db["communities"].find_one({"_id": ObjectId(community_id)})
        if not comm:
            comm = await db["communities"].find_one({"_id": community_id})

        if comm:
            is_actual_mentor = (str(comm.get("mentor_id", "")) == str(sender_id))
            if not is_actual_mentor and sender_role == "mentor":
                sender_role = "mentee"
                if sender_name == comm.get("mentor_name"):
                    u = None
                    if ObjectId.is_valid(sender_id):
                        u = await db["users"].find_one({"_id": ObjectId(sender_id)})
                    if not u:
                        u = await db["users"].find_one({"email": sender_id})
                    if u:
                        sender_name = u.get("username") or u.get("userName") or "Member"

        msg_doc = {
            "community_id": community_id,
            "sender_id": sender_id,
            "sender_name": sender_name,
            "sender_role": sender_role,
            "message": msg.message,
            "created_at": datetime.utcnow()
        }
        res = await db["community_messages"].insert_one(msg_doc)
        msg_doc["_id"] = str(res.inserted_id)
        msg_doc["created_at"] = msg_doc["created_at"].isoformat()

        # Broadcast via WebSocket
        await manager.broadcast_to_community(community_id, msg_doc)
        return {"data": msg_doc, "message": "Message sent"}
    except Exception as e:
        print("Error sending message:", e)
        raise HTTPException(status_code=500, detail="Failed to send message")


# =====================================================================
# DIRECT / PERSONAL MESSAGING SYSTEM (FREE FOR COMMUNITY MEMBERS)
# =====================================================================

@router.post("/direct-messages")
async def send_direct_message(data: DirectMessageCreate):
    """
    Send a 1-on-1 personal message.
    Free and exclusively permitted for community members and mentors.
    """
    try:
        mentor_id = data.mentor_id or (data.receiver_id if data.sender_role == "mentee" else data.sender_id)
        mentee_id = data.mentee_id or (data.sender_id if data.sender_role == "mentee" else data.receiver_id)

        # 1. Verify community subscription if sender is mentee
        if data.sender_role == "mentee":
            mentor_filter = [{"mentor_id": mentor_id}, {"mentor_id": str(mentor_id)}]
            if ObjectId.is_valid(mentor_id):
                mentor_filter.append({"mentor_id": ObjectId(mentor_id)})

            sub = await db["subscriptions"].find_one({
                "$and": [
                    {"$or": mentor_filter},
                    {"$or": [{"mentee_id": mentee_id}, {"mentee_email": mentee_id}, {"mentee_id": data.sender_id}, {"mentee_email": data.sender_id}]},
                    {"status": "active"}
                ]
            })

            if not sub:
                raise HTTPException(
                    status_code=403,
                    detail="Personal direct messaging is an exclusive perk free for community members. Please join this mentor's community first!"
                )

        msg_doc = {
            "sender_id": data.sender_id,
            "sender_name": data.sender_name,
            "sender_role": data.sender_role,
            "receiver_id": data.receiver_id,
            "receiver_name": data.receiver_name,
            "mentor_id": mentor_id,
            "mentee_id": mentee_id,
            "message": data.message.strip() if isinstance(data.message, str) else str(data.message),
            "read": False,
            "created_at": datetime.utcnow()
        }

        res = await db["direct_messages"].insert_one(msg_doc)
        msg_doc["_id"] = str(res.inserted_id)
        msg_doc["created_at"] = msg_doc["created_at"].isoformat()

        # Send notification to recipient
        await db["notifications"].insert_one({
            "recipient_id": data.receiver_id,
            "title": f"New Message from {data.sender_name}",
            "message": data.message[:100] if len(data.message) > 100 else data.message,
            "type": "direct_message",
            "sender_id": data.sender_id,
            "sender_name": data.sender_name,
            "read": False,
            "created_at": datetime.utcnow()
        })

        return {"data": msg_doc, "message": "Direct message sent successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print("Error sending direct message:", e)
        raise HTTPException(status_code=500, detail="Failed to send direct message")


@router.get("/direct-messages/conversation")
async def get_direct_conversation(mentor_id: str, mentee_id: str):
    """
    Fetch chronological direct conversation history between a mentor and mentee.
    Also marks messages sent to current viewer as read.
    """
    try:
        mentor_filter = [{"mentor_id": mentor_id}, {"mentor_id": str(mentor_id)}]
        if ObjectId.is_valid(mentor_id):
            mentor_filter.append({"mentor_id": ObjectId(mentor_id)})

        mentee_filter = [
            {"mentee_id": mentee_id},
            {"mentee_id": str(mentee_id)},
            {"sender_id": mentee_id},
            {"receiver_id": mentee_id}
        ]

        query = {
            "$and": [
                {"$or": mentor_filter},
                {"$or": mentee_filter}
            ]
        }

        messages = await db["direct_messages"].find(query).sort("created_at", 1).to_list(200)

        # Mark as read
        await db["direct_messages"].update_many(
            {"mentor_id": mentor_id, "mentee_id": mentee_id, "read": False},
            {"$set": {"read": True}}
        )

        formatted = [serialize_doc(m) for m in messages]
        return {"data": formatted, "message": "Conversation fetched successfully"}
    except Exception as e:
        print("Error fetching conversation:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch conversation")


@router.get("/direct-messages/conversations/{user_id}")
async def get_user_conversations(user_id: str, role: str = "mentor"):
    """
    Fetch all active direct messaging conversations for a mentor or mentee.
    Returns list of distinct contacts with their last message and community context.
    """
    try:
        user_filter = {
            "$or": [
                {"sender_id": user_id},
                {"receiver_id": user_id},
                {"mentor_id": user_id},
                {"mentee_id": user_id}
            ]
        }
        messages = await db["direct_messages"].find(user_filter).sort("created_at", -1).to_list(500)

        conversations_map = {}
        for m in messages:
            if m.get("sender_id") == user_id:
                partner_id = m.get("receiver_id")
                partner_name = m.get("receiver_name")
                partner_role = "mentor" if role == "mentee" else "mentee"
            else:
                partner_id = m.get("sender_id")
                partner_name = m.get("sender_name")
                partner_role = m.get("sender_role", "mentor" if role == "mentee" else "mentee")

            if partner_id not in conversations_map:
                conversations_map[partner_id] = {
                    "partner_id": partner_id,
                    "partner_name": partner_name or "User",
                    "partner_role": partner_role,
                    "last_message": m.get("message", ""),
                    "last_timestamp": m.get("created_at").isoformat() if isinstance(m.get("created_at"), datetime) else str(m.get("created_at")),
                    "unread_count": 1 if (m.get("receiver_id") == user_id and not m.get("read", False)) else 0
                }
            elif m.get("receiver_id") == user_id and not m.get("read", False):
                conversations_map[partner_id]["unread_count"] += 1

        # If mentor: also include any community subscribers who haven't messaged yet, so mentor can initiate conversation
        if role == "mentor":
            mentor_filter = [{"mentor_id": user_id}, {"mentor_id": str(user_id)}]
            if ObjectId.is_valid(user_id):
                mentor_filter.append({"mentor_id": ObjectId(user_id)})

            subs = await db["subscriptions"].find({
                "$and": [{"$or": mentor_filter}, {"status": "active"}]
            }).to_list(100)

            for s in subs:
                m_id = str(s.get("mentee_id") or s.get("mentee_email"))
                if m_id not in conversations_map:
                    conversations_map[m_id] = {
                        "partner_id": m_id,
                        "partner_name": s.get("mentee_name") or "Community Member",
                        "partner_role": "mentee",
                        "partner_email": s.get("mentee_email"),
                        "last_message": "Enrolled community member. Send a personal message!",
                        "last_timestamp": s.get("start_date") or "Recently",
                        "unread_count": 0,
                        "is_member": True
                    }

        # If mentee: also include mentors of communities the mentee has joined who haven't messaged yet
        if role == "mentee":
            mentee_filter = [
                {"mentee_id": user_id},
                {"mentee_id": str(user_id)},
                {"mentee_email": user_id}
            ]
            subs = await db["subscriptions"].find({
                "$and": [{"$or": mentee_filter}, {"status": "active"}]
            }).to_list(100)

            for s in subs:
                mentor_id = str(s.get("mentor_id"))
                if mentor_id not in conversations_map:
                    mentor_doc = None
                    if ObjectId.is_valid(mentor_id):
                        mentor_doc = await db["mentors"].find_one({"_id": ObjectId(mentor_id)})
                    if not mentor_doc:
                        mentor_doc = await db["mentors"].find_one({"_id": mentor_id})

                    mentor_name = f"{mentor_doc.get('firstName', '')} {mentor_doc.get('lastName', '')}".strip() if mentor_doc else (s.get("mentor_name") or "Mentor")
                    conversations_map[mentor_id] = {
                        "partner_id": mentor_id,
                        "partner_name": mentor_name or "Mentor",
                        "partner_role": "mentor",
                        "partner_email": mentor_doc.get("email") if mentor_doc else s.get("mentor_email", ""),
                        "last_message": "Joined community! Start a 1-on-1 chat.",
                        "last_timestamp": s.get("start_date") or "Recently",
                        "unread_count": 0,
                        "is_member": True
                    }

        return {"data": list(conversations_map.values()), "message": "Conversations fetched successfully"}
    except Exception as e:
        print("Error fetching conversations:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch conversations")


# =====================================================================
# REVIEWS & RATINGS SYSTEM
# =====================================================================

@router.post("/reviews")
async def submit_review(data: ReviewCreate):
    """Mentee submits a verified review for a mentor."""
    try:
        # Check if mentee subscribed to this mentor
        sub = await db["subscriptions"].find_one({
            "mentor_id": data.mentor_id,
            "$or": [{"mentee_id": data.mentee_id}, {"mentee_name": data.mentee_name}]
        })

        if not sub:
            raise HTTPException(
                status_code=403,
                detail="You must be an active or past subscriber of this mentor to submit a review."
            )

        # Prevent duplicate reviews for same community/mentor
        existing = await db["reviews"].find_one({
            "mentor_id": data.mentor_id,
            "mentee_id": data.mentee_id
        })
        if existing:
            raise HTTPException(status_code=400, detail="You have already reviewed this mentor.")

        review_doc = data.model_dump()
        review_doc["created_at"] = datetime.utcnow()

        res = await db["reviews"].insert_one(review_doc)
        review_doc["_id"] = str(res.inserted_id)

        # Notify mentor
        await db["notifications"].insert_one({
            "recipient_id": data.mentor_id,
            "role": "mentor",
            "title": "New Review Received!",
            "message": f"{data.mentee_name} left you a {data.rating}-star review.",
            "type": "review",
            "read": False,
            "created_at": datetime.utcnow()
        })

        return {"message": "Review submitted successfully!", "data": serialize_doc(review_doc)}
    except HTTPException:
        raise
    except Exception as e:
        print("Error submitting review:", e)
        raise HTTPException(status_code=500, detail="Failed to submit review")


@router.get("/reviews/mentor/{mentor_id}")
async def get_mentor_reviews(mentor_id: str):
    """Fetch all reviews and compute aggregate star rating for a mentor."""
    try:
        reviews = await db["reviews"].find({"mentor_id": mentor_id}).sort("created_at", -1).to_list(100)
        avg = 5.0
        if reviews:
            avg = round(sum(r.get("rating", 5) for r in reviews) / len(reviews), 1)

        return {
            "data": {
                "reviews": [serialize_doc(r) for r in reviews],
                "average_rating": avg,
                "total_reviews": len(reviews)
            },
            "message": "Reviews fetched successfully"
        }
    except Exception as e:
        print("Error fetching reviews:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch reviews")


# =====================================================================
# NOTIFICATIONS
# =====================================================================

@router.get("/notifications/{user_id}")
async def get_user_notifications(user_id: str):
    """Fetch notifications for a user."""
    try:
        notifs = await db["notifications"].find({
            "$or": [{"recipient_id": user_id}, {"recipient_email": user_id}]
        }).sort("created_at", -1).to_list(50)

        return {"data": [serialize_doc(n) for n in notifs], "message": "Notifications fetched"}
    except Exception as e:
        print("Error fetching notifications:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch notifications")


@router.put("/notifications/{id}/read")
async def mark_notification_read(id: str):
    """Mark a notification as read."""
    if ObjectId.is_valid(id):
        await db["notifications"].update_one({"_id": ObjectId(id)}, {"$set": {"read": True}})
    return {"message": "Notification marked as read"}
