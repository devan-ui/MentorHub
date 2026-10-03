import React, { useState, useEffect } from "react";
import {
    Settings,
    Save,
    Shield,
    Globe,
    Mail,
    Percent,
    Video,
    AlertOctagon,
    Users,
    CheckCircle2,
} from "lucide-react";
import api from "../../api.js";
import toast, { Toaster } from "react-hot-toast";

const SettingsAdmin = () => {
    const [settings, setSettings] = useState({
        platform_name: "MentorHub",
        support_email: "support@mentorhub.com",
        platform_fee_percent: 10,
        currency: "INR (₹)",
        max_community_capacity: 100,
        google_meet_integration: true,
        allow_new_registrations: true,
        maintenance_mode: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/settings");
            if (res.data?.data) {
                setSettings((prev) => ({ ...prev, ...res.data.data }));
            }
        } catch (err) {
            console.error("Error fetching settings:", err);
            toast.error("Failed to load settings from MongoDB");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const res = await api.put("/admin/settings", settings);
            toast.success(res.data?.message || "Platform configuration saved to MongoDB!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to save platform settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Toaster position="top-right" />

            <div>
                <h1 className="text-2xl font-bold text-[#163b35]">
                    Platform Settings & Configuration
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Control global platform fee structures, integrations, and community limits stored in MongoDB.
                </p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* General Settings */}
                <div className="rounded-2xl border border-[#dce8df] bg-white p-6 shadow-xs space-y-6">
                    <div className="border-b border-[#edf2ee] pb-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#eaf6ed] text-[#176b5c] flex items-center justify-center">
                            <Settings size={18} />
                        </div>
                        <div>
                            <h2 className="font-bold text-[#163b35]">General Settings</h2>
                            <p className="text-xs text-gray-400">Basic platform identity and operations</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1.5">
                                Platform Brand Name
                            </label>
                            <input
                                type="text"
                                name="platform_name"
                                value={settings.platform_name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#176b5c]"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1.5">
                                Support & Operations Email
                            </label>
                            <input
                                type="email"
                                name="support_email"
                                value={settings.support_email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#176b5c]"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1.5">
                                Platform Commission Fee (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="50"
                                name="platform_fee_percent"
                                value={settings.platform_fee_percent}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#176b5c]"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1.5">
                                Default Max Community Capacity
                            </label>
                            <input
                                type="number"
                                min="10"
                                max="500"
                                name="max_community_capacity"
                                value={settings.max_community_capacity}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#176b5c]"
                            />
                        </div>
                    </div>
                </div>

                {/* Feature Toggles & Integrations */}
                <div className="rounded-2xl border border-[#dce8df] bg-white p-6 shadow-xs space-y-5">
                    <div className="border-b border-[#edf2ee] pb-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Video size={18} />
                        </div>
                        <div>
                            <h2 className="font-bold text-[#163b35]">Integrations & Policies</h2>
                            <p className="text-xs text-gray-400">Toggle live features across user roles</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-[#fafcf9] transition cursor-pointer">
                            <div>
                                <p className="text-xs font-bold text-[#163b35]">Google Meet Video Calls</p>
                                <p className="text-[11px] text-gray-400">
                                    Allow mentors to schedule and launch Google Meet video links for community sessions.
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                name="google_meet_integration"
                                checked={settings.google_meet_integration}
                                onChange={handleChange}
                                className="h-4 w-4 rounded text-[#103d35] focus:ring-[#176b5c]"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-[#fafcf9] transition cursor-pointer">
                            <div>
                                <p className="text-xs font-bold text-[#163b35]">Allow Public Signups</p>
                                <p className="text-[11px] text-gray-400">
                                    Enable new mentees and mentors to register accounts on the platform.
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                name="allow_new_registrations"
                                checked={settings.allow_new_registrations}
                                onChange={handleChange}
                                className="h-4 w-4 rounded text-[#103d35] focus:ring-[#176b5c]"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-[#fafcf9] transition cursor-pointer">
                            <div>
                                <p className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                                    <AlertOctagon size={14} />
                                    Maintenance Mode
                                </p>
                                <p className="text-[11px] text-gray-400">
                                    Temporarily disable user access for scheduled system updates.
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                name="maintenance_mode"
                                checked={settings.maintenance_mode}
                                onChange={handleChange}
                                className="h-4 w-4 rounded text-red-600 focus:ring-red-500"
                            />
                        </label>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 rounded-xl bg-[#103d35] px-7 py-3 text-sm font-semibold text-white hover:bg-[#176b5c] transition shadow-md disabled:opacity-50"
                    >
                        <Save size={17} />
                        {saving ? "Saving Configuration..." : "Save Platform Configuration"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SettingsAdmin;
