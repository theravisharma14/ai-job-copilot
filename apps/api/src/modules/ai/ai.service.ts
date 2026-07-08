import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GEMINI = 'gemini',
  QWEN = 'qwen',
  LOCAL = 'local',
  MOCK = 'mock',
}

export interface AICompletionOptions {
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AICompletionResult {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: AIProvider;
}

export interface ResumeTailoringRequest {
  resume: string;
  jobDescription: string;
  companyName?: string;
  tone?: 'professional' | 'friendly' | 'confident' | 'humble';
}

export interface CoverLetterRequest {
  resume: string;
  jobDescription: string;
  companyName: string;
  hiringManagerName?: string;
  tone?: 'professional' | 'enthusiastic' | 'formal';
}

export interface JobMatchingRequest {
  resume: string;
  jobDescription: string;
  requiredSkills?: string[];
}

export interface JobMatchResult {
  score: number;
  skillMatch: {
    matched: string[];
    missing: string[];
    additional: string[];
  };
  experienceMatch: {
    required: string;
    candidate: string;
    match: boolean;
  };
  reasons: string[];
  recommendations: string[];
  salaryEstimate?: {
    min: number;
    max: number;
    currency: string;
  };
  applicationPriority: 'high' | 'medium' | 'low';
}

export interface InterviewQuestionRequest {
  role: string;
  level: 'junior' | 'mid' | 'senior' | 'staff' | 'principal';
  type: 'behavioral' | 'technical' | 'system-design' | 'coding' | 'mixed';
  technologies?: string[];
  count?: number;
}

export interface InterviewQuestion {
  question: string;
  type: 'behavioral' | 'technical' | 'system-design' | 'coding';
  difficulty: 'easy' | 'medium' | 'hard';
  expectedAnswer?: string;
  evaluationCriteria?: string[];
}

export interface InterviewEvaluationRequest {
  question: string;
  answer: string;
  role: string;
  level: string;
}

export interface InterviewEvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
  followUpQuestions: string[];
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private openai: OpenAI;
  private anthropic: Anthropic;
  private gemini: any;
  private defaultProvider: AIProvider;

  constructor(private configService: ConfigService) {
    const openaiKey = this.configService.get('OPENAI_API_KEY');
    const anthropicKey = this.configService.get('ANTHROPIC_API_KEY');
    const geminiKey = this.configService.get('GEMINI_API_KEY');

    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }

    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
    }

    if (geminiKey) {
      this.gemini = new GoogleGenerativeAI(geminiKey);
    }

    // Default to MOCK if no API keys are provided
    this.defaultProvider = this.detectProvider();
  }

  private detectProvider(): AIProvider {
    const openaiKey = this.configService.get('OPENAI_API_KEY');
    const anthropicKey = this.configService.get('ANTHROPIC_API_KEY');
    const geminiKey = this.configService.get('GEMINI_API_KEY');
    const localEndpoint = this.configService.get('LOCAL_LLM_ENDPOINT');

    if (openaiKey) return AIProvider.OPENAI;
    if (anthropicKey) return AIProvider.ANTHROPIC;
    if (geminiKey) return AIProvider.GEMINI;
    if (localEndpoint) return AIProvider.LOCAL;
    
    // Fallback to MOCK mode for demo/testing without API keys
    return AIProvider.MOCK;
  }

  async complete(prompt: string, options: AICompletionOptions = {}): Promise<AICompletionResult> {
    const provider = options.provider || this.defaultProvider;
    
    // Handle MOCK provider separately
    if (provider === AIProvider.MOCK) {
      return this.completeWithMock(prompt, options);
    }

    const model = options.model || this.getDefaultModel(provider);

    try {
      switch (provider) {
        case AIProvider.OPENAI:
          return this.completeWithOpenAI(prompt, { ...options, model });
        case AIProvider.ANTHROPIC:
          return this.completeWithAnthropic(prompt, { ...options, model });
        case AIProvider.GEMINI:
          return this.completeWithGemini(prompt, { ...options, model });
        case AIProvider.LOCAL:
          return this.completeWithLocal(prompt, { ...options, model });
        default:
          return this.completeWithMock(prompt, options);
      }
    } catch (error) {
      this.logger.error(`AI completion failed with provider ${provider}:`, error);
      // Fallback to mock on error
      return this.completeWithMock(prompt, options);
    }
  }

  private async completeWithOpenAI(prompt: string, options: AICompletionOptions): Promise<AICompletionResult> {
    const response = await this.openai.chat.completions.create({
      model: options.model || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: options.systemPrompt || 'You are a helpful career assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
    });

    return {
      content: response.choices[0].message.content || '',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      model: response.model,
      provider: AIProvider.OPENAI,
    };
  }

  private async completeWithAnthropic(prompt: string, options: AICompletionOptions): Promise<AICompletionResult> {
    const response = await this.anthropic.messages.create({
      model: options.model || 'claude-3-opus-20240229',
      max_tokens: options.maxTokens || 2000,
      system: options.systemPrompt || 'You are a helpful career assistant.',
      messages: [{ role: 'user', content: prompt }],
    });

    return {
      content: response.content[0].type === 'text' ? response.content[0].text : '',
      usage: {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      },
      model: response.model,
      provider: AIProvider.ANTHROPIC,
    };
  }

  private async completeWithGemini(prompt: string, options: AICompletionOptions): Promise<AICompletionResult> {
    const model = this.gemini.getGenerativeModel({ model: options.model || 'gemini-pro' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 2000,
      },
    });

    const response = await result.response;
    const text = response.text();

    return {
      content: text,
      model: options.model || 'gemini-pro',
      provider: AIProvider.GEMINI,
    };
  }

  private async completeWithLocal(prompt: string, options: AICompletionOptions): Promise<AICompletionResult> {
    const endpoint = this.configService.get('LOCAL_LLM_ENDPOINT') || 'http://localhost:11434';
    const model = options.model || 'llama2';

    const response = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.maxTokens || 2000,
        },
      }),
    });

    const data = await response.json();

    return {
      content: data.response || '',
      model,
      provider: AIProvider.LOCAL,
    };
  }

  private getDefaultModel(provider: AIProvider): string {
    switch (provider) {
      case AIProvider.OPENAI:
        return 'gpt-4-turbo-preview';
      case AIProvider.ANTHROPIC:
        return 'claude-3-opus-20240229';
      case AIProvider.GEMINI:
        return 'gemini-pro';
      case AIProvider.LOCAL:
        return 'llama2';
      case AIProvider.MOCK:
        return 'mock-model';
      default:
        return 'gpt-4-turbo-preview';
    }
  }

  private async completeWithMock(prompt: string, options: AICompletionOptions): Promise<AICompletionResult> {
    this.logger.warn('Using MOCK AI mode. Set an API key in .env for real AI responses.');
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockResponses: Record<string, string> = {
      'resume': `✨ [MOCK AI] Your resume has been optimized! I've enhanced your bullet points to highlight leadership and quantifiable achievements. Consider adding metrics like "increased revenue by 20%" or "reduced costs by 15%".`,
      'cover letter': `✨ [MOCK AI] Here's your personalized cover letter:\n\nDear Hiring Manager,\n\nI am excited to apply for this position. My experience in software development aligns perfectly with your requirements...\n\n[This is a demo response. Add GEMINI_API_KEY for real AI.]`,
      'interview': `✨ [MOCK AI] Great answer! You demonstrated strong problem-solving skills. To improve, try structuring responses using the STAR method (Situation, Task, Action, Result).`,
      'job match': `✨ [MOCK AI] Job Match Score: 85/100. Missing skills: Docker, AWS. Recommendation: Highlight any cloud experience you have.`,
    };

    let content = mockResponses['default'] || `✨ [MOCK AI] I processed your request successfully. This is a demo response - configure an API key for real AI assistance.`;
    
    // Simple keyword matching for demo
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('resume')) content = mockResponses['resume'];
    else if (lowerPrompt.includes('cover letter')) content = mockResponses['cover letter'];
    else if (lowerPrompt.includes('interview')) content = mockResponses['interview'];
    else if (lowerPrompt.includes('match') || lowerPrompt.includes('job')) content = mockResponses['job match'];

    return {
      content,
      model: 'mock-model',
      provider: AIProvider.MOCK,
    };
  }

  async tailorResume(request: ResumeTailoringRequest): Promise<{ tailoredResume: string; improvements: string[]; atsScore: number }> {
    const prompt = `
You are an expert resume writer and ATS optimization specialist.

TASK: Tailor the following resume to match the job description provided.

RESUME:
${request.resume}

JOB DESCRIPTION:
${request.jobDescription}

${request.companyName ? `COMPANY: ${request.companyName}` : ''}
${request.tone ? `TONE: ${request.tone}` : 'TONE: professional'}

INSTRUCTIONS:
1. Analyze the job description and identify key skills, keywords, and requirements
2. Rewrite the resume summary/objective to align with the role
3. Modify bullet points in experience section to highlight relevant achievements
4. Ensure all critical keywords from the JD are naturally incorporated
5. Quantify achievements where possible
6. Maintain honesty - do not fabricate experience
7. Optimize for ATS parsing while keeping it human-readable

OUTPUT FORMAT (JSON):
{
  "tailoredResume": "Full tailored resume text",
  "improvements": ["List of specific improvements made"],
  "atsScore": 0-100
}
`;

    const result = await this.complete(prompt, {
      systemPrompt: 'You are an expert resume writer specializing in ATS optimization.',
    });

    // Check if result is from MOCK provider
    if (result.provider === AIProvider.MOCK) {
      return {
        tailoredResume: result.content,
        improvements: ['[MOCK] Resume optimized for ATS', '[MOCK] Keywords aligned with job description'],
        atsScore: 85,
      };
    }

    try {
      const parsed = JSON.parse(result.content);
      return {
        tailoredResume: parsed.tailoredResume,
        improvements: parsed.improvements || [],
        atsScore: parsed.atsScore || 0,
      };
    } catch {
      return {
        tailoredResume: result.content,
        improvements: ['Resume tailored based on job description'],
        atsScore: 75,
      };
    }
  }

  async generateCoverLetter(request: CoverLetterRequest): Promise<string> {
    const prompt = `
You are a professional cover letter writer.

TASK: Write a compelling, personalized cover letter.

RESUME:
${request.resume}

JOB DESCRIPTION:
${request.jobDescription}

COMPANY: ${request.companyName}
${request.hiringManagerName ? `HIRING MANAGER: ${request.hiringManagerName}` : ''}
${request.tone ? `TONE: ${request.tone}` : 'TONE: professional'}

INSTRUCTIONS:
1. Start with a strong opening that shows enthusiasm for the company
2. Highlight 2-3 most relevant experiences from the resume
3. Show knowledge of the company and why you want to work there
4. Connect your skills to specific requirements in the JD
5. End with a confident call to action
6. Keep it concise (250-400 words)
7. Match the requested tone

Write the cover letter directly (no JSON).
`;

    const result = await this.complete(prompt, {
      systemPrompt: 'You are a professional cover letter writer with expertise in crafting compelling narratives.',
      temperature: 0.8,
    });

    return result.content.trim();
  }

  async matchJobToResume(request: JobMatchingRequest): Promise<JobMatchResult> {
    const prompt = `
You are an AI career coach specializing in job-resume matching.

TASK: Analyze how well the candidate's resume matches the job description.

RESUME:
${request.resume}

JOB DESCRIPTION:
${request.jobDescription}

${request.requiredSkills ? `REQUIRED SKILLS: ${request.requiredSkills.join(', ')}` : ''}

INSTRUCTIONS:
1. Calculate an overall match score (0-100)
2. Identify matched skills, missing skills, and additional skills
3. Compare required experience vs candidate experience
4. Provide 3-5 specific reasons for the score
5. Give 2-3 recommendations to improve fit
6. Estimate salary range if possible
7. Determine application priority (high/medium/low)

OUTPUT FORMAT (JSON):
{
  "score": 0-100,
  "skillMatch": {
    "matched": ["skill1", "skill2"],
    "missing": ["skill3"],
    "additional": ["skill4"]
  },
  "experienceMatch": {
    "required": "5+ years",
    "candidate": "3 years",
    "match": false
  },
  "reasons": ["Reason 1", "Reason 2"],
  "recommendations": ["Recommendation 1"],
  "salaryEstimate": {
    "min": 80000,
    "max": 120000,
    "currency": "USD"
  },
  "applicationPriority": "high" | "medium" | "low"
}
`;

    const result = await this.complete(prompt, {
      systemPrompt: 'You are an expert career coach with deep knowledge of hiring processes.',
    });

    // Check if result is from MOCK provider
    if (result.provider === AIProvider.MOCK) {
      return {
        score: 85,
        skillMatch: { 
          matched: ['TypeScript', 'Node.js', 'React'], 
          missing: ['Docker', 'AWS'], 
          additional: ['GraphQL'] 
        },
        experienceMatch: { required: '3+ years', candidate: '2 years', match: true },
        reasons: [
          '[MOCK] Strong technical skills match',
          '[MOCK] Good project experience',
          '[MOCK] Missing some cloud infrastructure knowledge'
        ],
        recommendations: [
          '[MOCK] Learn Docker basics',
          '[MOCK] Get AWS certified'
        ],
        salaryEstimate: { min: 70000, max: 95000, currency: 'USD' },
        applicationPriority: 'high',
      };
    }

    try {
      const parsed = JSON.parse(result.content);
      return parsed as JobMatchResult;
    } catch {
      return {
        score: 50,
        skillMatch: { matched: [], missing: [], additional: [] },
        experienceMatch: { required: 'Unknown', candidate: 'Unknown', match: false },
        reasons: ['Unable to parse detailed analysis'],
        recommendations: ['Review job requirements carefully'],
        applicationPriority: 'medium',
      };
    }
  }

  async generateInterviewQuestions(request: InterviewQuestionRequest): Promise<InterviewQuestion[]> {
    const count = request.count || 5;
    const prompt = `
You are an expert technical interviewer.

TASK: Generate ${count} interview questions for a ${request.level} ${request.role} position.

TYPE: ${request.type}
${request.technologies?.length ? `TECHNOLOGIES: ${request.technologies.join(', ')}` : ''}

INSTRUCTIONS:
1. Generate questions appropriate for the level and type
2. Include difficulty assessment
3. For technical questions, include expected answer guidelines
4. For behavioral questions, include evaluation criteria
5. Vary difficulty across easy, medium, hard

OUTPUT FORMAT (JSON array):
[
  {
    "question": "Question text",
    "type": "behavioral|technical|system-design|coding",
    "difficulty": "easy|medium|hard",
    "expectedAnswer": "Brief expected answer or key points",
    "evaluationCriteria": ["Criterion 1", "Criterion 2"]
  }
]
`;

    const result = await this.complete(prompt, {
      systemPrompt: 'You are a senior hiring manager with 20+ years of interviewing experience.',
    });

    try {
      const parsed = JSON.parse(result.content);
      return parsed as InterviewQuestion[];
    } catch {
      return [];
    }
  }

  async evaluateInterviewAnswer(request: InterviewEvaluationRequest): Promise<InterviewEvaluationResult> {
    const prompt = `
You are an expert technical interviewer evaluating a candidate's response.

QUESTION: ${request.question}
CANDIDATE ANSWER: ${request.answer}
ROLE: ${request.role}
LEVEL: ${request.level}

INSTRUCTIONS:
1. Score the answer from 0-100
2. Provide detailed feedback
3. Identify 2-3 strengths in the answer
4. Identify 2-3 weaknesses or gaps
5. Suggest 2-3 specific improvements
6. Generate 1-2 follow-up questions

OUTPUT FORMAT (JSON):
{
  "score": 0-100,
  "feedback": "Detailed feedback paragraph",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "improvementSuggestions": ["Suggestion 1", "Suggestion 2"],
  "followUpQuestions": ["Follow-up question 1"]
}
`;

    const result = await this.complete(prompt, {
      systemPrompt: 'You are a fair but thorough technical interviewer.',
    });

    try {
      const parsed = JSON.parse(result.content);
      return parsed as InterviewEvaluationResult;
    } catch {
      return {
        score: 50,
        feedback: 'Unable to evaluate in detail',
        strengths: [],
        weaknesses: [],
        improvementSuggestions: [],
        followUpQuestions: [],
      };
    }
  }

  async analyzeCareerPath(currentRole: string, targetRole: string, skills: string[]): Promise<{ roadmap: string[]; skillGaps: string[]; timeline: string }> {
    const prompt = `
You are a career development coach.

CURRENT ROLE: ${currentRole}
TARGET ROLE: ${targetRole}
CURRENT SKILLS: ${skills.join(', ')}

TASK: Create a career development roadmap.

OUTPUT FORMAT (JSON):
{
  "roadmap": ["Step 1", "Step 2", "Step 3"],
  "skillGaps": ["Missing skill 1", "Missing skill 2"],
  "timeline": "Estimated timeline (e.g., '6-12 months')"
}
`;

    const result = await this.complete(prompt, {
      systemPrompt: 'You are an experienced career coach specializing in tech industry progression.',
    });

    try {
      return JSON.parse(result.content);
    } catch {
      return {
        roadmap: ['Gain relevant experience', 'Build portfolio projects', 'Network in target field'],
        skillGaps: skills,
        timeline: '6-12 months',
      };
    }
  }
}
