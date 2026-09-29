"use client";

import React from "react";
import { BarChart3, LineChart, Cpu, CheckCircle2 } from "lucide-react";

export default function BackgroundSection() {
  return (
    <section className="py-16 sm:py-20 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#070D18]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#1769FF] dark:text-blue-400">
            EXPERIENCE &amp; DOMAINS
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Professional &amp; Academic Background
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            A structured focus across enterprise market data analytics, distributed data lake architectures, and systematic quantitative finance.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 1. Data Analytics */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-[#1769FF] dark:bg-blue-400/10 dark:text-blue-400">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Data Analytics</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Asterix StratComm</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Data Analyst at Asterix StratComm, working with FMCG market research data, data preprocessing, structured databases, analytics, and executive dashboard development.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">Core Deliverables:</div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>FMCG market research telemetry</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Data preprocessing &amp; structured databases</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Production dashboard engineering</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 2. Quantitative Finance */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-[#1769FF] dark:bg-blue-400/10 dark:text-blue-400">
                  <LineChart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Quantitative Finance</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Systematic Research</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Building quantitative research systems involving technical factor discovery, mathematical portfolio optimization, and realistic backtest simulation.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">System Capabilities:</div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Technical analysis &amp; Factor models</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Portfolio optimization &amp; Backtesting</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Volatility modelling &amp; Risk analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Time-series analysis &amp; Drawdown dynamics</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 3. Big Data Engineering */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-[#1769FF] dark:bg-blue-400/10 dark:text-blue-400">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Big Data Engineering</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Distributed Architecture</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Engineering distributed pipelines, columnar Parquet lakehouses, and containerized cloud services for large-scale data transformation.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">Technologies in Use:</div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["Python", "SQL", "Pandas", "PySpark", "Apache Spark", "ETL/ELT", "Parquet", "Docker", "AWS"].map((tech) => (
                  <span
                    key={tech}
                    className="rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
