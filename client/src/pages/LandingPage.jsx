import { Link } from 'react-router-dom';
import DarkModeToggle from '../components/DarkModeToggle';
import heroImage from '../assets/hero_image.png';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* ========== NAVBAR ========== */}
      <nav className="landing-nav">
        <Link to="/" className="logo">
          Study<span>Buddy</span>
        </Link>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How It Works</a></li>
          <li><a href="#testimonials">Testimonials</a></li>
          <li><Link to="/login">Log In</Link></li>
          <li><DarkModeToggle /></li>
          <li>
            <Link to="/register" className="nav-cta">Get Started</Link>
          </li>
        </ul>
      </nav>

      {/* ========== HERO ========== */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="dot"></span>
            AI-Powered Learning
          </div>
          <h1 className="hero-title">
            Your Academic <br />
            <span className="gradient-text">Companion</span>
          </h1>
          <p className="hero-subtitle">
            Transform your study sessions with AI-generated flashcards, quizzes, and summaries. 
            Master any subject faster with personalized learning tools built for high achievers.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn-primary hover:shadow-lg hover:shadow-blue-800" id="hero-cta-get-started">
              Start Studying Free →
            </Link>
          </div>
        </div>
        <div className="hero-image-container">
          <img src={heroImage} alt="Study Buddy Dashboard" className="hero-image" />
        </div>
      </section>

      {/* ========== STATS ========== */}
      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-value">2.4M+</div>
          <div className="stat-label">Flashcards Generated</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">85%</div>
          <div className="stat-label">Average Grade Improvement</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">50K+</div>
          <div className="stat-label">Active Students</div>
        </div>
      </div>

      {/* ========== FEATURES ========== */}
      <section className="features-section" id="features">
        <div className="section-label">Features</div>
        <h2 className="section-title">The Library of Precision</h2>
        <p className="section-subtitle">
          Every tool you need to transform raw notes into deep understanding — 
          powered by AI that adapts to how you learn.
        </p>
        <div className="features-grid">
          <div className="feature-card hover:shadow-lg hover:shadow-blue-800">
            <div className="feature-icon blue">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <h3>AI-Powered Summaries</h3>
            <p>Condense lengthy notes into crystal-clear summaries that capture the essence of every topic.</p>
          </div>
          <div className="feature-card hover:shadow-lg hover:shadow-blue-800">
            <div className="feature-icon purple">
              <span className="material-symbols-outlined">style</span>
            </div>
            <h3>Dynamic Flashcards</h3>
            <p>Auto-generated flashcards from your notes with spaced repetition to lock in long-term memory.</p>
          </div>
          <div className="feature-card hover:shadow-lg hover:shadow-blue-800">
            <div className="feature-icon teal">
              <span className="material-symbols-outlined">quiz</span>
            </div>
            <h3>Adaptive Quizzes</h3>
            <p>Test your knowledge with AI-crafted quizzes that adapt to your weak spots and track history.</p>
          </div>
          <div className="feature-card hover:shadow-lg hover:shadow-blue-800">
            <div className="feature-icon green">
              <span className="material-symbols-outlined">image</span>
            </div>
            <h3>Image Text Extraction</h3>
            <p>Upload photos of textbooks or handwritten notes — Vision AI extracts and organizes the text.</p>
          </div>
          <div className="feature-card hover:shadow-lg hover:shadow-blue-800">
            <div className="feature-icon amber">
              <span className="material-symbols-outlined">folder_open</span>
            </div>
            <h3>Subject Organization</h3>
            <p>Organize your studies by subject and topic with a clean, distraction-free workspace.</p>
          </div>
          <div className="feature-card hover:shadow-lg hover:shadow-blue-800">
            <div className="feature-icon rose">
              <span className="material-symbols-outlined">local_fire_department</span>
            </div>
            <h3>Streak Tracking</h3>
            <p>Stay motivated with daily study streaks and see your consistency build over time.</p>
          </div>
        </div>
      </section>

      {/* ========== CTA BANNER ========== */}
      <div className="cta-banner">
        <div className="cta-banner-text">
          <h2>Ready to elevate your grades?</h2>
          <p>Join thousands of students already using AI-powered tools to study smarter, not harder.</p>
        </div>
        <Link to="/register" className="btn-light" id="cta-banner-register">
          Start Studying Free →
        </Link>
      </div>

      {/* ========== HOW IT WORKS ========== */}
      <section className="steps-section" id="how-it-works">
        <div className="section-label">Process</div>
        <h2 className="section-title">From Chaos to Clarity</h2>
        <p className="section-subtitle" style={{ margin: '0 auto 0', maxWidth: 520 }}>
          Four simple steps to transform your study experience.
        </p>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number gradient-text">01</div>
            <h3>Create a Subject</h3>
            <p>Set up subjects that match your courses and organize everything in one place.</p>
          </div>
          <div className="step-card">
            <div className="step-number gradient-text">02</div>
            <h3>Add Your Notes</h3>
            <p>Type, paste, or upload images of your notes. Our Vision AI handles the rest.</p>
          </div>
          <div className="step-card">
            <div className="step-number gradient-text">03</div>
            <h3>Generate Study Tools</h3>
            <p>One click generates summaries, flashcards, and quizzes tailored to your content.</p>
          </div>
          <div className="step-card">
            <div className="step-number gradient-text">04</div>
            <h3>Master the Material</h3>
            <p>Study with adaptive tools, track your progress, and watch your grades climb.</p>
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className="testimonials-section" id="testimonials">
        <div className="section-label">Testimonials</div>
        <h2 className="section-title">Trusted by High Achievers</h2>
        <p className="section-subtitle" style={{ margin: '0 auto 0', maxWidth: 520 }}>
          See what students are saying about their Study Buddy experience.
        </p>

        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-stars">★★★★★</div>
            <blockquote>
              "The AI-generated flashcards are incredibly accurate. I went from cramming the night before to actually retaining information weeks later."
            </blockquote>
            <div className="testimonial-author">
              <div className="testimonial-avatar" style={{ background: '#0053db' }}>SP</div>
              <div>
                <div className="name">Sarah P.</div>
                <div className="role">Pre-Med, Stanford</div>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-stars">★★★★★</div>
            <blockquote>
              "I uploaded photos of my professor's whiteboard and Study Buddy turned them into organized notes with quizzes. Game changer."
            </blockquote>
            <div className="testimonial-author">
              <div className="testimonial-avatar" style={{ background: '#605c78' }}>MK</div>
              <div>
                <div className="name">Marcus K.</div>
                <div className="role">Engineering, MIT</div>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-stars">★★★★★</div>
            <blockquote>
              "The streak feature keeps me accountable. I've studied consistently for 45 days straight and my GPA jumped from 3.2 to 3.8."
            </blockquote>
            <div className="testimonial-author">
              <div className="testimonial-avatar" style={{ background: '#15803d' }}>AL</div>
              <div>
                <div className="name">Aisha L.</div>
                <div className="role">Business, NYU</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="landing-footer">
        <div className="footer-logo">
          Study<span>Buddy</span>
        </div>
        <ul className="footer-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How It Works</a></li>
          <li><a href="#testimonials">Testimonials</a></li>
        </ul>
        <div>© 2026 Study Buddy. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default LandingPage;
