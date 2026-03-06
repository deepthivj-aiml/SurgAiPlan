<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8bd13442-d370-4a04-a906-93565850d1b8

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


# SurgiPlan AI – Precision Surgical Planning with AI

**SurgiPlan AI** is an intelligent surgical planning platform that combines **large-scale medical data infrastructure** with **advanced AI reasoning** to generate safe and optimized robotic surgery trajectories.

The system creates a **digital twin of surgical procedures** by analyzing historical surgical data, medical imaging, and anatomical structures to assist surgeons in planning complex robotic surgeries.

---

# Problem Statement

Robotic surgery demands extremely high precision. However, planning safe surgical trajectories is difficult because:

- Every patient has **unique anatomical variations**
- Surgeons must avoid **critical structures such as arteries and veins**
- Surgical decisions require analyzing **large volumes of medical data**
- Traditional algorithms rely only on **geometric calculations**

**SurgiPlan AI** solves this problem by combining **large-scale data persistence with intelligent reasoning**.

---

# System Architecture Overview

The platform consists of three main components:

1. **Cosmos – Data Infrastructure**
2. **Gemini – AI Reasoning Engine**
3. **VR Simulation – Surgical Visualization**

Together, these components create a **data-driven surgical planning system**.

---

# Cosmos – The Data Backbone

**Cosmos** serves as the **long-term memory and data infrastructure** of SurgiPlan AI.

It stores and manages the massive ecosystem of surgical data, including:

- **MRI and CT scan images**
- **Surgical telemetry**
- **Anatomical models**
- **Historical surgical procedures**
- **Robotic motion trajectories**
- **Surgical outcomes**

Cosmos enables the platform to **retrieve and analyze thousands of previous surgical cases instantly**, allowing AI models to learn from past procedures.

## Why Cosmos?

Surgical systems require:

- **High-scale data storage**
- **Low latency retrieval**
- **Flexible schema for medical data**
- **Multimodal data handling**

Cosmos allows SurgiPlan AI to maintain a **universe of surgical data** that supports intelligent surgical decision-making.

---

# Gemini – The Reasoning Engine

While **Cosmos stores the data**, **Gemini interprets it**.

Traditional algorithms only calculate shortest paths. Gemini introduces **expanded reasoning capabilities** that consider medical context.

Gemini analyzes:

- **Patient scans**
- **Anatomical structures**
- **Surgical notes**
- **Historical case outcomes stored in Cosmos**

This allows the system to recommend **safe surgical approaches rather than simple geometric paths**.

---

# Dual AI Strategy (Cosmos + Gemini)

To achieve both **deep reasoning and real-time performance**, SurgiPlan AI uses a **dual AI architecture supported by Cosmos data retrieval**.

## Cosmos – Data Provider

Cosmos continuously supplies:

- **Historical surgical cases**
- **Anatomical variations**
- **Surgical motion data**
- **Safety constraints**

This data is used by both Gemini models to generate and validate surgical plans.

---

## Gemini 3.1 Pro – The Architect

**Gemini Pro** performs **deep reasoning and surgical planning**.

Responsibilities include:

- Analyze **patient imaging and medical context**
- Retrieve **relevant surgical cases from Cosmos**
- Generate a **safe motion trajectory**
- Apply **safety buffers around critical structures**

This model focuses on **accuracy and reasoning rather than speed**.

---

## Gemini 3 Flash – The Pilot

**Gemini Flash** converts the surgical plan into **real-time executable coordinates**.

Responsibilities include:

- Translate trajectory plans into **robotic movement**
- Generate **real-time 3D coordinates**
- Power the **VR simulation**
- Maintain smooth performance at **60 FPS**

This model focuses on **speed and real-time interaction**.

---

# Example Use Case

## Laparoscopic Cholecystectomy (Gallbladder Removal)

### Input

Target coordinate:
X: 10
Y: 25
Z: -5


### Critical Structure

**Portal Vein** located near the surgical path.

### System Process

1. **Cosmos retrieves similar gallbladder procedures**
2. **Gemini Pro analyzes anatomical structure and case data**
3. **The safest trajectory is calculated**

### Recommended Path

**Lateral-to-Medial arc trajectory with a 5mm safety buffer**

---

# Safety Validation System

Before presenting the surgical plan, SurgiPlan AI performs a **Validation Check**.

The system cross-references the AI-generated plan with **safety constraints stored in Cosmos**.

Validation checks include:

- **Robotic arm kinematics**
- **Collision boundaries**
- **Safe vessel distance**
- **Motion constraints**

If the plan violates physical limits, the simulation is **automatically blocked**.

Only **verified safe trajectories** are displayed to surgeons.

---

# VR Simulation Environment

After validation, the system generates a **VR surgical simulation**.

Surgeons can visualize:

- **Robotic arm motion**
- **Planned trajectory**
- **Critical anatomical structures**
- **Real-time surgical telemetry**

The interface includes a **high-contrast HUD displaying:**

- **Tool depth**
- **Distance from vessels**
- **Motion trajectory**
- **Safety buffer zones**

This allows surgeons to verify the surgical plan before the actual procedure.

---

# Key Features

- **Large-scale surgical data infrastructure**
- **AI reasoning for surgical trajectory planning**
- **Digital twin surgical simulation**
- **Real-time robotic trajectory visualization**
- **Safety-first validation system**
- **VR-based surgical planning preview**

---

# Technology Stack

## Data Infrastructure
- **Cosmos Database**
- **Large-scale medical data storage**

## AI Models
- **Gemini 3.1 Pro – Reasoning Engine**
- **Gemini 3 Flash – Real-Time Execution**

## Simulation
- **3D visualization**
- **VR simulation engine**

---

# Project Workflow

1. Medical data and imaging are **stored in Cosmos**
2. Historical surgical cases are **retrieved**
3. **Gemini Pro performs reasoning and trajectory planning**
4. **Safety validation checks system constraints**
5. **Gemini Flash converts the plan into real-time simulation coordinates**
6. Surgeons **review the trajectory in VR**

---

# Future Improvements

- **Integration with hospital PACS systems**
- **Real-time intraoperative guidance**
- **Reinforcement learning for trajectory optimization**
- **Patient-specific surgical personalization**

---

# Conclusion

**SurgiPlan AI** combines **large-scale medical data with advanced AI reasoning** to transform robotic surgical planning.

**Cosmos provides the memory and data infrastructure.**  
**Gemini provides the reasoning and intelligence.**

Together they enable **safer, data-driven surgical planning that improves outcomes for patients.**
