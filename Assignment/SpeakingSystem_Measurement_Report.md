# CMU-CS 462 - Software Measurement and Analysis
## Group Project Report: SpeakingSystem (IELTS Mock Test Platform)

**System Type:** Existing Software / Prototype 
**Duration:** 2 Weeks Analysis  

---

### 1. Introduction and Brief Presentation of the Selected System

**1.1 System Overview**
The selected system for this measurement study is **SpeakingSystem**, a comprehensive web-based application designed to simulate IELTS Speaking examinations. It provides users with an authentic test-taking environment, utilizing artificial intelligence (Google Gemini API and Azure Speech Services) to evaluate their speaking skills based on official IELTS band descriptors (Fluency, Lexical Resource, Grammatical Accuracy, and Pronunciation).

**1.2 Scope and Feasibility**
The system architecture consists of a React/TypeScript frontend and a Python (FastAPI) backend. The core scope evaluated in this report includes:
*   **Student Portal:** Audio recording, mock exam modes (Forecast, Smart Random), and result report generation.
*   **Admin Portal:** User management, token allocation, and billing plan management.
*   **AI Assessment Pipeline:** The core grading logic integrating LLMs and audio processing.

This scope is strictly bounded to the core examination and administrative workflows. Because the functional boundaries, API integrations, and database entities are explicitly defined, conducting a comprehensive size, complexity, and effort estimation study is highly feasible and manageable within the 2-week assignment period.

---

### 2. GQM / GQIM Framework

To ensure our measurement activities align with business objectives, we apply the Goal-Question-Metric (GQM) framework to the AI assessment component of the SpeakingSystem.

**2.1 Measurement Goal**
*   **Purpose:** To evaluate and improve
*   **Issue:** the accuracy and operational reliability
*   **Object:** of the AI Assessment Engine
*   **Viewpoint:** from the perspective of the development team and the test-takers.

**2.2 Questions and Metrics**

*   **Question 1:** How accurate is the AI grading compared to the standard IELTS criteria?
    *   **Metric 1: Grading Deviation Rate (%).** Calculated as the percentage of AI-generated scores that deviate by more than 0.5 bands from a human expert examiner on a benchmark dataset. 
    *   *Justification:* This metric directly quantifies the "accuracy" issue. A high deviation rate indicates the prompt engineering or AI context needs refinement.

*   **Question 2:** What is the system's stability during high-stakes, real-time mock test sessions?
    *   **Metric 2: Mean Time Between Failures (MTBF) & Uptime (%).** Measured by tracking the time elapsed between API timeouts or backend crashes during audio processing.
    *   *Justification:* Test-takers experience high stress; a system crash ruins the mock exam experience. MTBF directly answers the "operational reliability" question.

*   **Question 3:** How actionable and clear do users find the AI-generated feedback?
    *   **Metric 3: Customer Satisfaction Score (CSAT).** A 5-point scale rating prompted after a user reviews their exam result report.
    *   *Justification:* Even if accurate, feedback must be user-friendly. This metric captures the "test-taker viewpoint" regarding the quality of the system's output.

---

### 3. Size Analysis (Function Point, Object Point, Feature Point, Complexity)

**3.1 Function Point (FP) Analysis**
We evaluate the system based on 5 information domains. Assuming an **Average** complexity weight for all parameters to reflect standard web application features:

| Information Domain | Count | Weight (Average) | Unadjusted Function Points (UFP) |
| :--- | :---: | :---: | :---: |
| **External Inputs (EI)** <br> *(e.g., User Registration, Submit Audio, Update Tokens)* | 4 | 4 | 16 |
| **External Outputs (EO)** <br> *(e.g., Mock Test Report, Usage History, Dashboard Chart)* | 3 | 5 | 15 |
| **External Inquiries (EQ)** <br> *(e.g., View Profile, View Prompt, View User Details)* | 3 | 4 | 12 |
| **Internal Logical Files (ILF)** <br> *(e.g., Users, Test Sessions, Audio Records, Prompts, Billing)* | 5 | 10 | 50 |
| **External Interface Files (EIF)** <br> *(e.g., Azure Speech API, Gemini GenAI API, Payment)* | 3 | 7 | 21 |
| **Total Unadjusted Function Points (UFP)** | | | **114** |

**Value Adjustment Factor (VAF):**
We assess 14 general system characteristics (e.g., data communications, distributed processing, online update). We estimate a Total Degree of Influence (TDI) of **45** (indicating a moderately high system complexity due to real-time audio and AI).
$$VAF = 0.65 + (0.01 \times 45) = 1.10$$

**Final Function Point Count:**
$$FP = UFP \times VAF = 114 \times 1.10 = 125.4 \text{ FP}$$

**3.2 Object Point (OP) Analysis**
*   **Screens:** Login (Simple=1), Mock Exam (Medium=2), Result Report (Medium=2), Admin Dashboard (Medium=2), User/Token Management (Medium=2). Total = 9 OP.
*   **Reports:** Student Progress Report (Medium=5), Admin Usage Aggregation (Medium=5). Total = 10 OP.
*   **3GL Components:** AI Assessment Module (Difficult=10), Audio Processing/Upload (Difficult=10). Total = 20 OP.

*Total Object Points (OP) = 39.*
Assuming a **15% Reuse** rate (utilizing existing UI component libraries and API wrappers):
$$NOP = OP \times \frac{100 - \%Reuse}{100} = 39 \times \frac{85}{100} = 33.15 \text{ NOP}$$

**3.3 Feature Point & Complexity Discussion**
While Function Points measure data movement, **Feature Points** are highly relevant here due to the system's algorithmic intensity (e.g., scoring algorithms, token deduction algorithms). 
The **Cyclomatic Complexity (CC)** of the backend AI assessment pipeline is notably high. The code must handle multiple independent paths: successful AI response, API rate limits, error fallbacks, and varying rubric interpolations. High complexity directly increases the difficulty of unit testing and maintenance, which will demand highly capable engineering personnel.

---

### 4. Effort Estimation Using COCOMO II

We apply the **COCOMO II - Early Design Model** to estimate development effort. 

**4.1 Size Conversion (FP to KLOC)**
Using an industry-standard conversion ratio for a mixed Python/TypeScript stack, we assume **50 SLOC per FP**.
$$Size = 125.4 \text{ FP} \times 50 \text{ SLOC/FP} = 6270 \text{ SLOC} = 6.27 \text{ KLOC}$$

**4.2 Cost Drivers (EAF Selection)**
The Early Design model uses 7 cost drivers. Based on our team and system characteristics:
1.  **RCPX (Product Reliability and Complexity): High (1.33)** - The system requires high reliability for mock exams and handles complex AI integrations.
2.  **RUSE (Reuse Required): Nominal (1.00)** - Standard reuse expected.
3.  **PDIF (Platform Difficulty): Nominal (1.00)** - Standard web deployment.
4.  **PERS (Personnel Capability): High (0.83)** - The development team is highly skilled in React and Python.
5.  **PREX (Personnel Experience): High (0.87)** - The team has prior experience with LLM integrations.
6.  **FCIL (Facilities): Nominal (1.00)** - Standard agile environment.
7.  **SCED (Schedule): Nominal (1.00)** - Normal schedule pressure.

$$EAF = 1.33 \times 1.00 \times 1.00 \times 0.83 \times 0.87 \times 1.00 \times 1.00 = 0.96$$

**4.3 Effort Calculation**
Using the Early Design formula $E = 2.45 \times KLOC \times EAF$:
$$Effort = 2.45 \times 6.27 \times 0.96 \approx 14.74 \text{ Person-Months (PM)}$$

*Conclusion:* The core development of the SpeakingSystem will require approximately **14.74 Person-Months** of effort.

---

### 5. Discussion

The derived effort of 14.74 Person-Months is a direct reflection of the relationships between our measurement goals, software size, and complexity. 

Because our GQM goal prioritizes high AI accuracy and system reliability (reflected in the MTBF and Deviation Rate metrics), the system must incorporate robust error-handling and complex external interfaces (Azure and Gemini). This drives up both the unadjusted Function Points (due to EIFs) and the complexity multiplier ($RCPX = 1.33$) in the estimation model. 

**Controlling Effort via Metrics:**
The metrics established in Section 2 can be actively used to control this effort. For instance, if the **MTBF (Metric 2)** falls below an acceptable threshold during early prototyping, the team will need to allocate more of the estimated 14.74 PM toward infrastructure stabilization rather than feature development. Conversely, if the **CSAT (Metric 3)** is high early on, the team can safely avoid over-engineering the user interface, preventing scope creep and keeping the project within the estimated effort bounds.

---

### 6. Limitations

Estimation models are empirical and subject to significant variance, particularly at the early design stage:
1.  **Size Estimation Risks:** The foundational KLOC estimation relies heavily on the assumed 50 SLOC/FP ratio and the accurate counting of internal logical files. If the Azure audio processing requires unexpectedly complex internal data schemas, the FP—and consequently the effort—will be severely underestimated.
2.  **Empirical Model Inaccuracies:** COCOMO II is based on historical project data. Modern GenAI implementations often involve rapid trial-and-error (prompt engineering) which may not align perfectly with traditional SLOC-based effort models.
3.  **Standard Deviation Margin:** As taught in the discipline, a cost estimation model is generally considered acceptable if 75% of predictions fall within a 25% margin of actuals. Therefore, our estimate of 14.74 PM carries a high standard deviation; real-world effort could easily swing between ~11 PM and ~18 PM depending on unforeseen integration challenges.
4.  **Personnel Dependency:** We assumed high personnel capability ($PERS = 0.83$). If key developers become unavailable or struggle with specific AI libraries, this multiplier will revert to nominal (1.00) or low, drastically increasing the required Person-Months.

---

### 7. Conclusion

This report successfully applied a structured measurement framework to the **SpeakingSystem** project. 
*   **Size:** The system size was quantified at **125.4 Function Points** and **33.15 New Object Points**.
*   **Effort:** Driven by high complexity but mitigated by a capable team, the development effort was estimated at **14.74 Person-Months** using the COCOMO II Early Design model.
*   **Quality Objectives:** The GQM framework anchored the project's success to tangible metrics: AI Grading Deviation Rate, MTBF, and CSAT.

**Feasibility:** The structured analysis proves that the SpeakingSystem is a highly feasible project. By strictly monitoring the defined metrics, the team can navigate the inherent algorithmic complexity and deliver a reliable, high-quality IELTS mock examination platform within the estimated effort boundaries.

