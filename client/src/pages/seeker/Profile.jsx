import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiEdit2, FiX, FiMapPin, FiUser, FiBriefcase,
  FiDollarSign, FiClock, FiCheckCircle, FiSave,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import LocationPicker from "../../components/common/LocationPicker";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const badge = (text, color = "var(--wn-primary)") => (
  <span
    key={text}
    style={{
      background: `${color}18`,
      color,
      fontSize: "0.75rem",
      fontWeight: 600,
      padding: "0.2rem 0.6rem",
      borderRadius: 20,
      display: "inline-block",
    }}
  >
    {text}
  </span>
);

/**
 * Seeker Profile Management View
 * Manages job candidate credentials, skill tags, shift availability matrices,
 * target compensation bounds, commute radius, and verified geo-location.
 */
const SeekerProfile = () => {
  const { user, profile, loadUser, updateProfileState } = useAuth();

  const emptyForm = {
    skills: "", education: "", experience: "", experienceYears: 0,
    expectedSalaryMin: 0, expectedSalaryMax: 0, jobPreference: "ANY",
    preferredRadius: 5, languages: "", bio: "", isStudent: false, availableToday: false,
    availability: DAYS.map((d) => ({ day: d, available: false, from: "16:00", to: "21:00" })),
  };

  const [form, setForm] = useState(emptyForm);
  const [location, setLocation] = useState({
    type: "Point", coordinates: [0, 0], address: "", locality: "", city: "",
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Populate form whenever profile/user data arrives
  const populateForm = () => {
    if (user?.location) {
      setLocation({
        type: "Point",
        coordinates: user.location.coordinates || [0, 0],
        address: user.location.address || "",
        locality: user.location.locality || "",
        city: user.location.city || "",
      });
    }
    if (profile) {
      setForm({
        skills: (profile.skills || []).join(", "),
        education: profile.education || "",
        experience: profile.experience || "",
        experienceYears: profile.experienceYears || 0,
        expectedSalaryMin: profile.expectedSalary?.min || 0,
        expectedSalaryMax: profile.expectedSalary?.max || 0,
        jobPreference: profile.jobPreference || "ANY",
        preferredRadius: profile.preferredRadius || 5,
        languages: (profile.languages || []).join(", "),
        bio: profile.bio || "",
        isStudent: profile.isStudent || false,
        availableToday: profile.availableToday || false,
        availability: profile.availability?.length
          ? DAYS.map((d) => {
              const existing = profile.availability.find((a) => a.day === d);
              return existing || { day: d, available: false, from: "16:00", to: "21:00" };
            })
          : DAYS.map((d) => ({ day: d, available: false, from: "16:00", to: "21:00" })),
      });
    }
  };

  useEffect(() => { populateForm(); }, [user, profile]); // eslint-disable-line

  const handleAvailChange = (idx, field, value) => {
    const newAvail = [...form.availability];
    newAvail[idx] = { ...newAvail[idx], [field]: value };
    setForm({ ...form, availability: newAvail });
  };

  const toggleSuggestedSkill = (skill) => {
    const currentList = form.skills.split(',').map((s) => s.trim()).filter(Boolean);
    const exists = currentList.some((s) => s.toLowerCase() === skill.toLowerCase());
    let updated;
    if (exists) {
      updated = currentList.filter((s) => s.toLowerCase() !== skill.toLowerCase());
    } else {
      updated = [...currentList, skill];
    }
    setForm({ ...form, skills: updated.join(', ') });
  };

  const applyAvailabilityPreset = (preset) => {
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const weekends = ['Saturday', 'Sunday'];

    const newAvail = form.availability.map((a) => {
      let isAvailable = false;
      if (preset === 'WEEKDAYS') isAvailable = weekdays.includes(a.day);
      else if (preset === 'WEEKENDS') isAvailable = weekends.includes(a.day);
      else if (preset === 'ALL') isAvailable = true;
      else if (preset === 'CLEAR') isAvailable = false;
      return { ...a, available: isAvailable };
    });
    setForm({ ...form, availability: newAvail });
  };

  const handleCancel = () => {
    populateForm(); // reset unsaved changes
    setEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasRealCoords = location.coordinates?.[0] !== 0 || location.coordinates?.[1] !== 0;
    if (!hasRealCoords) {
      toast("⚠️ Location not set — distance-based matching won't work until you add it", {
        duration: 4000,
        style: { background: "#fef3c7", color: "#92400e" },
      });
    }
    setSaving(true);
    try {
      const payload = {
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        education: form.education,
        experience: form.experience,
        experienceYears: Number(form.experienceYears),
        expectedSalary: { min: Number(form.expectedSalaryMin), max: Number(form.expectedSalaryMax) },
        jobPreference: form.jobPreference,
        preferredRadius: Number(form.preferredRadius),
        languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
        bio: form.bio,
        isStudent: form.isStudent,
        availableToday: form.availableToday,
        availability: form.availability,
        location,
      };
      const { data } = await api.put("/workers/profile", payload);
      updateProfileState(data.profile);
      toast.success("Profile updated!");
      await loadUser();
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  /* ─────────────────────────────────────────────────────────
     Derived display values
  ───────────────────────────────────────────────────────── */
  const skills = profile?.skills || [];
  const languages = profile?.languages || [];
  const locationLabel =
    user?.location?.locality || user?.location?.city || null;
  const hasProfile = !!(profile?.skills?.length || profile?.bio);
  const availDays = (profile?.availability || []).filter((a) => a.available);

  const card = {
    background: "var(--wn-surface)",
    borderRadius: 16,
    border: "1px solid var(--wn-border)",
    padding: "1.5rem",
    marginBottom: "1.25rem",
  };

  return (
    <div style={{ background: "var(--wn-bg)", minHeight: "80vh" }}>
      <div className="container py-4 py-md-5" style={{ maxWidth: 740 }}>

        {/* ── PROFILE HEADER CARD ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            ...card,
            marginBottom: "1.5rem",
            background: "linear-gradient(135deg, var(--wn-primary) 0%, #0d9488 100%)",
            color: "#fff",
            border: "none",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* decorative orb */}
          <div style={{
            position: "absolute", top: -30, right: -30,
            width: 120, height: 120, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }} />

          <div className="d-flex align-items-start justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              {/* Avatar */}
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.6rem", fontWeight: 800, color: "#fff",
                flexShrink: 0,
              }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>

              <div>
                <h2 style={{ fontWeight: 800, margin: 0, fontSize: "clamp(1.2rem, 3vw, 1.5rem)" }}>
                  {user?.name}
                </h2>
                <p style={{ margin: "2px 0 2px", opacity: 0.85, fontSize: "0.875rem" }}>
                  {user?.email}
                </p>
                {user?.phone && (
                  <p style={{ margin: "0 0 6px", opacity: 0.8, fontSize: "0.82rem" }}>
                    📞 {user.phone}
                  </p>
                )}
                <div className="d-flex flex-wrap gap-2 align-items-center" style={{ fontSize: "0.8rem" }}>
                  {locationLabel && (
                    <span style={{ opacity: 0.9 }}>
                      <FiMapPin size={12} className="me-1" />{locationLabel}
                    </span>
                  )}
                  {profile?.jobPreference && profile.jobPreference !== "ANY" && (
                    <span style={{
                      background: "rgba(255,255,255,0.18)", borderRadius: 20,
                      padding: "0.15rem 0.55rem", fontWeight: 600,
                    }}>
                      {profile.jobPreference.replace("_", " ")}
                    </span>
                  )}
                  {profile?.isStudent && (
                    <span style={{
                      background: "rgba(255,255,255,0.18)", borderRadius: 20,
                      padding: "0.15rem 0.55rem", fontWeight: 600,
                    }}>
                      Student
                    </span>
                  )}
                  {profile?.availableToday && (
                    <span style={{
                      background: "#d1fae5", color: "#065f46", borderRadius: 20,
                      padding: "0.15rem 0.55rem", fontWeight: 700, fontSize: "0.72rem",
                    }}>
                      ✓ Available Today
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!editing && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditing(true)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.35)",
                  borderRadius: 10,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  padding: "0.5rem 1rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexShrink: 0,
                }}
              >
                <FiEdit2 size={14} />
                Edit Profile
              </motion.button>
            )}
          </div>

          {/* Skills preview */}
          {skills.length > 0 && !editing && (
            <div className="d-flex flex-wrap gap-2 mt-3">
              {skills.slice(0, 8).map((s) => (
                <span key={s} style={{
                  background: "rgba(255,255,255,0.18)",
                  borderRadius: 20, fontSize: "0.78rem", fontWeight: 600,
                  padding: "0.2rem 0.65rem", color: "#fff",
                }}>
                  {s}
                </span>
              ))}
              {skills.length > 8 && (
                <span style={{
                  background: "rgba(255,255,255,0.12)",
                  borderRadius: 20, fontSize: "0.78rem",
                  padding: "0.2rem 0.65rem", color: "rgba(255,255,255,0.7)",
                }}>
                  +{skills.length - 8} more
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* ── VIEW MODE ── */}
        <AnimatePresence mode="wait">
          {!editing ? (
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              {!hasProfile ? (
                <div style={{ ...card, textAlign: "center", padding: "2.5rem" }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: "var(--wn-bg)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    margin: "0 auto 1rem",
                  }}>
                    <FiUser size={24} color="var(--wn-text-muted)" />
                  </div>
                  <h5 style={{ fontWeight: 700 }}>Your profile is empty</h5>
                  <p style={{ color: "var(--wn-text-muted)", fontSize: "0.9rem" }}>
                    Add your skills, availability and salary expectations so businesses can find you.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="btn btn-primary px-4"
                    onClick={() => setEditing(true)}
                  >
                    <FiEdit2 size={15} className="me-2" />Complete Profile
                  </motion.button>
                </div>
              ) : (
                <>
                  {/* Bio */}
                  {profile?.bio && (
                    <div style={card}>
                      <h6 style={{ fontWeight: 700, marginBottom: "0.6rem", color: "var(--wn-text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>About</h6>
                      <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.6 }}>{profile.bio}</p>
                    </div>
                  )}

                  {/* Details grid */}
                  <div style={card}>
                    <div className="row g-3">
                      {profile?.education && (
                        <div className="col-sm-6">
                          <small style={{ color: "var(--wn-text-muted)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>Education</small>
                          <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{profile.education}</p>
                        </div>
                      )}
                      {profile?.experienceYears > 0 && (
                        <div className="col-sm-6">
                          <small style={{ color: "var(--wn-text-muted)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>Experience</small>
                          <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{profile.experienceYears} year{profile.experienceYears !== 1 ? "s" : ""}</p>
                        </div>
                      )}
                      {(profile?.expectedSalary?.min || profile?.expectedSalary?.max) ? (
                        <div className="col-sm-6">
                          <small style={{ color: "var(--wn-text-muted)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>Expected Salary</small>
                          <p style={{ margin: "4px 0 0", fontWeight: 600 }}>
                            ₹{(profile.expectedSalary.min || 0).toLocaleString()} – ₹{(profile.expectedSalary.max || 0).toLocaleString()}
                          </p>
                        </div>
                      ) : null}
                      {profile?.preferredRadius && (
                        <div className="col-sm-6">
                          <small style={{ color: "var(--wn-text-muted)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>Preferred Radius</small>
                          <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{profile.preferredRadius} km</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Languages */}
                  {languages.length > 0 && (
                    <div style={card}>
                      <h6 style={{ fontWeight: 700, marginBottom: "0.75rem", color: "var(--wn-text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Languages</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {languages.map((l) => badge(l, "#0f766e"))}
                      </div>
                    </div>
                  )}

                  {/* Availability */}
                  {availDays.length > 0 && (
                    <div style={card}>
                      <h6 style={{ fontWeight: 700, marginBottom: "0.75rem", color: "var(--wn-text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Weekly Availability</h6>
                      <div className="d-flex flex-column gap-2">
                        {availDays.map((a) => (
                          <div key={a.day} className="d-flex align-items-center gap-3" style={{ fontSize: "0.9rem" }}>
                            <FiCheckCircle size={14} color="#10b981" />
                            <span style={{ fontWeight: 600, minWidth: 90 }}>{a.day}</span>
                            <span style={{ color: "var(--wn-text-muted)" }}>{a.from} – {a.to}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience summary */}
                  {profile?.experience && (
                    <div style={card}>
                      <h6 style={{ fontWeight: 700, marginBottom: "0.6rem", color: "var(--wn-text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Experience Summary</h6>
                      <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.6 }}>{profile.experience}</p>
                    </div>
                  )}

                  <div className="d-flex justify-content-end mt-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="btn btn-primary px-4"
                      onClick={() => setEditing(true)}
                    >
                      <FiEdit2 size={15} className="me-2" />Edit Profile
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>

          ) : (

            /* ── EDIT MODE ── */
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 style={{ fontWeight: 700, margin: 0 }}>Editing Profile</h5>
                <button
                  className="btn btn-sm"
                  onClick={handleCancel}
                  style={{ border: "1px solid var(--wn-border)", borderRadius: 8, color: "var(--wn-text-secondary)" }}
                >
                  <FiX size={14} className="me-1" />Cancel
                </button>
              </div>

              <form onSubmit={handleSubmit}>

                {/* Skills & Experience */}
                <div style={card}>
                  <h6 style={{ fontWeight: 700, marginBottom: "1rem" }}>
                    <FiBriefcase size={15} className="me-2" style={{ color: "var(--wn-primary)" }} />
                    Skills &amp; Experience
                  </h6>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>
                      Skills <span style={{ color: "var(--wn-text-muted)", fontWeight: 400 }}>(type or tap suggested tags below)</span>
                    </label>
                    <input className="form-control mb-2" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Excel, Billing, Customer Service" />
                    
                    {/* Suggested Skill Tags */}
                    <div className="d-flex flex-wrap gap-1 align-items-center mt-1">
                      <span style={{ fontSize: '0.75rem', color: 'var(--wn-text-muted)', marginRight: 4 }}>Quick Add:</span>
                      {['Billing', 'Cashier', 'Customer Service', 'Excel', 'Barista', 'Cooking', 'Delivery', 'Teaching', 'Retail Sales', 'Data Entry'].map((sk) => {
                        const isSelected = form.skills.split(',').map(s => s.trim().toLowerCase()).includes(sk.toLowerCase());
                        return (
                          <button
                            key={sk}
                            type="button"
                            onClick={() => toggleSuggestedSkill(sk)}
                            className="btn btn-sm"
                            style={{
                              borderRadius: 12,
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              padding: '0.15rem 0.55rem',
                              background: isSelected ? 'var(--wn-primary)' : 'var(--wn-bg)',
                              color: isSelected ? '#fff' : 'var(--wn-text-secondary)',
                              border: `1px solid ${isSelected ? 'var(--wn-primary)' : 'var(--wn-border)'}`,
                            }}
                          >
                            {isSelected ? `✓ ${sk}` : `+ ${sk}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>Education</label>
                      <input className="form-control" value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} placeholder="B.Com, 12th Pass, MCA..." />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>Experience (years)</label>
                      <input type="number" min="0" max="60" className="form-control" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>Experience Summary</label>
                    <textarea className="form-control" rows={2} value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="Brief description of your work history..." />
                  </div>
                  <div className="mt-3">
                    <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>Bio</label>
                    <textarea className="form-control" rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell businesses a little about yourself..." />
                  </div>
                </div>

                {/* Location */}
                <div style={card}>
                  <h6 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
                    <FiMapPin size={15} className="me-2" style={{ color: "var(--wn-primary)" }} />
                    Your Location
                  </h6>
                  <p style={{ fontSize: "0.82rem", color: "var(--wn-text-muted)", marginBottom: "1rem" }}>
                    Jobs within your {form.preferredRadius} km radius are highlighted as nearby.
                  </p>
                  <LocationPicker value={location} onChange={setLocation} />
                </div>

                {/* Preferences */}
                <div style={card}>
                  <h6 style={{ fontWeight: 700, marginBottom: "1rem" }}>
                    <FiDollarSign size={15} className="me-2" style={{ color: "var(--wn-primary)" }} />
                    Preferences
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>Salary Min (₹)</label>
                      <input type="number" className="form-control" value={form.expectedSalaryMin} onChange={(e) => setForm({ ...form, expectedSalaryMin: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>Salary Max (₹)</label>
                      <input type="number" className="form-control" value={form.expectedSalaryMax} onChange={(e) => setForm({ ...form, expectedSalaryMax: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>Preferred Radius (km)</label>
                      <input type="number" min="1" max="50" className="form-control" value={form.preferredRadius} onChange={(e) => setForm({ ...form, preferredRadius: e.target.value })} />
                    </div>
                  </div>
                  <div className="row g-3 mt-1">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>Job Preference</label>
                      <select className="form-select" value={form.jobPreference} onChange={(e) => setForm({ ...form, jobPreference: e.target.value })}>
                        <option value="ANY">Any</option>
                        <option value="PART_TIME">Part Time</option>
                        <option value="FULL_TIME">Full Time</option>
                        <option value="INTERNSHIP">Internship</option>
                        <option value="DAILY_WAGE">Daily Wage</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>Languages</label>
                      <input className="form-control" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} placeholder="Hindi, English" />
                    </div>
                  </div>
                  <div className="mt-3 d-flex flex-column gap-2">
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" id="isStudent" checked={form.isStudent} onChange={(e) => setForm({ ...form, isStudent: e.target.checked })} />
                      <label className="form-check-label" htmlFor="isStudent">I am a student</label>
                    </div>
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" id="availableToday" checked={form.availableToday} onChange={(e) => setForm({ ...form, availableToday: e.target.checked })} />
                      <label className="form-check-label" htmlFor="availableToday">Available today (for urgent jobs)</label>
                    </div>
                  </div>
                </div>

                {/* Weekly Availability */}
                <div style={card}>
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                    <h6 style={{ fontWeight: 700, margin: 0 }}>
                      <FiClock size={15} className="me-2" style={{ color: "var(--wn-primary)" }} />
                      Weekly Availability
                    </h6>
                    <div className="d-flex gap-1 flex-wrap">
                      {[
                        { key: 'WEEKDAYS', label: 'Mon–Fri' },
                        { key: 'WEEKENDS', label: 'Weekends' },
                        { key: 'ALL', label: 'All 7 Days' },
                        { key: 'CLEAR', label: 'Clear' },
                      ].map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => applyAvailabilityPreset(p.key)}
                          className="btn btn-sm"
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.5rem',
                            borderRadius: 6,
                            background: 'var(--wn-bg)',
                            border: '1px solid var(--wn-border)',
                            color: 'var(--wn-text-secondary)',
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {form.availability.map((a, idx) => (
                    <div key={a.day} className="row align-items-center g-2 mb-2 p-1 p-sm-2 rounded" style={{ background: a.available ? 'rgba(15, 118, 110, 0.04)' : 'transparent' }}>
                      <div className="col-12 col-sm-4">
                        <div className="form-check">
                          <input type="checkbox" className="form-check-input" checked={a.available} onChange={(e) => handleAvailChange(idx, "available", e.target.checked)} id={`day-${a.day}`} />
                          <label className="form-check-label" htmlFor={`day-${a.day}`} style={{ fontWeight: a.available ? 700 : 500, fontSize: "0.9rem" }}>{a.day}</label>
                        </div>
                      </div>
                      <div className="col-6 col-sm-4">
                        <div className="d-flex align-items-center gap-1">
                          <span style={{ fontSize: '0.75rem', color: 'var(--wn-text-muted)', flexShrink: 0 }}>From:</span>
                          <input type="time" className="form-control form-control-sm" value={a.from} disabled={!a.available} onChange={(e) => handleAvailChange(idx, "from", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-6 col-sm-4">
                        <div className="d-flex align-items-center gap-1">
                          <span style={{ fontSize: '0.75rem', color: 'var(--wn-text-muted)', flexShrink: 0 }}>To:</span>
                          <input type="time" className="form-control form-control-sm" value={a.to} disabled={!a.available} onChange={(e) => handleAvailChange(idx, "to", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Save / Cancel */}
                <div className="d-flex gap-3">
                  <motion.button
                    type="submit"
                    className="btn btn-primary btn-lg px-4"
                    disabled={saving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiSave size={16} className="me-2" />
                    {saving ? "Saving..." : "Save Profile"}
                  </motion.button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-lg"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default SeekerProfile;
