"use client";

import React, { useState } from "react";
import { Calendar } from "lucide-react";

interface BetterDatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

export function BetterDatePicker({ 
  value, 
  onChange, 
  placeholder = "Select date",
  className = ""
}: BetterDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);
  const [openUpwards, setOpenUpwards] = useState(false);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onChange(date);
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (!isOpen) {
      // Check if there's enough space below the input
      const rect = document.querySelector(`[data-datepicker="${placeholder}"]`)?.getBoundingClientRect();
      if (rect) {
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        setOpenUpwards(spaceBelow < 400 && spaceAbove > 400);
      }
    }
    setIsOpen(!isOpen);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = selectedDate || today;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push(date);
    }
    
    return days;
  };

  const goToPreviousMonth = () => {
    const current = selectedDate || new Date();
    const newDate = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    setSelectedDate(newDate);
  };

  const goToNextMonth = () => {
    const current = selectedDate || new Date();
    const newDate = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    setSelectedDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    if (!value) return false;
    return date.toDateString() === value.toDateString();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        data-datepicker={placeholder}
        className="w-full h-14 pl-12 pr-4 border border-white/30 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 bg-black/20 backdrop-blur-md transition-all duration-300 text-white placeholder:text-white/80 shadow-inner flex items-center justify-between"
      >
        <div className="flex items-center">
          <Calendar className="w-5 h-5 text-white/70 mr-3" />
          <span className={value ? "text-white" : "text-white/60"}>
            {value ? formatDate(value) : placeholder}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-white/70 transition-transform ${
            isOpen ? (openUpwards ? "rotate-0" : "rotate-180") : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[9999] p-4 ${
          openUpwards ? 'bottom-full mb-2' : 'top-full mt-2'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedDate ? selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }) : 
               new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h3>
            
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays().map((date, index) => (
              <button
                key={index}
                type="button"
                onClick={() => date && handleDateSelect(date)}
                disabled={date ? isPastDate(date) : false}
                className={`
                  h-10 w-10 rounded-lg text-sm font-medium transition-colors
                  ${!date ? "" : 
                    isSelected(date) ? "bg-blue-600 text-white" :
                    isToday(date) ? "bg-blue-100 text-blue-600" :
                    isPastDate(date) ? "text-gray-300 cursor-not-allowed" :
                    "text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                {date ? date.getDate() : ""}
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setSelectedDate(null);
                onChange(null);
                setIsOpen(false);
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
