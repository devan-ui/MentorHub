import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import api from "../api.js";

const OTP_DURATION = 300;

const VerifyUser = () => {
    const [otpDigits, setOtpDigits] = useState([
        "", "", "", "", "", ""
    ]);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(OTP_DURATION);
    const [canResend, setCanResend] = useState(false);

    const inputRefs = useRef([]);

    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email || "";

    // ==============================
    // COUNTDOWN TIMER
    // ==============================

    useEffect(() => {
        if (timeLeft <= 0) {
            setCanResend(true);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    // ==============================
    // FORMAT TIMER
    // ==============================

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;

        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    // ==============================
    // HANDLE OTP INPUT
    // ==============================

    const handleDigitChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newDigits = [...otpDigits];

        newDigits[index] = value.slice(-1);

        setOtpDigits(newDigits);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // ==============================
    // BACKSPACE
    // ==============================

    const handleKeyDown = (index, e) => {
        if (
            e.key === "Backspace" &&
            !otpDigits[index] &&
            index > 0
        ) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // ==============================
    // PASTE OTP
    // ==============================

    const handlePaste = (e) => {
        e.preventDefault();

        const pastedData = e.clipboardData
            .getData("text")
            .trim();

        if (/^\d{6}$/.test(pastedData)) {
            const digits = pastedData.split("");

            setOtpDigits(digits);

            inputRefs.current[5]?.focus();
        }
    };

    // ==============================
    // VERIFY OTP
    // ==============================

    const handleSubmit = async (e) => {
        e.preventDefault();

        const fullOtp = otpDigits.join("");

        if (!email) {
            toast.error(
                "Email reference missing. Please register again."
            );

            navigate("/register");
            return;
        }

        if (timeLeft <= 0) {
            toast.error(
                "OTP has expired. Please request a new one."
            );

            return;
        }

        if (fullOtp.length < 6) {
            toast.error("Please enter all 6 digits.");
            return;
        }

        setLoading(true);

        try {
            const res = await api.post("/verify-otp", {
                email,
                otp: fullOtp,
            });

            toast.success(
                res.data.message ||
                    "Account verified successfully!"
            );

            setTimeout(() => {
                navigate("/login");
            }, 1200);
        } catch (err) {
            const errorMessage =
                err.response?.data?.detail ||
                "OTP verification failed";

            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ==============================
    // RESEND OTP
    // ==============================

    const handleResendOtp = async () => {
        if (!email) {
            toast.error(
                "Email reference missing. Please register again."
            );

            return;
        }

        setResendLoading(true);

        try {
            const res = await api.post("/resend-otp", {
                email,
            });

            toast.success(
                res.data.message ||
                    "New OTP sent to your email!"
            );

            setTimeLeft(OTP_DURATION);
            setCanResend(false);

            setOtpDigits([
                "", "", "", "", "", ""
            ]);

            inputRefs.current[0]?.focus();
        } catch (err) {
            const errorMessage =
                err.response?.data?.detail ||
                "Failed to resend OTP";

            toast.error(errorMessage);
        } finally {
            setResendLoading(false);
        }
    };

    const isComplete = otpDigits.every(
        (digit) => digit !== ""
    );

    return (
        <div className="min-h-screen bg-[#f5f3eb] flex items-center justify-center p-4 sm:p-6">

            <Toaster position="top-right" />

            {/* =========================================
                MAIN CARD
            ========================================= */}

            <div className="w-full max-w-6xl min-h-[680px] bg-white rounded-[28px] overflow-hidden shadow-[0_25px_80px_rgba(10,45,40,0.15)] grid lg:grid-cols-[0.9fr_1.1fr]">

                {/* =====================================
                    LEFT BRAND PANEL
                ====================================== */}

                <div className="relative hidden lg:flex overflow-hidden bg-[#073b35] text-white p-12 xl:p-16 flex-col justify-between">

                    {/* Decorative circles */}

                    <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full border border-white/10" />

                    <div className="absolute top-20 -right-28 w-72 h-72 rounded-full border border-emerald-200/10" />

                    <div className="absolute bottom-[-150px] left-[-80px] w-[420px] h-[420px] rounded-full bg-emerald-400/10" />

                    <div className="absolute top-[45%] right-[-100px] w-64 h-64 rounded-full bg-teal-300/10 blur-2xl" />

                    {/* Logo */}

                    <div className="relative z-10 flex items-center gap-3">

                        <div className="w-11 h-11 rounded-2xl bg-[#dcefe5] text-[#073b35] flex items-center justify-center text-xl font-black">
                            M
                        </div>

                        <span className="text-2xl font-bold tracking-tight">
                            MentorHub
                        </span>

                    </div>

                    {/* Main content */}

                    <div className="relative z-10 max-w-md">

                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/5 text-sm text-emerald-100 mb-7">

                            <span className="w-2 h-2 rounded-full bg-emerald-300" />

                            Almost there

                        </div>

                        <h1 className="font-serif text-5xl xl:text-6xl leading-[1.05] tracking-tight">

                            Verify your
                            <span className="block text-emerald-300">
                                email address.
                            </span>

                        </h1>

                        <p className="mt-6 text-base xl:text-lg leading-8 text-emerald-50/70">

                            One small step before you continue.
                            Enter the verification code we sent
                            to your email and start your mentorship
                            journey with MentorHub.

                        </p>

                        {/* Benefits */}

                        <div className="mt-9 space-y-4">

                            <div className="flex items-center gap-4">

                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
                                    ✓
                                </div>

                                <span className="text-sm text-white/85">
                                    Keep your account secure
                                </span>

                            </div>

                            <div className="flex items-center gap-4">

                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
                                    ✓
                                </div>

                                <span className="text-sm text-white/85">
                                    Verify your email in seconds
                                </span>

                            </div>

                            <div className="flex items-center gap-4">

                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
                                    ✓
                                </div>

                                <span className="text-sm text-white/85">
                                    Continue your journey with MentorHub
                                </span>

                            </div>

                        </div>

                    </div>

                    {/* Bottom */}

                    <div className="relative z-10 flex items-center gap-3 text-sm text-white/50">

                        <div className="flex -space-x-2">

                            <div className="w-8 h-8 rounded-full bg-[#d6b79c] border-2 border-[#073b35]" />

                            <div className="w-8 h-8 rounded-full bg-[#8ebcae] border-2 border-[#073b35]" />

                            <div className="w-8 h-8 rounded-full bg-[#b8a3c9] border-2 border-[#073b35]" />

                        </div>

                        <span>
                            A community built around growth
                        </span>

                    </div>

                </div>

                {/* =====================================
                    RIGHT VERIFY PANEL
                ====================================== */}

                <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-16 xl:px-20">

                    {/* Mobile Logo */}

                    <div className="lg:hidden flex items-center justify-center gap-3 mb-9">

                        <div className="w-10 h-10 rounded-xl bg-[#073b35] text-white flex items-center justify-center font-black">
                            M
                        </div>

                        <span className="text-2xl font-bold text-[#073b35]">
                            MentorHub
                        </span>

                    </div>

                    <div className="w-full max-w-md mx-auto">

                        {/* =================================
                            HEADER
                        ================================== */}

                        <div className="mb-8">

                            <p className="text-sm font-semibold text-[#16827a] mb-3">
                                Account verification
                            </p>

                            <h2 className="font-serif text-4xl sm:text-5xl text-[#123b38] tracking-tight">

                                Verify your email

                            </h2>

                            <p className="mt-3 text-gray-500 leading-6">

                                We've sent a 6-digit verification
                                code to your email address.

                            </p>

                        </div>

                        {/* Email box */}

                        <div className="mb-7 p-4 rounded-xl bg-[#f1f5f2] border border-[#e3ebe6]">

                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                Verification email
                            </p>

                            <p className="text-sm font-semibold text-[#123b38] break-all">
                                {email || "your email address"}
                            </p>

                        </div>

                        {/* =================================
                            OTP FORM
                        ================================== */}

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-6"
                        >

                            <div>

                                <div className="flex items-center justify-between mb-3">

                                    <label className="text-sm font-semibold text-[#294642]">
                                        Enter verification code
                                    </label>

                                    <span
                                        className={`text-sm font-semibold ${
                                            timeLeft > 60
                                                ? "text-[#16827a]"
                                                : "text-red-500"
                                        }`}
                                    >
                                        {timeLeft > 0
                                            ? formatTime(timeLeft)
                                            : "Expired"}
                                    </span>

                                </div>

                                {/* OTP boxes */}

                                <div
                                    className="flex justify-between gap-2"
                                    onPaste={handlePaste}
                                >

                                    {otpDigits.map(
                                        (digit, index) => (
                                            <input
                                                key={index}
                                                ref={(el) =>
                                                    (inputRefs.current[
                                                        index
                                                    ] = el)
                                                }
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                disabled={
                                                    timeLeft <= 0
                                                }
                                                onChange={(e) =>
                                                    handleDigitChange(
                                                        index,
                                                        e.target.value
                                                    )
                                                }
                                                onKeyDown={(e) =>
                                                    handleKeyDown(
                                                        index,
                                                        e
                                                    )
                                                }
                                                className="w-[48px] sm:w-[54px] h-[58px] text-center text-xl sm:text-2xl font-bold font-mono rounded-xl border border-gray-200 bg-gray-50/70 text-[#123b38] outline-none transition-all focus:bg-white focus:border-[#16827a] focus:ring-4 focus:ring-[#16827a]/10 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            />
                                        )
                                    )}

                                </div>

                            </div>

                            {/* Verify button */}

                            <button
                                type="submit"
                                disabled={
                                    loading ||
                                    timeLeft <= 0 ||
                                    !isComplete
                                }
                                className="w-full h-12 rounded-xl bg-[#176b5c] hover:bg-[#0f594d] text-white font-semibold shadow-lg shadow-[#176b5c]/15 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >

                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">

                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />

                                        Verifying...

                                    </span>
                                ) : (
                                    "Verify email"
                                )}

                            </button>

                        </form>

                        {/* =================================
                            RESEND
                        ================================== */}

                        <div className="text-center mt-6">

                            <p className="text-sm text-gray-500">

                                Didn't receive the code?{" "}

                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={
                                        !canResend ||
                                        resendLoading
                                    }
                                    className={`font-bold transition-all ${
                                        canResend &&
                                        !resendLoading
                                            ? "text-[#16827a] hover:text-[#0b5d57] hover:underline cursor-pointer"
                                            : "text-gray-400 cursor-not-allowed"
                                    }`}
                                >

                                    {resendLoading
                                        ? "Resending..."
                                        : "Resend code"}

                                </button>

                            </p>

                            {!canResend &&
                                timeLeft > 0 && (
                                    <p className="text-xs text-gray-400 mt-2">
                                        You can request a new code
                                        after the timer expires.
                                    </p>
                                )}

                        </div>

                        {/* Divider */}

                        <div className="flex items-center gap-4 my-7">

                            <div className="flex-1 h-px bg-gray-200" />

                            <span className="text-xs font-medium text-gray-400">
                                OR
                            </span>

                            <div className="flex-1 h-px bg-gray-200" />

                        </div>

                        {/* Back */}

                        <p className="text-center text-sm text-gray-500">

                            Wrong email address?{" "}

                            <Link
                                to="/register"
                                className="font-bold text-[#16827a] hover:text-[#0b5d57] hover:underline"
                            >
                                Back to registration
                            </Link>

                        </p>

                        {/* Footer */}

                        <p className="text-center text-xs text-gray-400 mt-8">

                            Your verification code expires after
                            5 minutes for your security.

                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default VerifyUser;