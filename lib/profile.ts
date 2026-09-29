/**
 * Centralized Author & Professional Profile Configuration
 * QuantSynthicaLab — Quantitative Finance & Big Data Research
 */

export const PROFILE_CONFIG = {
  name: "Michael Fernandes",
  title: "Data Analyst • Quantitative Researcher • Big Data Analytics",
  role: "Data Analyst & Quantitative Researcher",
  email: "michaelferns3210@gmail.com",
  location: "Mumbai, India",
  
  // LinkedIn URL: Configurable via NEXT_PUBLIC_LINKEDIN_URL or directly here
  linkedinUrl: process.env.NEXT_PUBLIC_LINKEDIN_URL || "https://www.linkedin.com/in/michael-fernandes-quant",
  
  // Personal Portfolio URL: Configurable via NEXT_PUBLIC_PORTFOLIO_URL or directly here
  portfolioUrl: process.env.NEXT_PUBLIC_PORTFOLIO_URL || "https://michaelfernandes.dev",
  
  bio: "I work at the intersection of data analytics, quantitative finance, machine learning, and financial technology. My work focuses on transforming financial and market data into analytical systems, research tools, and decision-support platforms.",
  
  currentPosition: {
    title: "Data Analyst",
    company: "Asterix StratComm",
    description: "Working with FMCG market research data, data preprocessing, structured databases, analytics, and executive dashboard development.",
  },
  
  education: [
    {
      degree: "M.Sc. Big Data Analytics",
      institution: "St. Xavier's College, Mumbai",
      period: "2025 – 2027",
      focus: ["Big Data Engineering", "Data Analytics", "Machine Learning", "Quantitative Research", "Cloud Computing"],
    },
    {
      degree: "B.Sc. Information Technology",
      institution: "University of Mumbai",
      period: "2022 – 2025",
      focus: ["Software Engineering", "Relational Databases", "Algorithms & Data Structures", "Statistical Methods"],
    },
  ],
  
  skills: {
    programming: ["Python", "SQL", "Java", "R", "TypeScript"],
    dataEngineering: ["Apache Spark", "PySpark", "ETL/ELT", "Parquet", "Docker", "Airflow"],
    machineLearning: ["Scikit-learn", "XGBoost", "LightGBM", "TensorFlow/Keras"],
    quantitativeFinance: ["Portfolio Optimization", "Factor Models", "Backtesting", "Risk Analytics", "GARCH", "Time-Series Analysis"],
    cloud: ["AWS", "S3", "Glue", "Athena", "Lambda", "Redshift"],
  },

  projects: [
    {
      title: "QuantSynthicaLab",
      category: "Flagship Quantitative Platform",
      description: "End-to-end institutional quantitative research and algorithmic trading platform covering technical factor research, 0-lookahead backtesting, multi-asset risk observatory, and quadratic portfolio optimization across US & Indian equities.",
      highlights: ["Dual-Market Ingestion (US & NSE/BSE)", "Next-Open Fills with Friction Modeling", "Markowitz Efficient Frontier & CVaR Risk Engine"],
      link: "/",
      status: "Production",
    },
    {
      title: "Quant Terminal",
      category: "Market Analytics Terminal",
      description: "Comprehensive quantitative market analysis platform with multi-timeframe interactive technical charting, factor signals, corporate fundamentals, and correlation heatmaps.",
      highlights: ["Interactive Lightweight Candlestick Charts", "Technical Indicator Pipeline (SMA, EMA, RSI, MACD, Bollinger)", "Fundamental Valuation & SEC/NSE Filings"],
      link: "/research",
      status: "Live in Platform",
    },
    {
      title: "Quantum Risk Analytics Engine",
      category: "Advanced Risk Modeling",
      description: "Experimental research platform exploring classical and quantum-inspired computational algorithms for heavy-tailed financial risk analytics and non-linear portfolio stress testing.",
      highlights: ["Value at Risk (VaR 95/99%) & Expected Shortfall (CVaR)", "Parametric Scenario Shocks & Multi-Horizon Drawdowns", "Covariance Stress-Testing"],
      link: "/risk",
      status: "Research Module",
    },
    {
      title: "FMCG Big Data Pipeline",
      category: "Big Data & Distributed Systems",
      description: "PySpark-based Medallion Architecture (Bronze → Silver → Gold) handling large-scale FMCG market telemetry, transactional anomaly detection, and automated analytical feature stores.",
      highlights: ["Distributed Data Lakehouse via Apache Spark", "Optimized Snappy-compressed Parquet Stores", "Automated ETL/ELT Reconciliation"],
      link: "/about#projects",
      status: "Completed",
    },
    {
      title: "AML Analytics System",
      category: "Machine Learning & Security",
      description: "Anti-Money Laundering financial transaction monitoring and anomaly detection engine leveraging supervised and unsupervised ensemble learning on high-frequency payment graphs.",
      highlights: ["Graph-based Transaction Features", "XGBoost & Isolation Forest Ensemble", "Low False-Positive Alert Scoring"],
      link: "/about#projects",
      status: "Completed",
    },
    {
      title: "Volatility Forecasting",
      category: "Econometric & Time-Series Models",
      description: "Time-series volatility econometric modeling and comparative evaluation across equity indices and FX pairs using symmetric and asymmetric volatility engines.",
      highlights: ["GARCH(1,1) & EGARCH Asymmetric Leverage Modeling", "Historical Realized Volatility vs Forecast Comparison", "Statistical Residual Diagnostics (Ljung-Box, ARCH-LM)"],
      link: "/analytics",
      status: "Live in Platform",
    },
  ],
};

export const LINKEDIN_URL = PROFILE_CONFIG.linkedinUrl;
export const PORTFOLIO_URL = PROFILE_CONFIG.portfolioUrl;
export const CONTACT_EMAIL = PROFILE_CONFIG.email;
