# Educational AI System - Agent Architecture

This directory contains the specialized AI agents that work together to provide personalized educational content, explanations, and visualizations.

## Agent Structure

The system is composed of four main agents:

### 1. Personalization Agent
- **Location**: `backend/agents/personalization/`
- **Purpose**: Learns from student interactions and tailors content to their learning style
- **Key Components**:
  - `agent.py`: Core agent implementation
  - `router.py`: FastAPI router for personalization endpoints

### 2. Explainer Agent
- **Location**: `backend/agents/explainer/`
- **Purpose**: Generates educational explanations with visualization suggestions
- **Key Components**:
  - `agent.py`: Core agent implementation
  - `router.py`: FastAPI router for explainer endpoints

### 3. Visual Agent
- **Location**: `backend/agents/visual/`
- **Purpose**: Creates visualizations based on educational explanations
- **Key Components**:
  - `agent.py`: Core agent implementation
  - `router.py`: FastAPI router for visual endpoints

### 4. Explanation Agent
- **Location**: `backend/agents/explanation/`
- **Purpose**: Generates educational explanations and visualization specifications
- **Key Components**:
  - `service.py`: Core service implementation
  - `router.py`: FastAPI router for explanation endpoints

## Agent Interaction Flow

1. The Personalization Agent analyzes user queries and history to create personalization data
2. The Explainer Agent uses this personalization data to generate tailored explanations with visualization suggestions
3. The Visual Agent creates actual visualizations based on the suggestions
4. The Explanation Agent provides an alternative approach for generating explanations and visualization specifications

## Usage

All agents are integrated into the main FastAPI application in `backend/main.py` and can be accessed through their respective endpoints. 