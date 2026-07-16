"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

const interviewTypes = [
  "Phone Interview",
  "Video Interview",
  "Face-to-Face Interview",
];

const interviewResults = [
  "Waiting for Response",
  "Shortlisted",
  "Invited for Second Interview",
  "Job Offer Received",
  "Rejected",
];

const initialFormData = {
  full_name: "",
  email_address: "",
  interview_type: "",
  interview_result: "",
  interview_feedback: "",
};

export default function ClientInterviewFeedbackPage() {
  const [formData, setFormData] = useState(initialFormData);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");

    if (!formData.full_name.trim()) {
      setErrorMsg("Full Name is required.");
      return;
    }

    if (!formData.email_address.trim()) {
      setErrorMsg("Email Address is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_address.trim())) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (!formData.interview_type) {
      setErrorMsg("Interview Type is required.");
      return;
    }

    if (!formData.interview_result) {
      setErrorMsg("Interview Result is required.");
      return;
    }

    if (!formData.interview_feedback.trim()) {
      setErrorMsg("Interview Feedback is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/client-interview-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
      setFormData(initialFormData);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    } catch (error) {
      setErrorMsg("Failed to submit feedback. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="site-main fj-page">
        <section className="fj-section" style={{ minHeight: "80vh", display: "flex", alignItems: "center" }}>
          <div
            className="fj-container center"
            style={{
              maxWidth: "720px",
              width: "100%",
            }}
          >
            <div
              className="feedback-success-shell"
              style={{
                display: "grid",
                gap: "20px",
                padding: "32px 24px",
                maxWidth: "560px",
                margin: "0 auto",
                background: "linear-gradient(180deg, #ffffff 0%, #fbfdfc 100%)",
                border: "1px solid rgba(224, 255, 130, 0.7)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "0 30px 70px rgba(3, 31, 42, 0.08), 0 0 50px rgba(224, 255, 130, 0.15)",
              }}
            >
              <CheckCircle2 size={56} style={{ color: "var(--lime)", margin: "0 auto" }} />
              <h1 className="page-title" style={{ fontSize: "clamp(2rem, 4vw, 2.6rem)" }}>
 Thank You for Your Feedback
               </h1>
              <p className="lead center" style={{ margin: 0 }}>
 Your client interview feedback has been submitted successfully. We appreciate your input and will use it to keep improving the 9Jobs experience.
               </p>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginTop: "4px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="fj-button fj-button--ghost"
                >
 Submit Another
               </button>
                <Link href="/" className="fj-button fj-button--dark">
 Back to Home
               </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
 );
 }

 return (
               <main className="site-main fj-page">
      <section className="fj-section">
        <div className="fj-container" style={{ maxWidth: "760px" }}>
          <div className="fj-section-head center">
            <h1>
 Client Interview <span className="heading-mark">Feedback</span>
            </h1>
            <p>
 Share a quick update on the recent interview so the 9Jobs team can better support follow-up, coaching and future employer communication.
               </p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gap: "22px",
              padding: "clamp(24px, 4vw, 40px)",
              background: "linear-gradient(180deg, #ffffff 0%, #fbfcf7 100%)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--line)",
              boxShadow: "var(--soft-shadow)",
            }}
          >
            {errorMsg && (
              <div
                style={{
                  padding: "16px",
                  background: "#fee2e2",
                  color: "#b91c1c",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>{errorMsg}</span>
              </div>
 )}

               <div style={{ display: "grid", gap: "8px" }}>
              <label htmlFor="full_name" style={{ fontWeight: 700 }}>Full Name *</label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={handleChange}
                style={fieldStyle}
              />
            </div>

            <div style={{ display: "grid", gap: "8px" }}>
              <label htmlFor="email_address" style={{ fontWeight: 700 }}>Email Address *</label>
              <input
                id="email_address"
                name="email_address"
                type="email"
                required
                placeholder="Enter your email address"
                value={formData.email_address}
                onChange={handleChange}
                style={fieldStyle}
              />
            </div>

            <div style={responsiveGridStyle}>
              <div style={{ display: "grid", gap: "8px" }}>
                <label htmlFor="interview_type" style={{ fontWeight: 700 }}>Interview Type *</label>
                <select
                  id="interview_type"
                  name="interview_type"
                  required
                  value={formData.interview_type}
                  onChange={handleChange}
                  style={fieldStyle}
                >
                  <option value="">Select interview type</option>
                  {interviewTypes.map((option) => (
               <option key={option} value={option}>{option}</option>
 ))}
               </select>
              </div>

              <div style={{ display: "grid", gap: "8px" }}>
                <label htmlFor="interview_result" style={{ fontWeight: 700 }}>Interview Result *</label>
                <select
                  id="interview_result"
                  name="interview_result"
                  required
                  value={formData.interview_result}
                  onChange={handleChange}
                  style={fieldStyle}
                >
                  <option value="">Select interview result</option>
                  {interviewResults.map((option) => (
               <option key={option} value={option}>{option}</option>
 ))}
               </select>
              </div>
            </div>

            <div style={{ display: "grid", gap: "8px" }}>
              <label htmlFor="interview_feedback" style={{ fontWeight: 700 }}>Interview Feedback *</label>
              <textarea
                id="interview_feedback"
                name="interview_feedback"
                required
                rows="7"
                placeholder="Please share the interview questions that were asked, any challenges you faced and any additional feedback or suggestions for the 9Jobs team."
                value={formData.interview_feedback}
                onChange={handleChange}
                style={{
                  ...fieldStyle,
                  minHeight: "180px",
                  resize: "vertical",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="fj-button fj-button--dark"
              style={{
                alignSelf: "flex-start",
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Submitting..." : "Submit Feedback"}
              {!loading && <ArrowRight size={18} />}
               </button>
          </form>
        </div>
      </section>
    </main>
  );
}

const fieldStyle = {
  width: "100%",
  minHeight: "52px",
  padding: "14px 16px",
  borderRadius: "16px",
  border: "1px solid var(--line)",
  background: "#ffffff",
  color: "var(--ink)",
  fontSize: "1rem",
  fontFamily: "inherit",
  boxShadow: "0 1px 0 rgba(5, 5, 5, 0.02)",
};

const responsiveGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
};
