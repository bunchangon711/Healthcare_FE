import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/landing.css';

// FAQ item interface
interface FAQItem {
  question: string;
  answer: string;
}

const LandingPage: React.FC = () => {
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // FAQ data
  const faqs: FAQItem[] = [
    {
      question: "How do I schedule an appointment?",
      answer: "You can schedule appointments through your patient dashboard after logging in. Simply navigate to the 'Appointments' section, click 'Book New Appointment', and follow the guided process to select a doctor, date, and time."
    },
    {
      question: "How can I view my medical records?",
      answer: "Your medical records are available in the 'Medical Records' section of your patient dashboard. They are securely stored and only accessible to you and your healthcare providers."
    },
    {
      question: "Can I manage my prescriptions online?",
      answer: "Yes, once prescribed by your doctor, you can view all your prescriptions in the 'Prescriptions' section. You can see details like dosage, frequency, and refill information."
    },
    {
      question: "How do I pay my medical bills?",
      answer: "You can view and pay your bills in the 'Billing' section of your dashboard. We offer multiple payment methods including credit card, debit card, and bank transfers."
    },
    {
      question: "Is my health information secure?",
      answer: "Absolutely. We use industry-standard encryption and security measures to protect your personal health information. Our system complies with all healthcare privacy regulations."
    }
  ];

  // Toggle FAQ answer visibility
  const toggleQuestion = (index: number) => {
    if (activeQuestion === index) {
      setActiveQuestion(null);
    } else {
      setActiveQuestion(index);
    }
  };

  // Handle dashboard navigation
  const handleDashboardClick = () => {
    if (user) {
      switch (user.role) {
        case 'PATIENT':
          navigate('/patient');
          break;
        case 'DOCTOR':
          navigate('/doctor');
          break;
        case 'ADMIN':
          navigate('/admin');
          break;
        default:
          navigate('/dashboard');
      }
    }
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <header className="landing-header">
        <div className="container">
          <div className="logo">
            <h1>MedCare</h1>
          </div>
          <nav className="landing-nav">
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#faq">FAQ</a></li>
              {isAuthenticated && (
                <li><button onClick={handleDashboardClick} className="dashboard-link">Dashboard</button></li>
              )}
            </ul>
          </nav>
          <div className="auth-buttons">
            {isAuthenticated ? (
              <div className="user-welcome">
                <span>Welcome, {user?.first_name}</span>
                <button onClick={handleDashboardClick} className="btn btn-primary">My Dashboard</button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">Log In</Link>
                <Link to="/register" className="btn btn-primary">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>Modern Healthcare, Simplified</h1>
            <p>
              Manage your health journey with our comprehensive healthcare platform. 
              Schedule appointments, access medical records, and communicate with healthcare 
              professionals all in one place.
            </p>
            <div className="hero-buttons">
              {isAuthenticated ? (
                <button onClick={handleDashboardClick} className="btn btn-primary btn-large">Go to Dashboard</button>
              ) : (
                <Link to="/register" className="btn btn-primary btn-large">Get Started</Link>
              )}
              <a href="#how-it-works" className="btn btn-secondary btn-large">Learn More</a>
            </div>
          </div>
          <div className="hero-image">
            <img src="/assets/hero.jpg" 
                 alt="Healthcare Illustration" 
                 className="hero-img" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <h2 className="section-title">Complete Healthcare Management</h2>
          <p className="section-subtitle">Everything you need to manage your healthcare experience</p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Appointment Scheduling</h3>
              <p>Easily book, reschedule, or cancel appointments with your healthcare providers.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h3>Medical Records</h3>
              <p>Secure access to your complete medical history, test results, and diagnoses.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💊</div>
              <h3>Prescription Management</h3>
              <p>View active prescriptions, request refills, and receive reminders.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💵</div>
              <h3>Billing & Insurance</h3>
              <p>Pay bills online, view payment history, and manage insurance information.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3>Notifications</h3>
              <p>Receive reminders for appointments, medications, and important updates.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure Communication</h3>
              <p>Communicate securely with your healthcare team about your care.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Your health journey in three simple steps</p>
          
          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Create Your Account</h3>
              <p>Sign up for a free account to access all features of our healthcare platform.</p>
            </div>
            
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Complete Your Profile</h3>
              <p>Add your medical history, insurance information, and healthcare preferences.</p>
            </div>
            
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Start Managing Your Health</h3>
              <p>Schedule appointments, access records, and take control of your healthcare.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section">
        <div className="container">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">Find answers to common questions about our platform</p>
          
          <div className="faq-container">
            {faqs.map((faq, index) => (
              <div key={index} className={`faq-item ${activeQuestion === index ? 'active' : ''}`}>
                <div className="faq-question" onClick={() => toggleQuestion(index)}>
                  <h3>{faq.question}</h3>
                  <span className="faq-toggle">{activeQuestion === index ? '−' : '+'}</span>
                </div>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to take control of your healthcare?</h2>
          <p>Join thousands of patients managing their health more effectively with MedCare.</p>
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary btn-large">Get Started</Link>
            <Link to="/login" className="btn btn-outline btn-large">Log In</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <h2>MedCare</h2>
              <p>Modern healthcare management</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h3>Product</h3>
                <ul>
                  <li><a href="#features">Features</a></li>
                  <li><a href="#how-it-works">How It Works</a></li>
                  <li><a href="#faq">FAQ</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h3>Legal</h3>
                <ul>
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Terms of Service</a></li>
                  <li><a href="#">Cookie Policy</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h3>Company</h3>
                <ul>
                  <li><a href="#">About Us</a></li>
                  <li><a href="#">Contact</a></li>
                  <li><a href="#">Careers</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} MedCare. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
