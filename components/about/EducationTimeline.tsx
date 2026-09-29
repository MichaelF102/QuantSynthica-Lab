"use client";

import React from "react";
import { GraduationCap, Calendar, MapPin, BookOpen } from "lucide-react";
import { PROFILE_CONFIG } from "@/lib/profile";

export default function EducationTimeline() {
  return (
    <section className="py-16 sm:py-20 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-[#060B14]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#1769FF] dark:text-blue-400">
            ACADEMIC FOUNDATION
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Education &amp; Credentials
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Rigorous training combining advanced computational analytics, statistics, machine learning, and software architecture.
          </p>
        </div>

        {/* Vertical Timeline */}
        <div className="mt-12 relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 md:ml-6 pl-6 sm:pl-8 space-y-12">
          {PROFILE_CONFIG.education.map((item, idx) => (
            <div key={item.degree} className="relative group">
              {/* Timeline Marker Dot */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-[#070D18] border-2 border-[#1769FF] shadow-xs group-hover:scale-110 transition-transform">
                <div className="h-2 w-2 rounded-full bg-[#1769FF]" />
              </div>

              {/* Education Card */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/50 p-6 sm:p-7 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {item.degree}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-[#1769FF] dark:text-blue-400">
                      <GraduationCap className="h-3.5 w-3.5" />
                      <span>{item.institution}</span>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{item.period}</span>
                  </div>
                </div>

                {item.focus && item.focus.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                      Focus Areas &amp; Coursework
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.focus.map((focusItem) => (
                        <span
                          key={focusItem}
                          className="rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300"
                        >
                          {focusItem}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
