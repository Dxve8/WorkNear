import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiBell, FiCheckCircle, FiCheck, FiBriefcase, FiClock } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../services/api";

const typeIcon = (type) => {
  switch (type) {
    case "NEW_APPLICATION":   return <FiBriefcase size={16} color="#3b82f6" />;
    case "APPLICATION_STATUS": return <FiCheckCircle size={16} color="#10b981" />;
    case "JOB_CLOSED":        return <FiClock size={16} color="#ef4444" />;
    default:                  return <FiBell size={16} color="#f59e0b" />;
  }
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async (p = 1) => {
    try {
      const { data } = await api.get(`/notifications?page=${p}&limit=20`);
      setNotifications(data.notifications || []);
      setPages(data.pages || 1);
      setPage(data.page || 1);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      toast.error("Failed");
    }
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed");
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const card = {
    background: "var(--wn-surface)",
    borderRadius: 16,
    border: "1px solid var(--wn-border)",
    overflow: "hidden",
  };

  return (
    <div style={{ background: "var(--wn-bg)", minHeight: "80vh" }}>
      <div className="container py-4 py-md-5" style={{ maxWidth: 720 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 style={{ fontWeight: 800, letterSpacing: "-0.03em", margin: 0, fontSize: "clamp(1.4rem, 3vw, 1.75rem)" }}>
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p style={{ color: "var(--wn-primary)", fontWeight: 600, fontSize: "0.85rem", margin: "4px 0 0" }}>
                  {unreadCount} unread
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn btn-sm"
                onClick={markAllRead}
                style={{
                  background: "var(--wn-primary)", color: "#fff",
                  borderRadius: 10, fontWeight: 600, fontSize: "0.82rem",
                  padding: "0.45rem 1rem",
                }}
              >
                <FiCheck size={14} className="me-1" /> Mark all read
              </motion.button>
            )}
          </div>
        </motion.div>

        {loading ? (
          <div style={card}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3" style={{ borderBottom: "1px solid var(--wn-border)" }}>
                <div className="placeholder-glow">
                  <span className="placeholder col-8 mb-2" style={{ height: 14, borderRadius: 6 }}></span>
                  <span className="placeholder col-5" style={{ height: 12, borderRadius: 6 }}></span>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ ...card, textAlign: "center", padding: "3rem 1.5rem" }}>
            <FiBell size={40} color="var(--wn-text-muted)" style={{ marginBottom: 12 }} />
            <h5 style={{ fontWeight: 700 }}>No notifications yet</h5>
            <p style={{ color: "var(--wn-text-muted)", fontSize: "0.9rem" }}>
              When businesses respond to your applications or new jobs match your profile, you will see them here.
            </p>
          </motion.div>
        ) : (
          <>
            <div style={card}>
              <AnimatePresence>
                {notifications.map((n, idx) => (
                  <motion.div
                    key={n._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="d-flex align-items-start gap-3 px-3 py-3"
                    style={{
                      borderBottom: idx < notifications.length - 1 ? "1px solid var(--wn-border)" : "none",
                      background: n.isRead ? "transparent" : "rgba(15,118,110,0.04)",
                      cursor: n.jobId ? "pointer" : "default",
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: n.isRead ? "var(--wn-bg)" : "rgba(15,118,110,0.12)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: 2,
                    }}>
                      {typeIcon(n.type)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div>
                          <p style={{ fontWeight: n.isRead ? 500 : 700, margin: "0 0 2px", fontSize: "0.9rem" }}>
                            {n.jobId ? (
                              <Link to={`/jobs/${n.jobId}`} style={{ color: "inherit", textDecoration: "none" }}>
                                {n.title}
                              </Link>
                            ) : n.title}
                          </p>
                          <p style={{ fontSize: "0.82rem", color: "var(--wn-text-muted)", margin: 0 }}>
                            {n.message}
                          </p>
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "var(--wn-text-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                    </div>

                    {!n.isRead && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markRead(n._id); }}
                        style={{
                          background: "none", border: "none",
                          color: "var(--wn-primary)", cursor: "pointer",
                          padding: 4, flexShrink: 0,
                        }}
                        title="Mark as read"
                      >
                        <FiCheck size={16} />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {pages > 1 && (
              <div className="d-flex justify-content-center gap-2 mt-3">
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className="btn btn-sm"
                    onClick={() => { setLoading(true); fetchNotifications(p); }}
                    style={{
                      borderRadius: 8, fontWeight: 600, fontSize: "0.8rem",
                      background: p === page ? "var(--wn-primary)" : "var(--wn-surface)",
                      color: p === page ? "#fff" : "var(--wn-text-secondary)",
                      border: `1px solid ${p === page ? "var(--wn-primary)" : "var(--wn-border)"}`,
                      minWidth: 34,
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;
