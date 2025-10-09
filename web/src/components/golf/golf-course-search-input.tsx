"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import type { GolfCourseSearchResult, SelectedGolfCourse } from "@/types/golf-course-api";

interface GolfCourseSearchInputProps {
  onCourseSelect: (course: SelectedGolfCourse) => void;
  selectedCourse: SelectedGolfCourse | null;
}

export function GolfCourseSearchInput({ onCourseSelect, selectedCourse }: GolfCourseSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GolfCourseSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      setError(null);

      try {
        const response = await fetch(`/api/golf-courses/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setSearchResults(data.results);
          setShowResults(true);
        } else {
          setError(data.error || "Failed to search courses");
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to search courses");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCourseClick = async (result: GolfCourseSearchResult) => {
    setShowResults(false);
    setIsFetchingDetails(true);
    setError(null);

    try {
      const response = await fetch(`/api/golf-courses/${result.id}`);
      const data = await response.json();

      if (response.ok && data.success) {
        console.log("Selected course data:", data.course);
        onCourseSelect(data.course);
        setSearchQuery(""); // Clear search after selection
      } else {
        setError(data.error || "Failed to fetch course details");
      }
    } catch (err) {
      console.error("Error fetching course details:", err);
      setError("Failed to fetch course details");
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleClearSelection = () => {
    onCourseSelect(null as any);
    setSearchQuery("");
    setSearchResults([]);
  };

  if (selectedCourse) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Golf Course
        </label>
        <div className="relative">
          <div className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-500 rounded-xl">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">{selectedCourse.course_name}</p>
                <p className="text-sm text-gray-600">{selectedCourse.club_name}</p>
                <p className="text-xs text-gray-500 flex items-center mt-1">
                  <MapPin className="w-3 h-3 mr-1" />
                  {selectedCourse.location}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Change
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700">
        Search for Golf Course *
      </label>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by course name (e.g., Pebble Beach)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (searchResults.length > 0) setShowResults(true);
          }}
          disabled={isFetchingDetails}
          className="pl-10 pr-10 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100"
        />
        {(isSearching || isFetchingDetails) && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-600 animate-spin" />
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}

      {showResults && searchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
          {searchResults.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => handleCourseClick(result)}
              className="w-full text-left p-4 hover:bg-green-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🏌️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{result.course_name}</p>
                  <p className="text-sm text-gray-600 truncate">{result.club_name}</p>
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{result.location}</span>
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && searchResults.length === 0 && !isSearching && searchQuery.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
          <p className="text-sm text-gray-600 text-center">No courses found. Try a different search term.</p>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-1">
        Start typing to search from thousands of golf courses worldwide
      </p>
    </div>
  );
}
