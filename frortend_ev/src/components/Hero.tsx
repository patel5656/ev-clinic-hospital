import { useNavigate } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import heroDashboard from '../assets/hero-dashboard-new.png';
import './Hero.css';

const Hero = () => {
    const navigate = useNavigate();

    return (
        <section id="home" className="hero">
            <div className="container">
                <div className="hero-content">
                    {/* Text Content */}
                    <div className="hero-text">
                        <h1 className="hero-title fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <span className="title-boxed">Exclusive Vision – Clinic System</span>
                        </h1>
                        <p className="hero-subtitle lead-text fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <span className="subtitle-boxed">A dedicated software solution designed specifically for clinics to manage daily operations digitally.</span>
                        </p>
                        <div className="hero-cta fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <button className="btn btn-primary btn-large" onClick={() => navigate('/login')}>
                                Get Started
                                <FiArrowRight style={{ marginLeft: '0.5rem' }} />
                            </button>
                        </div>

                        {/* Trust Indicators */}
                        <div className="hero-stats fade-in-up" style={{ animationDelay: '0.4s' }}>
                            <div className="stat-item scale-in" style={{ animationDelay: '0.5s' }}>
                                <h3 className="stat-number">500+</h3>
                                <p className="stat-label">Clinics Trust Us</p>
                            </div>
                            <div className="stat-item scale-in" style={{ animationDelay: '0.6s' }}>
                                <h3 className="stat-number">99.9%</h3>
                                <p className="stat-label">Uptime</p>
                            </div>
                            <div className="stat-item scale-in" style={{ animationDelay: '0.7s' }}>
                                <h3 className="stat-number">24/7</h3>
                                <p className="stat-label">Support</p>
                            </div>
                        </div>
                    </div>

                    {/* Hero Image */}
                    <div className="hero-image slide-in-right" style={{ animationDelay: '0.2s' }}>
                        <div className="image-wrapper float-animation">
                            <img src={heroDashboard} alt="EV Clinic Management Dashboard" />
                            <div className="image-glow"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Decoration */}
            <div className="hero-bg-decoration"></div>
        </section>
    );
};

export default Hero;
