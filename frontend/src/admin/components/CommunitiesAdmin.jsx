import React, { useState, useEffect } from "react";
import {
    Building2,
    Users,
    IndianRupee,
    Search,
    ExternalLink,
    CheckCircle2,
    Shield,
} from "lucide-react";
import api from "../../api.js";

const CommunitiesAdmin = () => {
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                setLoading(true);
                const res = await api.get("/communities");
                setCommunities(res.data?.data || []);
            } catch (error) {
                console.error("Failed to fetch communities:", error);
                setCommunities([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCommunities();
    }, []);

    const filtered = communities.filter((c) =>
        !search ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.mentor_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.category?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#163b35]">
                    Community Management
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Monitor all active mentor communities, subscription tiers, and member limits.
                </p>
            </div>

            {/* Communities Grid */}
            <div className="rounded-2xl border border-[#dce8df] bg-white shadow-xs">
                <div className="border-b border-[#edf2ee] p-5">
                    <div className="relative max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search communities..."
                            className="w-full rounded-xl border border-[#dce8df] py-2 pl-9 pr-3 text-xs outline-none focus:border-[#176b5c]"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-xs">
                        <thead className="border-b border-[#edf2ee] bg-[#fafcf9] text-gray-400 uppercase tracking-wider text-[11px]">
                            <tr>
                                <th className="px-6 py-3.5">Community</th>
                                <th className="px-6 py-3.5">Category</th>
                                <th className="px-6 py-3.5">Monthly Fee</th>
                                <th className="px-6 py-3.5">Enrolled / Capacity</th>
                                <th className="px-6 py-3.5">Status</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#edf2ee]">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-gray-400">
                                        Loading communities...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-gray-400">
                                        No communities found.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((c) => {
                                    const memberCount = Array.isArray(c.members) ? c.members.length : 0;
                                    const capacity = c.capacity || 20;

                                    return (
                                        <tr key={c._id} className="hover:bg-[#fafcf9] transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf6ed] text-[#176b5c]">
                                                        <Building2 size={18} />
                                                    </div>
                                                    <div>
                                                        <strong className="block text-sm text-[#163b35]">
                                                            {c.name}
                                                        </strong>
                                                        <span className="text-gray-400 text-[11px]">
                                                            Host: {c.mentor_name || "Mentor"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-gray-600">
                                                {c.category || "General"}
                                            </td>

                                            <td className="px-6 py-4 font-semibold text-gray-800">
                                                ₹{c.monthly_fee || 499} / mo
                                            </td>

                                            <td className="px-6 py-4 text-gray-600">
                                                <span className="font-semibold text-[#176b5c]">
                                                    {memberCount}
                                                </span>{" "}
                                                / {capacity} members
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold text-green-700">
                                                    {c.status || "Active"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CommunitiesAdmin;
