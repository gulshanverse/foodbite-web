"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTheme, type ThemeMode } from "./theme-provider";

const options: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Device", icon: Monitor },
];

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === mode) ?? options[2];
  const Icon = current.icon;
  return (
    <div className="theme-toggle">
      <button className="theme-trigger" type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Icon size={16} /> <span className="theme-label">{current.label}</span>
      </button>
      {open ? (
        <div className="theme-menu" role="menu">
          {options.map(({ value, label, icon: OptionIcon }) => (
            <button key={value} className="theme-option" data-active={mode === value} role="menuitem" type="button" onClick={() => { setMode(value); setOpen(false); }}>
              <OptionIcon size={15} /> <span style={{ marginLeft: 8 }}>{label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
