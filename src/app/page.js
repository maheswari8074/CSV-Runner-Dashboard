"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function RunnerDashboard() {
  const [csvData, setCsvData] = useState([]);
  const [error, setError] = useState("");
  const [selectedRunner, setSelectedRunner] = useState("all");

  // Function to parse CSV file
  function handleFileUpload(event) {
    const file = event.target.files[0];

    if (!file) return;

    // Check if it's a CSV file
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const text = e.target.result;
        const parsed = parseCSV(text);
        setCsvData(parsed);
        setError("");
      } catch (err) {
        setError(err.message);
        setCsvData([]);
      }
    };

    reader.readAsText(file);
  }

  // Parse CSV text into array of objects
  function parseCSV(text) {
    const lines = text.trim().split("\n");

    if (lines.length < 2) {
      throw new Error("CSV must have at least header and one data row");
    }

    // Get headers and convert to lowercase
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    // Check if required columns exist
    if (!headers.includes("date")) {
      throw new Error('Missing "date" column in CSV');
    }
    if (!headers.includes("person")) {
      throw new Error('Missing "person" column in CSV');
    }
    if (!headers.includes("miles run")) {
      throw new Error('Missing "miles run" column in CSV');
    }

    const result = [];

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const values = line.split(",").map((v) => v.trim());

      const dateStr = values[0];
      const person = values[1];
      const milesStr = values[2];

      // Validate date
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error(`Row ${i + 1}: Invalid date "${dateStr}"`);
      }

      // Validate person
      if (!person) {
        throw new Error(`Row ${i + 1}: Person name is empty`);
      }

      // Validate miles
      const miles = parseFloat(milesStr);
      if (isNaN(miles)) {
        throw new Error(`Row ${i + 1}: Invalid miles value "${milesStr}"`);
      }
      if (miles < 0) {
        throw new Error(`Row ${i + 1}: Miles cannot be negative`);
      }

      result.push({
        date: dateStr,
        person: person,
        miles: miles,
      });
    }

    if (result.length === 0) {
      throw new Error("No valid data found in CSV");
    }

    return result;
  }

  // Calculate statistics
  function calculateStats(data) {
    if (data.length === 0) {
      return { total: 0, average: 0, min: 0, max: 0 };
    }

    let total = 0;
    let min = data[0].miles;
    let max = data[0].miles;

    for (let i = 0; i < data.length; i++) {
      total += data[i].miles;
      if (data[i].miles < min) min = data[i].miles;
      if (data[i].miles > max) max = data[i].miles;
    }

    const average = total / data.length;

    return { total, average, min, max };
  }

  // Get list of unique runners
  function getRunners() {
    const runners = [];
    for (let i = 0; i < csvData.length; i++) {
      if (!runners.includes(csvData[i].person)) {
        runners.push(csvData[i].person);
      }
    }
    return runners;
  }

  // Filter data by selected runner
  function getFilteredData() {
    if (selectedRunner === "all") {
      return csvData;
    }

    const filtered = [];
    for (let i = 0; i < csvData.length; i++) {
      if (csvData[i].person === selectedRunner) {
        filtered.push(csvData[i]);
      }
    }
    return filtered;
  }

  // Prepare data for line chart (miles over time)
  function getTimelineData() {
    const filtered = getFilteredData();
    // Group by date
    const dateMap = {};

    for (let i = 0; i < filtered.length; i++) {
      const date = filtered[i].date;
      if (!dateMap[date]) {
        dateMap[date] = 0;
      }
      dateMap[date] += filtered[i].miles;
    }

    const result = [];
    for (let date in dateMap) {
      result.push({ date: date, miles: dateMap[date] });
    }

    return result;
  }

  // Prepare data for bar chart (total miles per person)
  function getPersonData() {
    const personMap = {};

    for (let i = 0; i < csvData.length; i++) {
      const person = csvData[i].person;
      if (!personMap[person]) {
        personMap[person] = 0;
      }
      personMap[person] += csvData[i].miles;
    }

    const result = [];
    for (let person in personMap) {
      result.push({ person: person, miles: personMap[person] });
    }

    return result;
  }

  const stats = calculateStats(getFilteredData());
  const runners = getRunners();
  const timelineData = getTimelineData();
  const personData = getPersonData();

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Runner Dashboard
          </h1>
          <p className="text-gray-600">
            Upload your CSV file to analyze running data
          </p>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload CSV File</h2>
          <p className="text-sm text-gray-600 mb-3">
            Required columns: date, person, miles run
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-4 mb-6">
            <p className="font-semibold">Error:</p>
            <p className="whitespace-pre-wrap">{error}</p>
          </div>
        )}

        {/* Main Dashboard */}
        {csvData.length > 0 && (
          <div>
            {/* Runner Selection */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Runner:
              </label>
              <select
                value={selectedRunner}
                onChange={(e) => setSelectedRunner(e.target.value)}
                className="w-full md:w-64 p-2 border border-gray-300 rounded"
              >
                <option value="all">All Runners</option>
                {runners.map((runner) => (
                  <option key={runner} value={runner}>
                    {runner}
                  </option>
                ))}
              </select>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-gray-600 text-sm mb-1">Total Miles</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.total.toFixed(2)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-gray-600 text-sm mb-1">Average</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.average.toFixed(2)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-gray-600 text-sm mb-1">Minimum</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.min.toFixed(2)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-gray-600 text-sm mb-1">Maximum</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.max.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Line Chart - Miles Over Time */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Miles Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="miles"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart - Total Miles by Person */}
            {selectedRunner === "all" && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Total Miles by Runner
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={personData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="person" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="miles" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {csvData.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-600">Upload a CSV file to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
