import { useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

import Login from "./loginRegister/Login.jsx";
import Register from "./loginRegister/Register.jsx";
import Home from "./mentee/Home.jsx";
import GuestHome from "./guest/GuestHome.jsx";
import VerifyUser from "./loginRegister/VerifyUser.jsx";

import Admin from "./admin/AdminPanel.jsx";
import ApplyMentor from "./loginRegister/ApplyMentor.jsx";

import AcceptOrRejectMentors from "./admin/components/AcceptOrRejectMentors.jsx";
import MenteesAdmin from "./admin/components/Mentees.jsx";
import MentorProfile from "./admin/components/MentorProfile.jsx";
import DashboardAdmin from "./admin/components/Dashboard.jsx";

import Mentors from "./mentee/Mentors.jsx";
import Mentor_Profile from "./mentee/MentorProfile.jsx";
import MenteeSessions from "./mentee/Sessions.jsx";
import ApplyMentorship from "./mentee/ApplyMentorship.jsx";
import MenteeDashboard from "./mentee/MenteeDashboard.jsx";
import MenteeProfile from "./mentee/MenteeProfile.jsx";
import UserMessages from "./mentee/UserMessages.jsx";
import MenteeProfileAdmin from "./admin/components/MenteeProfile.jsx";
import CommunityDetail from "./mentee/CommunityDetail.jsx";
import SessionsAdmin from "./admin/components/SessionsAdmin.jsx";
import CommunitiesAdmin from "./admin/components/CommunitiesAdmin.jsx";
import MentorshipsAdmin from "./admin/components/MentorshipsAdmin.jsx";
import PaymentsAdmin from "./admin/components/PaymentsAdmin.jsx";
import ReportsAdmin from "./admin/components/ReportsAdmin.jsx";
import ReviewsAdmin from "./admin/components/ReviewsAdmin.jsx";
import SettingsAdmin from "./admin/components/SettingsAdmin.jsx";


/* =================================================
                    MENTOR PANEL
   ================================================= */

import MentorPanel from "./mentor/Mentor.jsx";
import MentorDashboard from "./mentor/MentorDashboard.jsx";
import MentorMentees from "./mentor/Mentees.jsx";
import MentorCommunity from "./mentor/Community.jsx";
import MentorSessions from "./mentor/Sessions.jsx";
import MentorMessages from "./mentor/Messages.jsx";
import MentorPayments from "./mentor/Payments.jsx";
import MentorReviews from "./mentor/Reviews.jsx";
import MentorSettings from "./mentor/Settings.jsx";


const App = () => {

  const location = useLocation();

  // Dismiss all active toasts whenever route changes
  useEffect(() => {
    toast.dismiss();
  }, [location.pathname]);


  const isAdminLoggedIn =
    !!localStorage.getItem("adminToken");

  const isUserLoggedIn =
    !!localStorage.getItem("userToken");


  return (
    <div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#333",
          },
        }}
      />


      <Routes>

        {/* =================================================
                    GUEST / AUTH
                ================================================= */}

        <Route
          path="/"
          element={<GuestHome />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/verify"
          element={<VerifyUser />}
        />


        {/* =================================================
                    MENTEE
                ================================================= */}

        <Route
          path="/home"
          element={<Home />}
        />

        <Route
          path="/mentors"
          element={<Mentors />}
        />

        {/* ⭐ EXISTING MENTOR PROFILE ⭐ */}

        <Route
          path="/MentorProfile/:id"
          element={<Mentor_Profile />}
        />
        <Route
          path="/mentor-profile/:id"
          element={<Mentor_Profile />}
        />
        <Route
          path="/mentor-profile"
          element={<Mentor_Profile />}
        />


        {/* Sessions & Community Google Meet */}
        <Route
          path="/sessions"
          element={<MenteeSessions />}
        />

        {/* Mentee Messages & Communities Dedicated Hub */}
        <Route
          path="/messages"
          element={<UserMessages />}
        />
        <Route
          path="/mentee/messages"
          element={<UserMessages />}
        />

        {/* Redirect obsolete apply-mentorship to mentors */}
        <Route
          path="/apply-mentorship/:id"
          element={<Navigate to="/mentors" replace />}
        />

        {/* Mentee Learning Dashboard & Profile */}
        <Route
          path="/mentee/dashboard"
          element={<MenteeDashboard />}
        />
        <Route
          path="/mentee/profile"
          element={<MenteeProfile />}
        />

        {/* Community Workspace & Live Chat */}
        <Route
          path="/community"
          element={<CommunityDetail />}
        />
        <Route
          path="/community/:id"
          element={<CommunityDetail />}
        />



        {/* =================================================
                    MENTOR
                ================================================= */}

        {/* Existing mentor display page - NOT CHANGED */}

        <Route
          path="/mentor"
          element={<MentorPanel />}
        >

          {/* Mentor Dashboard */}
          <Route
            index
            element={<MentorDashboard />}
          />

          {/* My Mentees */}
          <Route
            path="mentees"
            element={<MentorMentees />}
          />

          {/* My Community */}
          <Route
            path="community"
            element={<MentorCommunity />}
          />

          {/* Sessions */}
          <Route
            path="sessions"
            element={<MentorSessions />}
          />

          {/* Messages & 1-on-1 Direct Chat */}
          <Route
            path="messages"
            element={<MentorMessages />}
          />

          {/* Payments */}
          <Route
            path="payments"
            element={<MentorPayments />}
          />

          {/* Reviews */}
          <Route
            path="reviews"
            element={<MentorReviews />}
          />

          {/* Settings */}
          <Route
            path="settings"
            element={<MentorSettings />}
          />

        </Route>


        {/* Apply Mentor */}

        <Route
          path="/mentor/apply"
          element={<ApplyMentor />}
        />


        {/* =================================================
                    ADMIN
                ================================================= */}

        <Route
          path="/admin"
          element={<Admin />}
        >

          {/* Admin Dashboard */}

          <Route
            index
            element={<DashboardAdmin />}
          />


          {/* Mentor Approval */}

          <Route
            path="accept-reject-mentors"
            element={<AcceptOrRejectMentors />}
          />


          {/* Mentor Profile */}

          <Route
            path="find-mentors/:id"
            element={<MentorProfile />}
          />
          <Route
            path="mentors/:id"
            element={<MentorProfile />}
          />


          {/* Mentee Management */}

          <Route
            path="Mentees-Admin"
            element={<MenteesAdmin />}
          />
          <Route
            path="mentees"
            element={<MenteesAdmin />}
          />

          {/* Mentee Profile in Admin */}
          <Route
            path="mentees/:id"
            element={<MenteeProfileAdmin />}
          />
          <Route
            path="find-mentees/:id"
            element={<MenteeProfileAdmin />}
          />


          {/* Mentorships */}
          <Route
            path="mentorships"
            element={<MentorshipsAdmin />}
          />

          {/* Community */}
          <Route
            path="community"
            element={<CommunitiesAdmin />}
          />
          <Route
            path="communities"
            element={<CommunitiesAdmin />}
          />

          {/* Sessions */}
          <Route
            path="sessions"
            element={<SessionsAdmin />}
          />

          {/* Payments */}
          <Route
            path="payments"
            element={<PaymentsAdmin />}
          />

          {/* Reports */}
          <Route
            path="reports"
            element={<ReportsAdmin />}
          />

          {/* Reviews */}
          <Route
            path="reviews"
            element={<ReviewsAdmin />}
          />

          {/* Settings */}
          <Route
            path="settings"
            element={<SettingsAdmin />}
          />

        </Route>

      </Routes>

    </div>
  );
};

export default App;