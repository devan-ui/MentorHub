import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import api from "../api.js";

const initialForm = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    jobTitle: "",
    company: "",
    location: "",
    category: "",
    skills: "",
    bio: "",
    linkedin: "",
    website: "",
    whyMentor: "",
    achievement: "",
};

const steps = ["About you", "Profile", "Experience"];

const ApplyMentor = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [form, setForm] = useState(initialForm);
    const [profilePic, setProfilePic] = useState(null);
    const [preview, setPreview] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const update = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    /* Profile picture */
    const handleImage = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be less than 5MB.");
            return;
        }

        setProfilePic(file);
        setPreview(URL.createObjectURL(file));
    };

    const removeImage = () => {
        setProfilePic(null);
        setPreview("");
    };

    /* Refresh / close warning */
    useEffect(() => {
        const handleUnload = (e) => {
            if (!submitted) {
                e.preventDefault();
                e.returnValue = "";
            }
        };

        window.addEventListener("beforeunload", handleUnload);

        return () =>
            window.removeEventListener("beforeunload", handleUnload);
    }, [submitted]);

    /* Browser back warning */
    useEffect(() => {
        window.history.pushState(null, "", window.location.href);

        const handleBack = () => {
            if (submitted) {
                navigate(-1);
                return;
            }

            const leave = window.confirm(
                "Your form data will be lost. Are you sure you want to leave?"
            );

            if (leave) {
                navigate(-1);
            } else {
                window.history.pushState(null, "", window.location.href);
            }
        };

        window.addEventListener("popstate", handleBack);

        return () =>
            window.removeEventListener("popstate", handleBack);
    }, [navigate, submitted]);

    /* Required fields for each step */
    const requiredFields = {
        1: [
            "firstName",
            "lastName",
            "email",
            "password",
            "jobTitle",
            "company",
            "location",
        ],
        2: [
            "category",
            "skills",
            "bio",
            "linkedin",
            "website",
        ],
        3: ["whyMentor", "achievement"],
    };

    const isStepComplete = () =>
        requiredFields[step].every(
            (field) => form[field].trim() !== ""
        );

    const next = () => {
        if (!profilePic && step === 1) {
            toast.error("Please upload your profile picture.");
            return;
        }

        if (!isStepComplete()) {
            toast.error("Please complete all fields before continuing.");
            return;
        }

        if (step < 3) {
            setStep(step + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const back = () => {
        if (step > 1) {
            setStep(step - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    /* Submit */
    const submit = async (e) => {
        e.preventDefault();

        if (!isStepComplete()) {
            toast.error("Please complete all required fields.");
            return;
        }

        if (!profilePic) {
            toast.error("Please upload your profile picture.");
            setStep(1);
            return;
        }

        setLoading(true);

        try {
            const data = new FormData();

            Object.entries(form).forEach(([key, value]) => {
                data.append(key, value);
            });

            data.append("profilePic", profilePic);

            try {
                const res = await api.post("/mentor/apply", data);

                console.log(res.data);

                setSubmitted(true);

                toast.success("Mentor application submitted!");

                navigate("/mentor");
            } catch (error) {
                console.error(error);
                toast.error(
                    error.response?.data?.detail ||
                    "Failed to submit application."
                );
            }

        } catch (error) {
            console.error(error);

            toast.error(
                error.response?.data?.detail ||
                "Failed to submit application."
            );
        } finally {
            setLoading(false);
        }
    };

    const cancel = () => {
        const leave = window.confirm(
            "Your form data will be lost. Are you sure you want to leave?"
        );

        if (leave) navigate("/mentors");
    };

    return (
        <div className="min-h-screen bg-[#f5f3eb] px-4 py-8 sm:px-6">

            <Toaster position="top-right" />

            {/* HEADER */}
            <header className="mx-auto mb-8 flex max-w-4xl items-center justify-between">

                <Link to="/" className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#073b35] font-black text-white">
                        M
                    </div>

                    <span className="text-2xl font-bold tracking-tight text-[#073b35]">
                        MentorHub
                    </span>
                </Link>

                <Link
                    to="/mentors"
                    className="text-sm font-semibold text-[#16827a] hover:underline"
                >
                    Browse mentors
                </Link>

            </header>

            {/* MAIN CARD */}
            <main className="mx-auto max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-[0_25px_80px_rgba(10,45,40,0.12)]">

                {/* TITLE */}
                <div className="px-6 pt-8 sm:px-10 sm:pt-10">

                    <p className="mb-2 text-sm font-semibold text-[#16827a]">
                        Mentor application
                    </p>

                    <h1 className="font-serif text-4xl tracking-tight text-[#123b38] sm:text-5xl">
                        Become a mentor
                    </h1>

                    <p className="mt-3 max-w-xl leading-6 text-gray-500">
                        Share your experience, help others grow and become
                        part of the MentorHub community.
                    </p>

                </div>

                {/* STEPS */}
                <div className="px-6 pt-8 sm:px-10">

                    <div className="flex items-center">

                        {steps.map((name, index) => {
                            const number = index + 1;

                            return (
                                <React.Fragment key={name}>

                                    <div className="flex items-center gap-2">

                                        <div
                                            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${step >= number
                                                ? "bg-[#176b5c] text-white"
                                                : "bg-[#f1f5f2] text-gray-400"
                                                }`}
                                        >
                                            {step > number ? "✓" : number}
                                        </div>

                                        <span
                                            className={`hidden text-sm font-semibold sm:block ${step >= number
                                                ? "text-[#123b38]"
                                                : "text-gray-400"
                                                }`}
                                        >
                                            {name}
                                        </span>

                                    </div>

                                    {number !== 3 && (
                                        <div
                                            className={`mx-3 h-px flex-1 ${step > number
                                                ? "bg-[#176b5c]"
                                                : "bg-gray-200"
                                                }`}
                                        />
                                    )}

                                </React.Fragment>
                            );
                        })}

                    </div>

                </div>

                {/* FORM */}
                <form
                    onSubmit={submit}
                    className="px-6 pb-8 pt-8 sm:px-10 sm:pb-10"
                >

                    {/* STEP 1 */}
                    {step === 1 && (
                        <div className="space-y-5">

                            <SectionTitle
                                title="Tell us about yourself"
                                text="Start with some basic information about you."
                            />

                            {/* PROFILE PICTURE */}
                            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-5">

                                <div className="flex flex-col items-center gap-5 sm:flex-row">

                                    <div className="relative">

                                        {preview ? (
                                            <img
                                                src={preview}
                                                alt="Profile preview"
                                                className="h-28 w-28 rounded-full object-cover border-4 border-white shadow-md"
                                            />
                                        ) : (
                                            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#e8f2ed] text-3xl font-bold text-[#176b5c]">
                                                {form.firstName
                                                    ? form.firstName[0].toUpperCase()
                                                    : "M"}
                                            </div>
                                        )}

                                    </div>

                                    <div className="text-center sm:text-left">

                                        <h3 className="font-semibold text-[#123b38]">
                                            Profile picture
                                        </h3>

                                        <p className="mt-1 text-sm text-gray-500">
                                            Use a clear photo of yourself.
                                            JPG, PNG up to 5MB.
                                        </p>

                                        <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">

                                            <label className="cursor-pointer rounded-lg bg-[#176b5c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f594d]">
                                                {preview
                                                    ? "Change photo"
                                                    : "Upload photo"}

                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImage}
                                                    className="hidden"
                                                />
                                            </label>

                                            {preview && (
                                                <button
                                                    type="button"
                                                    onClick={removeImage}
                                                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-white"
                                                >
                                                    Remove
                                                </button>
                                            )}

                                        </div>

                                    </div>

                                </div>

                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">

                                <Input
                                    label="First name"
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={update}
                                    placeholder="Your first name"
                                />

                                <Input
                                    label="Last name"
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={update}
                                    placeholder="Your last name"
                                />

                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">

                                <Input
                                    label="Email address"
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={update}
                                    placeholder="you@example.com"
                                />

                                <Input
                                    label="Password"
                                    type="password"
                                    name="password"
                                    value={form.password}
                                    onChange={update}
                                    placeholder="Create a password"
                                />

                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">

                                <Input
                                    label="Job title"
                                    name="jobTitle"
                                    value={form.jobTitle}
                                    onChange={update}
                                    placeholder="e.g. Software Engineer"
                                />

                                <Input
                                    label="Company"
                                    name="company"
                                    value={form.company}
                                    onChange={update}
                                    placeholder="Company name"
                                />

                            </div>

                            <Select
                                label="Location"
                                name="location"
                                value={form.location}
                                onChange={update}
                                options={[
                                    "India",
                                    "United States",
                                    "United Kingdom",
                                    "Canada",
                                    "Australia",
                                    "Germany",
                                    "Other",
                                ]}
                            />

                        </div>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <div className="space-y-5">

                            <SectionTitle
                                title="Your expertise"
                                text="Tell mentees what you can help them with."
                            />

                            <Select
                                label="Category"
                                name="category"
                                value={form.category}
                                onChange={update}
                                options={[
                                    "Technology",
                                    "Software Development",
                                    "Business",
                                    "Marketing",
                                    "Design",
                                    "Finance",
                                    "Career",
                                    "Leadership",
                                ]}
                            />

                            <Input
                                label="Skills"
                                name="skills"
                                value={form.skills}
                                onChange={update}
                                placeholder="React, Python, Leadership..."
                            />

                            <TextArea
                                label="About you"
                                name="bio"
                                value={form.bio}
                                onChange={update}
                                placeholder="Tell mentees about your experience..."
                            />

                            <div className="grid gap-5 sm:grid-cols-2">

                                <Input
                                    label="LinkedIn"
                                    name="linkedin"
                                    value={form.linkedin}
                                    onChange={update}
                                    placeholder="https://linkedin.com/in/..."
                                />

                                <Input
                                    label="Website"
                                    name="website"
                                    value={form.website}
                                    onChange={update}
                                    placeholder="https://yourwebsite.com"
                                />

                            </div>

                        </div>
                    )}

                    {/* STEP 3 */}
                    {step === 3 && (
                        <div className="space-y-5">

                            <SectionTitle
                                title="Your experience"
                                text="A little more about your mentoring motivation."
                            />

                            <TextArea
                                label="Why do you want to become a mentor?"
                                name="whyMentor"
                                value={form.whyMentor}
                                onChange={update}
                                placeholder="Tell us why you want to mentor others..."
                            />

                            <TextArea
                                label="Greatest achievement"
                                name="achievement"
                                value={form.achievement}
                                onChange={update}
                                placeholder="Tell us about an achievement you are proud of..."
                            />

                        </div>
                    )}

                    {/* BUTTONS */}
                    <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">

                        {step > 1 ? (
                            <button
                                type="button"
                                onClick={back}
                                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                            >
                                ← Back
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={cancel}
                                className="text-sm font-semibold text-gray-400 hover:text-[#16827a]"
                            >
                                Cancel
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={next}
                                disabled={
                                    !isStepComplete() || !profilePic
                                }
                                className={`rounded-xl px-7 py-3 text-sm font-semibold text-white shadow-lg transition ${isStepComplete() && profilePic
                                    ? "bg-[#176b5c] shadow-[#176b5c]/15 hover:-translate-y-0.5 hover:bg-[#0f594d]"
                                    : "cursor-not-allowed bg-gray-300 shadow-none"
                                    }`}
                            >
                                Continue →
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={
                                    !isStepComplete() || loading
                                }
                                className={`rounded-xl px-7 py-3 text-sm font-semibold text-white shadow-lg transition ${isStepComplete() && !loading
                                    ? "bg-[#176b5c] shadow-[#176b5c]/15 hover:-translate-y-0.5 hover:bg-[#0f594d]"
                                    : "cursor-not-allowed bg-gray-300 shadow-none"
                                    }`}
                            >
                                {loading
                                    ? "Submitting..."
                                    : "Submit application"}
                            </button>
                        )}

                    </div>

                </form>

            </main>

            <p className="mx-auto mt-6 max-w-3xl text-center text-xs text-gray-400">
                By applying, you agree to MentorHub's{" "}
                <span className="underline">Terms</span> and{" "}
                <span className="underline">Privacy Policy</span>.
            </p>

        </div>
    );
};


/* INPUT */

const Input = ({
    label,
    type = "text",
    name,
    value,
    onChange,
    placeholder,
}) => (
    <div>
        <label className="mb-2 block text-sm font-semibold text-[#294642]">
            {label}
        </label>

        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required
            className="h-13 w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 text-[#123b38] outline-none transition-all placeholder:text-gray-400 focus:border-[#16827a] focus:bg-white focus:ring-4 focus:ring-[#16827a]/10"
        />
    </div>
);


/* SELECT */

const Select = ({
    label,
    name,
    value,
    onChange,
    options,
}) => (
    <div>
        <label className="mb-2 block text-sm font-semibold text-[#294642]">
            {label}
        </label>

        <select
            name={name}
            value={value}
            onChange={onChange}
            required
            className="h-13 w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 text-[#123b38] outline-none transition-all focus:border-[#16827a] focus:bg-white focus:ring-4 focus:ring-[#16827a]/10"
        >
            <option value="">
                Select {label.toLowerCase()}
            </option>

            {options.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
    </div>
);


/* TEXTAREA */

const TextArea = ({
    label,
    name,
    value,
    onChange,
    placeholder,
}) => (
    <div>
        <label className="mb-2 block text-sm font-semibold text-[#294642]">
            {label}
        </label>

        <textarea
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required
            rows={5}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/70 p-4 text-[#123b38] outline-none transition-all placeholder:text-gray-400 focus:border-[#16827a] focus:bg-white focus:ring-4 focus:ring-[#16827a]/10"
        />
    </div>
);


/* SECTION TITLE */

const SectionTitle = ({ title, text }) => (
    <div className="mb-7">
        <h2 className="font-serif text-2xl text-[#123b38]">
            {title}
        </h2>

        <p className="mt-1 text-sm leading-6 text-gray-500">
            {text}
        </p>
    </div>
);

export default ApplyMentor;