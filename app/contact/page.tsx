"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Linkedin, Globe, Send, CheckCircle2, MessageSquare, MapPin } from "lucide-react";
import Footer from "@/components/footer/Footer";
import { PROFILE_CONFIG, LINKEDIN_URL, PORTFOLIO_URL, CONTACT_EMAIL } from "@/lib/profile";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitting(true);
    // Simulate instantaneous client dispatch
    setTimeout(() => {
      setSubmitting(false);
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/60 dark:bg-[#070D18] text-slate-900 dark:text-white transition-colors duration-300">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#1769FF] dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Back to QuantSynthicaLab</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="max-w-2xl mb-12">
          <span className="rounded-md bg-[#1769FF]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#1769FF] dark:bg-blue-500/10 dark:text-blue-400">
            GET IN TOUCH
          </span>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Contact &amp; Collaboration
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Reach out regarding quantitative research, algorithmic trading models, big data engineering, or prospective initiatives.
          </p>
        </div>

        {/* Grid Layout: Contact Info & Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Direct Channels */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                Direct Channels
              </h2>

              <div className="space-y-4">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-blue-500/40 dark:hover:border-blue-500/40 bg-slate-50/50 dark:bg-slate-800/40 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-blue-500/10 text-[#1769FF] dark:text-blue-400 shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Direct Email</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                      {CONTACT_EMAIL}
                    </div>
                  </div>
                </a>

                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-blue-500/40 dark:hover:border-blue-500/40 bg-slate-50/50 dark:bg-slate-800/40 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-[#0A66C2]/10 text-[#0A66C2] shrink-0">
                    <Linkedin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">LinkedIn Profile</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                      Michael Fernandes
                    </div>
                  </div>
                </a>

                <a
                  href={PORTFOLIO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-blue-500/40 dark:hover:border-blue-500/40 bg-slate-50/50 dark:bg-slate-800/40 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Personal Portfolio</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                      michaelfernandes.dev
                    </div>
                  </div>
                </a>

                <div className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="p-2 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Location</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                      {PROFILE_CONFIG.location}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                About Michael
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Want to learn more about my background in FMCG data analytics, Big Data Engineering, and quantitative finance?
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1769FF] dark:text-blue-400 hover:underline"
              >
                <span>Read Full Professional Background</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Contact Form */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="h-4 w-4 text-[#1769FF] dark:text-blue-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Send an Inquiry
                </h2>
              </div>

              {isSubmitted ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Thank You, {formData.name}!
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    Your inquiry has been received. I will review your message and respond directly to <span className="font-semibold">{formData.email}</span>.
                  </p>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({ name: "", email: "", subject: "", message: "" });
                    }}
                    className="mt-5 rounded-lg bg-slate-900 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                  >
                    Send Another Note
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Your Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. John Doe"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Your Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@domain.com"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Quantitative Strategy Research / Data Analytics"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Message <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Share project details, research topics, or questions..."
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none resize-y"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Replies are sent to your provided email address.
                    </p>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#1769FF] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? (
                        <span>Sending...</span>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
