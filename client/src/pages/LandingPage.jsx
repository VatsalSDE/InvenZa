import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BarChart, Brain, CreditCard, FileText, IndianRupee, 
  Package, ShoppingCart, Truck, Users, LayoutDashboard, 
  Zap, ArrowRight, CheckCircle, RefreshCcw, TrendingUp,
  MapPin, Mail, Phone, PlusCircle, Box, Clock, PackageCheck, Settings
} from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const featureCards = [
    { icon: Box, title: "Inventory Management", desc: "Real-time stock tracking with low stock alerts and automatic quantity updates" },
    { icon: Users, title: "Dealer Management", desc: "Complete dealer profiles, ledgers, payment scores, and outstanding balance tracking" },
    { icon: ShoppingCart, title: "Order Management", desc: "Multi-item orders with automatic stock deduction and payment tracking" },
    { icon: CreditCard, title: "Payment Tracking", desc: "Record payments by any method with reference numbers and dealer ledger sync" },
    { icon: FileText, title: "GST Billing", desc: "Generate professional bills and send directly to dealer email in one click" },
    { icon: Truck, title: "Purchase Management", desc: "Track supplier purchases with automatic inventory updates on delivery" },
    { icon: BarChart, title: "Business Analytics", desc: "Revenue trends, product profitability, dealer contributions and order patterns" },
    { icon: Brain, title: "AI Business Insights", desc: "Gemini-powered anomaly detection, risk scoring, and smart restock recommendations" },
    { icon: IndianRupee, title: "Profit & Loss", desc: "Complete P&L with cost of goods, operating expenses, and margin analysis" },
  ];

  const StatCounter = ({ value, label, desc }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const end = parseInt(value) || 10;
          const duration = 2000;
          const increment = end / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      }, { threshold: 0.1 });
      if (ref.current) observer.observe(ref.current);
      return () => observer.disconnect();
    }, [value]);

    return (
      <div ref={ref} className="border-l border-emerald-500/50 pl-6 py-2">
        <div className="text-4xl font-bold text-emerald-500 mb-1">
          {typeof value === 'string' && value.includes('+') ? `${count}+` : count || value}
        </div>
        <div className="text-white font-medium mb-1">{label}</div>
        <div className="text-zinc-500 text-sm leading-relaxed">{desc}</div>
      </div>
    );
  };

  const FadeInSection = ({ children, className = "" }) => {
    const [isVisible, setVisible] = useState(false);
    const domRef = useRef();

    useEffect(() => {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => setVisible(entry.isIntersecting));
      }, { threshold: 0.1 });
      if (domRef.current) observer.observe(domRef.current);
      return () => observer.disconnect();
    }, []);

    return (
      <div className={`transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`} ref={domRef}>
        {children}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white font-inter selection:bg-emerald-500/30 selection:text-emerald-500">
      
      {/* SECTION 1 - Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0F0F0F]/80 backdrop-blur-lg border-b border-emerald-500/20 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="p-1.5 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
              <Zap className="w-6 h-6 text-emerald-500" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-emerald-500">INVENZA</span>
          </div>
          
          <button 
            onClick={() => navigate('/login')}
            className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-black font-semibold px-4 sm:px-6 py-2 rounded-full transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <span className="hidden sm:inline">Login to Dashboard</span>
            <span className="sm:hidden">Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* SECTION 2 - Hero Section */}
      <section className="relative min-h-[100vh] flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.08)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        
        <div className="relative z-10 max-w-4xl w-full text-center mt-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium mb-6 animate-pulse">
            <Zap className="w-3 h-3 text-emerald-400" /> Version 2.0 Now Live
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6 px-2">
            Intelligent Inventory <br />
            <span className="text-emerald-500">Built for Vinayak Lakshmi</span>
          </h1>
          
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Complete business control. Real-time insights. Zero complexity.  
            Experience the next generation of wholesale management.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
            >
              Login to Dashboard
            </button>
            <button 
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-8 py-4 border border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/5 text-emerald-400 font-bold rounded-xl transition-all active:scale-95"
            >
              Explore Features
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mb-16">
            {[
              { icon: LayoutDashboard, text: "11 Modules" },
              { icon: TrendingUp, text: "Real-time Analytics" },
              { icon: Brain, text: "AI-Powered Insights" },
              { icon: Clock, text: "Zero Downtime" }
            ].map((pill, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-full text-sm text-zinc-300">
                <pill.icon className="w-4 h-4 text-emerald-500" />
                {pill.text}
              </div>
            ))}
          </div>

          {/* Fake Dashboard Mockup */}
          <div className="relative max-w-5xl mx-auto animate-float px-2 sm:px-0">
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/10 scale-[0.9] sm:scale-100 origin-top">
              <div className="h-8 bg-[#222222] border-b border-[#2A2A2A] flex items-center px-4 gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-6 mb-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-[#222222] rounded-xl border border-[#2A2A2A] p-4">
                      <div className="w-12 h-2 bg-emerald-500/20 rounded mb-2" />
                      <div className="w-20 h-6 bg-emerald-500/10 border border-emerald-500/20 rounded" />
                    </div>
                  ))}
                </div>
                <div className="h-48 bg-[#222222] rounded-xl border border-[#2A2A2A] p-4 overflow-hidden relative">
                   <div className="absolute inset-0 flex items-end px-6 pb-6 gap-2">
                      {[40, 70, 45, 90, 65, 80, 55, 30, 85, 60].map((h, i) => (
                        <div key={i} className="flex-1 bg-emerald-500/20 border-t border-emerald-500" style={{ height: `${h}%` }} />
                      ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - Stats Bar */}
      <section className="bg-[#1A1A1A] border-y border-[#2A2A2A] py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          <StatCounter value="10+" label="Complete Coverage" desc="Across entire business operations" />
          <StatCounter value="Real-time" label="Live Tracking" desc="Instant inventory & sales updates" />
          <StatCounter value="AI" label="Gemini Analytics" desc="Smart decision support layer" />
          <StatCounter value="₹0 Cost" label="Built for Owner" desc="Infrastructure on free-tier tier" />
        </div>
      </section>

      {/* SECTION 4 - Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <FadeInSection className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything Your Business Needs</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto">From inventory to AI insights, INVENZA covers every aspect of your wholesale operation with uncompromising precision.</p>
          </FadeInSection>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((card, i) => (
              <FadeInSection key={i} className="h-full">
                <div className="group h-full p-8 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/5">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-6 text-emerald-500 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                    <card.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                  <p className="text-zinc-500 leading-relaxed text-sm">{card.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 - How It Works */}
      <section className="py-24 px-4 sm:px-6 bg-[#0B0B0B]">
        <div className="max-w-7xl mx-auto">
          <FadeInSection className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple. Powerful. Always On.</h2>
            <p className="text-zinc-500">A streamlined workflow designed for maximum efficiency.</p>
          </FadeInSection>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-[60px] left-[20%] right-[20%] h-[1px] border-t border-dashed border-emerald-500/30" />
            
            {[
              { icon: PlusCircle, title: "Add Your Products", desc: "Register your product catalog once with prices, categories, and minimum stock levels" },
              { icon: RefreshCcw, title: "Manage Daily Operations", desc: "Record purchases, create orders, track payments — everything updates automatically" },
              { icon: TrendingUp, title: "Get AI Insights", desc: "Let INVENZA analyze your data and tell you what needs attention every morning" }
            ].map((step, i) => (
              <FadeInSection key={i} className="relative z-10 flex flex-col items-center">
                <div className="w-8 h-8 bg-emerald-500 text-black font-bold rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                  {i + 1}
                </div>
                <div className="w-20 h-20 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-8 text-emerald-500">
                  <step.icon className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                <p className="text-zinc-500 max-w-sm mx-auto">{step.desc}</p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 - AI Features Highlight */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full" />
        
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <FadeInSection className="flex-1 text-left">
            <div className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium mb-6">
              Powered by Gemini AI
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">Your Business Gets <br /> Smarter Every Day</h2>
            <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
              INVENZA's AI layer monitors your business 24/7, detects unusual patterns, 
              scores dealer reliability, and tells you exactly what to reorder before you run out.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                "Business anomaly alerts",
                "Dealer risk scoring",
                "Smart restock suggestions",
                "Morning business digest"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-zinc-300 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </FadeInSection>

          <FadeInSection className="flex-1 w-full relative">
             <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 shadow-2xl relative z-10 overflow-hidden">
                {/* AI Chat Visualization */}
                <div className="flex flex-col gap-6">
                  {/* User Message */}
                  <div className="flex justify-end pr-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-4 max-w-[80%]">
                      <p className="text-sm text-emerald-200 uppercase tracking-widest font-bold text-[10px] mb-2">You</p>
                      <p className="text-white text-sm">Kaunsa product khatam hone wala hai?</p>
                    </div>
                  </div>
                  {/* AI Message */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
                      <Brain className="w-6 h-6 text-black" />
                    </div>
                    <div className="bg-[#222222] border-l-4 border-emerald-500 rounded-r-2xl rounded-bl-2xl px-5 py-4 w-full">
                       <p className="text-sm text-zinc-500 uppercase tracking-widest font-bold text-[10px] mb-2">INVENZA AI</p>
                       <p className="text-white text-sm leading-relaxed">
                        <span className="text-emerald-400 font-bold">2 Burner Brass</span> ke sirf 3 units bache hain. 
                        Weekly sales 8 units hain. Aaj hi <span className="text-emerald-400">Mehta Gas Fittings</span> se 40 units order karein.
                       </p>
                    </div>
                  </div>
                </div>
             </div>
             {/* Decorative Background for AI Section */}
             <div className="absolute -top-10 -right-10 w-full h-full border border-emerald-500/10 rounded-2xl -z-0" />
          </FadeInSection>
        </div>
      </section>

      {/* SECTION 7 - Complete Business Coverage */}
      <section className="py-24 px-4 sm:px-6 bg-[#0B0B0B] text-center">
        <div className="max-w-7xl mx-auto">
          <FadeInSection className="mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Complete Business Coverage</h2>
            <p className="text-zinc-500">Every module crafted for maximum precision.</p>
          </FadeInSection>

          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: LayoutDashboard, name: "Dashboard" },
              { icon: Box, name: "Products" },
              { icon: Package, name: "Inventory" },
              { icon: Users, name: "Dealers" },
              { icon: ShoppingCart, name: "Orders" },
              { icon: CreditCard, name: "Payments" },
              { icon: FileText, name: "Billing" },
              { icon: Truck, name: "Suppliers" },
              { icon: PackageCheck, name: "Purchases" },
              { icon: IndianRupee, name: "Profit & Loss" },
              { icon: Settings, name: "Settings" }
            ].map((module, i) => (
              <FadeInSection key={i}>
                <div className="flex items-center gap-2.5 px-6 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl text-zinc-400 transition-all hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 group cursor-default">
                  <module.icon className="w-4 h-4 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
                  <span className="text-sm font-medium">{module.name}</span>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8 - Footer */}
      <footer className="bg-[#0F0F0F] border-t border-[#2A2A2A] pt-20 pb-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-8 h-8 text-emerald-500" />
              <span className="text-2xl font-bold tracking-tight text-emerald-500 uppercase">INVENZA</span>
            </div>
            <p className="text-zinc-500 leading-relaxed">
              Intelligent inventory management for wholesale businesses.
              Customized for Vinayak Lakshmi Gas Stoves.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-6">Quick Links</h4>
            <div className="flex flex-col gap-4 text-zinc-500 text-sm">
              <span className="hover:text-emerald-500 transition-colors cursor-pointer" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>Features</span>
              <span className="hover:text-emerald-500 transition-colors cursor-pointer">How It Works</span>
              <span className="hover:text-emerald-500 transition-colors cursor-pointer" onClick={() => navigate('/auth/login')}>Login to Account</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Location</h4>
            <div className="flex items-center gap-2 text-zinc-500 text-sm mb-4">
              <MapPin className="w-4 h-4 text-emerald-500" />
              Vinayak Lakshmi Gas Stoves, Vadodara
            </div>
            <div className="text-xs text-zinc-600 font-medium tracking-tight">
              STACK: REACT • NODE.JS • SUPABASE • GEMINI AI
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-zinc-900 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-zinc-600 text-xs">© 2026 INVENZA. All rights reserved.</p>
          <p className="text-zinc-600 text-xs">Built with ❤️ for Vinayak Lakshmi Gas Stoves.</p>
        </div>
      </footer>

      {/* Custom Styles for Animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotateX(2deg); }
          50% { transform: translateY(-20px) rotateX(5deg); }
        }
        .animate-float {
          perspective: 1000px;
          animation: float 6s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default LandingPage;
