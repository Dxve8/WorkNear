import { Link } from 'react-router-dom';
import { FiBriefcase, FiMapPin, FiMail } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="wn-footer"
      style={{
        background: 'linear-gradient(180deg, #0f172a 0%, #0c1222 100%)',
        color: '#e2e8f0',
        marginTop: 'auto',
      }}
    >
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-md-5">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div
                className="d-flex align-items-center justify-content-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
                }}
              >
                <FiBriefcase size={18} color="#fff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.03em' }}>
                WorkNear
              </span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 320, lineHeight: 1.7 }}>
              Hyperlocal employment platform connecting small businesses with nearby workers
              based on skills, availability, distance and real-world fit.
            </p>
          </div>

          <div className="col-6 col-md-2">
            <h6 style={{ fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>Product</h6>
            <ul className="list-unstyled" style={{ fontSize: '0.875rem' }}>
              <li className="mb-2">
                <Link to="/jobs" style={{ color: '#94a3b8', textDecoration: 'none' }}>Browse Jobs</Link>
              </li>
              <li className="mb-2">
                <Link to="/register" style={{ color: '#94a3b8', textDecoration: 'none' }}>For Seekers</Link>
              </li>
              <li className="mb-2">
                <Link to="/register" style={{ color: '#94a3b8', textDecoration: 'none' }}>For Businesses</Link>
              </li>
            </ul>
          </div>

          <div className="col-6 col-md-2">
            <h6 style={{ fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>Company</h6>
            <ul className="list-unstyled" style={{ fontSize: '0.875rem' }}>
              <li className="mb-2">
                <Link to="/about" style={{ color: '#94a3b8', textDecoration: 'none' }}>About</Link>
              </li>
              <li className="mb-2">
                <span style={{ color: '#94a3b8' }}>MCA Project</span>
              </li>
            </ul>
          </div>

          <div className="col-md-3">
            <h6 style={{ fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>Focus</h6>
            <div className="d-flex align-items-center gap-2 mb-2" style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              <FiMapPin size={14} /> Hyperlocal matching
            </div>
            <div className="d-flex align-items-center gap-2" style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              <FiMail size={14} /> Skills + Availability first
            </div>
          </div>
        </div>

        <hr style={{ borderColor: 'rgba(148,163,184,0.2)', margin: '2rem 0 1.25rem' }} />

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
            © {new Date().getFullYear()} WorkNear · Built as MCA MERN Project
          </p>
          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
            Find work nearby. Find workers who fit.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
