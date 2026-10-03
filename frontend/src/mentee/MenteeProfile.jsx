import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    User,
    Mail,
    Phone,
    Briefcase,
    GraduationCap,
    Globe,
    Save,
    ArrowLeft,
    CheckCircle2,
    Sparkles,
    BookOpen,
} from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import api from "../api.js";
import toast, { Toaster } from "react-hot-toast";

const MenteeProfile = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        bio: "",
        target_role: "",
        experience_level: "Student / Beginner",
        skills: "",
        education: "",
        linkedin: "",
        github: "",
    });

    const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");

    useEffect(() => {
        const token = localStorage.getItem("userToken");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/mentee/profile/${userId}`);
            if (res.data?.data) {
                const u = res.data.data;
                setFormData({
                    name: u.name || localStorage.getItem("userName") || "",
                    email: u.email || localStorage.getItem("userEmail") || "",
                    phone: u.phone || "",
                    bio: u.bio || "",
                    target_role: u.target_role || "",
                    experience_level: u.experience_level || "Student / Beginner",
                    skills: Array.isArray(u.skills) ? u.skills.join(", ") : (u.skills || ""),
                    education: u.education || "",
                    linkedin: u.linkedin || "",
                    github: u.github || "",
                });
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
            // Fallback from localStorage
            setFormData((prev) => ({
                ...prev,
                name: localStorage.getItem("userName") || "",
                email: localStorage.getItem("userEmail") || "",
            }));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const payload = {
                ...formData,
                skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
            };
            const res = await api.put(`/mentee/profile/${userId}`, payload);
            if (res.data?.data?.name) {
                localStorage.setItem("userName", res.data.data.name);
            }
            toast.success("Profile saved successfully to MongoDB!");
        } catch (err) {
            console.error("Error saving profile:", err);
            toast.error(err.response?.data?.detail || "Failed to save profile changes");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fbfaf6] text-[#123b38]">
            <Toaster position="top-right" />
            <Navbar />

            <div className="w-[92%] max-w-[900px] mx-auto py-8 lg:py-12 space-y-8">
                {/* Back / Navigation Breadcrumb */}
                <div className="flex items-center justify-between">
                    <Link
                        to="/mentee/dashboard"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#082f2b] transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                    <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                        Mentee Account
                    </span>
                </div>

                {/* Profile Header Card */}
                <div className="bg-white rounded-3xl border border-[#123b38]/10 p-6 sm:p-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#082f2b] to-[#176b5c] text-white flex items-center justify-center text-3xl font-extrabold shadow-md">
                            {formData.name ? formData.name.charAt(0).toUpperCase() : "M"}
                        </div>
                        <div className="text-center sm:text-left space-y-1">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#082f2b]">
                                {formData.name || "Mentee Profile"}
                            </h1>
                            <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-2">
                                <Mail className="w-3.5 h-3.5 text-[#177fc0]" />
                                {formData.email}
                            </p>
                            <p className="text-xs text-emerald-700 font-medium pt-1">
                                {formData.target_role ? `Aspiring ${formData.target_role}` : "Active Learner & Community Member"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Edit Profile Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[#123b38]/10 p-6 sm:p-10 shadow-sm space-y-8">
                    <div className="border-b border-gray-100 pb-4">
                        <h2 className="text-xl font-bold text-[#082f2b] flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[#177fc0]" /> Personal & Professional Details
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Keep your profile updated so mentors can tailor advice to your background and career goals.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-[#177fc0]" /> Full Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#177fc0] focus:ring-2 focus:ring-[#177fc0]/20 text-sm outline-none transition"
                                placeholder="e.g. Alex Morgan"
                            />
                        </div>

                        {/* Email (Readonly) */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-gray-400" /> Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                disabled
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 text-sm outline-none cursor-not-allowed"
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-[#177fc0]" /> Phone Number
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#177fc0] focus:ring-2 focus:ring-[#177fc0]/20 text-sm outline-none transition"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>

                        {/* Target Role */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-[#177fc0]" /> Target Role / Career Goal
                            </label>
                            <input
                                type="text"
                                name="target_role"
                                value={formData.target_role}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#177fc0] focus:ring-2 focus:ring-[#177fc0]/20 text-sm outline-none transition"
                                placeholder="e.g. Frontend Engineer, Product Designer"
                            />
                        </div>

                        {/* Experience Level */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700">
                                Current Experience Level
                            </label>
                            <select
                                name="experience_level"
                                value={formData.experience_level}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#177fc0] focus:ring-2 focus:ring-[#177fc0]/20 text-sm outline-none transition bg-white"
                            >
                                <option value="Student / Beginner">Student / Beginner</option>
                                <option value="Junior Developer (0-2 yrs)">Junior Developer (0-2 yrs)</option>
                                <option value="Mid-Level (2-5 yrs)">Mid-Level (2-5 yrs)</option>
                                <option value="Career Switcher">Career Switcher</option>
                                <option value="Senior / Advanced">Senior / Advanced</option>
                            </select>
                        </div>

                        {/* Education */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                <GraduationCap className="w-3.5 h-3.5 text-[#177fc0]" /> College / Degree / University
                            </label>
                            <input
                                type="text"
                                name="education"
                                value={formData.education}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#177fc0] focus:ring-2 focus:ring-[#177fc0]/20 text-sm outline-none transition"
                                placeholder="e.g. B.Tech Computer Science"
                            />
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">
                            About Me / Bio
                        </label>
                        <textarea
                            name="bio"
                            rows={3}
                            value={formData.bio}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#177fc0] focus:ring-2 focus:ring-[#177fc0]/20 text-sm outline-none transition"
                            placeholder="Share a short summary about your background, what skills you're sharpening, and what you hope to achieve with mentorship..."
                        />
                    </div>

                    {/* Skills */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-[#177fc0]" /> Skills & Interests (comma-separated)
                        </label>
                        <input
                            type="text"
                            name="skills"
                            value={formData.skills}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#177fc0] focus:ring-2 focus:ring-[#177fc0]/20 text-sm outline-none transition"
                            placeholder="e.g. React, Python, UI/UX Design, Data Structures, System Design"
                        />
                    </div>

                    {/* Social Profiles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                <FaLinkedin className="w-3.5 h-3.5 text-[#0077b5]" /> LinkedIn URL
                            </label>
                            <input
                                type="url"
                                name="linkedin"
                                value={formData.linkedin}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#177fc0] focus:ring-2 focus:ring-[#177fc0]/20 text-sm outline-none transition"
                                placeholder="https://linkedin.com/in/username"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                <FaGithub className="w-3.5 h-3.5 text-gray-800" /> GitHub URL
                            </label>
                            <input
                                type="url"
                                name="github"
                                value={formData.github}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#177fc0] focus:ring-2 focus:ring-[#177fc0]/20 text-sm outline-none transition"
                                placeholder="https://github.com/username"
                            />
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 rounded-full bg-[#082f2b] hover:bg-[#103d35] text-white font-bold text-sm shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? "Saving Changes..." : "Save Profile"}
                        </button>
                    </div>
                </form>
            </div>

            <Footer />
        </div>
    );
};

export default MenteeProfile;
