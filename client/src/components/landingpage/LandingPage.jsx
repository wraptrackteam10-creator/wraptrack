import 'bootstrap/dist/css/bootstrap.css';
import logo from "../../images/wtlogo2.png";
import { MdEmail, MdPhone } from "react-icons/md";
import { FaGithub, FaUniversity, FaBars } from "react-icons/fa";
import { NavLink } from 'react-router-dom';
import { useState, useEffect, useRef } from "react";
import Login from '../loginpage/Login';

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // ✅ Infinite carousel refs
  const trackRef = useRef(null);
  const isPausedRef = useRef(false);

  const cards = [1, 2, 3, 4, 5, 6, 7, 8];

  // ✅ TRUE INFINITE SLIDING EFFECT (WITH PAUSE)
  useEffect(() => {
    let animationId;
    let position = 0;
    const speed = 1.5;

    const animate = () => {
      if (trackRef.current && !isPausedRef.current) {
        position -= speed;
        const halfWidth = trackRef.current.scrollWidth / 2;
        if (Math.abs(position) >= halfWidth) {
          position = 0;
        }
        trackRef.current.style.transform = `translateX(${position}px)`;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // ✅ PWA Install Event
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault(); // Prevent automatic prompt
      setDeferredPrompt(e); // Store for later use
    };

    const appInstalledHandler = () => {
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", appInstalledHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", appInstalledHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); // Show the native install prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log("User choice:", outcome);
      setDeferredPrompt(null); // Clear stored prompt
    } else {
      alert("PWA installation is not supported or already installed.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F1EFEC" }}>

      {/* HEADER */}
      <header
        className="d-flex justify-content-between align-items-center px-4 py-3"
        style={{ backgroundColor: "#123458" }}
      >
        <div className="d-flex align-items-center gap-2">
          <img src={logo} alt="logo" style={{ width: "32px", height: "32px" }} />
          <h5 className="m-0 text-light fw-semibold">WraPTrack</h5>
        </div>

        <div className="d-none d-md-flex gap-2">
          <button
            className="btn btn-outline-light btn-sm"
            onClick={handleInstallClick}
            disabled={isInstalled}
          >
            {isInstalled ? "Installed ✅" : "Install"}
          </button>
          <NavLink to="/sign-in">
            <button className="btn btn-outline-light btn-sm">Sign in</button>
          </NavLink>
          <NavLink to="/sign-up">
            <button className="btn btn-light btn-sm fw-semibold">Sign up</button>
          </NavLink>
        </div>

        <div className="d-md-none">
          <button
            className="btn btn-outline-light btn-sm"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <FaBars />
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className="d-md-none px-4 py-2"
        style={{
          backgroundColor: "#123458",
          display: menuOpen ? "flex" : "none",
          flexDirection: "row",
          gap: "8px",
          justifyContent: "center",
          alignItems: "center",
          transition: "all 0.3s ease",
          overflow: "hidden",
        }}
      >
        <button
          className="btn btn-outline-light btn-sm"
          onClick={handleInstallClick}
          disabled={isInstalled}
        >
          {isInstalled ? "Installed ✅" : "Install"}
        </button>
        <NavLink to="/sign-in">
            <button className="btn btn-outline-light btn-sm">Sign in</button>
        </NavLink>
        <NavLink to="/sign-up">
            <button className="btn btn-light btn-sm fw-semibold">Sign up</button>
        </NavLink>
      </div>

      {/* HERO SECTION */}
      <section className="container py-5">
        <div className="row align-items-center">
          <div className="col-md-6 order-md-1 mb-4 mb-md-0">
            <h1 className="fw-bold text-dark">Wraptrack System</h1>
            <p className="mt-3 text-secondary">
              A Progressive Web Application for managing plastic bottles and
              plastic-wrapped items using image processing and descriptive analytics
              at Davao Oriental State University.
            </p>
            <button
              className="btn mt-3 px-4"
              style={{ backgroundColor: "#123458", color: "#F1EFEC", height: "50px" }}
            >
              Get Started
            </button>
          </div>

          <div className="col-md-6 order-md-2 text-center">
            <div
              className="p-4 mb-2"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #D4C9BE",
                borderRadius: "12px",
                height: "300px",
              }}
            >
              <p className="text-muted m-0">App preview / screenshots here</p>
            </div>
          </div>
        </div>
      </section>

      {/* INFINITE CAROUSEL SECTION */}
      <section className="container pb-5">
        <div
          className="p-4"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #D4C9BE",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div
            ref={trackRef}
            className="d-flex gap-3"
            style={{ willChange: "transform" }}
            onMouseEnter={() => (isPausedRef.current = true)}
            onMouseLeave={() => (isPausedRef.current = false)}
            onTouchStart={() => (isPausedRef.current = true)}
            onTouchEnd={() => (isPausedRef.current = false)}
          >
            {[...cards, ...cards].map((_, index) => (
              <div
                key={index}
                style={{
                  flex: "0 0 auto",
                  width: "200px",
                  height: "200px",
                  backgroundColor: "#F1EFEC",
                  border: "1px solid #D4C9BE",
                  borderRadius: "8px",
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="px-4 py-4"
        style={{ backgroundColor: "#123458", color: "#F1EFEC" }}
      >
        <div className="container text-center text-md-start">
          <p className="fw-semibold m-0">WraPTrack</p>
          <p className="m-0 d-flex align-items-center justify-content-center justify-content-md-start gap-2">
            <FaUniversity size={14} />
            Davao Oriental State University
          </p>
          <p className="m-0">© 2025</p>
          <p className="m-0">
            Rembrant Gumbason, Cristine Catambac, Nouf Masagnay
          </p>

          <div className="mt-2 d-flex flex-column gap-1 align-items-center align-items-md-start">
            <p className="m-0 d-flex align-items-center gap-2">
              <MdEmail size={16} /> wraptrackteam1.0@gmail.com
            </p>
            <p className="m-0 d-flex align-items-center gap-2">
              <MdPhone size={16} /> 0991 129 6586
            </p>
          </div>

          <div className="mt-3 d-flex gap-3 flex-wrap justify-content-center justify-content-md-start">
            <a href="/About" className="text-light text-decoration-none">About</a>
            <a href="/Privacy" className="text-light text-decoration-none">Privacy Policy</a>
            <a href="https://github.com/wraptrackteam10-creator/wraptrack" target='blank' className="text-light text-decoration-none d-flex align-items-center gap-1">
              <FaGithub size={14} /> GitHub
            </a>
          </div>

          <p className="mt-3 mb-0 text-center text-md-start" style={{ fontSize: "0.85rem", opacity: 0.8 }}>
            Progressive Web Application • Installable on supported devices
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
