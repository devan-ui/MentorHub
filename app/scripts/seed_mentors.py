import asyncio
from datetime import datetime, timedelta
from app.database import db
from bson import ObjectId

MENTORS_SEED = [
    {
        "firstName": "Devanandan",
        "lastName": "CS",
        "email": "devanandhancs@gmail.com",
        "jobTitle": "Lead Full Stack Software Engineer",
        "company": "TechCorp Solutions",
        "location": "Bengaluru, India",
        "category": "Software Development",
        "skills": "React, Node.js, Python, FastAPI, MongoDB, System Design",
        "bio": "Full stack engineer passionate about modern web apps, Python backend architectures, and practical developer mentorship. Helping developers write clean code and crack technical rounds.",
        "linkedin": "https://linkedin.com/in/devanandan",
        "website": "https://github.com/devanandan",
        "whyMentor": "Passionate about helping ambitious students and developers transition to high-impact production engineering roles.",
        "achievement": "Engineered distributed systems handling 500k+ daily requests and mentored 60+ engineers.",
        "monthly_fee": 599,
        "rating": 5.0,
        "total_reviews": 14,
        "accepted": "true",
    },
    {
        "firstName": "Priya",
        "lastName": "Sharma",
        "email": "priya.sharma@fintech.io",
        "jobTitle": "Staff Frontend Architect",
        "company": "Razorpay",
        "location": "Bengaluru, India",
        "category": "Software Development",
        "skills": "React, TypeScript, Next.js, System Design, TailwindCSS, State Management",
        "bio": "8+ years building enterprise fintech interfaces and design systems. Former Flipkart engineer. Mentoring developers on clean frontend architecture, performance optimization, and senior interview loops.",
        "linkedin": "https://linkedin.com/in/priyasharma-eng",
        "website": "https://priyasharma.dev",
        "whyMentor": "I love demystifying large-scale web architecture and seeing mentees land their dream offers.",
        "achievement": "Architected checkout flow processing $5B+ annually with 99.99% uptime.",
        "monthly_fee": 799,
        "rating": 4.95,
        "total_reviews": 28,
        "accepted": "true",
    },
    {
        "firstName": "Aarav",
        "lastName": "Patel",
        "email": "aarav.patel@designstudio.io",
        "jobTitle": "Principal Product Designer",
        "company": "Figma",
        "location": "Mumbai, India",
        "category": "Design & UX",
        "skills": "UI/UX, Figma, Design Systems, User Research, Prototyping, Usability Testing",
        "bio": "Design lead focused on SaaS products, usability heuristics, and intuitive experiences. Guiding emerging designers in building standout portfolios and thinking from product-first principles.",
        "linkedin": "https://linkedin.com/in/aarav-patel-design",
        "website": "https://aaravpatel.design",
        "whyMentor": "Helping the next generation of designers shift from visual styling to strategic product problem-solving.",
        "achievement": "Lead designer for flagship collaborative tooling with 4M+ monthly active creators.",
        "monthly_fee": 699,
        "rating": 5.0,
        "total_reviews": 32,
        "accepted": "true",
    },
    {
        "firstName": "Ananya",
        "lastName": "Iyer",
        "email": "ananya.iyer@deepscale.ai",
        "jobTitle": "Senior AI & Machine Learning Scientist",
        "company": "Google",
        "location": "Hyderabad, India",
        "category": "Software Development",
        "skills": "Python, PyTorch, Generative AI, LLMs, Machine Learning, Data Science, MLOps",
        "bio": "Working on applied LLMs, transformer fine-tuning, and scalable neural search. Guiding aspiring data scientists and ML engineers through math foundations and production deployment.",
        "linkedin": "https://linkedin.com/in/ananya-iyer-ai",
        "website": "https://ananyaiyer.ai",
        "whyMentor": "Bridging the gap between cutting-edge AI research papers and practical industry applications.",
        "achievement": "Published 4 top-tier AI conference papers and deployed LLM models serving 10M+ users.",
        "monthly_fee": 1199,
        "rating": 4.98,
        "total_reviews": 19,
        "accepted": "true",
    },
    {
        "firstName": "Vikramaditya",
        "lastName": "Rao",
        "email": "vikram.rao@nextwave.vc",
        "jobTitle": "VP of Engineering & Serial Founder",
        "company": "NextWave Ventures",
        "location": "Pune, India",
        "category": "Business & Startup",
        "skills": "Startup Strategy, Tech Leadership, MVP Architecture, Scaling Teams, Product Growth",
        "bio": "Built and exited two venture-backed SaaS startups. Mentoring early-stage founders and tech leads on product validation, engineering team scaling, and investor pitches.",
        "linkedin": "https://linkedin.com/in/vikram-rao-founder",
        "website": "https://nextwave.vc",
        "whyMentor": "Mentoring early entrepreneurs to help them avoid the common, expensive pitfalls of the 0-to-1 journey.",
        "achievement": "Raised $12M Series A and successfully led acquisition of enterprise developer tools startup.",
        "monthly_fee": 1499,
        "rating": 5.0,
        "total_reviews": 22,
        "accepted": "true",
    },
    {
        "firstName": "Kavita",
        "lastName": "Reddy",
        "email": "kavita.reddy@cloudscale.net",
        "jobTitle": "Principal Cloud & DevOps Architect",
        "company": "Microsoft",
        "location": "Bengaluru, India",
        "category": "Software Development",
        "skills": "Kubernetes, Docker, AWS, Azure, CI/CD, Terraform, Microservices, SRE",
        "bio": "10+ years in cloud infrastructure, site reliability, and distributed microservices. Helping software engineers master cloud architecture, container orchestration, and Kubernetes certifications.",
        "linkedin": "https://linkedin.com/in/kavita-reddy-devops",
        "website": "https://cloudscale.net/kavita",
        "whyMentor": "Passionate about empowering engineers to master modern cloud-native deployment patterns.",
        "achievement": "Orchestrated zero-downtime multi-region Kubernetes migration across 400+ microservices.",
        "monthly_fee": 899,
        "rating": 4.92,
        "total_reviews": 16,
        "accepted": "true",
    },
    {
        "firstName": "Rahul",
        "lastName": "Varma",
        "email": "rahul.varma@cloudtech.dev",
        "jobTitle": "Lead Cloud Infrastructure Engineer",
        "company": "Amazon Web Services",
        "location": "Bengaluru, India",
        "category": "Software Development",
        "skills": "AWS, Kubernetes, Terraform, Go, CI/CD",
        "bio": "Specializing in multi-region high availability architectures and container security.",
        "linkedin": "https://linkedin.com/in/rahul-varma",
        "website": "https://rahulvarma.io",
        "whyMentor": "Passionate about helping cloud beginners master infra-as-code.",
        "achievement": "Migrated 50+ enterprise workloads to EKS with zero downtime.",
        "monthly_fee": 850,
        "rating": 4.8,
        "total_reviews": 0,
        "accepted": "pending",
    },
    {
        "firstName": "Neha",
        "lastName": "Gupta",
        "email": "neha.gupta@growthlab.co",
        "jobTitle": "Senior Product Manager",
        "company": "Swiggy",
        "location": "Bengaluru, India",
        "category": "Business & Startup",
        "skills": "Product Strategy, Growth Experimentation, Agile, Metrics",
        "bio": "Leading consumer growth and loyalty product pods. Mentoring PMs on interview cases.",
        "linkedin": "https://linkedin.com/in/neha-gupta-pm",
        "website": "https://nehagupta.pm",
        "whyMentor": "Excited to coach aspiring product managers breaking into tech.",
        "achievement": "Scaled subscription feature to 2M+ active members.",
        "monthly_fee": 950,
        "rating": 4.9,
        "total_reviews": 0,
        "accepted": "pending",
    }
]

COMMUNITIES_SEED = [
    {
        "mentor_email": "priya.sharma@fintech.io",
        "name": "Frontend Architecture & React 19 Guild",
        "description": "Weekly deep dives into React internals, modern build tools, state management, and real-world system design for UI engineers.",
        "category": "Software Development",
        "monthly_fee": 799,
        "capacity": 25,
        "status": "active",
    },
    {
        "mentor_email": "aarav.patel@designstudio.io",
        "name": "Product Design & Figma Systems Lab",
        "description": "Collaborative design reviews, Figma auto-layout workshops, UX research teardowns, and portfolio polishing sessions.",
        "category": "Design & UX",
        "monthly_fee": 699,
        "capacity": 20,
        "status": "active",
    },
    {
        "mentor_email": "ananya.iyer@deepscale.ai",
        "name": "Applied Generative AI & LLM Builders",
        "description": "Hands-on projects building LLM agents, RAG pipelines, fine-tuning open source models, and deploying production AI APIs.",
        "category": "Software Development",
        "monthly_fee": 1199,
        "capacity": 20,
        "status": "active",
    },
    {
        "mentor_email": "vikram.rao@nextwave.vc",
        "name": "Startup Founders & Tech Leaders Collective",
        "description": "Strategic masterminds on finding product-market fit, building minimum viable products (MVPs), and pitching investors.",
        "category": "Business & Startup",
        "monthly_fee": 1499,
        "capacity": 15,
        "status": "active",
    },
]

SESSIONS_SEED = [
    {
        "mentor_email": "priya.sharma@fintech.io",
        "title": "React 19 Server Components & State Mastery",
        "description": "Hands-on breakdown of React 19 Actions, Server Actions, and architectural patterns for resilient enterprise apps.",
        "category": "Software Development",
        "date": "Today",
        "time": "7:30 PM",
        "duration": "60 min",
        "gmeet_link": "https://meet.google.com/pri-react-ses",
        "status": "live",
        "max_attendees": 40,
    },
    {
        "mentor_email": "aarav.patel@designstudio.io",
        "title": "UX Portfolio Teardown & Live Case Study Review",
        "description": "Live Figma review of mentee case studies. Learn how to tell compelling design stories that get interviews at top companies.",
        "category": "Design & UX",
        "date": "Tomorrow",
        "time": "6:00 PM",
        "duration": "45 min",
        "gmeet_link": "https://meet.google.com/aar-figma-call",
        "status": "upcoming",
        "max_attendees": 30,
    },
    {
        "mentor_email": "ananya.iyer@deepscale.ai",
        "title": "Building Production RAG Systems with Python & LangChain",
        "description": "Step-by-step implementation of retrieval augmented generation with vector databases, hybrid search, and evaluation metrics.",
        "category": "Software Development",
        "date": "Friday",
        "time": "8:00 PM",
        "duration": "75 min",
        "gmeet_link": "https://meet.google.com/ana-llm-meet",
        "status": "upcoming",
        "max_attendees": 35,
    },
    {
        "mentor_email": "vikram.rao@nextwave.vc",
        "title": "From Idea to MVP: Founder Roadmap & Validation",
        "description": "How to validate problem-solution fit in under 3 weeks without wasting engineering resources or hiring prematurely.",
        "category": "Business & Startup",
        "date": "Saturday",
        "time": "11:00 AM",
        "duration": "60 min",
        "gmeet_link": "https://meet.google.com/vik-startup-ama",
        "status": "upcoming",
        "max_attendees": 25,
    },
    {
        "mentor_email": "priya.sharma@fintech.io",
        "title": "Modern Frontend Build Systems: Vite & Turbopack",
        "description": "Comprehensive walkthrough of bundle optimization and build tooling configurations.",
        "category": "Software Development",
        "date": "Aug 28, 2026",
        "time": "7:00 PM",
        "duration": "60 min",
        "gmeet_link": "https://meet.google.com/pri-vite-arch",
        "status": "completed",
        "max_attendees": 50,
    },
    {
        "mentor_email": "devanandhancs@gmail.com",
        "title": "FastAPI & Distributed Asynchronous Architecture",
        "description": "Deep dive into async Python web frameworks, connection pooling, and background task queues.",
        "category": "Software Development",
        "date": "Sep 02, 2026",
        "time": "6:30 PM",
        "duration": "90 min",
        "gmeet_link": "https://meet.google.com/dev-fastapi-ses",
        "status": "completed",
        "max_attendees": 45,
    },
    {
        "mentor_email": "aarav.patel@designstudio.io",
        "title": "Design Systems & Component Anatomy in Figma",
        "description": "Building production design tokens and multi-brand component libraries.",
        "category": "Design & UX",
        "date": "Sep 05, 2026",
        "time": "5:00 PM",
        "duration": "60 min",
        "gmeet_link": "https://meet.google.com/aar-ds-workshop",
        "status": "completed",
        "max_attendees": 35,
    },
]

REVIEWS_SEED = [
    {
        "mentor_email": "priya.sharma@fintech.io",
        "mentee_name": "Rohan Gupta",
        "rating": 5,
        "review_text": "Priya's feedback on my React architecture completely changed the way I structure components. Landed an SDE-2 offer within 4 weeks of mentoring!",
        "created_at": datetime.utcnow() - timedelta(days=5),
    },
    {
        "mentor_email": "aarav.patel@designstudio.io",
        "mentee_name": "Tanvi Joshi",
        "rating": 5,
        "review_text": "Aarav walked through my Figma design system and pointed out usability gaps that no tutorial ever mentioned. Highly recommended for any product designer.",
        "created_at": datetime.utcnow() - timedelta(days=8),
    },
    {
        "mentor_email": "ananya.iyer@deepscale.ai",
        "mentee_name": "Karthik N",
        "rating": 5,
        "review_text": "Ananya explained transformer attention mechanisms with phenomenal clarity. Her hands-on PyTorch coding session was worth every minute.",
        "created_at": datetime.utcnow() - timedelta(days=12),
    },
    {
        "mentor_email": "devanandhancs@gmail.com",
        "mentee_name": "Siddharth Mehta",
        "rating": 5,
        "review_text": "Devanandan gives direct, high-value feedback on backend APIs and system design. His live code reviews helped me ace my technical rounds.",
        "created_at": datetime.utcnow() - timedelta(days=2),
    }
]

USERS_SEED = [
    {
        "name": "Aditya Roy",
        "username": "adityaroy",
        "email": "aditya.roy@example.com",
        "role": "mentee",
        "education": "B.Tech Computer Science, 4th Year",
        "goals": "Landing an SDE role in fintech",
        "created_at": datetime.utcnow() - timedelta(days=15),
    },
    {
        "name": "Sneha Sen",
        "username": "snehasen",
        "email": "sneha.sen@example.com",
        "role": "mentee",
        "education": "B.Des Industrial Design",
        "goals": "Transitioning to Senior Product Designer",
        "created_at": datetime.utcnow() - timedelta(days=10),
    },
    {
        "name": "Rahul Nair",
        "username": "rahulnair",
        "email": "rahul.nair@example.com",
        "role": "mentee",
        "education": "M.Tech Artificial Intelligence",
        "goals": "Publishing research and deploying LLM applications",
        "created_at": datetime.utcnow() - timedelta(days=7),
    },
    {
        "name": "Pooja Verma",
        "username": "poojaverma",
        "email": "pooja.verma@example.com",
        "role": "mentee",
        "education": "BCA, Final Year",
        "goals": "Mastering full stack development",
        "created_at": datetime.utcnow() - timedelta(days=3),
    },
    {
        "name": "Arjun Das",
        "username": "arjundas",
        "email": "arjun.das@example.com",
        "role": "mentee",
        "education": "MBA Tech",
        "goals": "Launching a tech startup",
        "created_at": datetime.utcnow() - timedelta(days=1),
    },
]

SUBSCRIPTIONS_SEED = [
    {
        "mentee_name": "Aditya Roy",
        "mentee_email": "aditya.roy@example.com",
        "mentor_email": "priya.sharma@fintech.io",
        "mentor_name": "Priya Sharma",
        "community_name": "Frontend Architecture & React 19 Guild",
        "amount": 799,
        "status": "active",
        "created_at": datetime.utcnow() - timedelta(days=12),
    },
    {
        "mentee_name": "Sneha Sen",
        "mentee_email": "sneha.sen@example.com",
        "mentor_email": "aarav.patel@designstudio.io",
        "mentor_name": "Aarav Patel",
        "community_name": "Product Design & Figma Systems Lab",
        "amount": 699,
        "status": "active",
        "created_at": datetime.utcnow() - timedelta(days=9),
    },
    {
        "mentee_name": "Rahul Nair",
        "mentee_email": "rahul.nair@example.com",
        "mentor_email": "ananya.iyer@deepscale.ai",
        "mentor_name": "Ananya Iyer",
        "community_name": "Applied Generative AI & LLM Builders",
        "amount": 1199,
        "status": "active",
        "created_at": datetime.utcnow() - timedelta(days=5),
    },
    {
        "mentee_name": "Arjun Das",
        "mentee_email": "arjun.das@example.com",
        "mentor_email": "vikram.rao@nextwave.vc",
        "mentor_name": "Vikramaditya Rao",
        "community_name": "Startup Founders & Tech Leaders Collective",
        "amount": 1499,
        "status": "active",
        "created_at": datetime.utcnow() - timedelta(days=1),
    },
]

PAYMENTS_SEED = [
    {
        "transaction_id": "TXN_MH_90821",
        "user_name": "Aditya Roy",
        "user_email": "aditya.roy@example.com",
        "amount": 799,
        "currency": "INR",
        "purpose": "Frontend Architecture & React 19 Guild Subscription",
        "status": "Completed",
        "method": "UPI",
        "created_at": datetime.utcnow() - timedelta(days=12),
    },
    {
        "transaction_id": "TXN_MH_90822",
        "user_name": "Sneha Sen",
        "user_email": "sneha.sen@example.com",
        "amount": 699,
        "currency": "INR",
        "purpose": "Product Design & Figma Systems Lab Subscription",
        "status": "Completed",
        "method": "Debit Card",
        "created_at": datetime.utcnow() - timedelta(days=9),
    },
    {
        "transaction_id": "TXN_MH_90823",
        "user_name": "Rahul Nair",
        "user_email": "rahul.nair@example.com",
        "amount": 1199,
        "currency": "INR",
        "purpose": "Applied Generative AI & LLM Builders Subscription",
        "status": "Completed",
        "method": "NetBanking",
        "created_at": datetime.utcnow() - timedelta(days=5),
    },
    {
        "transaction_id": "TXN_MH_90824",
        "user_name": "Arjun Das",
        "user_email": "arjun.das@example.com",
        "amount": 1499,
        "currency": "INR",
        "purpose": "Startup Founders & Tech Leaders Collective Subscription",
        "status": "Completed",
        "method": "UPI",
        "created_at": datetime.utcnow() - timedelta(days=1),
    },
]

REPORTS_SEED = [
    {
        "title": "Audio sync issue during live workshop recording",
        "description": "The audio had a slight delay during the latter 20 minutes of the session.",
        "reporter_name": "Sneha Sen",
        "reporter_email": "sneha.sen@example.com",
        "category": "Technical Issue",
        "priority": "medium",
        "status": "open",
        "created_at": datetime.utcnow() - timedelta(days=2),
    },
    {
        "title": "Calendar sync query for upcoming sessions",
        "description": "Requested Google Calendar sync integration for community events.",
        "reporter_name": "Rahul Nair",
        "reporter_email": "rahul.nair@example.com",
        "category": "Feature Request",
        "priority": "low",
        "status": "resolved",
        "created_at": datetime.utcnow() - timedelta(days=6),
    }
]

async def seed_data():
    print("[INFO] Checking and seeding mentors...")
    mentor_id_map = {}

    for mentor_data in MENTORS_SEED:
        email = mentor_data["email"]
        existing = await db["mentors"].find_one({"email": email})
        if not existing:
            mentor_data["created_at"] = datetime.utcnow()
            result = await db["mentors"].insert_one(mentor_data)
            mentor_id = str(result.inserted_id)
            print(f"[+] Added mentor: {mentor_data['firstName']} {mentor_data['lastName']} ({email})")
        else:
            mentor_id = str(existing["_id"])
            update_fields = {
                "jobTitle": mentor_data["jobTitle"],
                "company": mentor_data["company"],
                "location": mentor_data["location"],
                "category": mentor_data["category"],
                "skills": mentor_data["skills"],
                "bio": mentor_data["bio"],
                "monthly_fee": mentor_data["monthly_fee"],
                "rating": mentor_data["rating"],
                "accepted": mentor_data.get("accepted", "true"),
            }
            await db["mentors"].update_one({"_id": existing["_id"]}, {"$set": update_fields})
            print(f"[*] Updated mentor: {mentor_data['firstName']} {mentor_data['lastName']} ({email})")

        mentor_id_map[email] = {
            "id": mentor_id,
            "name": f"{mentor_data['firstName']} {mentor_data['lastName']}",
            "role": mentor_data["jobTitle"],
        }

    # Communities
    print("\n[INFO] Checking and seeding communities...")
    for comm in COMMUNITIES_SEED:
        mentor_info = mentor_id_map.get(comm["mentor_email"])
        if not mentor_info:
            continue

        existing_comm = await db["communities"].find_one({
            "name": comm["name"],
            "mentor_id": mentor_info["id"]
        })
        if not existing_comm:
            doc = {
                "name": comm["name"],
                "description": comm["description"],
                "category": comm["category"],
                "mentor_id": mentor_info["id"],
                "mentor_name": mentor_info["name"],
                "mentor_role": mentor_info["role"],
                "monthly_fee": comm["monthly_fee"],
                "capacity": comm["capacity"],
                "current_members": 3,
                "status": comm["status"],
                "created_at": datetime.utcnow(),
            }
            await db["communities"].insert_one(doc)
            print(f"[+] Added community: {comm['name']}")
        else:
            print(f"[=] Community exists: {comm['name']}")

    # Sessions
    print("\n[INFO] Checking and seeding sessions...")
    for sess in SESSIONS_SEED:
        mentor_info = mentor_id_map.get(sess["mentor_email"])
        if not mentor_info:
            continue

        existing_sess = await db["sessions"].find_one({
            "title": sess["title"],
            "mentor_id": mentor_info["id"]
        })
        if not existing_sess:
            doc = {
                "title": sess["title"],
                "description": sess["description"],
                "category": sess["category"],
                "mentor_id": mentor_info["id"],
                "mentor_name": mentor_info["name"],
                "mentor_role": mentor_info["role"],
                "mentor_email": sess["mentor_email"],
                "date": sess["date"],
                "time": sess["time"],
                "duration": sess["duration"],
                "gmeet_link": sess["gmeet_link"],
                "max_attendees": sess["max_attendees"],
                "session_type": "community",
                "status": sess["status"],
                "attendees": [
                    {"name": "Aditya Roy", "email": "aditya@gmail.com", "joined_at": datetime.utcnow().isoformat()},
                    {"name": "Sneha Sen", "email": "sneha@gmail.com", "joined_at": datetime.utcnow().isoformat()},
                ],
                "created_at": datetime.utcnow(),
            }
            await db["sessions"].insert_one(doc)
            print(f"[+] Added session: {sess['title']}")
        else:
            print(f"[=] Session exists: {sess['title']}")

    # Reviews
    print("\n[INFO] Checking and seeding reviews...")
    for rev in REVIEWS_SEED:
        mentor_info = mentor_id_map.get(rev["mentor_email"])
        if not mentor_info:
            continue

        existing_rev = await db["reviews"].find_one({
            "mentor_id": mentor_info["id"],
            "mentee_name": rev["mentee_name"]
        })
        if not existing_rev:
            doc = {
                "mentor_id": mentor_info["id"],
                "mentee_id": "mentee_seed_user",
                "mentee_name": rev["mentee_name"],
                "rating": rev["rating"],
                "review_text": rev["review_text"],
                "created_at": rev["created_at"],
            }
            await db["reviews"].insert_one(doc)
            print(f"[+] Added review from {rev['mentee_name']} for {mentor_info['name']}")

    # Users
    print("\n[INFO] Checking and seeding users...")
    for user_data in USERS_SEED:
        existing_user = await db["users"].find_one({"email": user_data["email"]})
        if not existing_user:
            await db["users"].insert_one(user_data)
            print(f"[+] Added user: {user_data['name']} ({user_data['email']})")
        else:
            print(f"[=] User exists: {user_data['name']}")

    # Subscriptions
    print("\n[INFO] Checking and seeding subscriptions...")
    for sub in SUBSCRIPTIONS_SEED:
        existing_sub = await db["subscriptions"].find_one({
            "mentee_email": sub["mentee_email"],
            "community_name": sub["community_name"]
        })
        if not existing_sub:
            await db["subscriptions"].insert_one(sub)
            print(f"[+] Added subscription for {sub['mentee_name']} -> {sub['community_name']}")
        else:
            print(f"[=] Subscription exists: {sub['mentee_name']} -> {sub['community_name']}")

    # Payments
    print("\n[INFO] Checking and seeding payments...")
    for pay in PAYMENTS_SEED:
        existing_pay = await db["payments"].find_one({"transaction_id": pay["transaction_id"]})
        if not existing_pay:
            await db["payments"].insert_one(pay)
            print(f"[+] Added payment: {pay['transaction_id']} (Rs.{pay['amount']})")
        else:
            print(f"[=] Payment exists: {pay['transaction_id']}")

    # Reports
    print("\n[INFO] Checking and seeding reports...")
    for rep in REPORTS_SEED:
        existing_rep = await db["reports"].find_one({"title": rep["title"]})
        if not existing_rep:
            await db["reports"].insert_one(rep)
            print(f"[+] Added report: {rep['title']}")
        else:
            print(f"[=] Report exists: {rep['title']}")

    print("\n[SUCCESS] Seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
