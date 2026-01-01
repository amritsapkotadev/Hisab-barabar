"use client";

import React, { useState } from "react";

export default function DeleteAccountPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to request account deletion.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: 24, border: "1px solid #eee", borderRadius: 8, background: "#fff" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Delete Your Account</h1>
      <p style={{ marginBottom: 16 }}>
        If you wish to permanently delete your account and all associated data, please enter your email address below. This action is irreversible.
      </p>
      {submitted ? (
        <div style={{ color: "green", fontWeight: 500 }}>
          Your account deletion request has been submitted. We will process your request as soon as possible.
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <label htmlFor="email" style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: 8, marginBottom: 16, border: "1px solid #ccc", borderRadius: 4 }}
            placeholder="you@example.com"
          />
          {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: 10, background: "#d32f2f", color: "#fff", border: "none", borderRadius: 4, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Submitting..." : "Request Account Deletion"}
          </button>
        </form>
      )}
      <p style={{ marginTop: 24, fontSize: 13, color: "#888" }}>
        For any questions, contact our support team.
      </p>
    </div>
  );
}
