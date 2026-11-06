import { useState } from "react";
import { motion } from "framer-motion";
import { FiUser, FiLock, FiPhone, FiSave } from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const Settings = () => {
  const { user, loadUser } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) { toast.error("Name is required"); return; }
    setSavingProfile(true);
    try {
      await api.put("/auth/update-profile", {
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
      });
      toast.success("Profile updated!");
      await loadUser();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSavingPassword(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password changed successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Password change failed");
    } finally {
      setSavingPassword(false);
    }
  };

  const card = {
    background: "var(--wn-surface)",
    borderRadius: 16,
    border: "1px solid var(--wn-border)",
    padding: "1.5rem",
    marginBottom: "1.25rem",
  };

  return (
    <div style={{ background: "var(--wn-bg)", minHeight: "80vh" }}>
      <div className="container py-4 py-md-5" style={{ maxWidth: 620 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "1.5rem", fontSize: "clamp(1.4rem, 3vw, 1.75rem)" }}>
            Account Settings
          </h1>
        </motion.div>

        {/* Profile Info */}
        <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} onSubmit={handleProfileSubmit}>
          <div style={card}>
            <h6 style={{ fontWeight: 700, marginBottom: "1rem" }}>
              <FiUser size={15} className="me-2" style={{ color: "var(--wn-primary)" }} />
              Personal Information
            </h6>
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>Full Name</label>
              <input
                className="form-control"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>Email</label>
              <input className="form-control" value={user?.email || ""} disabled style={{ background: "var(--wn-bg)" }} />
              <small className="text-muted">Email cannot be changed</small>
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>
                <FiPhone size={13} className="me-1" /> Phone Number
              </label>
              <input
                className="form-control"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="e.g. 9876543210"
              />
            </div>
            <motion.button
              type="submit"
              className="btn btn-primary"
              disabled={savingProfile}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiSave size={14} className="me-2" />
              {savingProfile ? "Saving..." : "Save Changes"}
            </motion.button>
          </div>
        </motion.form>

        {/* Change Password */}
        <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} onSubmit={handlePasswordSubmit}>
          <div style={card}>
            <h6 style={{ fontWeight: 700, marginBottom: "1rem" }}>
              <FiLock size={15} className="me-2" style={{ color: "var(--wn-primary)" }} />
              Change Password
            </h6>
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>Current Password</label>
              <input
                type="password"
                className="form-control"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>New Password</label>
              <input
                type="password"
                className="form-control"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
                minLength={8}
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>Confirm New Password</label>
              <input
                type="password"
                className="form-control"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
              />
            </div>
            <motion.button
              type="submit"
              className="btn btn-outline-danger"
              disabled={savingPassword}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiLock size={14} className="me-2" />
              {savingPassword ? "Changing..." : "Change Password"}
            </motion.button>
          </div>
        </motion.form>

        <p style={{ color: "var(--wn-text-muted)", fontSize: "0.8rem", marginTop: "0.5rem" }}>
          Role: <strong>{user?.role?.replace("_", " ")}</strong> · Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
        </p>
      </div>
    </div>
  );
};

export default Settings;
