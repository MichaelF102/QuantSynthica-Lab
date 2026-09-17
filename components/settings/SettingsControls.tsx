"use client";

import React from "react";
import { ChevronDown, Info } from "lucide-react";

interface SettingsFieldProps {
  label: string;
  tooltip?: string;
  description?: string;
  badge?: string;
  className?: string;
  children: React.ReactNode;
}

export function SettingsField({
  label,
  tooltip,
  description,
  badge,
  className = "",
  children,
}: SettingsFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <label className="block text-[11px] font-mono font-medium text-slate-300 uppercase tracking-tight">
            {label}
          </label>
          {tooltip && (
            <span className="text-slate-500 hover:text-slate-300 cursor-help" title={tooltip}>
              <Info className="w-3 h-3" />
            </span>
          )}
        </div>
        {badge && (
          <span className="text-[9px] font-mono text-[#38BDF8] bg-[#38BDF8]/10 px-1 py-0.2 rounded border border-[#38BDF8]/30">
            {badge}
          </span>
        )}
      </div>
      {children}
      {description && (
        <p className="text-[10px] text-slate-500 font-sans leading-tight">
          {description}
        </p>
      )}
    </div>
  );
}

interface SettingsSelectProps<T extends string> {
  value: T;
  options: { value: T; label: string; subtext?: string }[] | readonly T[];
  onChange: (val: T) => void;
  disabled?: boolean;
}

export function SettingsSelect<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
}: SettingsSelectProps<T>) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        disabled={disabled}
        className="w-full appearance-none bg-[#111722] border border-[#1F2B3E] hover:border-[#2C3E56] focus:border-[#38BDF8] text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none transition-colors cursor-pointer font-sans disabled:opacity-50"
      >
        {options.map((opt) => {
          const val = typeof opt === "string" ? opt : opt.value;
          const lbl = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={val} value={val} className="bg-[#0D121B] text-slate-200">
              {lbl}
            </option>
          );
        })}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

interface SettingsInputProps {
  value: string | number;
  onChange: (val: string) => void;
  type?: "text" | "number";
  step?: string;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function SettingsInput({
  value,
  onChange,
  type = "text",
  step,
  min,
  max,
  prefix,
  suffix,
  placeholder,
  disabled = false,
}: SettingsInputProps) {
  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-2.5 text-slate-500 font-mono text-xs pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type={type}
        step={step}
        min={min}
        max={max}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full bg-[#111722] border border-[#1F2B3E] hover:border-[#2C3E56] focus:border-[#38BDF8] text-slate-100 text-xs py-1.5 rounded focus:outline-none transition-colors font-mono disabled:opacity-50 ${
          prefix ? "pl-6" : "pl-2.5"
        } ${suffix ? "pr-8 text-right" : "pr-2.5"}`}
      />
      {suffix && (
        <span className="absolute right-2.5 text-slate-500 font-mono text-[11px] pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}

interface SettingsToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function SettingsToggle({
  label,
  checked,
  onChange,
  disabled = false,
}: SettingsToggleProps) {
  return (
    <div className="flex items-center justify-between py-1">
      {label && <span className="text-xs text-slate-300 font-sans">{label}</span>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`w-8 h-4 rounded-full transition-colors relative p-0.5 disabled:opacity-50 ${
          checked ? "bg-[#0284C7]" : "bg-[#1E293B]"
        }`}
      >
        <div
          className={`w-3 h-3 rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
