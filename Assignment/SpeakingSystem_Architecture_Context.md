# SpeakingSystem: Comprehensive System Architecture & Business Context
## Background Knowledge for NotebookLM

**Instruction for NotebookLM:** This document provides the foundational background knowledge, architectural details, and business context of the **SpeakingSystem** project. Use this context to deeply understand the product before generating presentation slides, ensuring that all technical explanations, system scale measurements, and business logic are perfectly accurate and professional.

---

### 1. Executive Summary
**SpeakingSystem** is a modern, web-based educational technology platform designed to provide an authentic, high-stakes mock examination environment for the **IELTS Speaking Test**. 

Unlike traditional platforms that rely on expensive and time-consuming human examiners, SpeakingSystem leverages advanced Artificial Intelligence—specifically Large Language Models (LLMs) and advanced Speech-to-Text pipelines—to instantly evaluate a user's spoken audio and generate a professional, highly detailed result report based on official IELTS grading rubrics.

---

### 2. Core Features & User Workflows

#### A. The Student Portal (Test-Taker Experience)
*   **Exam Modes:** Users can engage in different practice modes, including **Forecast** (using predicted/trending IELTS topics) and **Smart Random** (AI-generated randomized topics to prevent memorization).
*   **Audio Recording & Interface:** The UI provides a distraction-free examination interface (`PracticeModePage`). It features a robust `AudioRecorder` component with concurrency guards (preventing users from accidentally double-clicking and consuming extra tokens) and UI constraints to mimic the pressure of a real exam.
*   **AI Result Reports:** After submitting audio, users receive a detailed breakdown of their performance. The UI utilizes custom `BandBadge` components to display scores across the four official IELTS criteria:
    1.  **Fluency and Coherence (FC)**
    2.  **Lexical Resource (LR)**
    3.  **Grammatical Range and Accuracy (GRA)**
    4.  **Pronunciation (PR)**
*   **Token/Billing Economy:** The system is monetized via a token system (visually represented by diamond icons). Users consume tokens to take exams. If a user has insufficient tokens, a professional modal directs them to subscription/plan upgrades.

#### B. The Admin Control Center
*   **Admin Dashboard:** Aggregates system usage data, utilizing SQL joins to visualize metrics like token burn rates, user conversions (from Guest to Registered), and API failure rates.
*   **User Management:** Allows administrators to view detailed user profiles (`UserDetailModal`), track their testing history, and monitor account statuses.
*   **Token & Plan Allocation:** Admins can manually allocate tokens, manage subscription tiers, and configure billing account details. 

---

### 3. Technical Architecture & Tech Stack

#### A. Frontend (Client-Side)
*   **Framework:** React with TypeScript (`.tsx`), built for high performance and strict type safety.
*   **State Management & UI:** Utilizes modern React hooks and context. Features modular, reusable components like `Card`, `BandBadge`, `TopicSidebar`, and `AddQuestionModal`.
*   **Routing & Security:** Implements strict Role-Based Access Control (RBAC). The `ProtectedRoute` logic ensures that only authenticated users can access the practice area, and only Super-Admins can access the Admin Control Center.

#### B. Backend (Server-Side)
*   **Framework:** Python using **FastAPI**, chosen for its high performance and native asynchronous (`async/await`) capabilities, which are essential for handling long-running AI API calls.
*   **Authentication:** Uses modern JWT (JSON Web Tokens) via the `joserfc` library for secure, stateless user sessions. Also integrates OAuth for Google logins.
*   **Database:** Powered by **SQL Server** (utilizing ODBC driver v18), managing relational entities such as Users, Test Sessions, Audio Metadata, and Token Ledgers. Seed data scripts (`seed_data.py`) ensure the database is prepopulated with valid IELTS topics.

#### C. AI & External Integrations (The Assessment Pipeline)
The most critical and complex part of the system is the AI Assessment Engine. When a user submits an audio answer, the backend triggers a dual-pipeline process:
1.  **Audio Processing (Azure):** The system processes the audio (handling `ffmpeg` conversions if necessary) and sends it to **Azure Speech Services** for advanced transcription and pronunciation assessment metrics.
2.  **LLM Evaluation (Google Gemini):** The transcript and Azure metrics are fed into the **Google Gemini API** (specifically the production-ready `gemini-2.0-flash` model). The backend uses highly engineered prompts to force Gemini to evaluate the text strictly against IELTS band descriptors, identifying vocabulary usage, grammar errors, and topic relevance.

---

### 4. Why This Context Matters for Software Measurement (CMU-CS 462)

When NotebookLM generates the presentation on Function Points and COCOMO II Effort Estimation, this context justifies the numbers:
*   **High Complexity (Cyclomatic Complexity / Feature Points):** The integration of asynchronous audio processing, Azure APIs, and Gemini LLM prompt handling creates complex backend logic. This justifies a high **RCPX (Product Reliability and Complexity)** score in COCOMO II.
*   **External Interface Files (EIF):** The heavy reliance on Azure and Google APIs directly increases the Function Point (FP) count.
*   **Quality Metrics (GQM):** Because this is a high-stakes educational tool, metrics like **Grading Deviation Rate** (how close the AI is to a human examiner) and **System Uptime/MTBF** (preventing crashes during a recorded exam) are absolutely critical business requirements.

