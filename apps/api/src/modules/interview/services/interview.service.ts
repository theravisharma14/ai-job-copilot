import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Interview, InterviewDocument } from '../../schemas/interview.schema';
import { CreateInterviewDto, SubmitInterviewAnswerDto, InterviewEvaluation } from '../dtos/interview.dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);

  constructor(
    @InjectModel(Interview.name) private interviewModel: Model<InterviewDocument>,
    private aiService: AiService,
  ) {}

  async create(userId: string, dto: CreateInterviewDto): Promise<Interview> {
    const interview = new this.interviewModel({
      user: userId,
      ...dto,
      status: dto.scheduledAt ? 'scheduled' : 'completed',
      questions: [],
      answers: [],
      evaluation: null,
    });

    // Generate AI questions for mock interviews
    if (dto.type === 'mock') {
      const questions = await this.generateQuestions(dto.category, dto.role, 5);
      interview.questions = questions;
    }

    return interview.save();
  }

  async findAll(userId: string, filters?: { type?: string; status?: string }): Promise<Interview[]> {
    const query: any = { user: userId };
    if (filters?.type) query.type = filters.type;
    if (filters?.status) query.status = filters.status;

    return this.interviewModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(userId: string, id: string): Promise<Interview | null> {
    return this.interviewModel.findOne({ _id: id, user: userId }).exec();
  }

  async submitAnswer(
    userId: string,
    interviewId: string,
    dto: SubmitInterviewAnswerDto,
  ): Promise<Interview> {
    const interview = await this.interviewModel.findOne({ _id: interviewId, user: userId });
    if (!interview) throw new Error('Interview not found');

    interview.answers.push({
      questionId: dto.questionId,
      answer: dto.answer,
      audioUrl: dto.audioUrl,
      timeSpent: dto.timeSpent || 0,
      submittedAt: new Date(),
    });

    return interview.save();
  }

  async evaluate(userId: string, interviewId: string): Promise<{ interview: Interview; evaluation: InterviewEvaluation }> {
    const interview = await this.interviewModel.findOne({ _id: interviewId, user: userId });
    if (!interview) throw new Error('Interview not found');

    if (interview.answers.length === 0) {
      throw new Error('No answers to evaluate');
    }

    // Generate AI evaluation
    const evaluation = await this.generateEvaluation(interview);
    interview.evaluation = evaluation;
    interview.status = 'completed';
    interview.completedAt = new Date();

    await interview.save();
    return { interview, evaluation };
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.interviewModel.deleteOne({ _id: id, user: userId }).exec();
  }

  private async generateQuestions(
    category: string,
    role: string,
    count: number,
  ): Promise<any[]> {
    const prompt = `Generate ${count} interview questions for a ${role} position focusing on ${category}. 
    Return JSON array with: id, text, difficulty (easy/medium/hard), expectedAnswer, evaluationCriteria`;

    const response = await this.aiService.generate(prompt, {
      temperature: 0.7,
      maxTokens: 2000,
    });

    try {
      return JSON.parse(response);
    } catch {
      // Fallback questions
      return this.getFallbackQuestions(category, count);
    }
  }

  private getFallbackQuestions(category: string, count: number): any[] {
    const questions = [
      {
        id: 'q1',
        text: `Tell me about a challenging ${category.toLowerCase()} problem you solved recently.`,
        difficulty: 'medium' as const,
        expectedAnswer: 'Candidate should describe the problem, approach, and outcome.',
        evaluationCriteria: ['Problem identification', 'Solution approach', 'Results'],
      },
      {
        id: 'q2',
        text: `How do you stay updated with ${category.toLowerCase()} best practices?`,
        difficulty: 'easy' as const,
        expectedAnswer: 'Mention blogs, courses, conferences, or personal projects.',
        evaluationCriteria: ['Learning mindset', 'Resource awareness'],
      },
      {
        id: 'q3',
        text: `Describe your approach to handling ${category.toLowerCase()} challenges under pressure.`,
        difficulty: 'hard' as const,
        expectedAnswer: 'Should show systematic thinking and composure.',
        evaluationCriteria: ['Stress management', 'Systematic approach'],
      },
    ];
    return questions.slice(0, count);
  }

  private async generateEvaluation(interview: Interview): Promise<InterviewEvaluation> {
    const answersText = interview.answers
      .map((a) => `Q: ${a.questionId}\nA: ${a.answer}`)
      .join('\n\n');

    const prompt = `Evaluate this interview:\n${answersText}\n\n
    Provide JSON with: overallScore (0-100), scores (communication, technicalKnowledge, problemSolving, confidence, clarity - each 0-100), 
    strengths (array), weaknesses (array), feedback (string), improvementTips (array of strings), recommendedResources (array of strings)`;

    const response = await this.aiService.generate(prompt, {
      temperature: 0.3,
      maxTokens: 1500,
    });

    try {
      return JSON.parse(response);
    } catch {
      return {
        overallScore: 65,
        scores: {
          communication: 70,
          technicalKnowledge: 65,
          problemSolving: 60,
          confidence: 65,
          clarity: 70,
        },
        strengths: ['Good communication', 'Clear explanations'],
        weaknesses: ['Needs more technical depth', 'Could improve problem-solving speed'],
        feedback: 'Overall decent performance with room for improvement in technical areas.',
        improvementTips: ['Practice more coding problems', 'Study system design patterns', 'Mock interviews'],
        recommendedResources: ['LeetCode', 'System Design Primer', 'Cracking the Coding Interview'],
      };
    }
  }
}
