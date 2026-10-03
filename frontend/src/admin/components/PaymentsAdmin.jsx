import React, { useState, useEffect } from "react";
import {
    CreditCard,
    IndianRupee,
    TrendingUp,
    Download,
    Search,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowDownToLine,
} from "lucide-react";
import api from "../../api.js";
import toast, { Toaster } from "react-hot-toast";

const PaymentsAdmin = () => {
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({
        total_volume: 0,
        platform_revenue: 0,
        transactions_count: 0,
        successful_count: 0,
        average_amount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/payments");
            if (res.data) {
                setPayments(res.data.data || []);
                setStats(res.data.stats || {
                    total_volume: 0,
                    platform_revenue: 0,
                    transactions_count: 0,
                    successful_count: 0,
                    average_amount: 0,
                });
            }
        } catch (err) {
            console.error("Error fetching admin payments:", err);
            toast.error("Failed to load payments from MongoDB");
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadCSV = () => {
        if (payments.length === 0) {
            toast.error("No transactions to export");
            return;
        }

        const headers = "Transaction ID,Mentee Name,Amount,Payment Method,Status,Date\n";
        const rows = payments
            .map(
                (p) =>
                    `"${p._id}","${p.mentee_name || "Mentee"}","₹${p.amount || 0}","${
                        p.payment_method || "UPI"
                    }","${p.status || "Completed"}","${p.created_at || "Recent"}"`
            )
            .join("\n");

        const blob = new Blob([headers + rows], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `MentorHub_Platform_Transactions_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        toast.success("Transaction report downloaded");
    };

    const filtered = payments.filter((p) => {
        const matchesSearch =
            !search ||
            p.mentee_name?.toLowerCase().includes(search.toLowerCase()) ||
            p.payment_method?.toLowerCase().includes(search.toLowerCase()) ||
            p._id?.toLowerCase().includes(search.toLowerCase());

        const currentStatus = (p.status || "Completed").toLowerCase();
        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "completed" && (currentStatus === "completed" || currentStatus === "success")) ||
            currentStatus === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-[#163b35]">
                        Payments & Revenue
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Financial logs, subscription revenue, platform fees, and transaction audit trails.
                    </p>
                </div>

                <button
                    onClick={handleDownloadCSV}
                    className="flex items-center gap-2 rounded-xl bg-[#103d35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#176b5c] transition shadow-xs"
                >
                    <ArrowDownToLine size={17} />
                    Export CSV Report
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Gross Volume</span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                            <IndianRupee size={19} />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-[#163b35]">
                        ₹{Number(stats.total_volume || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-1">Total transaction volume</p>
                </div>

                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Platform Take (10%)</span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-[#177fc0]">
                            <TrendingUp size={19} />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-[#163b35]">
                        ₹{Number(stats.platform_revenue || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-sky-600 mt-1">Platform fee retention</p>
                </div>

                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Successful Orders</span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                            <CheckCircle2 size={19} />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-[#163b35]">
                        {stats.successful_count} / {stats.transactions_count}
                    </p>
                    <p className="text-[11px] text-purple-600 mt-1">Completed checkout rate</p>
                </div>

                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Average Order</span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                            <CreditCard size={19} />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-[#163b35]">
                        ₹{Number(stats.average_amount || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-amber-600 mt-1">Per subscription purchase</p>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-[#dce8df] bg-white shadow-xs overflow-hidden">
                <div className="p-5 border-b border-[#edf2ee] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative max-w-sm w-full">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by mentee, transaction ID..."
                            className="w-full rounded-xl border border-[#dce8df] py-2 pl-9 pr-3 text-xs outline-none focus:border-[#176b5c]"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#f5f7f2] p-1 rounded-xl text-xs font-semibold">
                        {["all", "completed", "pending"].map((st) => (
                            <button
                                key={st}
                                onClick={() => setStatusFilter(st)}
                                className={`px-3 py-1.5 rounded-lg capitalize transition ${
                                    statusFilter === st ? "bg-white text-[#163b35] shadow-xs" : "text-gray-500 hover:text-[#163b35]"
                                }`}
                            >
                                {st}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left text-xs">
                        <thead className="border-b border-[#edf2ee] bg-[#fafcf9] text-gray-400 uppercase tracking-wider text-[11px]">
                            <tr>
                                <th className="px-6 py-3.5">Transaction ID</th>
                                <th className="px-6 py-3.5">Mentee Buyer</th>
                                <th className="px-6 py-3.5">Payment Method</th>
                                <th className="px-6 py-3.5">Date & Time</th>
                                <th className="px-6 py-3.5">Amount</th>
                                <th className="px-6 py-3.5 text-right">Status</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#edf2ee]">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-gray-400">
                                        Loading payment transactions from MongoDB...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-gray-400">
                                        No payment records found in MongoDB.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((p) => {
                                    const status = p.status || "Completed";
                                    const isSuccess = status === "Completed" || status === "success";

                                    return (
                                        <tr key={p._id} className="hover:bg-[#fafcf9] transition">
                                            <td className="px-6 py-4 font-mono text-[11px] text-gray-500">
                                                {p._id.slice(-8).toUpperCase()}
                                            </td>

                                            <td className="px-6 py-4 font-semibold text-[#163b35]">
                                                {p.mentee_name || "Community Member"}
                                            </td>

                                            <td className="px-6 py-4 text-gray-600">
                                                {p.payment_method || "Razorpay / UPI"}
                                            </td>

                                            <td className="px-6 py-4 text-gray-500">
                                                {p.created_at ? new Date(p.created_at).toLocaleString() : "Recent"}
                                            </td>

                                            <td className="px-6 py-4 font-bold text-[#103d35] text-sm">
                                                ₹{p.amount || 0}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                        isSuccess
                                                            ? "bg-green-50 text-green-700 border border-green-200"
                                                            : "bg-amber-50 text-amber-700 border border-amber-200"
                                                    }`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${
                                                            isSuccess ? "bg-green-500" : "bg-amber-500"
                                                        }`}
                                                    />
                                                    {status}
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

export default PaymentsAdmin;
