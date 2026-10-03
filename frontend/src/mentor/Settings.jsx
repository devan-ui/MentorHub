import React, { useState, useEffect } from "react";
import {
    User,
    Lock,
    Bell,
    Save,
    Briefcase,
    Building2,
    Globe,
    Sparkles,
} from "lucide-react";
import api from "../api.js";
import toast, { Toaster } from "react-hot-toast";

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobTitle: "",
        company: "",
        location: "",
        bio: "",
        skills: "",
        linkedin: "",
    });

    const mentorId = localStorage.getItem("mentorId");

    useEffect(() => {
        const fetchMentorProfile = async () => {
            if (!mentorId) return;
            try {
                setLoading(true);
                const res = await api.get(`/mentors/${mentorId}`);
                if (res.data?.data) {
                    const m = res.data.data;
                    setFormData({
                        firstName: m.firstName || "",
                        lastName: m.lastName || "",
                        email: m.email || "",
                        phone: m.phone || "",
                        jobTitle: m.jobTitle || "",
                        company: m.company || "",
                        location: m.location || "",
                        bio: m.bio || "",
                        skills: Array.isArray(m.skills) ? m.skills.join(", ") : (m.skills || ""),
                        linkedin: m.linkedin || "",
                    });
                }
            } catch (err) {
                console.error("Error fetching mentor settings:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMentorProfile();
    }, [mentorId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!mentorId) return;
        try {
            setSaving(true);
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                jobTitle: formData.jobTitle,
                company: formData.company,
                location: formData.location,
                bio: formData.bio,
                skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
                linkedin: formData.linkedin,
            };

            const res = await api.put(`/mentors/${mentorId}`, payload);
            toast.success(res.data?.message || "Mentor profile updated successfully!");

            // Update localStorage mentorName
            const fullName = `${formData.firstName} ${formData.lastName}`.trim();
            if (fullName) {
                localStorage.setItem("mentorName", fullName);
            }
        } catch (err) {
            console.error("Error updating settings:", err);
            toast.error(err.response?.data?.detail || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <Toaster position="top-right" />

            <div>
                <h1 className="text-2xl font-bold text-[#163b35]">
                    Mentor Settings & Profile
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Manage your public mentor profile, bio, and mentorship preferences.
                </p>
            </div>

            {/* Profile Information Card */}
            <form onSubmit={handleSave} className="rounded-2xl border border-[#dce8df] bg-white shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 border-b border-[#edf2ee] p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf6ed] text-[#176b5c]">
                        <User size={19} />
                    </div>

                    <div>
                        <h2 className="font-bold text-[#163b35]">
                            Profile Information
                        </h2>
                        <p className="text-xs text-gray-400">
                            Update details that mentees see on your public MentorHub profile.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-xs font-semibold text-gray-600">
                            First Name
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            className="w-full rounded-xl border border-[#dce8df] px-4 py-3 text-sm outline-none focus:border-[#176b5c]"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold text-gray-600">
                            Last Name
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-[#dce8df] px-4 py-3 text-sm outline-none focus:border-[#176b5c]"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold text-gray-600">
                            Email (Read-only)
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            disabled
                            className="w-full rounded-xl border border-[#dce8df] bg-gray-50 text-gray-400 px-4 py-3 text-sm outline-none cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold text-gray-600">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-[#dce8df] px-4 py-3 text-sm outline-none focus:border-[#176b5c]"
                            placeholder="+91 9876543210"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold text-gray-600">
                            Job Title / Designation
                        </label>
                        <input
                            type="text"
                            name="jobTitle"
                            value={formData.jobTitle}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-[#dce8df] px-4 py-3 text-sm outline-none focus:border-[#176b5c]"
                            placeholder="e.g. Senior Software Engineer"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold text-gray-600">
                            Current Company / Organization
                        </label>
                        <input
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-[#dce8df] px-4 py-3 text-sm outline-none focus:border-[#176b5c]"
                            placeholder="e.g. Google, Microsoft, Startup"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-xs font-semibold text-gray-600">
                            Core Skills & Topics (comma separated)
                        </label>
                        <input
                            type="text"
                            name="skills"
                            value={formData.skills}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-[#dce8df] px-4 py-3 text-sm outline-none focus:border-[#176b5c]"
                            placeholder="e.g. React, Node.js, Python, System Design, Career Mentorship"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-xs font-semibold text-gray-600">
                            Mentor Bio & Introduction
                        </label>
                        <textarea
                            rows="4"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            className="w-full resize-none rounded-xl border border-[#dce8df] px-4 py-3 text-sm outline-none focus:border-[#176b5c]"
                            placeholder="Tell mentees about your engineering background, achievements, and mentorship philosophy..."
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-xs font-semibold text-gray-600">
                            LinkedIn Profile URL
                        </label>
                        <input
                            type="url"
                            name="linkedin"
                            value={formData.linkedin}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-[#dce8df] px-4 py-3 text-sm outline-none focus:border-[#176b5c]"
                            placeholder="https://linkedin.com/in/username"
                        />
                    </div>
                </div>

                <div className="border-t border-[#edf2ee] p-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 rounded-xl bg-[#103d35] px-6 py-3 text-sm font-semibold text-white hover:bg-[#176b5c] transition shadow-md disabled:opacity-50"
                    >
                        <Save size={17} />
                        {saving ? "Saving Changes..." : "Save Profile"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;