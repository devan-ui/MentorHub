from fastapi import APIRouter, HTTPException, status, Body
from bson import ObjectId
from datetime import datetime, timedelta
from app.database import db

import base64

router = APIRouter(prefix="/admin", tags=["Admin Platform Operations"])

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



@router.get("/dashboard/stats")
async def get_admin_dashboard_stats(timeframe: str = "this_month"):
    """Fetch real-time platform statistics from MongoDB."""
    try:
        now = datetime.utcnow()
        if timeframe == "last_month":
            first_this_month = datetime(now.year, now.month, 1)
            last_day_last_month = first_this_month - timedelta(days=1)
            start_date = datetime(last_day_last_month.year, last_day_last_month.month, 1)
            end_date = first_this_month
        elif timeframe == "last_3_months":
            start_date = now - timedelta(days=90)
            end_date = now
        elif timeframe == "all_time":
            start_date = None
            end_date = None
        else:  # "this_month"
            start_date = datetime(now.year, now.month, 1)
            end_date = now

        total_users = await db["users"].count_documents({})
        total_mentors = await db["mentors"].count_documents({"accepted": "true"})
        pending_mentors = await db["mentors"].count_documents({"accepted": "pending"})
        rejected_mentors = await db["mentors"].count_documents({"accepted": "rejected"})
        total_communities = await db["communities"].count_documents({})
        active_subscriptions = await db["subscriptions"].count_documents({"status": "active"})
        total_sessions = await db["sessions"].count_documents({})
        completed_sessions = await db["sessions"].count_documents({"status": {"$in": ["completed", "Completed"]}})
        upcoming_sessions = await db["sessions"].count_documents({"status": {"$in": ["upcoming", "live"]}})
        open_reports = await db["reports"].count_documents({"status": "open"})
        total_reports = await db["reports"].count_documents({})
        payments_count = await db["payments"].count_documents({})

        # Total revenue from payments (Completed, completed, success)
        payments = await db["payments"].find({
            "status": {"$in": ["success", "Completed", "completed"]}
        }).to_list(1000)
        total_revenue = sum(p.get("amount", 0) for p in payments)

        # Overview metrics for selected timeframe
        if start_date and end_date:
            new_users = await db["users"].count_documents({"created_at": {"$gte": start_date, "$lt": end_date}})
            if new_users == 0 and total_users > 0 and timeframe in ["this_month", "all_time"]:
                new_users = total_users

            new_mentors = await db["mentors"].count_documents({
                "accepted": "true",
                "created_at": {"$gte": start_date, "$lt": end_date}
            })
            if new_mentors == 0 and total_mentors > 0 and timeframe in ["this_month", "all_time"]:
                new_mentors = total_mentors

            timeframe_completed_sessions = await db["sessions"].count_documents({
                "status": {"$in": ["completed", "Completed"]},
                "created_at": {"$gte": start_date, "$lt": end_date}
            })
            if timeframe_completed_sessions == 0 and completed_sessions > 0 and timeframe in ["this_month", "all_time"]:
                timeframe_completed_sessions = completed_sessions
        else:
            new_users = total_users
            new_mentors = total_mentors
            timeframe_completed_sessions = completed_sessions

        # Dynamic trends/badges
        users_growth = f"+{new_users} active" if new_users > 0 else "0 active"
        mentors_growth = f"{pending_mentors} pending" if pending_mentors > 0 else "All verified"
        sessions_growth = f"{upcoming_sessions} upcoming" if upcoming_sessions > 0 else f"{total_sessions} total"

        overview = {
            "timeframe": timeframe,
            "new_users": new_users,
            "new_users_growth": users_growth,
            "new_mentors": new_mentors,
            "new_mentors_growth": mentors_growth,
            "sessions_completed": timeframe_completed_sessions,
            "sessions_growth": sessions_growth,
        }

        # Pending applications preview
        pending_apps = await db["mentors"].find(
            {"accepted": "pending"},
            {"password": 0, "profilePic": 0}
        ).sort("created_at", -1).to_list(5)

        # Recent activities
        recent_users = await db["users"].find(
            {}, {"password": 0}
        ).sort("created_at", -1).to_list(4)

        recent_subs = await db["subscriptions"].find(
            {}
        ).sort("created_at", -1).to_list(4)

        activities = []
        for app in pending_apps:
            activities.append({
                "title": "New mentor application",
                "description": f"{app.get('firstName', '')} {app.get('lastName', '')} applied to become a mentor",
                "time": "Recently",
                "type": "mentor"
            })

        for u in recent_users:
            activities.append({
                "title": "New user registered",
                "description": f"{u.get('username') or u.get('name') or u.get('email')} joined MentorHub",
                "time": "Recently",
                "type": "user"
            })

        for s in recent_subs:
            activities.append({
                "title": "New subscription",
                "description": f"{s.get('mentee_name')} subscribed to {s.get('community_name')}",
                "time": "Recently",
                "type": "payment"
            })

        return {
            "data": {
                "total_users": total_users,
                "total_mentors": total_mentors,
                "accepted_mentors": total_mentors,
                "pending_mentors": pending_mentors,
                "rejected_mentors": rejected_mentors,
                "total_communities": total_communities,
                "active_subscriptions": active_subscriptions,
                "total_subscriptions": active_subscriptions,
                "total_revenue": total_revenue,
                "total_sessions": total_sessions,
                "completed_sessions": completed_sessions,
                "upcoming_sessions": upcoming_sessions,
                "open_reports": open_reports,
                "total_reports": total_reports,
                "payments_count": payments_count,
                "pending_applications": [serialize_doc(a) for a in pending_apps],
                "activities": activities[:8],
                "overview": overview
            },
            "message": "Admin dashboard stats fetched successfully"
        }
    except Exception as e:
        print("Error fetching admin stats:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch admin stats")


@router.get("/activity")
async def get_admin_activity():
    """Fetch live activity stream from MongoDB."""
    try:
        activities = []

        # Recent subscriptions
        subs = await db["subscriptions"].find().sort("created_at", -1).to_list(5)
        for s in subs:
            activities.append({
                "title": "Mentorship Subscription",
                "description": f"{s.get('mentee_name')} enrolled in '{s.get('community_name')}'",
                "time": s.get("created_at").strftime("%b %d, %H:%M") if isinstance(s.get("created_at"), datetime) else "Recently",
                "type": "payment"
            })

        # Recent mentor registrations
        mentors = await db["mentors"].find().sort("created_at", -1).to_list(5)
        for m in mentors:
            name = f"{m.get('firstName', '')} {m.get('lastName', '')}".strip() or "Mentor"
            status_text = "applied" if m.get("accepted") == "pending" else "approved"
            activities.append({
                "title": f"Mentor {status_text.capitalize()}",
                "description": f"{name} ({m.get('jobTitle', 'Engineer')}) {status_text}",
                "time": m.get("created_at").strftime("%b %d, %H:%M") if isinstance(m.get("created_at"), datetime) else "Recently",
                "type": "mentor"
            })

        # Recent user signups
        users = await db["users"].find({}, {"password": 0}).sort("created_at", -1).to_list(5)
        for u in users:
            activities.append({
                "title": "New User Joined",
                "description": f"{u.get('name') or u.get('email')} signed up as a mentee",
                "time": u.get("created_at").strftime("%b %d, %H:%M") if isinstance(u.get("created_at"), datetime) else "Recently",
                "type": "user"
            })

        return {"data": activities[:15], "message": "Activity stream loaded"}
    except Exception as e:
        print("Error loading admin activity:", e)
        raise HTTPException(status_code=500, detail="Failed to load activity")


# =====================================================================
# MENTORSHIPS & SUBSCRIPTIONS MANAGEMENT
# =====================================================================

@router.get("/mentorships")
async def get_all_mentorships():
    """Fetch all mentee-mentor community enrollments and subscriptions."""
    try:
        subscriptions = await db["subscriptions"].find().sort("created_at", -1).to_list(200)
        serialized = [serialize_doc(s) for s in subscriptions]

        # Quick stats
        active_count = sum(1 for s in serialized if s.get("status") == "active")
        paused_count = sum(1 for s in serialized if s.get("status") == "paused")
        cancelled_count = sum(1 for s in serialized if s.get("status") == "cancelled")

        return {
            "data": serialized,
            "stats": {
                "total": len(serialized),
                "active": active_count,
                "paused": paused_count,
                "cancelled": cancelled_count,
            },
            "message": "Mentorships fetched successfully"
        }
    except Exception as e:
        print("Error fetching mentorships:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch mentorships")


@router.put("/mentorships/{id}/status")
async def update_mentorship_status(id: str, payload: dict = Body(...)):
    """Admin updates subscription status (active, paused, cancelled)."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid subscription ID")

    new_status = payload.get("status")
    if new_status not in ["active", "paused", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    res = await db["subscriptions"].update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": new_status, "updated_at": datetime.utcnow()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Mentorship subscription not found")

    return {"message": f"Mentorship status updated to {new_status}"}


# =====================================================================
# PAYMENTS & REVENUE MANAGEMENT
# =====================================================================

@router.get("/payments")
async def get_all_payments():
    """Fetch all payments, revenue transactions, and platform fees."""
    try:
        payments = await db["payments"].find().sort("created_at", -1).to_list(500)
        serialized = [serialize_doc(p) for p in payments]

        total_volume = sum(p.get("amount", 0) for p in payments if p.get("status") in ["Completed", "completed", "success"])
        successful_count = sum(1 for p in payments if p.get("status") in ["Completed", "completed", "success"])
        avg_amount = round(total_volume / successful_count, 2) if successful_count > 0 else 0

        # Platform fee (e.g. 10%)
        platform_revenue = round(total_volume * 0.10, 2)

        return {
            "data": serialized,
            "stats": {
                "total_volume": total_volume,
                "platform_revenue": platform_revenue,
                "transactions_count": len(serialized),
                "successful_count": successful_count,
                "average_amount": avg_amount
            },
            "message": "Payments fetched successfully"
        }
    except Exception as e:
        print("Error fetching admin payments:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch payments")


# =====================================================================
# REVIEWS & MODERATION
# =====================================================================

@router.get("/reviews")
async def get_all_reviews():
    """Fetch all mentee reviews submitted across mentors for platform moderation."""
    try:
        reviews = await db["reviews"].find().sort("created_at", -1).to_list(500)
        serialized = [serialize_doc(r) for r in reviews]

        avg_rating = 5.0
        if serialized:
            avg_rating = round(sum(r.get("rating", 5) for r in serialized) / len(serialized), 1)

        return {
            "data": serialized,
            "stats": {
                "total_reviews": len(serialized),
                "average_rating": avg_rating,
                "five_star_count": sum(1 for r in serialized if r.get("rating") == 5),
            },
            "message": "Reviews fetched successfully"
        }
    except Exception as e:
        print("Error fetching admin reviews:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch reviews")


@router.delete("/reviews/{id}")
async def delete_review(id: str):
    """Admin removes a review for moderation/abuse."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid review ID")

    res = await db["reviews"].delete_one({"_id": ObjectId(id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")

    return {"message": "Review removed successfully"}


# =====================================================================
# PLATFORM REPORTS & DISPUTES
# =====================================================================

@router.get("/reports")
async def get_all_reports():
    """Fetch platform reports, flagged content, or community issues."""
    try:
        reports = await db["reports"].find().sort("created_at", -1).to_list(200)
        serialized = [serialize_doc(r) for r in reports]

        # If no reports submitted yet, generate real analytics summary
        total_users = await db["users"].count_documents({})
        total_mentors = await db["mentors"].count_documents({})
        total_comms = await db["communities"].count_documents({})

        analytics = {
            "total_users": total_users,
            "total_mentors": total_mentors,
            "total_communities": total_comms,
            "open_tickets": sum(1 for r in serialized if r.get("status") == "open"),
            "resolved_tickets": sum(1 for r in serialized if r.get("status") == "resolved"),
        }

        return {
            "data": serialized,
            "analytics": analytics,
            "message": "Reports and platform analytics fetched successfully"
        }
    except Exception as e:
        print("Error fetching reports:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch reports")


@router.post("/reports")
async def create_report(payload: dict = Body(...)):
    """File a new report or issue."""
    try:
        report_doc = {
            "title": payload.get("title", "Platform Report"),
            "description": payload.get("description", ""),
            "reporter_name": payload.get("reporter_name", "Administrator"),
            "reporter_email": payload.get("reporter_email", "admin@mentorhub.com"),
            "category": payload.get("category", "General"),
            "priority": payload.get("priority", "medium"),
            "status": "open",
            "created_at": datetime.utcnow()
        }
        res = await db["reports"].insert_one(report_doc)
        report_doc["_id"] = str(res.inserted_id)
        return {"data": serialize_doc(report_doc), "message": "Report filed successfully"}
    except Exception as e:
        print("Error creating report:", e)
        raise HTTPException(status_code=500, detail="Failed to create report")


@router.put("/reports/{id}/resolve")
async def resolve_report(id: str):
    """Mark a report resolved."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid report ID")

    res = await db["reports"].update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": "resolved", "resolved_at": datetime.utcnow()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")

    return {"message": "Report marked as resolved"}


# =====================================================================
# PLATFORM SETTINGS
# =====================================================================

@router.get("/settings")
async def get_admin_settings():
    """Retrieve platform global configuration from MongoDB."""
    try:
        settings = await db["admin_settings"].find_one({})
        if not settings:
            default_settings = {
                "platform_name": "MentorHub",
                "support_email": "support@mentorhub.com",
                "platform_fee_percent": 10,
                "allow_new_registrations": True,
                "maintenance_mode": False,
                "currency": "INR (₹)",
                "max_community_capacity": 100,
                "google_meet_integration": True,
                "updated_at": datetime.utcnow()
            }
            res = await db["admin_settings"].insert_one(default_settings)
            default_settings["_id"] = str(res.inserted_id)
            return {"data": serialize_doc(default_settings), "message": "Default settings loaded"}

        return {"data": serialize_doc(settings), "message": "Settings loaded successfully"}
    except Exception as e:
        print("Error loading settings:", e)
        raise HTTPException(status_code=500, detail="Failed to load settings")


@router.put("/settings")
async def update_admin_settings(payload: dict = Body(...)):
    """Update platform global configuration."""
    try:
        clean_payload = {k: v for k, v in payload.items() if k != "_id"}
        clean_payload["updated_at"] = datetime.utcnow()

        await db["admin_settings"].update_one(
            {},
            {"$set": clean_payload},
            upsert=True
        )

        updated = await db["admin_settings"].find_one({})
        return {"data": serialize_doc(updated), "message": "Platform settings saved successfully"}
    except Exception as e:
        print("Error updating settings:", e)
        raise HTTPException(status_code=500, detail="Failed to update settings")
