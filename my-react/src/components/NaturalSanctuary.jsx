import React, { useState } from "react";
import { 
  Sparkles, Leaf, HeartPulse, ShieldCheck, Sun, Moon, Wind, 
  Flame, Droplets, ArrowRight, CheckCircle2, Clock, BookOpen,
  Coffee, Compass, Stethoscope, ChevronRight, Flower2
} from "lucide-react";

const QUICK_AILMENTS = [
  {
    id: "cough",
    title: "Dry Cough & Sore Throat",
    sanskrit: "Kasa & Gala Graha",
    icon: "🌿",
    desc: "Persistent scratchy throat, tickling cough, and chest tightness.",
    prompt: "I have a dry tickling cough, painful sore throat, and mild congestion for 2 days. What Ayurvedic home remedies with exact dosage and safety precautions do you recommend?",
    tag: "Respiratory"
  },
  {
    id: "digestion",
    title: "Indigestion & Bloating",
    sanskrit: "Ajirna & Agnimandya",
    icon: "🫚",
    desc: "Heavy stomach after meals, flatulence, gas, and sluggish digestive fire.",
    prompt: "I am experiencing severe stomach bloating, indigestion, and gas after eating. Please formulate an Ayurvedic remedy to rekindle my Agni (digestive fire).",
    tag: "Digestive Fire"
  },
  {
    id: "stress-sleep",
    title: "Insomnia & Mental Stress",
    sanskrit: "Anidra & Manasika Shrama",
    icon: "🧘",
    desc: "Racing thoughts at night, restless sleep, tension headaches, and fatigue.",
    prompt: "I am having difficulty falling asleep due to stress and waking up exhausted with tension headaches. What natural herbs and nighttime rituals can help balance my mind?",
    tag: "Mind & Sleep"
  },
  {
    id: "immunity",
    title: "Low Immunity & Cold Recovery",
    sanskrit: "Ojakshaya & Pratishyaya",
    icon: "🛡️",
    desc: "Frequent seasonal colds, sneezing, low vitality, and slow recovery.",
    prompt: "I frequently catch colds and feel weak with low stamina. What immune-boosting (Rasayana) Ayurvedic remedies will help rebuild my Ojas safely?",
    tag: "Vitality (Ojas)"
  },
  {
    id: "skin",
    title: "Skin Heat & Acne Flares",
    sanskrit: "Mukhadushika & Rakta Pitta",
    icon: "✨",
    desc: "Inflamed facial breakouts, excessive internal heat, and skin redness.",
    prompt: "I am getting painful acne breakouts and feeling excess internal heat in my body. What cooling herbal remedies and blood-purifying therapies do you suggest?",
    tag: "Pitta Balance"
  },
  {
    id: "joints",
    title: "Joint Stiffness & Aches",
    sanskrit: "Sandhivata & Shula",
    icon: "🦴",
    desc: "Morning joint stiffness, knee pain, and weather-triggered body aches.",
    prompt: "I wake up with stiff, aching knees and joints in the morning. Which Ayurvedic warm oils, herbal decoctions, and anti-inflammatory remedies are best suited?",
    tag: "Vata Soothing"
  }
];

const SACRED_HERBS = [
  {
    name: "Tulsi (Holy Basil)",
    botanical: "Ocimum sanctum",
    sanskrit: "Surasa • The Incomparable",
    element: "Fire & Air",
    role: "Clears prana channels, destroys Kapha congestion, lowers stress cortisol.",
    icon: "🍃",
    accent: "#059669"
  },
  {
    name: "Haridra (Golden Turmeric)",
    botanical: "Curcuma longa",
    sanskrit: "Kanchani • Golden Goddess",
    element: "Earth & Fire",
    role: "Deep anti-inflammatory, detoxifies liver (Yakrit), heals cellular wounds.",
    icon: "🫚",
    accent: "#d97706"
  },
  {
    name: "Ashwagandha",
    botanical: "Withania somnifera",
    sanskrit: "Vajigandha • Horse Vitality",
    element: "Earth & Air",
    role: "Supreme adaptogen, rebuilds nervous tissue (Majja Dhatu), restores sleep.",
    icon: "🌱",
    accent: "#15803d"
  },
  {
    name: "Amalaki (Indian Gooseberry)",
    botanical: "Phyllanthus emblica",
    sanskrit: "Dhatri • The Earth Mother",
    element: "Water & Earth",
    role: "Contains 20x more Vitamin C than oranges. Tridoshic youth rejuvenator.",
    icon: "🍈",
    accent: "#16a34a"
  },
  {
    name: "Sunthi (Dried Ginger)",
    botanical: "Zingiber officinale",
    sanskrit: "Vishwabhesaj • Universal Healer",
    element: "Fire & Earth",
    role: "Stimulates deep digestive fire (Agni), melts toxins (Ama), opens sinuses.",
    icon: "☕",
    accent: "#b45309"
  },
  {
    name: "Brahmi (Water Hyssop)",
    botanical: "Bacopa monnieri",
    sanskrit: "Saraswati • Cosmic Wisdom",
    element: "Water & Air",
    role: "Cools mental agitation, enhances memory (Medhya), balances brain neurotransmitters.",
    icon: "🌿",
    accent: "#0d9488"
  }
];

const DOSHAS = [
  {
    name: "Vata",
    elements: "Air & Space (Vayu + Akasha)",
    governs: "Movement, breathing, nerve impulses, mental flow",
    imbalance: "Dry skin, irregular digestion, anxiety, insomnia, cold extremities",
    remedy: "Warm cooked meals, sesame oil self-massage (Abhyanga), grounding herbs like Ashwagandha.",
    color: "#6366f1",
    bg: "rgba(99, 102, 241, 0.08)",
    border: "rgba(99, 102, 241, 0.25)"
  },
  {
    name: "Pitta",
    elements: "Fire & Water (Tejas + Jala)",
    governs: "Metabolism, digestion, body temperature, intelligence",
    imbalance: "Acidity, heartburn, anger, skin rashes, excessive body heat",
    remedy: "Cooling foods, aloe vera juice, ghee, coconut water, coriander and fennel seeds.",
    color: "#ea580c",
    bg: "rgba(234, 88, 12, 0.08)",
    border: "rgba(234, 88, 12, 0.25)"
  },
  {
    name: "Kapha",
    elements: "Earth & Water (Prithvi + Jala)",
    governs: "Structure, lubrication, fluid balance, emotional stability",
    imbalance: "Lethargy, excess weight, chest congestion, sinus sluggishness",
    remedy: "Light pungent spices, dry ginger, honey, brisk morning exercise, warming herbal teas.",
    color: "#059669",
    bg: "rgba(5, 150, 105, 0.08)",
    border: "rgba(5, 150, 105, 0.25)"
  }
];

const DINACHARYA_STEPS = [
  {
    time: "06:00 AM - 10:00 AM",
    phase: "Kapha Dawn",
    title: "Awakening & Purification",
    tip: "Drink 1 glass warm copper water with a splash of lemon. Scrape tongue and practice gentle Surya Namaskar to stimulate sluggish morning lymphatic flow.",
    icon: <Sun size={20} className="text-amber-500" />
  },
  {
    time: "10:00 AM - 02:00 PM",
    phase: "Pitta Peak",
    title: "Digestive Fire (Agni) at Maximum",
    tip: "Eat your largest, most nutrient-dense meal of the day. The digestive fire mirrors the peak sun. Avoid ice cold drinks that extinguish metabolic heat.",
    icon: <Flame size={20} className="text-orange-500" />
  },
  {
    time: "02:00 PM - 06:00 PM",
    phase: "Vata Flow",
    title: "Mental Focus & Hydration",
    tip: "Sip warm cumin-coriander-fennel (CCF) tea. Great window for creative brainstorming and light meditation as mental energy is fluid.",
    icon: <Wind size={20} className="text-blue-500" />
  },
  {
    time: "06:00 PM - 10:00 PM",
    phase: "Kapha Renewal",
    title: "Evening Wind-down & Restorative Sleep",
    tip: "Have a light dinner before 8 PM. Drink warm golden turmeric milk with a pinch of nutmeg and cardamom 45 minutes before sleep to induce deep REM sleep.",
    icon: <Moon size={20} className="text-indigo-500" />
  }
];

export function NaturalSanctuary({ onStartConsultation }) {
  const [activeDosha, setActiveDosha] = useState("Vata");

  return (
    <div className="natural-sanctuary">
      {/* ── 1. Hero Section ── */}
      <section className="sanctuary-hero">
        <div className="hero-text-col">
          <div className="natural-badge-pill">
            <Leaf size={14} className="badge-leaf" />
            <span>Ayurvedic Natural Healing & Home Remedies</span>
          </div>

          <h1 className="hero-heading">
            Natural Remedies for Gentle, Everyday Healing
          </h1>

          <p className="hero-subtext">
            Discover time-tested herbal remedies and kitchen formulations rooted in 
            Ayurveda. Describe your symptoms to receive balanced natural advice with 
            clear preparation steps, exact dosages, and safety precautions.
          </p>

          <div className="hero-action-buttons">
            <button 
              className="sanctuary-primary-btn"
              onClick={() => onStartConsultation()}
            >
              <Leaf size={16} />
              <span>Consult Ayurvedic AI Vaidya</span>
              <ArrowRight size={16} />
            </button>

            <a href="#quick-healer" className="sanctuary-secondary-btn">
              <span>Browse Common Ailments</span>
            </a>
          </div>

          {/* Trust Highlights */}
          <div className="hero-trust-grid">
            <div className="trust-item">
              <CheckCircle2 size={15} />
              <span>Traditional Home Formulations</span>
            </div>
            <div className="trust-item">
              <ShieldCheck size={15} />
              <span>Safety & Precaution Checks</span>
            </div>
            <div className="trust-item">
              <HeartPulse size={15} />
              <span>Personalized Dosha Balance</span>
            </div>
            <div className="trust-item">
              <Flower2 size={15} />
              <span>Pure Kitchen & Herbal Ingredients</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Card */}
        <div className="hero-visual-col">
          <div className="visual-card-frame">
            <img 
              src="/images/ayurveda_hero.jpg" 
              alt="Ayurvedic Natural Healing Herbs and Mortar" 
              className="hero-sanctuary-img"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* ── 2. Quick Symptom Healer Section ── */}
      <section id="quick-healer" className="sanctuary-section">
        <div className="section-header-centered">
          <span className="section-eyebrow">Natural Remedy Finder</span>
          <h2 className="section-title">What Ailment Are You Seeking Relief From?</h2>
          <p className="section-subtitle">
            Click on any common health concern below to immediately receive personalized herbal remedies, exact preparation instructions, and dosage advice.
          </p>
        </div>

        <div className="ailment-cards-grid">
          {QUICK_AILMENTS.map((item) => (
            <div 
              key={item.id} 
              className="ailment-card glass-panel"
              onClick={() => onStartConsultation(item.prompt)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onStartConsultation(item.prompt)}
            >
              <div className="ailment-card-top">
                <div className="ailment-emoji-box">{item.icon}</div>
                <span className="ailment-tag">{item.tag}</span>
              </div>
              <h3 className="ailment-title">{item.title}</h3>
              <p className="ailment-sanskrit">{item.sanskrit}</p>
              <p className="ailment-desc">{item.desc}</p>
              <div className="ailment-cta-row">
                <span>Prescribe Natural Remedy</span>
                <ChevronRight size={15} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Sacred Herbarium Showcase ── */}
      <section className="sanctuary-section bg-herbal-soft">
        <div className="section-header-centered">
          <span className="section-eyebrow">Nature’s Apothecary</span>
          <h2 className="section-title">Sacred Ayurvedic Botanicals & Their Powers</h2>
          <p className="section-subtitle">
            Each herb is an energetic medicine carrying specific Taste (Rasa), Thermal Potency (Virya), and Post-Digestive Effect (Vipaka).
          </p>
        </div>

        <div className="herbs-grid">
          {SACRED_HERBS.map((herb, idx) => (
            <div key={idx} className="herb-card glass-panel">
              <div className="herb-card-header">
                <div className="herb-icon-circle" style={{ background: `${herb.accent}18`, color: herb.accent }}>
                  <span>{herb.icon}</span>
                </div>
                <div className="herb-naming">
                  <h4 className="herb-title">{herb.name}</h4>
                  <span className="herb-botanical">{herb.botanical}</span>
                </div>
              </div>

              <div className="herb-details">
                <div className="herb-tag-row">
                  <span className="herb-meta-tag">{herb.sanskrit}</span>
                  <span className="herb-element-tag">{herb.element}</span>
                </div>
                <p className="herb-role">{herb.role}</p>
              </div>

              <button 
                className="herb-action-btn"
                onClick={() => onStartConsultation(`What are the proven Ayurvedic remedies and preparation techniques using ${herb.name} (${herb.botanical})?`)}
              >
                <span>Heal with {herb.name.split(" ")[0]}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Tri-Dosha Harmony Guide ── */}
      <section className="sanctuary-section">
        <div className="section-header-centered">
          <span className="section-eyebrow">The Tri-Dosha Principle</span>
          <h2 className="section-title">Discover Your Bio-Energetic Balance</h2>
          <p className="section-subtitle">
            Health in Ayurveda is defined as "Sama Dosha, Sama Agnischa" — perfect equilibrium of biological humors, digestive fire, and joyful mind.
          </p>
        </div>

        {/* Dosha Selector Tabs */}
        <div className="dosha-tabs-container">
          {DOSHAS.map((d) => (
            <button
              key={d.name}
              className={`dosha-tab-pill ${activeDosha === d.name ? "active-dosha" : ""}`}
              onClick={() => setActiveDosha(d.name)}
              style={activeDosha === d.name ? { borderColor: d.color, color: d.color } : {}}
            >
              <span>{d.name} Dosha</span>
            </button>
          ))}
        </div>

        {/* Active Dosha Display */}
        {DOSHAS.filter(d => d.name === activeDosha).map((d) => (
          <div key={d.name} className="dosha-featured-card glass-panel" style={{ borderColor: d.border }}>
            <div className="dosha-content-split">
              <div className="dosha-main-info">
                <div className="dosha-header-badge" style={{ color: d.color, background: d.bg }}>
                  <strong>{d.name} Dosha</strong> • <span>{d.elements}</span>
                </div>
                <h3 className="dosha-card-heading">What {d.name} Controls</h3>
                <p className="dosha-card-governs">{d.governs}</p>

                <h4 className="dosha-card-subheading">Signs of Imbalance (Vitiation):</h4>
                <p className="dosha-card-imbalance">{d.imbalance}</p>
              </div>

              <div className="dosha-remedy-box">
                <h4 className="dosha-box-title">Natural Restoration Therapy:</h4>
                <p className="dosha-box-text">{d.remedy}</p>
                <button 
                  className="dosha-consult-btn"
                  onClick={() => onStartConsultation(`I suspect my ${d.name} dosha is aggravated. What natural remedies, diet, and herbal teas will restore balance to ${d.name}?`)}
                >
                  <Sparkles size={16} />
                  <span>Get Personalized {d.name} Prescription</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── 5. Daily Dinacharya (Healing Clock) ── */}
      <section className="sanctuary-section bg-emerald-gradient-soft">
        <div className="section-header-centered">
          <span className="section-eyebrow">Circadian Harmony</span>
          <h2 className="section-title">The Ayurvedic Daily Clock (Dinacharya)</h2>
          <p className="section-subtitle">
            Synchronize your bodily rhythms with nature's solar and lunar cycles for effortless vitality and immunity.
          </p>
        </div>

        <div className="dinacharya-timeline-grid">
          {DINACHARYA_STEPS.map((step, idx) => (
            <div key={idx} className="dinacharya-card glass-panel">
              <div className="dinacharya-time-row">
                <div className="dinacharya-icon-wrap">{step.icon}</div>
                <div>
                  <span className="dinacharya-phase-tag">{step.phase}</span>
                  <div className="dinacharya-time">{step.time}</div>
                </div>
              </div>
              <h4 className="dinacharya-title">{step.title}</h4>
              <p className="dinacharya-tip">{step.tip}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Bottom Invitation Banner ── */}
      <section className="sanctuary-cta-banner">
        <div className="banner-leaves-decor">🌿</div>
        <div className="banner-content">
          <h2 className="banner-title">Ready to Experience True Natural Healing?</h2>
          <p className="banner-desc">
            Tell our LangGraph AI Vaidya what symptoms you feel. We will formulate a tailored 
            Ayurvedic home remedy with precise kitchen herbs, dosages, and safety checks.
          </p>
          <button 
            className="banner-cta-button"
            onClick={() => onStartConsultation()}
          >
            <Stethoscope size={20} />
            <span>Consult AI Vaidya Now</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </section>
    </div>
  );
}
