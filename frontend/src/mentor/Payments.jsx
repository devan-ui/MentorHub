import React, { useState, useEffect } from "react";
import {
    IndianRupee,
    TrendingUp,
    Wallet,
    ArrowDownToLine,
    CreditCard,
    CheckCircle2,
} from "lucide-react";
import api from "../api.js";

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [loading, setLoading] = useState(true);

    const mentorId = localStorage.getItem("mentorId");

    useEffect(() => {
        const fetchEarnings = async () => {
            if (!mentorId) return;
            try {
                setLoading(true);
                const res = await api.get(`/mentor/${mentorId}/earnings`);
                if (res.data?.data) {
                    setTotalEarnings(res.data.data.total_earnings || 0);
                    const txns = res.data.data.transactions || res.data.data.payments || [];
                    setPayments(txns);
                }
            } catch (err) {
                console.error("Error loading payments:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchEarnings();
    }, [mentorId]);

    const handleDownloadReport = () => {
        const headers = "Mentee,Amount,Payment Method,Date,Status\n";
        const rows = payments
            .map(
                (p) =>
                    `"${p.mentee_name || p.mentee || "Mentee"}","₹${p.amount}","${p.payment_method || "UPI"}","${p.created_at || "Recent"}","${p.status || "Completed"}"`
            )
            .join("\n");
        const blob = new Blob([headers + rows], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `MentorHub-Earnings-Report.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-[#163b35]">
                        Payments & Earnings
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Track your community mentorship subscriptions and transactions.
                    </p>
                </div>

                <button
                    onClick={handleDownloadReport}
                    className="flex items-center gap-2 rounded-xl border border-[#dce8df] bg-white px-5 py-3 text-sm font-semibold text-[#176b5c] hover:bg-[#f5f7f2] shadow-sm transition"
                >
                    <ArrowDownToLine size={17} />
                    Download CSV Report
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <PaymentStat
                    icon={<IndianRupee size={20} />}
                    title="Total Verified Earnings"
                    value={`₹${totalEarnings.toLocaleString()}`}
                />

                <PaymentStat
                    icon={<TrendingUp size={20} />}
                    title="Paid Transactions"
                    value={payments.length}
                />

                <PaymentStat
                    icon={<Wallet size={20} />}
                    title="Available for Payout"
                    value={`₹${(totalEarnings * 0.9).toLocaleString()}`}
                />
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-[#dce8df] bg-white shadow-sm overflow-hidden">
                <div className="border-b border-[#edf2ee] p-5 flex items-center justify-between">
                    <h2 className="font-bold text-[#163b35]">
                        Recent Transactions
                    </h2>
                    <span className="text-xs text-gray-400">
                        {payments.length} records
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px]">
                        <thead>
                            <tr className="border-b border-[#edf2ee] text-left text-xs uppercase tracking-wide text-gray-400">
                                <th className="px-6 py-4">Mentee</th>
                                <th className="px-6 py-4">Payment Method</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-10 text-gray-400 text-sm">
                                        Loading payments...
                                    </td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-10 text-gray-400 text-sm">
                                        No transactions recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                payments.map((p, index) => (
                                    <tr
                                        key={p._id || index}
                                        className="border-b border-[#edf2ee] last:border-0 hover:bg-[#fafcf9] transition"
                                    >
                                        <td className="px-6 py-4 text-sm font-semibold text-[#163b35]">
                                            {p.mentee_name || p.mentee || "Community Subscriber"}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {p.payment_method || "Razorpay UPI"}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {p.created_at ? new Date(p.created_at).toLocaleDateString() : "Recent"}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-[#103d35]">
                                            ₹{p.amount || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                <CheckCircle2 size={13} />
                                                {p.status || "Completed"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const PaymentStat = ({ icon, title, value }) => {
    return (
        <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf6ed] text-[#176b5c]">
                    {icon}
                </div>
                <div>
                    <p className="text-xs text-gray-400">{title}</p>
                    <p className="text-xl font-bold text-[#163b35]">{value}</p>
                </div>
            </div>
        </div>
    );
};

export default Payments;