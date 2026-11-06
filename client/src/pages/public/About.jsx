import { motion } from "framer-motion";
import { FiBriefcase, FiMapPin, FiUsers, FiCpu, FiDatabase, FiCode, FiLayers, FiZap } from "react-icons/fi";

const features = [
  { icon: <FiMapPin size={22} />, title: "Hyperlocal Matching", desc: "Jobs matched by distance using Haversine formula on real GPS coordinates. Your preferred radius controls what appears." },
  { icon: <FiCpu size={22} />, title: "AI-Powered Scoring", desc: "TF-IDF cosine similarity + Porter stemming on skills, bio and job descriptions. Six weighted factors produce a 0-100 match score." },
  { icon: <FiUsers size={22} />, title: "Dual Dashboards", desc: "Seekers see recommended jobs, match scores and application status. Businesses see applicants, shortlist candidates and track hiring." },
  { icon: <FiZap size={22} />, title: "Real-Time Availability", desc: "Workers set per-day time slots. The engine checks actual minute overlap against job shift times, not just day availability." },
];

const techStack = [
  { icon: <FiCode size={18} />, name: "React + Vite", detail: "Frontend SPA with Framer Motion animations" },
  { icon: <FiDatabase size={18} />, name: "MongoDB + Mongoose", detail: "Document database with geospatial indexes" },
  { icon: <FiLayers size={18} />, name: "Node.js + Express", detail: "RESTful API with JWT authentication" },
  { icon: <FiCpu size={18} />, name: "TF-IDF (natural)", detail: "NLP-based skill and text matching engine" },
];

const About = () => {
  const card = {
    background: "var(--wn-surface)",
    borderRadius: 16,
    border: "1px solid var(--wn-border)",
    padding: "1.5rem",
  };

  return (
    <div style={{ background: "var(--wn-bg)", minHeight: "80vh" }}>
      <div className="container py-4 py-md-5" style={{ maxWidth: 860 }}>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-5">
          <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg, #0f766e, #14b8a6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <FiBriefcase size={24} color="#fff" />
            </div>
          </div>
          <h1 style={{ fontWeight: 800, letterSpacing: "-0.03em", fontSize: "clamp(1.6rem, 4vw, 2.2rem)" }}>
            About WorkNear
          </h1>
          <p style={{ color: "var(--wn-text-secondary)", fontSize: "1.05rem", maxWidth: 600, margin: "0.75rem auto 0", lineHeight: 1.7 }}>
            WorkNear is a hyperlocal employment and workforce matching platform connecting small and local businesses with nearby job seekers — built as an MCA (Masters in Computer Applications) project.
          </p>
        </motion.div>

        {/* Mission */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ ...card, marginBottom: "1.5rem" }}>
          <h4 style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Our Mission</h4>
          <p style={{ color: "var(--wn-text-secondary)", lineHeight: 1.75, margin: 0, fontSize: "0.95rem" }}>
            Most job platforms focus on white-collar city-wide hiring. WorkNear focuses on the other 90% — local shops, cafes, salons, warehouses and small offices that need workers <strong>within walking or commuting distance</strong>.
            Instead of showing hundreds of irrelevant listings, WorkNear ranks jobs using a multi-factor matching engine that considers skills, distance, salary, experience, availability and job-type preference. The result: seekers see fewer, better-matched jobs, and businesses find candidates who can actually show up.
          </p>
        </motion.div>

        {/* Features */}
        <h4 style={{ fontWeight: 700, marginBottom: "1rem" }}>Key Features</h4>
        <div className="row g-3 mb-4">
          {features.map((f, i) => (
            <div className="col-md-6" key={i}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.04 }} style={{ ...card, height: "100%" }}>
                <div className="d-flex align-items-center gap-2 mb-2" style={{ color: "var(--wn-primary)" }}>
                  {f.icon}
                  <h6 style={{ fontWeight: 700, margin: 0 }}>{f.title}</h6>
                </div>
                <p style={{ color: "var(--wn-text-secondary)", fontSize: "0.88rem", margin: 0, lineHeight: 1.65 }}>
                  {f.desc}
                </p>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Tech Stack */}
        <h4 style={{ fontWeight: 700, marginBottom: "1rem" }}>Tech Stack</h4>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={card}>
          <div className="row g-3">
            {techStack.map((t, i) => (
              <div className="col-sm-6" key={i}>
                <div className="d-flex align-items-center gap-3">
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: "rgba(15,118,110,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--wn-primary)", flexShrink: 0,
                  }}>
                    {t.icon}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, margin: 0, fontSize: "0.9rem" }}>{t.name}</p>
                    <p style={{ color: "var(--wn-text-muted)", margin: 0, fontSize: "0.8rem" }}>{t.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer note */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="text-center mt-4"
          style={{ color: "var(--wn-text-muted)", fontSize: "0.85rem" }}
        >
          Built with ❤️ as an MCA MERN Stack project · © {new Date().getFullYear()} WorkNear
        </motion.p>
      </div>
    </div>
  );
};

export default About;
