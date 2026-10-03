import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api.js";
import toast, { Toaster } from "react-hot-toast";

const Register = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [userName, setUserName] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const navigator = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            const res = await api.post("/register", {
                userName,
                email,
                password,
            });

            toast.success(res.data.message || "OTP sent successfully!");

            setTimeout(() => {
                navigator("/verify", {
                    state: { email },
                });
            }, 1200);

        } catch (err) {
            console.log(err.response?.data || err.message);

            const errorMessage =
                err.response?.data?.detail ||
                "Registration failed. Please try again.";

            toast.error(errorMessage);
        }
    };

    return (
        <>
            <Toaster position="top-right" />

            <div className="min-h-screen bg-[#f5f7f2] flex items-center justify-center p-4 sm:p-6 lg:p-10">

                <div className="w-full max-w-5xl min-h-[500px] bg-white rounded-[32px] overflow-hidden shadow-[0_25px_80px_rgba(15,55,45,0.14)] grid lg:grid-cols-[0.9fr_1.1fr]">

                    {/* =====================================================
                        LEFT BRAND SECTION
                    ====================================================== */}

                    <section className="relative hidden lg:flex overflow-hidden bg-[#103d35] text-white p-12 xl:p-16 flex-col justify-between">

                        {/* Decorative circles */}

                        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full border border-white/10" />

                        <div className="absolute top-32 -right-24 w-72 h-72 rounded-full border border-emerald-200/10" />

                        <div className="absolute -bottom-40 left-20 w-96 h-96 rounded-full bg-emerald-400/5" />


                        {/* Brand */}

                        <div className="relative z-10">

                            <Link
                                to="/"
                                className="inline-flex items-center gap-3"
                            >

                                <div className="w-11 h-11 rounded-2xl bg-[#d8f0dc] text-[#103d35] flex items-center justify-center text-xl font-bold">
                                    M
                                </div>

                                <span className="text-2xl font-semibold tracking-tight">
                                    MentorHub
                                </span>

                            </Link>

                        </div>


                        {/* Main message */}

                        <div className="relative z-10 max-w-lg">

                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm text-emerald-100 mb-7">

                                <span className="w-2 h-2 rounded-full bg-emerald-300" />

                                Learn. Connect. Grow.

                            </div>


                            <h1 className="text-5xl xl:text-6xl font-semibold leading-[1.05] tracking-tight">

                                Your next
                                <span className="block text-[#a9dfb5]">
                                    breakthrough
                                </span>

                                starts with
                                <span className="block">
                                    the right mentor.
                                </span>

                            </h1>


                            <p className="mt-7 text-lg leading-8 text-emerald-50/70 max-w-md">

                                MentorHub brings ambitious learners and
                                experienced professionals together to turn
                                questions into progress.

                            </p>


                            {/* Benefits */}

                            <div className="mt-10 grid grid-cols-2 gap-4">

                                <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-5">

                                    <div className="text-2xl font-semibold text-[#b8e5c0]">
                                        1 : 1
                                    </div>

                                    <p className="mt-1 text-sm text-white/60">
                                        Personal guidance
                                    </p>

                                </div>


                                <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-5">

                                    <div className="text-2xl font-semibold text-[#b8e5c0]">
                                        24/7
                                    </div>

                                    <p className="mt-1 text-sm text-white/60">
                                        Learning community
                                    </p>

                                </div>

                            </div>

                        </div>


                        {/* Bottom quote */}

                        <div className="relative z-10">

                            <div className="h-px bg-white/10 mb-5" />

                            <p className="text-sm text-white/50">
                                "One conversation can change the direction
                                of your career."
                            </p>

                        </div>

                    </section>


                    {/* =====================================================
                        RIGHT SIGNUP SECTION
                    ====================================================== */}

                    <section className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">

                        {/* Mobile logo */}

                        <div className="lg:hidden flex items-center justify-between mb-10">

                            <Link
                                to="/"
                                className="flex items-center gap-3"
                            >

                                <div className="w-10 h-10 rounded-xl bg-[#103d35] text-white flex items-center justify-center font-bold">
                                    M
                                </div>

                                <span className="text-xl font-bold text-[#103d35]">
                                    MentorHub
                                </span>

                            </Link>

                            <Link
                                to="/login"
                                className="text-sm font-medium text-[#176b5c] hover:underline"
                            >
                                Sign in
                            </Link>

                        </div>


                        <div className="w-full max-w-xl mx-auto">

                            {/* Header */}

                            <div className="mb-8">

                                <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#eaf6ed] text-[#176b5c] text-xs font-semibold mb-4">
                                    JOIN MENTORHUB
                                </div>

                                <h2 className="text-3xl sm:text-4xl font-semibold text-[#163b35] tracking-tight">
                                    Create your account
                                </h2>

                                <p className="mt-2 text-gray-500">
                                    Start building meaningful connections
                                    with people who can help you grow.
                                </p>

                            </div>


                            {/* Form */}

                            <form
                                onSubmit={handleSubmit}
                                className="space-y-5"
                            >

                                {/* Username */}

                                <div>

                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Username
                                    </label>

                                    <input
                                        type="text"
                                        required
                                        value={userName}
                                        placeholder="Choose a username"
                                        onChange={(e) =>
                                            setUserName(e.target.value)
                                        }
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/70 text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:border-[#2c8b77] focus:ring-4 focus:ring-[#2c8b77]/10"
                                    />

                                </div>


                                {/* Email */}

                                <div>

                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email address
                                    </label>

                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        placeholder="you@example.com"
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/70 text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:border-[#2c8b77] focus:ring-4 focus:ring-[#2c8b77]/10"
                                    />

                                </div>


                                {/* Password */}

                                <div>

                                    <div className="flex items-center justify-between mb-2">

                                        <label className="text-sm font-medium text-gray-700">
                                            Password
                                        </label>

                                        <span className="text-xs text-gray-400">
                                            8+ characters
                                        </span>

                                    </div>

                                    <div className="relative">

                                        <input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            required
                                            value={password}
                                            placeholder="Create a strong password"
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            className="w-full h-12 px-4 pr-20 rounded-xl border border-gray-200 bg-gray-50/70 text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:border-[#2c8b77] focus:ring-4 focus:ring-[#2c8b77]/10"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#176b5c] hover:text-[#0e5145]"
                                        >
                                            {showPassword ? "Hide" : "Show"}
                                        </button>

                                    </div>

                                </div>


                                {/* Confirm Password */}

                                <div>

                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm password
                                    </label>

                                    <div className="relative">

                                        <input
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            required
                                            value={confirmPassword}
                                            placeholder="Re-enter your password"
                                            onChange={(e) =>
                                                setConfirmPassword(
                                                    e.target.value
                                                )
                                            }
                                            className={`w-full h-12 px-4 pr-20 rounded-xl border bg-gray-50/70 text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:ring-4 ${confirmPassword &&
                                                    password !== confirmPassword
                                                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                                                    : "border-gray-200 focus:border-[#2c8b77] focus:ring-[#2c8b77]/10"
                                                }`}
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    !showConfirmPassword
                                                )
                                            }
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#176b5c] hover:text-[#0e5145]"
                                        >
                                            {showConfirmPassword
                                                ? "Hide"
                                                : "Show"}
                                        </button>

                                    </div>

                                    {confirmPassword &&
                                        password !== confirmPassword && (
                                            <p className="mt-2 text-xs text-red-500">
                                                Passwords do not match.
                                            </p>
                                        )}

                                </div>


                                {/* Terms */}

                                <label className="flex items-start gap-3 cursor-pointer pt-1">

                                    <input
                                        type="checkbox"
                                        required
                                        className="mt-1 w-4 h-4 accent-[#176b5c]"
                                    />

                                    <span className="text-sm leading-6 text-gray-500">

                                        I agree to the{" "}

                                        <span className="font-medium text-[#176b5c] hover:underline cursor-pointer">
                                            Terms & Conditions
                                        </span>

                                        {" "}and{" "}

                                        <span className="font-medium text-[#176b5c] hover:underline cursor-pointer">
                                            Privacy Policy
                                        </span>

                                    </span>

                                </label>


                                {/* Submit */}

                                <button
                                    type="submit"
                                    className="w-full h-12 rounded-xl bg-[#176b5c] hover:bg-[#0f594d] text-white font-semibold shadow-lg shadow-[#176b5c]/15 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    Create MentorHub account
                                </button>

                            </form>


                            {/* Divider */}

                            <div className="flex items-center gap-4 my-7">

                                <div className="flex-1 h-px bg-gray-200" />

                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    or
                                </span>

                                <div className="flex-1 h-px bg-gray-200" />

                            </div>


                            {/* Google */}

                            <button
                                type="button"
                                className="w-full h-12 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-center gap-3 transition-colors"
                            >

                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-sm font-bold">
                                    G
                                </span>

                                Continue with Google

                            </button>


                            {/* Login */}

                            <p className="text-center text-sm text-gray-500 mt-7">

                                Already have an account?{" "}

                                <Link
                                    to="/login"
                                    className="font-semibold text-[#176b5c] hover:underline"
                                >
                                    Sign in
                                </Link>

                            </p>


                            {/* Mentor CTA */}

                            <div className="mt-8 p-4 rounded-2xl bg-[#f1f7f2] border border-[#dcecdf] text-center">

                                <p className="text-sm text-gray-600">
                                    Have experience to share?
                                </p>

                                <button
                                    type="button"
                                    onClick={() => navigator("/mentor/apply")}
                                    className="mt-1 text-sm font-semibold text-[#176b5c] hover:underline"
                                >
                                    Become a mentor →
                                </button>

                            </div>

                        </div>

                    </section>

                </div>

            </div>
        </>
    );
};

export default Register;