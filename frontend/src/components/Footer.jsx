import { useState } from 'react';
import { Heart, Briefcase, Mail, MapPin, Phone, Linkedin, Twitter, Facebook, Instagram, Github } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { data: userProfile } = useGetCallerUserProfile();
  const userType = userProfile?.userType;
  
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setSending(true);
    try {
      await fetchApi('/auth/contact/', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });
      
      toast.success('Message sent successfully!');
      setMessage('');
      setName('');
      setEmail('');
    } catch (error) {
      toast.error(error?.body?.detail || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img
                src="/images/Header, Footer-dark.png"
                alt="Recruitify"
                className="hidden dark:block h-[5.25rem] w-auto"
              />
              <img
                src="/images/Header, Cards, Features and Footer-light.png"
                alt="Recruitify"
                className="block dark:hidden h-[5.25rem] w-auto"
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              The ultimate platform for modern recruitment. We bridge the gap between world-class talent and innovative companies.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-blue-600 hover:text-white transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-blue-600 hover:text-white transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-blue-600 hover:text-white transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-blue-600 hover:text-white transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Solutions - Dynamic based on user type */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-900 dark:text-white">
              {userType === 'candidate' ? 'For Job Seekers' : userType === 'organization' ? 'For Employers' : 'Solutions'}
            </h4>
            <ul className="space-y-3">
              {userType === 'candidate' ? (
                <>
                  <li>
                    <Link to="/candidate/jobs" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Browse Jobs
                    </Link>
                  </li>
                  <li>
                    <Link to="/candidate/applications" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      My Applications
                    </Link>
                  </li>
                  <li>
                    <Link to="/candidate/communities" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      My Communities
                    </Link>
                  </li>
                  <li>
                    <Link to="/candidate/analytics" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Career Analytics
                    </Link>
                  </li>
                  <li>
                    <Link to="/candidate/profile" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      My Profile
                    </Link>
                  </li>
                </>
              ) : userType === 'organization' ? (
                <>
                  <li>
                    <Link to="/organization/post-vacancy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Post a Job
                    </Link>
                  </li>
                  <li>
                    <Link to="/organization/vacancies" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Manage Vacancies
                    </Link>
                  </li>
                  <li>
                    <Link to="/organization/candidates" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Review Candidates
                    </Link>
                  </li>
                  <li>
                    <Link to="/organization/talent-pool" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Talent Pool
                    </Link>
                  </li>
                  <li>
                    <Link to="/organization/analytics" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Analytics
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/register/organization" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      For Enterprise
                    </Link>
                  </li>
                  <li>
                    <Link to="/register/organization" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      For Startups
                    </Link>
                  </li>
                  <li>
                    <Link to="/candidate/jobs" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Find Jobs
                    </Link>
                  </li>
                  <li>
                    <Link to="/register/candidate" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      For Job Seekers
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Resources - Dynamic based on user type */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-900 dark:text-white">Resources</h4>
            <ul className="space-y-3">
              {userType === 'candidate' ? (
                <>
                  <li>
                    <Link to="/documentation" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      How to Apply
                    </Link>
                  </li>
                  <li>
                    <Link to="/documentation" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Resume Tips
                    </Link>
                  </li>
                  <li>
                    <Link to="/documentation" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Interview Prep
                    </Link>
                  </li>
                  <li>
                    <Link to="/documentation" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Career Advice
                    </Link>
                  </li>
                </>
              ) : userType === 'organization' ? (
                <>
                  <li>
                    <Link to="/documentation" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Hiring Guide
                    </Link>
                  </li>
                  <li>
                    <Link to="/documentation" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Best Practices
                    </Link>
                  </li>
                  <li>
                    <Link to="/documentation" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      API Documentation
                    </Link>
                  </li>
                  <li>
                    <Link to="/documentation" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Support Center
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/documentation" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      How to Use Recruitify
                    </Link>
                  </li>
                  <li>
                    <Link to="/documentation" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Integration Guide
                    </Link>
                  </li>
                  <li>
                    <Link to="/documentation" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Hiring Best Practices
                    </Link>
                  </li>
                  <li>
                    <Link to="/documentation" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Support Center
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-900 dark:text-white">Get in Touch</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
                <span>Suranussi, Jalandhar<br />Punjab 144027, India</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <a href="tel:+916239881326" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  +91 6239881326
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Phone className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <span>Mon - Fri, 9am - 6pm IST</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <a href="mailto:recruitify26@gmail.com" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  recruitify26@gmail.com
                </a>
              </li>
            </ul>
            
            {/* Contact Form */}
            <div className="pt-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Message us</p>
              <form onSubmit={handleSendMessage} className="space-y-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  disabled={sending}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  disabled={sending}
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Your message..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  disabled={sending}
                />
                <button 
                  type="submit"
                  disabled={sending}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 text-center md:text-left">
              © {currentYear} Recruitify AI Technologies Inc. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm">
              <Link to="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Cookie Settings
              </Link>
              <Link to="/accessibility" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

