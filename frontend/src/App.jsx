import { useState } from "react";
import bg from "./assets/pg.png";
import * as pdfjsLib from "pdfjs-dist";
import { jsPDF } from "jspdf";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.min.mjs";

function App() {
  const [page, setPage] = useState("home");
  const [resume, setResume] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [message, setMessage] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");
  const [isReadingResume, setIsReadingResume] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPreparingInterview, setIsPreparingInterview] = useState(false);
  const [interviewPrepResult, setInterviewPrepResult] = useState("");
  const [mockInterviewResult, setMockInterviewResult] = useState("");
  const [mockAnswer, setMockAnswer] = useState("");
  const [mockQuestionNumber, setMockQuestionNumber] = useState(1);
  const [mockFinalReport, setMockFinalReport] = useState("");
  const [mockInterviewCompleted, setMockInterviewCompleted] = useState(false);
  const [mockEvaluations, setMockEvaluations] = useState([]);
  const [isSubmittingMockAnswer, setIsSubmittingMockAnswer] = useState(false);
  const [jobMatchResult, setJobMatchResult] = useState("");

  const goHome = () => {
    setPage("home");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToAssistant = () => {
    setPage("assistant");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const exploreFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  const extractPdfText = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("https://careerpilot-nc5e.onrender.com/api/extract-pdf", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "PDF extraction failed");
    }

    return data.text || "";
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw error;
  }
};

  const handleResume = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (file.type !== "application/pdf") {
    setMessage("Please upload a PDF resume.");
    return;
  }

  setResume(file);
  setResumeText("");
  setAnalysisResult("");
  setIsReadingResume(true);
  setMessage("Reading your resume...");

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      "https://careerpilot-nc5e.onrender.com/api/extract-pdf",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();


    if (!response.ok || !data.success) {
      throw new Error(
        data.detail || data.error || "Unable to read PDF"
      );
    }

    setResumeText(data.text);
    setMessage("Resume read successfully. Ready for AI analysis.");
  } catch (error) {
    console.error("PDF extraction error:", error);
    setMessage("Unable to read this PDF.");
  } finally {
    setIsReadingResume(false);
  }
};

  const openResumeAnalysis = async () => {
    if (!resume) return setMessage("Please upload your resume first.");
    if (isReadingResume || !resumeText) {
      return setMessage("Please wait for the resume to finish reading.");
    }

    setPage("resumeAnalysis");
    setMessage("AI is analyzing your resume...");
    setIsAnalyzing(true);
    setAnalysisResult("");
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const response = await fetch(
        "https://careerpilot-nc5e.onrender.com/api/analyze-resume",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Resume analysis failed");
      }

      if (!data.success) {
        throw new Error(data.error || "AI analysis failed");
      }

      setAnalysisResult(data.analysis || "");
      setMessage("Resume analysis completed successfully.");
    } catch (error) {
      console.error("Resume analysis error:", error);
      setMessage("AI analysis failed. Please check the Python FastAPI backend.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeJob = async () => {
  if (!resume) return setMessage("Please upload your resume first.");
  if (!resumeText) return setMessage("Please analyze your resume first.");
  if (!jobDescription.trim()) return setMessage("Please paste the job description first.");

  setMessage("🤖 AI is analyzing your job match... Please wait.");
  setIsAnalyzing(true);

  try {
    const response = await fetch("https://careerpilot-nc5e.onrender.com/api/job-match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resumeText,
        jobDescription,
      }),
    });

    const data = await response.json();
    console.log("JOB MATCH AI RESPONSE:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.detail || data.error || "Job match failed");
    }

    setJobMatchResult(data.analysis);
    setMessage("");
    setPage("jobMatch");
  } catch (error) {
    console.error("Job Match error:", error);
    setMessage(`Job Match failed: ${error.message}`);
  } finally {
  setIsAnalyzing(false);
}
};

  const prepareInterview = async () => {
  if (!resumeText) {
    return setMessage("Please analyze your resume first.");
  }

  setMessage("🤖 AI is preparing your interview... Please wait.");
  setIsPreparingInterview(true);

  try {
    const response = await fetch("https://careerpilot-nc5e.onrender.com/api/interview-prep", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resumeText,
        jobDescription,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.error || "Interview preparation failed");
    }

    setMessage("Interview preparation completed successfully.");
    setInterviewPrepResult(data.analysis);
    setPage("interviewPrep");
  } catch (error) {
    console.error("Interview Prep error:", error);
    setMessage("Interview preparation failed. Please check the Python FastAPI backend.");
  }finally {
  setIsPreparingInterview(false);
}
};

// PDF REPORT ONLY
const downloadCompleteCareerReport = () => {
  try {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 42;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    let y = 52;

    const cleanText = (value) =>
      String(value ?? "")
        .replace(/\r/g, "")
        .replace(/[✓✔]/g, "[OK]")
        .replace(/[^\x00-\x7F]/g, (char) => (char === "•" ? "-" : ""));

    const ensureSpace = (needed = 20) => {
      if (y + needed > pageHeight - 45) {
        doc.addPage();
        y = 52;
      }
    };

    const addHeading = (text, size = 16) => {
      ensureSpace(35);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(size);
      doc.text(cleanText(text), margin, y);
      y += size + 10;
    };

    const addBody = (text, size = 10.5, lineGap = 15) => {
      const value = cleanText(text).trim();
      if (!value) return;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(size);

      value.split(/\n+/).forEach((paragraph) => {
        const line = paragraph.trim();

        if (!line) {
          y += 7;
          return;
        }

        const wrapped = doc.splitTextToSize(line, contentWidth);

        wrapped.forEach((row) => {
          ensureSpace(lineGap);
          doc.text(row, margin, y);
          y += lineGap;
        });

        y += 2;
      });
    };

    const addSection = (title, content) => {
      ensureSpace(45);
      y += 8;
      addHeading(title, 15);
      addBody(content);
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("CareerPilot-AI", margin, y);
    y += 32;

    doc.setFontSize(18);
    doc.text("Complete Career Report", margin, y);
    y += 25;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    addBody(`Resume: ${resume?.name || "Not available"}`);
    addBody(`Target Job Description: ${jobDescription ? "Provided" : "Not provided"}`);

    addSection(
      "1. Resume Analysis",
      analysisResult || "Resume analysis was not completed."
    );

    addSection(
      "2. Job Match Analysis",
      jobMatchResult || "Job match analysis was not completed."
    );

    addSection(
      "3. Interview Preparation",
      interviewPrepResult || "Interview preparation was not completed."
    );

    addSection(
      "4. Mock Interview - 25 Questions",
      mockEvaluations.length
        ? mockEvaluations
            .map((evaluation, index) => `Question ${index + 1}\n${evaluation}`)
            .join("\n\n")
        : "Mock interview evaluations were not recorded."
    );

    addSection(
      "5. Final Interview Report",
      mockFinalReport || "Final interview report was not completed."
    );

    const pageCount = doc.getNumberOfPages();

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
      doc.setPage(pageNumber);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(
        `CareerPilot-AI | Complete Career Report | Page ${pageNumber} of ${pageCount}`,
        margin,
        pageHeight - 20
      );
    }

    doc.save("CareerPilot-AI-Complete-Career-Report.pdf");
  } catch (error) {
    console.error("PDF report generation error:", error);
    setMessage("Unable to create the PDF report.");
  }
};

const buildMockFinalReport = (evaluations) => {
  const allText = evaluations.join("\n\n");
  const scoreMatches = allText.match(/(?:score|marks?|rating)\s*[:\-]?\s*(\d{1,3})(?:\s*\/\s*100)?/gi) || [];
  const scores = scoreMatches
    .map((item) => {
      const match = item.match(/(\d{1,3})/);
      return match ? Number(match[1]) : null;
    })
    .filter((score) => score !== null && score >= 0 && score <= 100);

  const overallScore = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : null;

  const rating = overallScore === null
    ? "Not available"
    : overallScore >= 90
      ? "Excellent"
      : overallScore >= 80
        ? "Very Good"
        : overallScore >= 70
          ? "Good"
          : overallScore >= 60
            ? "Needs Improvement"
            : "Needs Significant Improvement";

  const extractSection = (text, names) => {
    const sectionNames = names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const nextNames = [
      "GOOD", "STRENGTHS", "IMPROVEMENT", "AREAS TO IMPROVE", "BETTER ANSWER",
      "NEXT QUESTION", "QUESTION", "EVALUATION", "SCORE", "MARKS", "RATING"
    ].map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const re = new RegExp(`(?:^|\\n)\\s*(?:#{1,6}\\s*)?(?:${sectionNames})\\s*:?\\s*([\\s\\S]*?)(?=\\n\\s*(?:#{1,6}\\s*)?(?:${nextNames})\\s*:?|$)`, "i");
    return text.match(re)?.[1]?.trim() || "";
  };

  const strengths = [];
  const improvements = [];
  evaluations.forEach((evaluation) => {
    const good = extractSection(evaluation, ["GOOD", "STRENGTHS"]);
    const improve = extractSection(evaluation, ["IMPROVEMENT", "AREAS TO IMPROVE"]);
    if (good) strengths.push(good.replace(/^[\-•*]\s*/, "").trim());
    if (improve) improvements.push(improve.replace(/^[\-•*]\s*/, "").trim());
  });

  const unique = (items) => [...new Set(items.filter(Boolean))].slice(0, 5);
  const finalStrengths = unique(strengths);
  const finalImprovements = unique(improvements);

  return [
    "FINAL INTERVIEW REPORT",
    `Questions Completed: 25/25`,
    `Overall Score: ${overallScore === null ? "Not available" : `${overallScore}/100`}`,
    `Rating: ${rating}`,
    "",
    "STRENGTHS",
    ...(finalStrengths.length ? finalStrengths.map((item) => `• ${item}`) : ["• Review the individual answer evaluations above for identified strengths."]),
    "",
    "AREAS TO IMPROVE",
    ...(finalImprovements.length ? finalImprovements.map((item) => `• ${item}`) : ["• Continue improving clarity, depth, and confidence in your answers."]),
    "",
    "OVERALL FEEDBACK",
    overallScore === null
      ? "The interview is complete. Individual answer evaluations were recorded, but a numeric score was not returned by the AI."
      : `You completed all 25 questions with an average evaluated score of ${overallScore}/100. Focus on the improvement points above and keep your answers specific, structured, and relevant to the target role.`,
    "",
    "INTERVIEW STATUS",
    "✓ Completed"
  ].join("\n");
};

const startMockInterview = async () => {
  if (!resumeText) {
    setMessage("Please analyze your resume first.");
    return;
  }

  // Open interview screen immediately
  setPage("mockInterview");
  setMockAnswer("");
  setMockQuestionNumber(1);
  setMockFinalReport("");
  setMockInterviewCompleted(false);
  setMockEvaluations([]);
  setMockInterviewResult("AI is preparing your first interview question...");
  setMessage("");

  try {
    const response = await fetch(
      "https://careerpilot-nc5e.onrender.com/api/mock-interview",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText: resumeText,
          jobDescription: jobDescription,
          conversation: "",
          userAnswer: "",
        }),
      }
    );

    const data = await response.json();
    console.log("MOCK INTERVIEW DATA:", data);

    if (!response.ok || !data.success) {
      throw new Error(
        data.detail || data.error || "Mock interview failed"
      );
    }

    setMockInterviewResult(data.analysis || "AI did not return a question.");
    setMockAnswer("");
    setMessage("");
  } catch (error) {
    console.error("Mock Interview error:", error);
    setMockInterviewResult("");
    setMessage(`Mock Interview failed: ${error.message}`);
  }
};
const submitMockAnswer = async () => {
  const answer = mockAnswer.trim();

  if (!answer) {
    setMessage("Please enter your answer first.");
    return;
  }

  // Prevent double-submit from skipping Question 25.
  if (isSubmittingMockAnswer) {
    return;
  }

  setIsSubmittingMockAnswer(true);

  setMessage(
    mockQuestionNumber === 25
      ? "AI is evaluating your final answer and preparing your final report..."
      : "AI is evaluating your answer and preparing the next question..."
  );

  try {
    const response = await fetch(
      "https://careerpilot-nc5e.onrender.com/api/mock-interview",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          conversation: mockInterviewResult || "",
          userAnswer: answer,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.detail || data.error || "Mock interview failed"
      );
    }

    // The number of completed answers is the reliable source for
    // moving from Question 24 to Question 25.
    const currentEvaluation = data.analysis || "";
    const updatedEvaluations = [...mockEvaluations, currentEvaluation];
    setMockEvaluations(updatedEvaluations);

    const completedQuestions = updatedEvaluations.length;

    if (completedQuestions >= 25) {
      setMockFinalReport(buildMockFinalReport(updatedEvaluations));
      setMockAnswer("");
      setMessage("");
      setMockInterviewCompleted(true);
      setPage("mockFinalReport");
      return;
    }

    // After Question 24, this explicitly becomes Question 25.
    setMockQuestionNumber(completedQuestions + 1);
    setMockInterviewResult(
      currentEvaluation || "No response received."
    );
    setMockAnswer("");
    setPage("mockInterview");
    setMessage("");
  } catch (error) {
    console.error("Mock Interview error:", error);
    setMessage(`Mock Interview failed: ${error.message}`);
  } finally {
    setIsSubmittingMockAnswer(false);
  }
};

  const getAnalysisSection = (title) => {
    if (!analysisResult) return "AI analysis will appear here after you analyze your resume.";

    const titles = [
      "Profile Summary", "Work Experience", "Technical Skills", "Soft Skills",
      "Education", "Certifications", "Projects", "Key Strengths",
      "Career Profile", "Top Skills", "Areas to Improve"
    ];

    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const nextSections = titles
      .filter((item) => item !== title)
      .map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");

    const pattern = new RegExp(
      `(?:^|\\n)\\s*(?:#{1,6}\\s*)?(?:\\d+[.)]\\s*)?${escaped}\\s*:?[\\s\\n]+([\\s\\S]*?)(?=\\n\\s*(?:#{1,6}\\s*)?(?:\\d+[.)]\\s*)?(?:${nextSections})\\s*:?(?:\\s|$)|$)`,
      "i"
    );

    const match = analysisResult.replace(/\r/g, "").match(pattern);
    return match?.[1]?.trim() || "Not specifically mentioned in the AI analysis.";
  };

  const renderSectionContent = (title) => {
    const lines = getAnalysisSection(title)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return (
      <div style={styles.resultContent}>
        {lines.map((line, index) => (
          <p key={index} style={styles.resultLine}>
            {line.replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "").trim()}
          </p>
        ))}
      </div>
    );
  };

  if (page === "resumeAnalysis") {
    return (
      <div style={styles.app}>
        <header style={styles.topNav}>
          <button onClick={goHome} style={styles.logoButton}>✦ CareerPilot AI</button>
          <button onClick={goToAssistant} style={styles.backButton}>← Back to Assistant</button>
        </header>

        <main style={styles.analysisPage}>
          <div style={styles.smallBadge}>✦ RESUME ANALYSIS</div>
          <h1 style={styles.analysisTitle}>Understand your resume</h1>
          <p style={styles.analysisSubtitle}>
            CareerPilot AI will analyze your resume and organize your professional profile into clear, useful insights.
          </p>

          <section style={styles.resumeUploadBox}>
            <div style={styles.uploadIcon}>📄</div>
            <h2 style={styles.uploadTitle}>
              {resume ? "Resume ready for analysis" : "Upload your resume"}
            </h2>
            <p style={styles.uploadText}>{resume ? resume.name : "Upload your PDF resume."}</p>

            <label style={styles.uploadButton}>
              {resume ? "Change Resume" : "Choose Resume"}
              <input type="file" accept=".pdf,application/pdf" onChange={handleResume} style={{ display: "none" }} />
            </label>

            {resume && (
              <button
                onClick={openResumeAnalysis}
                disabled={isReadingResume || isAnalyzing}
                style={{ ...styles.analyzeResumeButton, opacity: isReadingResume || isAnalyzing ? 0.6 : 1 }}
              >
                {isReadingResume ? "Reading Resume..." : isAnalyzing ? "AI Analyzing..." : "Analyze Resume →"}
              </button>
            )}
          </section>

          {message && <div style={styles.message}>{message}</div>}

          {analysisResult && (
            <section style={styles.aiResultHeader}>
              <span style={styles.nextStepLabel}>✦ AI ANALYSIS COMPLETE</span>
              <h2 style={styles.resultTitle}>Your Professional Profile</h2>
              <p style={styles.resultSubtitle}>
                The information below is generated from your uploaded resume by CareerPilot AI.
              </p>
            </section>
          )}

          <div style={styles.resultGrid}>
            {[
              ["👤", "Profile Summary"], ["💼", "Work Experience"],
              ["⚙️", "Technical Skills"], ["🤝", "Soft Skills"],
              ["🎓", "Education"], ["🏆", "Certifications"],
              ["🚀", "Projects"], ["⭐", "Key Strengths"],
              ["🧭", "Career Profile"], ["🔥", "Top Skills"],
              ["📈", "Areas to Improve"]
            ].map(([icon, title]) => (
              <section style={styles.resultCard} key={title}>
                <div style={styles.resultIcon}>{icon}</div>
                <h2>{title}</h2>
                {renderSectionContent(title)}
              </section>
            ))}
          </div>

          <section style={styles.nextStepBox}>
            <div>
              <span style={styles.nextStepLabel}>NEXT STEP</span>
              <h2>Ready to discover your job match?</h2>
              <p>Compare your resume with a real job description and discover your match percentage and skill gaps.</p>
            </div>
            <button onClick={goToAssistant} style={styles.nextButton}>Continue to Job Match →</button>
          </section>

          <button onClick={goToAssistant} style={styles.bottomBackButton}>← Back to Assistant</button>
        </main>
      </div>
    );
  }

if (page === "jobMatch") {
 const getJobMatchSection = (title) => {
  if (!jobMatchResult) {
    return "AI is analyzing your job match...";
  }

  const text = jobMatchResult.replace(/\r/g, "");
  const upperText = text.toUpperCase();
  const start = upperText.indexOf(title);

  if (start === -1) {
    return "AI result not available.";
  }

  const contentStart = start + title.length;

  const sections = [
    "MATCH SCORE",
    "MATCHING SKILLS",
    "MISSING SKILLS",
    "EXPERIENCE MATCH",
    "EDUCATION MATCH",
    "CERTIFICATION MATCH",
    "CANDIDATE STRENGTHS",
    "SKILL GAPS",
    "FINAL RECOMMENDATION",
  ];

  let end = text.length;

  sections.forEach((section) => {
    if (section === title) return;

    const position = upperText.indexOf(section, contentStart);

    if (position !== -1 && position < end) {
      end = position;
    }
  });

  return text.slice(contentStart, end).replace(/^[:\s]+/, "").trim();
};

  const renderJobMatchContent = (title) => {
    const lines = getJobMatchSection(title)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return (
      <div style={styles.resultContent}>
        {lines.map((line, index) => (
          <p key={index} style={styles.resultLine}>
            {line
              .replace(/^[-•]\s/, "")
              .replace(/^\d+[.)]\s*/, "")
              .trim()}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.app}>
      <header style={styles.topNav}>
        <button onClick={goHome} style={styles.logoButton}>
          ✦ CareerPilot AI
        </button>

        <button
          onClick={goToAssistant}
          style={styles.backButton}
        >
          ← Back to Assistant
        </button>
      </header>

      <main style={styles.analysisPage}>
        <div style={styles.smallBadge}>
          ✦ JOB MATCH ANALYSIS
        </div>

        <h1 style={styles.analysisTitle}>
          Discover your job match
        </h1>

        <p style={styles.analysisSubtitle}>
          Understand how closely your resume matches the target opportunity.
        </p>

      <section style={{ ...styles.analysisCard, ...styles.jobMatchCard }}>
      <h2>🎯 Match Score</h2>
      {renderJobMatchContent("MATCH SCORE")}
    </section>

    <section style={{ ...styles.analysisCard, ...styles.jobMatchCard }}>
      <h2>✅ Matching Skills</h2>
      {renderJobMatchContent("MATCHING SKILLS")}
    </section>

    <section style={{ ...styles.analysisCard, ...styles.jobMatchCard }}>
      <h2>⚠️ Missing Skills</h2>
      {renderJobMatchContent("MISSING SKILLS")}
    </section>

    <section style={{ ...styles.analysisCard, ...styles.jobMatchCard }}>
      <h2>💼 Experience Match</h2>
      {renderJobMatchContent("EXPERIENCE MATCH")}
    </section>

    <section style={{ ...styles.analysisCard, ...styles.jobMatchCard }}>
      <h2>🎓 Education Match</h2>
      {renderJobMatchContent("EDUCATION MATCH")}
    </section>

    <section style={{ ...styles.analysisCard, ...styles.jobMatchCard }}>
      <h2>🏆 Certification Match</h2>
      {renderJobMatchContent("CERTIFICATION MATCH")}
    </section>

    <section style={{ ...styles.analysisCard, ...styles.jobMatchCard }}>
      <h2>⭐ Candidate Strengths</h2>
      {renderJobMatchContent("CANDIDATE STRENGTHS")}
    </section>

    <section style={{ ...styles.analysisCard, ...styles.jobMatchCard }}>
      <h2>📈 Skill Gaps</h2>
      {renderJobMatchContent("SKILL GAPS")}
    </section>

    <section style={{ ...styles.analysisCard, ...styles.jobMatchCard }}>
      <h2>💡 Final Recommendation</h2>
      {renderJobMatchContent("FINAL RECOMMENDATION")}
    </section>

      <section style={styles.nextStepBox}>
      <div style={styles.nextStepLabel}>NEXT STEP</div>

      <h2 style={styles.nextStepTitle}>
        Ready for your interview?
      </h2>

      <p style={styles.nextStepText}>
        Use your resume and target job to generate personalized interview preparation.
      </p>

      <button
      onClick={prepareInterview}
      disabled={isPreparingInterview}
      style={{
        ...styles.primaryButton,
        opacity: isPreparingInterview ? 0.6 : 1,
        cursor: isPreparingInterview ? "wait" : "pointer"
      }}
    >
      {isPreparingInterview
        ? "🤖 AI Preparing Interview..."
        : "Continue to Interview Prep →"}
    </button>
    </section>

        <button
          onClick={goToAssistant}
          style={styles.bottomBackButton}
        >
          ← Back to Assistant
        </button>
      </main>
    </div>
  );
}
  
if (page === "interviewPrep") {
  return (
    <div style={styles.app}>
      <header style={styles.topNav}>
        <button onClick={goHome} style={styles.logoButton}>
          ✦ CareerPilot AI
        </button>

        <button
          onClick={goToAssistant}
          style={styles.backButton}
        >
          ← Back to Assistant
        </button>
      </header>

      <main style={styles.analysisPage}>
        <div style={styles.smallBadge}>
          ✦ INTERVIEW PREPARATION
        </div>

        <h1 style={styles.analysisTitle}>
          Prepare for your interview
        </h1>

        <p style={styles.analysisSubtitle}>
          Get personalized interview preparation based on your resume and target job.
        </p>

        <section style={styles.analysisCard}>
          <h2>🎯 Interview Preparation</h2>

          <div style={styles.resultContent}>
            {interviewPrepResult
            ? interviewPrepResult.split("\n").map((line, index) => {
                const text = line.trim();

                const isHeading =
                  /^#{1,6}\s*\d*\.?\s*/.test(text) ||
                  /^\\(Candidate Overview|Target Role|Strongest Areas|Important Risks|Preparation Priorities|Question|What the interviewer is testing|Suggested Answer|Key Points|Overall Feedback|Interview Status).?\\*/i.test(text);

                return (
                  <p
                    key={index}
                    style={{
                      ...styles.resultLine,
                      fontWeight: isHeading ? "800" : "400",
                      marginTop: isHeading ? "18px" : "0",
                    }}
                  >
                    {text}
                  </p>
                );
              })
              : "AI is preparing your interview..."}
          </div>
        </section>
        <button
        onClick={startMockInterview}
        style={styles.primaryButton}
      >
        Start Mock Interview →
      </button>
        <button
          onClick={goToAssistant}
          style={styles.bottomBackButton}
        >
          ← Back to Assistant
        </button>
      </main>
    </div>
  );
}

if (page === "mockInterview") {
  return (
    <div style={styles.app}>
      <header style={styles.topNav}>
        <button onClick={goHome} style={styles.logoButton}>
          ✦ CareerPilot AI
        </button>

        <button onClick={goToAssistant} style={styles.backButton}>
          ← Back to Assistant
        </button>
      </header>

      <main style={styles.analysisPage}>
        <div style={styles.smallBadge}>✦ MOCK INTERVIEW</div>
        <div style={{ marginTop: "15px", color: "#b9b6ff", fontWeight: "800" }}>
          Current Question: {mockQuestionNumber}/25
        </div>

        <h1 style={styles.analysisTitle}>
          Your AI Mock Interview
        </h1>

        <p style={styles.analysisSubtitle}>
          Practice with personalized interview questions based on your resume and target job.
        </p>

        <section style={styles.analysisCard}>
  <h2>🎤 Interview Session</h2>

  <div style={styles.resultContent}>
  {mockInterviewResult ? (
    mockInterviewResult.split("\n").map((line, index) => (
      <p key={index} style={styles.resultLine}>
        {line.trim()}
      </p>
    ))
  ) : (
    "AI is preparing your first interview question..."
  )}
</div>

  <textarea
    value={mockAnswer}
    onChange={(e) => setMockAnswer(e.target.value)}
    placeholder="Type your answer here..."
    rows={6}
    style={{
      width: "100%",
      marginTop: "20px",
      padding: "16px",
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.15)",
      background: "rgba(255,255,255,0.05)",
      color: "white",
      fontSize: "16px",
      resize: "vertical",
      boxSizing: "border-box",
    }}
  />

  <button
    onClick={submitMockAnswer}
    disabled={isSubmittingMockAnswer}
    style={{
      ...styles.primaryButton,
      opacity: isSubmittingMockAnswer ? 0.6 : 1,
      cursor: isSubmittingMockAnswer ? "not-allowed" : "pointer",
    }}
  >
    {isSubmittingMockAnswer ? "Evaluating..." : "Submit Answer →"}
  </button>
</section>


        <button
          onClick={goToAssistant}
          style={styles.bottomBackButton}
        >
          ← Back to Assistant
        </button>
      </main>
    </div>
  );
}

  if (page === "mockFinalReport" && mockInterviewCompleted) {
    return (
      <div style={styles.app}>
        <header style={styles.topNav}>
          <button onClick={goHome} style={styles.logoButton}>
            ✦ CareerPilot AI
          </button>

          <button onClick={goToAssistant} style={styles.backButton}>
            ← Back to Assistant
          </button>
        </header>

        <main style={styles.analysisPage}>
          <div style={styles.smallBadge}>✦ FINAL INTERVIEW REPORT</div>

          <h1 style={styles.analysisTitle}>
            Your Interview Results
          </h1>

          <p style={styles.analysisSubtitle}>
            Your 25-question AI mock interview is complete. Here is your final performance report.
          </p>

          <section style={styles.analysisCard}>
            <h2>📊 Final Report</h2>

            <div style={styles.resultContent}>
              {mockFinalReport
                ? mockFinalReport.split("\n").map((line, index) => (
                    <p key={index} style={styles.resultLine}>
                      {line.trim()}
                    </p>
                  ))
                : "Final report is being prepared..."}
            </div>
          </section>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "15px",
              flexWrap: "wrap",
              marginTop: "30px",
            }}
          >
            <button
              onClick={startMockInterview}
              style={styles.primaryButton}
            >
              🔄 Start New Mock Interview
            </button>

            <button
              onClick={downloadCompleteCareerReport}
              style={styles.primaryButton}
            >
              📥 Download Complete Career Report
            </button>

            <button
              onClick={goToAssistant}
              style={styles.bottomBackButton}
            >
              ← Back to Assistant
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (page === "assistant") {
    return (
      <div style={styles.app}>
        <header style={styles.topNav}>
          <button onClick={goHome} style={styles.logoButton}>✦ CareerPilot AI</button>
          <button onClick={goHome} style={styles.backButton}>← Back to Home</button>
        </header>

        <main style={styles.assistantPage}>
          <div style={styles.smallBadge}>✦ AI JOB & INTERVIEW ASSISTANT</div>
          <h1 style={styles.assistantTitle}>Your AI career assistant</h1>
          <p style={styles.assistantSubtitle}>
            Upload your resume, analyze your profile, discover your job match, and prepare for your interview.
          </p>

          <div style={styles.cards}>
            <section style={styles.card}>
              <div style={styles.cardIcon}>📄</div>
              <h2 style={styles.cardTitle}>Resume Analysis</h2>
              <p style={styles.cardText}>
                Upload your resume and let AI understand your experience, skills, education, projects, and strengths.
              </p>

              <label style={styles.primaryButton}>
                {resume ? "Change Resume" : "Upload Resume"}
                <input type="file" accept=".pdf,application/pdf" onChange={handleResume} style={{ display: "none" }} />
              </label>

              {resume && (
                <>
                  <div style={styles.fileName}>✓ {resume.name}</div>
                  <button onClick={openResumeAnalysis} style={styles.primaryButton} disabled={isReadingResume || isAnalyzing}>
                    {isReadingResume ? "Reading Resume..." : isAnalyzing ? "Analyzing..." : "View Resume Analysis →"}
                  </button>
                </>
              )}
            </section>

            <section style={styles.card}>
              <div style={styles.cardIcon}>🎯</div>
              <h2 style={styles.cardTitle}>Job Match</h2>
              <p style={styles.cardText}>
                Paste a job description and discover how closely your profile matches the opportunity.
              </p>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here..."
                style={styles.textarea}
              />
              <button onClick={analyzeJob} style={styles.primaryButton}>Analyze Job →</button>
            </section>

            <section style={styles.card}>
              <div style={styles.cardIcon}>🎤</div>
              <h2 style={styles.cardTitle}>Interview Prep</h2>
              <p style={styles.cardText}>
                Get personalized technical and HR questions based on your resume and target job.
              </p>
              <button
              onClick={prepareInterview}
              disabled={isPreparingInterview}
              style={{
                ...styles.primaryButton,
                opacity: isPreparingInterview ? 0.6 : 1,
                cursor: isPreparingInterview ? "wait" : "pointer"
              }}
            >
              {isPreparingInterview
                ? "🤖 AI Preparing Interview..."
                : "Prepare Interview →"}
            </button>
            </section>
          </div>

          {message && <div style={styles.message}>{message}</div>}

          <section style={styles.workflow}>
            <div style={styles.workflowHeader}>
              <span style={styles.smallBadge}>✦ CAREERPILOT WORKFLOW</span>
              <h2>From resume to interview confidence</h2>
              <p>A complete AI-powered career preparation journey.</p>
            </div>

            <div style={styles.workflowGrid}>
              {[
                ["01", "Resume Analysis", "Understand your profile"],
                ["02", "Job Match", "Discover compatibility"],
                ["03", "Skill Gaps", "Know what to improve"],
                ["04", "Interview Prep", "Practice smarter"],
                ["05", "Mock Interview", "Practice with AI"],
                ["06", "Career Report", "Review your results"]
              ].map(([num, title, text]) => (
                <div style={styles.workflowItem} key={num}>
                  <span>{num}</span>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </div>
              ))}
            </div>
          </section>

          <button onClick={goHome} style={styles.bottomBackButton}>← Back to Home</button>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <header style={styles.nav}>
        <button onClick={goHome} style={styles.logoButton}>✦ CareerPilot AI</button>
        <nav style={styles.navLinks}>
          <button onClick={exploreFeatures} style={styles.navButton}>How it works</button>
          <button onClick={exploreFeatures} style={styles.navButton}>Features</button>
          <button onClick={goToAssistant} style={styles.getStarted}>Get Started</button>
        </nav>
      </header>

      <main>
        <section style={styles.hero}>
          <div style={styles.heroGlow}></div>
          <div style={styles.heroBadge}>✦ AI-powered career intelligence</div>

          <h1 style={styles.heroTitle}>
            Your career.<br />
            <span style={styles.gradientText}>Powered by AI.</span>
          </h1>

          <p style={styles.heroText}>
            Analyze your resume, discover your job match, identify skill gaps, and prepare for interviews with an intelligent career assistant.
          </p>

          <div style={styles.heroButtons}>
            <button onClick={goToAssistant} style={styles.heroPrimary}>Start Your Career Journey →</button>
            <button onClick={exploreFeatures} style={styles.heroSecondary}>Explore Features</button>
          </div>

        <div style={styles.trustRow}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
          <strong>Resume</strong>
          <span>AI Analysis</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
          <strong>Job Match</strong>
          <span>Smart Scoring</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
          <strong>Interview</strong>
          <span>AI Preparation</span>
        </div>
      </div>
        </section>

        <section id="features" style={styles.featuresSection}>
          <div style={styles.smallBadge}>✦ SIMPLE. SMART. PERSONALIZED.</div>
          <h2 style={styles.featuresTitle}>Everything you need to prepare for your next job</h2>
          <p style={styles.featuresSubtitle}>
            CareerPilot AI brings your resume analysis, job matching, skill-gap discovery, interview preparation, and career insights together.
          </p>

          <div style={styles.featureGrid}>
            {[
              ["📄", "Resume Analysis", "Understand your experience, skills, education, projects, and career strengths."],
              ["🎯", "Job Match", "Compare your resume with a job description and discover your compatibility."],
              ["💡", "Skill Gaps", "Identify important missing skills and understand what you should improve."],
              ["🎤", "Interview Preparation", "Prepare for technical and HR interviews using personalized AI-generated questions."]
            ].map(([icon, title, text]) => (
              <div style={styles.featureCard} key={title}>
                <div style={styles.largeIcon}>{icon}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>

          <button onClick={goToAssistant} style={styles.heroPrimary}>Get Started →</button>
        </section>
      </main>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
   background: `url(${bg}) center center / cover fixed no-repeat`,
    color: "#f7f8ff",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflowX: "hidden"
  },

  nav: {
    height: "76px",
    padding: "0 5%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid rgba(120,140,190,0.18)",
    background: "rgba(3,5,11,0.82)",
    backdropFilter: "blur(20px)",
    position: "sticky",
    top: 0,
    zIndex: 20
  },

  topNav: {
    height: "76px",
    padding: "0 5%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid rgba(120,140,190,0.18)",
    background: "rgba(3,5,11,0.82)",
    backdropFilter: "blur(20px)",
    position: "sticky",
    top: 0,
    zIndex: 20
  },

  logoButton: {
    border: "none",
    background: "transparent",
    fontSize: "22px",
    fontWeight: "850",
    color: "#f7f8ff",
    cursor: "pointer",
    padding: 0
  },

  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "34px"
  },

  navButton: {
    border: "none",
    background: "transparent",
    color: "#d5daf0",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer"
  },

  getStarted: {
    border: "1px solid rgba(108,142,255,0.5)",
    borderRadius: "14px",
    padding: "13px 23px",
    background: "linear-gradient(135deg, #7257ff, #168ff7)",
    color: "#fff",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 0 28px rgba(72,112,255,0.32)"
  },

  backButton: {
    border: "1px solid rgba(130,145,190,0.28)",
    background: "rgba(15,20,34,0.8)",
    color: "#e7eaff",
    padding: "10px 16px",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer"
  },

  hero: {
    minHeight: "calc(100vh - 76px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "70px 5% 80px",
    position: "relative",
    overflow: "hidden",
    background:`url(${bg}) center center / cover no-repeat`,
  },

  heroGlow: {
    position: "absolute",
    width: "620px",
    height: "620px",
    borderRadius: "50%",
    background: "rgba(48,92,255,0.14)",
    filter: "blur(110px)",
    top: "70px",
    left: "50%",
    transform: "translateX(-50%)",
    pointerEvents: "none"
  },

  heroBadge: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 17px",
    borderRadius: "999px",
    background: "rgba(18,24,42,0.72)",
    border: "1px solid rgba(128,145,205,0.30)",
    color: "#cfd8ff",
    fontSize: "13px",
    fontWeight: "700",
    boxShadow: "0 0 30px rgba(66,92,180,0.12)"
  },

  smallBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "rgba(72,68,170,0.18)",
    border: "1px solid rgba(117,105,255,0.28)",
    color: "#b9b6ff",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.06em"
  },

  heroTitle: {
    position: "relative",
    margin: "30px 0 22px",
    fontSize: "clamp(52px, 8vw, 96px)",
    lineHeight: "0.98",
    letterSpacing: "-0.055em",
    fontWeight: "900",
    color: "#ffffff",
    textShadow: "0 0 35px rgba(255,255,255,0.08)"
  },

  gradientText: {
    background: "linear-gradient(90deg, #f2eaff 0%, #9d72ff 28%, #4c8dff 65%, #2cecff 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    filter: "drop-shadow(0 0 24px rgba(91,109,255,0.22))"
  },

  heroText: {
    maxWidth: "820px",
    color: "#c1c8df",
    fontSize: "19px",
    lineHeight: "1.7",
    margin: "0 auto"
  },

  heroButtons: {
    display: "flex",
    gap: "18px",
    marginTop: "36px",
    flexWrap: "wrap",
    justifyContent: "center"
  },

  heroPrimary: {
    border: "1px solid rgba(125,105,255,0.55)",
    borderRadius: "14px",
    padding: "16px 28px",
    background: "linear-gradient(135deg, #7954ff 0%, #437cff 55%, #12bff4 100%)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "850",
    cursor: "pointer",
    boxShadow: "0 0 38px rgba(74,100,255,0.42)"
  },

  heroSecondary: {
    border: "1px solid rgba(130,150,205,0.45)",
    borderRadius: "14px",
    padding: "16px 28px",
    background: "rgba(5,8,17,0.65)",
    color: "#f1f3ff",
    fontSize: "16px",
    fontWeight: "750",
    cursor: "pointer"
  },

 trustRow: {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  justifyContent: "center",
  gap: "70px",
  marginTop: "75px",
  width: "100%"
},
  featuresSection: {
  padding: "85px 5% 100px",
  textAlign: "center",
  position: "relative",
  background: "transparent",
  borderTop: "1px solid rgba(100,120,180,0.14)"
},

  featuresTitle: {
    maxWidth: "800px",
    margin: "22px auto 14px",
    fontSize: "clamp(34px, 5vw, 56px)",
    lineHeight: "1.05",
    letterSpacing: "-0.04em",
    color: "#f7f8ff"
  },

  featuresSubtitle: {
    maxWidth: "700px",
    margin: "0 auto",
    color: "#aeb7d0",
    fontSize: "17px",
    lineHeight: "1.7"
  },

  featureGrid: {
    maxWidth: "1120px",
    margin: "55px auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "22px"
  },

  featureCard: {
    padding: "30px",
    border: "1px solid rgba(100,125,190,0.22)",
    borderRadius: "20px",
    background: "rgba(8,12,24,0.78)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 18px 50px rgba(0,0,0,0.25)",
    textAlign: "left",
    color: "#f3f5ff"
  },

  largeIcon: {
    fontSize: "32px",
    marginBottom: "18px"
  },

  assistantPage: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "75px 6%",
    textAlign: "center",
    background: "radial-gradient(circle at 50% 10%, rgba(46,77,190,0.12), transparent 35%)"
  },

  assistantTitle: {
    fontSize: "clamp(42px, 6vw, 68px)",
    margin: "22px 0 15px",
    letterSpacing: "-0.045em",
    color: "#f7f8ff"
  },

  assistantSubtitle: {
    maxWidth: "720px",
    margin: "0 auto 55px",
    color: "#aeb7d0",
    lineHeight: "1.7",
    fontSize: "17px"
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "22px",
    textAlign: "left"
  },

  card: {
    padding: "30px",
    borderRadius: "22px",
    background: "rgba(8,12,24,0.82)",
    border: "1px solid rgba(105,128,190,0.23)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.28)"
  },

  cardIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, rgba(86,70,220,0.35), rgba(31,112,235,0.24))",
    border: "1px solid rgba(120,130,255,0.25)",
    fontSize: "25px"
  },

  cardTitle: {
    fontSize: "24px",
    margin: "20px 0 10px",
    color: "#f4f6ff"
  },

  cardText: {
    color: "#aab4cd",
    lineHeight: "1.65",
    minHeight: "80px"
  },

  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(115,130,255,0.35)",
    borderRadius: "11px",
    padding: "12px 17px",
    background: "linear-gradient(135deg, #5947d8, #176fd5)",
    color: "#fff",
    fontWeight: "750",
    cursor: "pointer",
    marginTop: "15px"
  },

  secondaryAction: {
    display: "block",
    marginTop: "12px",
    border: "none",
    background: "transparent",
    color: "#8ea8ff",
    fontWeight: "750",
    cursor: "pointer"
  },

  fileName: {
    marginTop: "13px",
    color: "#62e6a8",
    fontSize: "13px",
    fontWeight: "700",
    wordBreak: "break-word"
  },

  textarea: {
    width: "100%",
    minHeight: "180px",
    boxSizing: "border-box",
    resize: "vertical",
    border: "1px solid rgba(120,140,190,0.30)",
    borderRadius: "12px",
    padding: "14px",
    marginTop: "10px",
    fontFamily: "inherit",
    fontSize: "14px",
    outline: "none",
    color: "#f1f4ff",
    background: "rgba(3,6,15,0.75)"
  },

  message: {
    maxWidth: "900px",
    margin: "28px auto",
    padding: "15px 18px",
    borderRadius: "12px",
    background: "rgba(65,76,180,0.18)",
    border: "1px solid rgba(100,120,255,0.24)",
    color: "#cbd4ff",
    fontWeight: "650"
  },

  workflow: {
    marginTop: "75px",
    padding: "55px 30px",
    borderRadius: "28px",
    background: "rgba(8,12,24,0.78)",
    border: "1px solid rgba(105,128,190,0.22)"
  },

  workflowHeader: {
    marginBottom: "35px"
  },

  workflowGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px"
  },

  workflowItem: {
    padding: "22px",
    borderRadius: "16px",
    background: "rgba(14,19,35,0.9)",
    border: "1px solid rgba(100,120,180,0.20)",
    textAlign: "left",
    color: "#e9edff",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  bottomBackButton: {
    marginTop: "45px",
    border: "1px solid rgba(130,145,190,0.28)",
    background: "rgba(12,16,29,0.8)",
    color: "#e7eaff",
    padding: "12px 20px",
    borderRadius: "11px",
    fontWeight: "700",
    cursor: "pointer"
  },

  analysisPage: {
    maxWidth: "1150px",
    margin: "0 auto",
    padding: "75px 6%",
    textAlign: "center",
    background: "radial-gradient(circle at 50% 10%, rgba(46,77,190,0.12), transparent 35%)"
  },

  analysisTitle: {
    fontSize: "clamp(42px, 6vw, 68px)",
    margin: "22px 0 20px",
    letterSpacing: "-0.045em",
    color: "#f7f8ff"
  },

  analysisSubtitle: {
    maxWidth: "720px",
    margin: "0 auto 50px",
    color: "#aeb7d0",
    fontSize: "17px",
    lineHeight: "1.7"
  },

  analysisCard: {
  background: "rgba(5, 10, 22, 0.58)",
  border: "1px solid rgba(110, 190, 255, 0.22)",
  borderRadius: "22px",
  padding: "30px",
  margin: "24px auto",
  maxWidth: "1000px",
  boxShadow: "0 12px 35px rgba(0,0,0,0.18)",
  backdropFilter: "blur(8px)",
  color: "#d6dbe8",
  textAlign: "left"
},

jobMatchCard: {
  background: "rgba(5, 10, 22, 0.58)",
  border: "1px solid rgba(110, 190, 255, 0.22)",
  borderRadius: "22px",
  padding: "30px",
  margin: "24px auto",
  maxWidth: "1000px",
  boxShadow: "0 12px 35px rgba(0,0,0,0.18)",
  backdropFilter: "blur(8px)"
},

  resumeUploadBox: {
    maxWidth: "720px",
    margin: "0 auto 35px",
    padding: "45px 30px",
    borderRadius: "24px",
    background: "rgba(8,12,24,0.82)",
    border: "1px solid rgba(105,128,190,0.24)",
    boxShadow: "0 18px 55px rgba(0,0,0,0.28)"
  },

  uploadIcon: {
    width: "70px",
    height: "70px",
    margin: "0 auto 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "20px",
    background: "linear-gradient(135deg, rgba(84,68,220,0.35), rgba(22,111,218,0.24))",
    border: "1px solid rgba(120,130,255,0.25)",
    fontSize: "32px"
  },

  uploadTitle: {
    margin: "0 0 8px",
    fontSize: "25px",
    color: "#f4f6ff"
  },

  uploadText: {
    color: "#aab4cd",
    marginBottom: "22px",
    wordBreak: "break-word"
  },

  uploadButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "13px 20px",
    borderRadius: "11px",
    background: "linear-gradient(135deg, #5947d8, #176fd5)",
    color: "#fff",
    fontWeight: "750",
    cursor: "pointer"
  },

  analyzeResumeButton: {
    display: "block",
    margin: "15px auto 0",
    border: "1px solid rgba(110,130,255,0.35)",
    borderRadius: "11px",
    padding: "13px 20px",
    background: "linear-gradient(135deg, #7252f2, #168fe8)",
    color: "#fff",
    fontWeight: "750",
    cursor: "pointer",
    boxShadow: "0 0 25px rgba(72,100,255,0.25)"
  },

  aiResultHeader: {
    maxWidth: "850px",
    margin: "55px auto 30px"
  },

  resultTitle: {
    margin: "15px 0 8px",
    fontSize: "34px",
    letterSpacing: "-0.03em",
    color: "#f7f8ff"
  },

  resultSubtitle: {
    color: "#aeb7d0",
    lineHeight: "1.6",
    margin: 0
  },

  resultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    textAlign: "left",
    marginTop: "35px"
  },

  resultCard: {
    padding: "27px",
    borderRadius: "20px",
    background: "rgba(8,12,24,0.82)",
    border: "1px solid rgba(105,128,190,0.22)",
    boxShadow: "0 10px 35px rgba(0,0,0,0.25)"
  },

  resultIcon: {
    fontSize: "28px",
    marginBottom: "12px"
  },

  resultContent: {
    marginTop: "14px"
  },

  resultLine: {
    color: "#b4bed5",
    lineHeight: "1.65",
    margin: "0 0 10px"
  },

  nextStepBox: {
  marginTop: "55px",
  padding: "35px",
  borderRadius: "22px",
  background: "rgba(5, 10, 22, 0.58)",
  border: "1px solid rgba(110, 190, 255, 0.22)",
  boxShadow: "0 12px 35px rgba(0,0,0,0.18)",
  backdropFilter: "blur(8px)",
  textAlign: "left",
  maxWidth: "1000px",
  marginLeft: "auto",
  marginRight: "auto"
},

  nextStepLabel: {
    color: "#a99cff",
    fontSize: "11px",
    fontWeight: "900",
    letterSpacing: "0.08em"
  },

  nextButton: {
    border: "1px solid rgba(115,130,255,0.38)",
    borderRadius: "12px",
    padding: "14px 20px",
    background: "linear-gradient(135deg, #654cff, #168eea)",
    color: "#fff",
    fontWeight: "800",
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 0 25px rgba(72,100,255,0.25)"
  }
};

export default App;
