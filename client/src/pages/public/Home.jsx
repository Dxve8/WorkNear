import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Tilt from 'react-parallax-tilt';
import { FiMapPin, FiClock, FiCheckCircle, FiUsers, FiBriefcase, FiArrowRight, FiStar, FiZap, FiTarget, FiNavigation, FiHeart, FiShield } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { fadeUp, staggerContainer } from '../../animations';

const Section = ({ children, className = '', style = {} }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: .12 });
  return (
    <motion.section ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={{ visible: { transition: { staggerChildren: .08 } } }} className={`wn-section ${className}`} style={style}>
      {children}
    </motion.section>
  );
};

/**
 * Public Landing / Homepage View
 * Highlights core platform value propositions, interactive search preview cards,
 * social proof, and quick registration prompts.
 */
const Home = () => {
  const { isAuthenticated, isSeeker, isBusiness } = useAuth();

  return (
    <div className="home-page" style={{ overflowX: 'hidden' }}>
      <section className="wn-hero">
        <div className="wn-hero-orb one" />
        <div className="wn-hero-orb two wn-float" />
        <div className="container wn-hero-content">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <motion.div
                className="wn-hero-copy"
                initial="hidden"
                animate="visible"
                variants={staggerContainer(0.12, 0.05)}
              >
                <motion.div custom={0} variants={fadeUp} className="d-flex flex-wrap gap-2 mb-4">
                  <span className="wn-mini-chip"><FiNavigation size={13} /> Built around your neighbourhood</span>
                  <span className="wn-mini-chip"><FiZap size={13} /> Smart matching</span>
                </motion.div>
                <motion.h1 custom={1} variants={fadeUp} className="wn-hero-title mb-4">Work that fits your life.<br /><span>Right around you.</span></motion.h1>
                <motion.p custom={2} variants={fadeUp} className="wn-hero-subtitle mb-4">Stop scrolling through endless listings. WorkNear helps people discover nearby work that fits their skills, schedule, distance and real life.</motion.p>
                <motion.div custom={3} variants={fadeUp} className="d-flex flex-wrap gap-3 mb-4">
                  {!isAuthenticated && <>
                    <motion.div whileHover={{ y: -3 }} whileTap={{ scale: .97 }}><Link to="/register" className="btn btn-light btn-lg px-4">Start exploring <FiArrowRight className="ms-1" /></Link></motion.div>
                    <motion.div whileHover={{ y: -3 }} whileTap={{ scale: .97 }}><Link to="/jobs" className="btn btn-lg px-4" style={{ color:'#fff', border:'1px solid rgba(255,255,255,.28)', background:'rgba(255,255,255,.08)', borderRadius:11, fontWeight:700 }}>See nearby jobs</Link></motion.div>
                  </>}
                  {isSeeker && <Link to="/seeker/recommended" className="btn btn-light btn-lg px-4">Show my best matches <FiArrowRight className="ms-1" /></Link>}
                  {isBusiness && <Link to="/business/post-job" className="btn btn-light btn-lg px-4">Find your next worker <FiArrowRight className="ms-1" /></Link>}
                </motion.div>
                <motion.div custom={4} variants={fadeUp} className="d-flex flex-wrap gap-4" style={{ color:'rgba(255,255,255,.7)', fontSize:'.82rem' }}>
                  <span><FiCheckCircle className="me-1" /> Free to get started</span>
                  <span><FiMapPin className="me-1" /> Hyperlocal</span>
                  <span><FiShield className="me-1" /> Explainable matches</span>
                </motion.div>
              </motion.div>
            </div>

            <div className="col-lg-6">
              <motion.div className="wn-hero-media" initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }} transition={{ duration:.8, delay:.15 }} style={{ overflow: 'hidden' }}>
                <div className="wn-photo-main" />
                <div className="wn-photo-secondary" />
                <Tilt className="wn-match-tilt" tiltMaxAngleX={7} tiltMaxAngleY={7} scale={1.025} glareEnable={false}>
                  <div className="wn-match-card wn-match-card-pulse">
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1"><span style={{ width:9,height:9,borderRadius:'50%',background:'#20bd82',boxShadow:'0 0 0 4px rgba(32,189,130,.12)' }} /><span style={{ fontSize:'.72rem',fontWeight:800,color:'#18a976' }}>GREAT MATCH</span></div>
                        <h5 style={{ fontWeight:800, margin:0, fontSize:'1.05rem' }}>Part-time Café Crew</h5>
                        <p style={{ color:'#73827f', fontSize:'.78rem', margin:0 }}>ABC Café · 1.8 km away</p>
                      </div>
                      <div className="wn-match-ring" />
                    </div>
                    <div className="d-flex flex-wrap gap-2 mt-3">
                      {['4 skills matched','4 PM–9 PM','Within 2 km'].map(t => <span key={t} style={{ background:'#f0faf7', color:'#13776f', padding:'.32rem .55rem', borderRadius:8, fontSize:'.68rem', fontWeight:700 }}>{t}</span>)}
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-3 pt-3" style={{ borderTop:'1px solid #edf2f0' }}>
                      <span style={{ fontSize:'.74rem', color:'#788783' }}>₹9k–₹11k / month</span>
                      <span style={{ fontSize:'.72rem', fontWeight:800, color:'#087f78' }}>Why this matches →</span>
                    </div>
                  </div>
                </Tilt>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <Section className="py-5" style={{ background:'#f7faf8' }}>
        <div className="container py-4">
          <motion.div variants={fadeUp} className="text-center mb-5">
            <span style={{ color:'#087f78',fontSize:'.75rem',fontWeight:800,letterSpacing:'.12em',textTransform:'uppercase' }}>Less searching. More doing.</span>
            <h2 className="section-title mt-2 mb-2" style={{ fontSize:'clamp(1.8rem,3vw,2.5rem)' }}>A job search that feels personal.</h2>
            <p className="text-secondary-wn mx-auto" style={{ maxWidth:570 }}>WorkNear turns a pile of listings into a short, useful feed of opportunities that actually make sense for you.</p>
          </motion.div>
          <div className="row g-4">
            {[
              { n:'01', icon:<FiMapPin size={23}/>, title:'Start with your world', text:'Tell us where you are, when you can work and what you can do. No corporate résumé required.' },
              { n:'02', icon:<FiTarget size={23}/>, title:'See the right opportunities', text:'Jobs are ranked around skills, availability, distance, salary and experience — not just keywords.' },
              { n:'03', icon:<FiHeart size={23}/>, title:'Save, apply, come back', text:'Keep favourites, follow your applications and discover new matches without starting over.' },
            ].map((item,i)=>(
              <div className="col-md-4" key={item.n}><motion.div variants={fadeUp} custom={i} className="wn-step-card wn-hover-lift">
                <div className="d-flex justify-content-between align-items-start mb-4"><div style={{ width:52,height:52,borderRadius:16,display:'grid',placeItems:'center',background:'linear-gradient(135deg,#e4f8f4,#f1fffb)',color:'#087f78' }}>{item.icon}</div><span className="wn-step-number">{item.n}</span></div>
                <h5 style={{ fontWeight:800, marginBottom:8 }}>{item.title}</h5><p style={{ color:'var(--wn-text-secondary)',fontSize:'.92rem',margin:0 }}>{item.text}</p>
              </motion.div></div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="py-5" style={{ background:'#fff' }}>
        <div className="container py-4">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6"><motion.div variants={fadeUp} className="wn-feature-image"><div className="wn-feature-label"><span className="badge mb-2" style={{ background:'rgba(255,255,255,.16)',border:'1px solid rgba(255,255,255,.25)' }}>LOCAL-FIRST</span><h3 style={{ fontWeight:800, fontSize:'clamp(1.8rem,3vw,2.6rem)', marginBottom:8 }}>The café down the street could be your next opportunity.</h3><p style={{ margin:0,color:'rgba(255,255,255,.8)' }}>Because the best job isn't always the biggest company. Sometimes it's the one you can reach in 10 minutes.</p></div></motion.div></div>
            <div className="col-lg-6"><motion.div variants={fadeUp} custom={1}>
              <span style={{ color:'#087f78',fontWeight:800,fontSize:'.76rem',letterSpacing:'.1em',textTransform:'uppercase' }}>Why WorkNear feels different</span>
              <h2 className="section-title mt-2 mb-3" style={{ fontSize:'clamp(1.8rem,3vw,2.5rem)' }}>Designed for real people, not perfect résumés.</h2>
              <p className="text-secondary-wn mb-4">Local hiring has different rules. Distance matters. Shift timings matter. Practical skills matter. WorkNear puts those signals first.</p>
              <div className="d-flex flex-column gap-3">
                {[{icon:<FiMapPin/>,t:'Distance first',d:'See opportunities you can realistically reach.'},{icon:<FiClock/>,t:'Availability first',d:'Match around classes, shifts and everyday schedules.'},{icon:<FiStar/>,t:'Skills first',d:'Show what you can actually do, not just job titles.'},{icon:<FiZap/>,t:'Urgent when it matters',d:'Surface businesses that need someone soon.'}].map(item=><div className="d-flex gap-3 align-items-center" key={item.t}><div style={{width:44,height:44,borderRadius:14,display:'grid',placeItems:'center',background:'#fff3dc',color:'#df951f',flexShrink:0}}>{item.icon}</div><div><div style={{fontWeight:800}}>{item.t}</div><div style={{fontSize:'.84rem',color:'var(--wn-text-secondary)'}}>{item.d}</div></div></div>)}
              </div>
            </motion.div></div>
          </div>
        </div>
      </Section>

      <Section className="py-5" style={{ background:'#f7faf8' }}>
        <div className="container py-4"><div className="row g-4 align-items-stretch">
          <div className="col-lg-7"><motion.div variants={fadeUp} className="wn-benefit-panel h-100"><div className="d-flex align-items-center gap-2 mb-3"><span style={{width:38,height:38,borderRadius:12,display:'grid',placeItems:'center',background:'#fff',color:'#087f78'}}><FiUsers/></span><h4 style={{fontWeight:800,margin:0}}>For job seekers</h4></div><div className="row g-3">{['Jobs within your radius','Match around your actual availability','See why a job fits you','Save jobs and track applications'].map(t=><div className="col-sm-6" key={t}><div className="d-flex gap-2 align-items-start" style={{fontSize:'.9rem'}}><FiCheckCircle style={{color:'#18a976',marginTop:3,flexShrink:0}}/>{t}</div></div>)}</div></motion.div></div>
          <div className="col-lg-5"><motion.div variants={fadeUp} custom={1} className="h-100 p-4 p-lg-5" style={{borderRadius:28,background:'#10211f',color:'#fff',boxShadow:'var(--wn-shadow-md)'}}><div style={{color:'#8de7dc',fontWeight:800,fontSize:'.75rem',letterSpacing:'.1em'}}>FOR LOCAL BUSINESSES</div><h3 style={{fontWeight:800,margin:'10px 0 12px'}}>Spend less time sorting CVs.</h3><p style={{color:'rgba(255,255,255,.68)',fontSize:'.9rem'}}>Reach nearby people who fit the shift, skills and practical needs of the role.</p><Link to="/register" className="btn btn-light mt-2">Start hiring <FiArrowRight className="ms-1"/></Link></motion.div></div>
        </div></div>
      </Section>

      <Section className="py-5" style={{ overflow: 'hidden' }}>
        <div className="container py-4"><motion.div variants={fadeUp} className="wn-cta text-center text-white" style={{ position: 'relative', overflow: 'hidden' }}><div className="wn-aurora-bg" /><div style={{position:'relative',zIndex:1}}><span style={{fontSize:'.76rem',fontWeight:800,letterSpacing:'.12em',color:'#b9f5ed'}}>YOUR NEXT LOCAL MOVE</span><h2 style={{fontWeight:800,fontSize:'clamp(2rem,4vw,3rem)',letterSpacing:'-.04em',margin:'8px 0 12px'}}>Ready to find your fit?</h2><p style={{color:'rgba(255,255,255,.75)',maxWidth:500,margin:'0 auto 26px'}}>Join WorkNear and make your next search smaller, smarter and closer to home.</p><div className="d-flex flex-wrap justify-content-center gap-3"><motion.div whileHover={{ y: -3 }} whileTap={{ scale: .97 }}><Link to="/register" className="btn btn-light btn-lg px-4">Create free account</Link></motion.div><motion.div whileHover={{ y: -3 }} whileTap={{ scale: .97 }}><Link to="/jobs" className="btn btn-lg px-4" style={{color:'#fff',border:'1px solid rgba(255,255,255,.35)',background:'rgba(255,255,255,.08)',borderRadius:11,fontWeight:700}}>Explore jobs</Link></motion.div></div></div></motion.div></div>
      </Section>
    </div>
  );
};

export default Home;
