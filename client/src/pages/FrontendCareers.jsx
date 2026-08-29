import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, Clock, Award, Mail, ArrowRight, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import FrontendLayout from '../components/FrontendLayout';
import Loader from '../components/Loader';

const FrontendCareers = () => {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const itemsPerPage = 6;

  useEffect(() => {
    fetchCareers();
  }, []);

  const fetchCareers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/careers?status=Active');
      const data = await res.json();
      setCareers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching careers:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(careers.length / itemsPerPage) || 1;
  const currentOpenings = careers.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const handleApply = (career) => {
    const email = career.contactEmail || 'hr@lemoott.com';
    const subject = encodeURIComponent(`Application for ${career.title} - LEMO OTT`);
    const body = encodeURIComponent(
      `Hello HR Team,\n\nI am writing to apply for the position of ${career.title} at LEMO OTT.\n\nPlease find my resume attached.\n\nBest regards,`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <FrontendLayout>
      <div className="fe-career-pg">
        <div className="fe-career-hero">
          <div className="fe-career-hero-badge">
            <Briefcase size={14} />
            <span>JOIN OUR TEAM</span>
          </div>
          <h1>Shape The Future Of Streaming</h1>
          <p>
            At LEMO OTT, we are building world-class digital media and OTT streaming experiences. 
            Explore our open positions and grow your career with industry pioneers.
          </p>
        </div>

        <section className="fe-career-content">
          <div className="fe-career-container">
            <div className="fe-career-section-header">
              <div>
                <h2>CAREER OPENINGS</h2>
                <p className="fe-career-subtitle">
                  {loading ? 'Finding opportunities...' : `${careers.length} Position${careers.length === 1 ? '' : 's'} Available`}
                </p>
              </div>
              {totalPages > 1 && (
                <div className="fe-career-nav-btns">
                  <button
                    className="fe-nav-btn"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    aria-label="Previous"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    className="fe-nav-btn"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    aria-label="Next"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="fe-career-loading">
                <Loader size="medium" />
              </div>
            ) : careers.length === 0 ? (
              <div className="fe-career-empty">
                <div className="fe-career-empty-icon">
                  <CheckCircle2 size={44} color="#b3d332" />
                </div>
                <h3>No Open Positions At The Moment</h3>
                <p>We are always eager to meet exceptional talent. Feel free to submit an open resume to our HR team.</p>
                <a href="mailto:hr@lemoott.com?subject=General Application - LEMO OTT" className="fe-career-empty-btn">
                  Send Your Resume <Mail size={16} />
                </a>
              </div>
            ) : (
              <div className="fe-career-grid">
                {currentOpenings.map(job => (
                  <div key={job._id} className="fe-job-card">
                    <div className="fe-job-card-top">
                      <div className="fe-job-dept-row">
                        <span className="fe-job-dept-pill">{job.department || 'General'}</span>
                        <span className="fe-job-type-pill">{job.jobType || 'Full Time'}</span>
                      </div>
                      <h3>{job.title}</h3>
                    </div>

                    <div className="fe-job-details">
                      <div className="fe-job-detail-row">
                        <span className="fe-detail-label">Experience :</span>
                        <span className="fe-detail-val">{job.experience || '1-3 years'}</span>
                      </div>
                      <div className="fe-job-detail-row">
                        <span className="fe-detail-label">Location :</span>
                        <span className="fe-detail-val">{job.location || 'Kerala'}</span>
                      </div>
                      <div className="fe-job-detail-row">
                        <span className="fe-detail-label">Qualification :</span>
                        <span className="fe-detail-val">{job.qualification || 'Graduate'}</span>
                      </div>
                    </div>

                    {job.description && (
                      <p className="fe-job-desc-snippet">{job.description}</p>
                    )}

                    <div className="fe-job-card-footer">
                      <button className="fe-btn-apply" onClick={() => handleApply(job)}>
                        APPLY NOW <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Dots */}
            {totalPages > 1 && (
              <div className="fe-career-dots">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    className={`fe-dot ${currentPage === i ? 'active' : ''}`}
                    onClick={() => setCurrentPage(i)}
                    aria-label={`Page ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Contact HR Banner */}
            <div className="fe-career-contact-banner">
              <div className="fe-contact-banner-left">
                <h3>For more details, you can contact our HR at</h3>
                <p>Have inquiries about our interview process or benefits? Reach out directly.</p>
              </div>
              <a href="mailto:hr@lemoott.com" className="fe-contact-email-link">
                <Mail size={16} /> hr@lemoott.com
              </a>
            </div>
          </div>
        </section>

        <style dangerouslySetInnerHTML={{
          __html: `
          .fe-career-pg { background: #07080b; min-height: 100vh; color: #fff; padding-top: 90px; }
          .fe-career-hero { text-align: center; padding: 60px 20px 45px; max-width: 800px; margin: 0 auto; }
          .fe-career-hero-badge { display: inline-flex; align-items: center; gap: 7px; background: rgba(179,211,50,0.12); color: #b3d332; border: 1px solid rgba(179,211,50,0.3); padding: 5px 14px; border-radius: 20px; font-size: 0.76rem; font-weight: 700; letter-spacing: 1px; margin-bottom: 18px; }
          .fe-career-hero h1 { font-size: 2.5rem; font-weight: 800; color: #fff; margin: 0 0 16px; letter-spacing: -0.5px; }
          .fe-career-hero p { color: #999; font-size: 1.05rem; line-height: 1.6; margin: 0; }

          .fe-career-content { padding: 20px 20px 80px; }
          .fe-career-container { max-width: 1180px; margin: 0 auto; }
          .fe-career-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 1px solid #1a1d26; padding-bottom: 18px; }
          .fe-career-section-header h2 { font-size: 1.35rem; font-weight: 800; letter-spacing: 1.2px; margin: 0; color: #fff; }
          .fe-career-subtitle { color: #b3d332; font-size: 0.85rem; font-weight: 600; margin-top: 4px; }
          .fe-career-nav-btns { display: flex; gap: 8px; }
          .fe-nav-btn { width: 34px; height: 34px; border-radius: 50%; border: 1px solid #232733; background: #12141a; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
          .fe-nav-btn:hover:not(:disabled) { background: #b3d332; color: #000; border-color: #b3d332; }
          .fe-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }

          .fe-career-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 22px; margin-bottom: 35px; }
          .fe-job-card { background: #12141a; border: 1px solid #1f2330; border-radius: 12px; padding: 26px 24px; display: flex; flex-direction: column; transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; text-align: left; }
          .fe-job-card:hover { transform: translateY(-3px); border-color: rgba(179,211,50,0.4); box-shadow: 0 12px 30px rgba(0,0,0,0.4); }
          .fe-job-card-top { margin-bottom: 18px; }
          .fe-job-dept-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
          .fe-job-dept-pill { background: rgba(179,211,50,0.1); color: #b3d332; padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .fe-job-type-pill { color: #888; font-size: 0.75rem; font-weight: 600; }
          .fe-job-card h3 { font-size: 1.2rem; font-weight: 700; color: #fff; margin: 0; line-height: 1.35; letter-spacing: 0.2px; }

          .fe-job-details { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; background: rgba(255,255,255,0.02); padding: 12px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.04); }
          .fe-job-detail-row { display: flex; gap: 6px; font-size: 0.86rem; line-height: 1.4; }
          .fe-detail-label { color: #888; font-weight: 600; min-width: 105px; }
          .fe-detail-val { color: #eee; font-weight: 600; }

          .fe-job-desc-snippet { color: #aaa; font-size: 0.84rem; line-height: 1.5; margin: 0 0 20px; flex-grow: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

          .fe-job-card-footer { margin-top: auto; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); }
          .fe-btn-apply { background: #213559; color: #fff; border: 1px solid #334c7a; border-radius: 6px; padding: 10px 18px; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.8px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; text-transform: uppercase; transition: 0.2s; }
          .fe-btn-apply:hover { background: #b3d332; color: #000; border-color: #b3d332; }

          .fe-career-dots { display: flex; justify-content: center; gap: 6px; margin: 25px 0 40px; }
          .fe-dot { width: 22px; height: 4px; border-radius: 2px; border: none; background: #232733; cursor: pointer; transition: 0.25s; }
          .fe-dot.active { background: #b3d332; width: 34px; }

          .fe-career-contact-banner { background: linear-gradient(135deg, #151824 0%, #1e283d 100%); border: 1px solid #232a3e; border-radius: 12px; padding: 28px 32px; display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; margin-top: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
          .fe-contact-banner-left h3 { font-size: 1.15rem; font-weight: 700; color: #fff; margin: 0 0 6px; }
          .fe-contact-banner-left p { color: #999; font-size: 0.88rem; margin: 0; }
          .fe-contact-email-link { display: inline-flex; align-items: center; gap: 8px; color: #fff; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 0.92rem; text-decoration: none; transition: 0.2s; }
          .fe-contact-email-link:hover { background: #b3d332; color: #000; border-color: #b3d332; }

          .fe-career-empty { text-align: center; padding: 60px 20px; background: #12141a; border: 1px dashed #282c3c; border-radius: 12px; }
          .fe-career-empty-icon { margin-bottom: 16px; }
          .fe-career-empty h3 { font-size: 1.25rem; color: #fff; margin-bottom: 8px; }
          .fe-career-empty p { color: #888; font-size: 0.9rem; max-width: 500px; margin: 0 auto 20px; }
          .fe-career-empty-btn { display: inline-flex; align-items: center; gap: 8px; background: #b3d332; color: #000; font-weight: 700; padding: 10px 22px; border-radius: 6px; text-decoration: none; font-size: 0.85rem; }

          .fe-career-loading { display: flex; justify-content: center; padding: 80px 0; }

          @media (max-width: 768px) {
            .fe-career-hero h1 { font-size: 1.8rem; }
            .fe-career-contact-banner { flex-direction: column; text-align: center; }
            .fe-career-grid { grid-template-columns: 1fr; }
          }
          `
        }} />
      </div>
    </FrontendLayout>
  );
};

export default FrontendCareers;
