const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function callOpenAI(messages: OpenAIMessage[], temperature: number = 0.7, maxTokens: number = 4000): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI call failed:', error);
    throw error;
  }
}

export async function analyzeProcessDocument(documentText: string): Promise<{
  processName: string;
  processDescription: string;
  steps: Array<{ name: string; description: string; order: number }>;
  roles: string[];
  inputs: string[];
  outputs: string[];
  decisions: Array<{ question: string; options: string[] }>;
}> {
  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: `You are an expert business process analyst. Analyze the provided process document and extract structured information about the business process. Return your analysis as valid JSON only, no additional text.`
    },
    {
      role: 'user',
      content: `Analyze this process document and extract:
1. Process name
2. Process description (2-3 sentences)
3. All process steps in order with descriptions
4. All roles/actors involved
5. All inputs required
6. All outputs produced
7. Any decision points with options

Document text:
${documentText}

Return valid JSON in this exact format:
{
  "processName": "string",
  "processDescription": "string",
  "steps": [{"name": "string", "description": "string", "order": number}],
  "roles": ["string"],
  "inputs": ["string"],
  "outputs": ["string"],
  "decisions": [{"question": "string", "options": ["string"]}]
}`
    }
  ];

  const result = await callOpenAI(messages, 0.3);
  return JSON.parse(result);
}

export async function generateBPMNFromProcess(processAnalysis: any): Promise<string> {
  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: `You are an expert in BPMN 2.0 (Business Process Model and Notation). Generate valid BPMN XML from process descriptions. Include proper swimlanes for different roles, sequence flows, gateways for decisions, and follow BPMN best practices.`
    },
    {
      role: 'user',
      content: `Generate a complete BPMN 2.0 XML diagram from this process analysis:

Process: ${processAnalysis.processName}
Description: ${processAnalysis.processDescription}
Steps: ${JSON.stringify(processAnalysis.steps)}
Roles: ${JSON.stringify(processAnalysis.roles)}
Decisions: ${JSON.stringify(processAnalysis.decisions)}

Requirements:
1. Create swimlanes (lanes) for each role
2. Use proper BPMN elements: startEvent, task, exclusiveGateway, endEvent
3. Connect elements with sequenceFlow
4. Place tasks in appropriate swimlanes
5. Use gateways for decision points
6. Include proper IDs and names
7. Return ONLY valid BPMN 2.0 XML, no markdown or explanations

Return the complete BPMN XML starting with <?xml version="1.0"?>`
    }
  ];

  return await callOpenAI(messages, 0.2, 6000);
}

export async function generateSOPContent(processAnalysis: any, bpmnXml: string): Promise<string> {
  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: `You are an expert technical writer specializing in Standard Operating Procedures (SOPs). Create comprehensive, clear, and actionable SOPs that follow industry best practices.`
    },
    {
      role: 'user',
      content: `Create a detailed Standard Operating Procedure (SOP) for this process:

Process: ${processAnalysis.processName}
Description: ${processAnalysis.processDescription}
Steps: ${JSON.stringify(processAnalysis.steps, null, 2)}
Roles: ${JSON.stringify(processAnalysis.roles)}
Inputs: ${JSON.stringify(processAnalysis.inputs)}
Outputs: ${JSON.stringify(processAnalysis.outputs)}

Create a comprehensive SOP with these sections:

1. PURPOSE
   - Clear objective statement
   - Why this SOP exists

2. SCOPE
   - What is covered
   - What is not covered
   - Who this applies to

3. DEFINITIONS
   - Key terms and acronyms

4. RESPONSIBILITIES
   - Role-specific responsibilities
   - Who does what

5. PROCEDURE
   - Detailed step-by-step instructions
   - Include decision points
   - Specify inputs/outputs for each step
   - Include quality checkpoints

6. REFERENCES
   - Related documents
   - System references

7. REVISION HISTORY
   - Version 1.0 - Initial creation

Format the SOP professionally with clear headings and numbered steps.`
    }
  ];

  return await callOpenAI(messages, 0.4);
}

export async function generateRACIContent(processAnalysis: any): Promise<string> {
  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: `You are an expert in organizational structure and RACI matrices. Create clear, actionable RACI (Responsible, Accountable, Consulted, Informed) matrices that define roles and responsibilities.`
    },
    {
      role: 'user',
      content: `Generate a comprehensive RACI matrix for this process:

Process: ${processAnalysis.processName}
Description: ${processAnalysis.processDescription}
Steps: ${JSON.stringify(processAnalysis.steps, null, 2)}
Roles: ${JSON.stringify(processAnalysis.roles)}

Create a RACI matrix that:
1. Lists each process step/activity
2. For each step, assign RACI codes to each role:
   - R (Responsible): Does the work
   - A (Accountable): Final authority, only ONE per activity
   - C (Consulted): Provides input
   - I (Informed): Kept updated

3. Include sub-processes where applicable
4. Ensure each activity has exactly ONE Accountable role
5. Format as a clear table

RACI MATRIX FORMAT:
Activity | ${processAnalysis.roles.join(' | ')}
---
[For each step, show the RACI assignment]

Add explanatory notes at the end explaining key decision points and handoffs.`
    }
  ];

  return await callOpenAI(messages, 0.3);
}

export async function generateRiskControlContent(processAnalysis: any): Promise<string> {
  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: `You are an expert risk management consultant specializing in operational risk assessment and control design. Identify realistic risks and design effective controls.`
    },
    {
      role: 'user',
      content: `Analyze this business process and create a comprehensive Risk and Control Matrix:

Process: ${processAnalysis.processName}
Description: ${processAnalysis.processDescription}
Steps: ${JSON.stringify(processAnalysis.steps, null, 2)}
Roles: ${JSON.stringify(processAnalysis.roles)}

For this process, identify:

1. KEY RISKS (at least 5-8 realistic risks):
   - Operational risks
   - Compliance risks
   - Quality risks
   - Security risks
   - Timing/SLA risks

2. For EACH risk, provide:
   - Risk Name
   - Risk Description
   - Risk Category (Operational/Compliance/Quality/Security/Financial)
   - Likelihood (High/Medium/Low)
   - Impact (High/Medium/Low)
   - Risk Score (High/Medium/Low)

3. For EACH risk, design CONTROLS:
   - Control Description (specific, actionable)
   - Control Type (Preventive/Detective/Corrective)
   - Control Owner (role responsible)
   - Implementation Method
   - Testing Frequency

4. MITIGATION STRATEGIES:
   - Additional risk mitigation steps
   - Contingency plans
   - Escalation procedures

Format as a professional Risk and Control Matrix with clear sections and tables.`
    }
  ];

  return await callOpenAI(messages, 0.4);
}

export async function extractTextFromDocument(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const content = e.target?.result as string;

      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        resolve(content);
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        resolve(`[PDF Content from ${file.name}]\n\nThis is a placeholder for PDF text extraction. In production, this would use a PDF parsing library to extract the actual text content from the PDF file.\n\nFor now, please describe your process, and I'll analyze it.`);
      } else {
        resolve(`[Document from ${file.name}]\n\nDocument type: ${file.type}\nSize: ${(file.size / 1024).toFixed(2)} KB\n\nThis document has been uploaded. Please provide a description of the process it contains, and I'll help analyze it.`);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));

    if (file.type.startsWith('text/')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  });
}
