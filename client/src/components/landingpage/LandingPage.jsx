import 'bootstrap/dist/css/bootstrap.css';
import bgImage from "../../images/landing-bg.png";
import image1 from "../../images/carousel_1.png";
import image2 from "../../images/carousel_2.png";
import image3 from "../../images/carousel_3.png"; 
import image4 from "../../images/carousel_4.png";
import image5 from "../../images/carousel_5.png";
import image6 from "../../images/carousel_6.png";
import image7 from "../../images/carousel_7.png";
import logo from "../../images/wraPtrack-removebg-preview.png";
import { MdEmail, MdPhone } from "react-icons/md";
import { FaGithub, FaUniversity, FaBars } from "react-icons/fa";
import { NavLink } from 'react-router-dom';
import { useState, useEffect, useRef } from "react";


function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const [showInstallModal, setShowInstallModal] = useState(false); // for Get Started
  const [showHeaderInstall, setShowHeaderInstall] = useState(false); // for header install

  const trackRef = useRef(null);
  const isPausedRef = useRef(false);
  const cards = [image1, image2, image3, image4, image5, image6, image7];

  // Infinite carousel animation
  useEffect(() => {
    let animationId;
    let position = 0;
    const speed = 1.5;
    const animate = () => {
      if (trackRef.current && !isPausedRef.current) {
        position -= speed;
        const halfWidth = trackRef.current.scrollWidth / 2;
        if (Math.abs(position) >= halfWidth) position = 0;
        trackRef.current.style.transform = `translateX(${position}px)`;
      }
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // PWA install prompt handling
  useEffect(() => {
    const beforeInstallHandler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const installedHandler = () => {
      setIsInstalled(true);
      window.location.assign("/sign-in");
    };

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (isStandalone) setIsInstalled(true);

    window.addEventListener("beforeinstallprompt", beforeInstallHandler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstallHandler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  // Trigger PWA install prompt
  const handleInstallFromModal = async () => {
    if (!deferredPrompt) {
      window.location.assign("/sign-in");
      return;
    }

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    // Clear deferredPrompt so it won't trigger again
    setDeferredPrompt(null);

    // Close any modal
    setShowInstallModal(false);
    setShowHeaderInstall(false);

    if (choiceResult.outcome === "accepted") {
      setIsInstalled(true);
    }

    window.location.assign("/sign-in");
  };

  // Get Started button
  const handleGetStarted = () => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (isStandalone || isInstalled) {
      window.location.assign("/sign-in");
      return;
    }

    if (deferredPrompt) setShowInstallModal(true);
    else window.location.assign("/sign-in");
  };

  const handleCancelInstall = () => setShowInstallModal(false);
  const handleNotNow = () => {
    setShowInstallModal(false);
    window.location.assign("/sign-in");
  };
  const handleHeaderCancel = () => setShowHeaderInstall(false);

  return (
    <div style={{
    minHeight: "100vh",
    backgroundImage: `url(${bgImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }}>

      {/* ---------------- HEADER ---------------- */}
      <header className="d-flex justify-content-between align-items-center px-4 py-3" style={{ backgroundColor: "#123458" }}>
        <div className="d-flex align-items-center gap-2">
          <img src={logo} alt="logo" style={{ width: "32px", height: "32px" }} />
          <h5 className="m-0 text-light fw-semibold">WraPTrack</h5>
        </div>

        {/* ---------- DESKTOP BUTTONS ---------- */}
        <div className="d-none d-md-flex gap-2">
          <button 
            className="btn btn-outline-light btn-sm" 
            onClick={() => setShowHeaderInstall(true)}
            disabled={isInstalled}
          >
            {isInstalled ? "Installed ✅" : "Install"}
          </button>
          <NavLink to="/sign-in"><button className="btn btn-outline-light btn-sm">Sign in</button></NavLink>
          <NavLink to="/sign-up"><button className="btn btn-light btn-sm fw-semibold">Sign up</button></NavLink>
        </div>

        {/* ---------- MOBILE MENU BUTTON ---------- */}
        <div className="d-md-none">
          <button className="btn btn-outline-light btn-sm" onClick={() => setMenuOpen(!menuOpen)}>
            <FaBars />
          </button>
        </div>
      </header>

      {/* ---------------- MOBILE MENU ---------------- */}
      <div className="d-md-none px-4 py-2" style={{ backgroundColor: "#123458", display: menuOpen ? "flex" : "none", gap: "8px", justifyContent: "center" }}>
        <button 
          className="btn btn-outline-light btn-sm" 
          onClick={() => setShowHeaderInstall(true)}
          disabled={isInstalled}
        >
          {isInstalled ? "Installed" : "Install"}
        </button>
        <NavLink to="/sign-in"><button className="btn btn-outline-light btn-sm">Sign in</button></NavLink>
        <NavLink to="/sign-up"><button className="btn btn-light btn-sm fw-semibold">Sign up</button></NavLink>
      </div>

      {/* ---------------- HERO SECTION ---------------- */}
      <section className="container py-5 p-4 mt-4">
        <div className="row align-items-center p-2" style={{backgroundColor: "rgba(255, 255, 255, 0.5)", borderRadius: "12px",}}>
          <div className="col-md-6 mb-4">
            <h1 className="fw-bold">Wraptrack</h1>
            <p className="text-dark mt-3">
              A Progressive Web Application for managing plastic bottles and
              plastic-wrapped items using image processing and descriptive analytics.
            </p>
            <button
              className="btn mt-3 px-4"
              style={{ backgroundColor: "#123458", color: "#F1EFEC", height: "50px" }}
              onClick={handleGetStarted}
            >
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* ================= HEADER INSTALL MODAL ================= */}
      {showHeaderInstall && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "14px" }}>
              <div className="modal-header">
                <h5 className="modal-title">Install this app?</h5>
                <button className="btn-close" onClick={handleHeaderCancel} />
              </div>
              <div className="modal-footer justify-content-center gap-2">
                <button className="btn btn-outline-secondary" onClick={handleHeaderCancel}>Cancel</button>
                <button className="btn" style={{ backgroundColor: "#123458", color: "#F1EFEC" }} onClick={handleInstallFromModal}>Install</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= GET STARTED INSTALL MODAL ================= */}
      {showInstallModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "14px" }}>
              <div className="modal-header">
                <h5 className="modal-title">Add to home screen</h5>
                <button className="btn-close" onClick={handleCancelInstall} />
              </div>
              <div className="modal-body text-center">
                <p className="fw-semibold mb-1">Install app for better UI / Performance</p>
                <p className="text-muted mb-0">Faster loading, offline support, and smoother experience.</p>
              </div>
              <div className="modal-footer justify-content-center gap-2">
                <button className="btn btn-outline-secondary" onClick={handleNotNow}>Not now</button>
                <button className="btn" style={{ backgroundColor: "#123458", color: "#F1EFEC" }} onClick={handleInstallFromModal}>Install</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- INFINITE CAROUSEL ---------------- */}
      <section className="container pb-5">
        <div className="p-4" style={{ backgroundColor: "#FFFFFF", border: "1px solid #D4C9BE", borderRadius: "12px", overflow: "hidden" }}>
          <div ref={trackRef} className="d-flex gap-3" onMouseEnter={() => (isPausedRef.current = true)} onMouseLeave={() => (isPausedRef.current = false)}>
            {[...cards, ...cards].map((_, index) => (
              <div key={index} style={{ flex: "0 0 auto", width: "300px", height: "193px", backgroundColor: "#F1EFEC", border: "1px solid #D4C9BE", borderRadius: "8px" }}>
                <p className="text-muted m-0">
                  <img src={cards[index % cards.length]} alt="Card Image" style={{ width: "100%", height: "auto", borderRadius: "8px"}} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="px-4 py-4" style={{ backgroundColor: "#123458", color: "#F1EFEC" }}>
        <div className="container text-center text-md-start">
          <p className="fw-semibold m-0">WraPTrack</p>
          <p className="m-0 d-flex align-items-center justify-content-center justify-content-md-start gap-2">
            <FaUniversity size={14} />
            Davao Oriental State University
          </p>
          <p className="m-0">© 2025</p>
          <p className="m-0">Rembrant Gumbason, Cristine Catambac, Nouf Masagnay</p>

          <div className="mt-2 d-flex flex-column gap-1 align-items-center align-items-md-start">
            <p className="m-0 d-flex align-items-center gap-2">
              <MdEmail size={16} /> wraptrackteam1.0@gmail.com
            </p>
            <p className="m-0 d-flex align-items-center gap-2">
              <MdPhone size={16} /> 0948 508 3516
            </p>
          </div>

          <div className="mt-3 d-flex gap-3 flex-wrap justify-content-center justify-content-md-start">
            <a href="/About" className="text-light text-decoration-none">About</a>
            <a href="/Privacy" className="text-light text-decoration-none">Privacy Policy</a>
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
