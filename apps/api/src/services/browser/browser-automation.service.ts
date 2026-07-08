import { Injectable, Logger } from '@nestjs/common';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

export enum ATSType {
  GREENHOUSE = 'greenhouse',
  LEVER = 'lever',
  WORKDAY = 'workday',
  ASHBY = 'ashby',
  SMARTRECRUITERS = 'smartrecruiters',
  SUCCESSFACTORS = 'successfactors',
  TALEO = 'taleo',
  ICIMS = 'icims',
  CUSTOM = 'custom',
}

export interface AutoApplyJob {
  id: string;
  url: string;
  atsType: ATSType;
  company: string;
  title: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  resumePath?: string;
  coverLetterPath?: string;
}

@Injectable()
export class BrowserAutomationService {
  private readonly logger = new Logger(BrowserAutomationService.name);
  private browser: Browser | null = null;
  private readonly screenshotDir = path.join(process.cwd(), 'screenshots');

  constructor() {
    this.ensureScreenshotDir();
  }

  private ensureScreenshotDir() {
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: process.env.NODE_ENV === 'production',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      this.logger.log('Browser initialized');
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.logger.log('Browser closed');
    }
  }

  async autoApply(job: AutoApplyJob, profile: UserProfile): Promise<{ success: boolean; error?: string; screenshots?: string[] }> {
    const screenshots: string[] = [];
    
    try {
      await this.initialize();
      const context = await this.browser!.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      });

      const page = await context.newPage();
      
      // Navigate to job URL
      this.logger.log(`Navigating to ${job.url}`);
      await page.goto(job.url, { waitUntil: 'networkidle', timeout: 30000 });
      
      await page.waitForTimeout(2000); // Human-like delay
      screenshots.push(await this.takeScreenshot(page, `${job.id}_initial`));

      // Detect ATS type if not specified
      if (job.atsType === ATSType.CUSTOM) {
        job.atsType = await this.detectATS(page);
      }

      // Apply based on ATS type
      let success = false;
      switch (job.atsType) {
        case ATSType.GREENHOUSE:
          success = await this.applyGreenhouse(page, job, profile, screenshots);
          break;
        case ATSType.LEVER:
          success = await this.applyLever(page, job, profile, screenshots);
          break;
        case ATSType.WORKDAY:
          success = await this.applyWorkday(page, job, profile, screenshots);
          break;
        case ATSType.ASHBY:
          success = await this.applyAshby(page, job, profile, screenshots);
          break;
        default:
          success = await this.applyGeneric(page, job, profile, screenshots);
      }

      await context.close();
      
      return { success, screenshots };
    } catch (error) {
      this.logger.error(`Auto-apply failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async takeScreenshot(page: Page, name: string): Promise<string> {
    const filename = path.join(this.screenshotDir, `${name}_${Date.now()}.png`);
    await page.screenshot({ path: filename, fullPage: false });
    return filename;
  }

  private async detectATS(page: Page): Promise<ATSType> {
    const url = page.url();
    
    if (url.includes('greenhouse')) return ATSType.GREENHOUSE;
    if (url.includes('lever')) return ATSType.LEVER;
    if (url.includes('myworkday')) return ATSType.WORKDAY;
    if (url.includes('ashby')) return ATSType.ASHBY;
    if (url.includes('smartrecruiters')) return ATSType.SMARTRECRUITERS;
    if (url.includes('successfactors')) return ATSType.SUCCESSFACTORS;
    
    // Check for specific selectors
    const greenhouseSelector = await page.$('#application_form');
    if (greenhouseSelector) return ATSType.GREENHOUSE;

    return ATSType.CUSTOM;
  }

  private async applyGreenhouse(page: Page, job: AutoApplyJob, profile: UserProfile, screenshots: string[]): Promise<boolean> {
    try {
      // Fill personal information
      await this.fillInput(page, 'first_name', profile.firstName);
      await this.fillInput(page, 'last_name', profile.lastName);
      await this.fillInput(page, 'email', profile.email);
      await this.fillInput(page, 'phone', profile.phone);
      
      if (profile.linkedinUrl) {
        await this.fillInput(page, 'linkedin_url', profile.linkedinUrl);
      }

      // Upload resume
      if (profile.resumePath) {
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
          await fileInput.setInputFiles(profile.resumePath);
          await page.waitForTimeout(1000);
        }
      }

      // Fill additional questions if any
      await this.handleAdditionalQuestions(page);

      screenshots.push(await this.takeScreenshot(page, `${job.id}_completed`));

      // Submit application
      const submitButton = await page.$('button[type="submit"], input[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(3000);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Greenhouse apply failed: ${error.message}`);
      return false;
    }
  }

  private async applyLever(page: Page, job: AutoApplyJob, profile: UserProfile, screenshots: string[]): Promise<boolean> {
    try {
      // Lever typically uses standard form fields
      await this.fillInput(page, 'name', `${profile.firstName} ${profile.lastName}`);
      await this.fillInput(page, 'email', profile.email);
      await this.fillInput(page, 'phone', profile.phone);

      // Upload resume
      if (profile.resumePath) {
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
          await fileInput.setInputFiles(profile.resumePath);
          await page.waitForTimeout(1000);
        }
      }

      screenshots.push(await this.takeScreenshot(page, `${job.id}_completed`));

      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(3000);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Lever apply failed: ${error.message}`);
      return false;
    }
  }

  private async applyWorkday(page: Page, job: AutoApplyJob, profile: UserProfile, screenshots: string[]): Promise<boolean> {
    try {
      // Workday often requires login first - skip if not logged in
      const signInButton = await page.$('button[data-automation-id="signIn"]');
      if (signInButton) {
        this.logger.warn('Workday requires sign-in');
        return false;
      }

      // Try to fill available fields
      await this.fillInput(page, 'firstName', profile.firstName);
      await this.fillInput(page, 'lastName', profile.lastName);
      await this.fillInput(page, 'email', profile.email);

      screenshots.push(await this.takeScreenshot(page, `${job.id}_partial`));
      return true; // Partial success
    } catch (error) {
      this.logger.error(`Workday apply failed: ${error.message}`);
      return false;
    }
  }

  private async applyAshby(page: Page, job: AutoApplyJob, profile: UserProfile, screenshots: string[]): Promise<boolean> {
    try {
      await this.fillInput(page, 'first-name', profile.firstName);
      await this.fillInput(page, 'last-name', profile.lastName);
      await this.fillInput(page, 'email', profile.email);

      if (profile.resumePath) {
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
          await fileInput.setInputFiles(profile.resumePath);
          await page.waitForTimeout(1000);
        }
      }

      screenshots.push(await this.takeScreenshot(page, `${job.id}_completed`));

      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Ashby apply failed: ${error.message}`);
      return false;
    }
  }

  private async applyGeneric(page: Page, job: AutoApplyJob, profile: UserProfile, screenshots: string[]): Promise<boolean> {
    try {
      // Generic form filling strategy
      const fillStrategies = [
        { selectors: ['input[name="email"]', 'input[type="email"]', '#email'], value: profile.email },
        { selectors: ['input[name="firstName"]', 'input[name="first_name"]', '#firstname'], value: profile.firstName },
        { selectors: ['input[name="lastName"]', 'input[name="last_name"]', '#lastname'], value: profile.lastName },
        { selectors: ['input[name="phone"]', 'input[type="tel"]', '#phone'], value: profile.phone },
      ];

      for (const strategy of fillStrategies) {
        for (const selector of strategy.selectors) {
          const element = await page.$(selector);
          if (element) {
            await element.fill(strategy.value);
            break;
          }
        }
      }

      // Try to upload resume
      if (profile.resumePath) {
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
          await fileInput.setInputFiles(profile.resumePath);
        }
      }

      screenshots.push(await this.takeScreenshot(page, `${job.id}_generic`));
      return true;
    } catch (error) {
      this.logger.error(`Generic apply failed: ${error.message}`);
      return false;
    }
  }

  private async fillInput(page: Page, selector: string, value: string): Promise<void> {
    try {
      const selectors = [
        `input[name="${selector}"]`,
        `input[id="${selector}"]`,
        `#${selector}`,
        `[name="${selector}"]`,
      ];

      for (const sel of selectors) {
        const element = await page.$(sel);
        if (element) {
          await element.fill(value);
          await page.waitForTimeout(100); // Human-like typing delay
          return;
        }
      }
    } catch (error) {
      // Silently fail - field may not exist
    }
  }

  private async handleAdditionalQuestions(page: Page): Promise<void> {
    // Handle common additional questions
    const textareas = await page.$$('textarea');
    for (const textarea of textareas) {
      const placeholder = await textarea.getAttribute('placeholder');
      if (placeholder?.toLowerCase().includes('cover letter')) {
        // Skip for now - would need cover letter content
        continue;
      }
    }
  }

  async detectCaptcha(page: Page): Promise<boolean> {
    const captchaSelectors = [
      '[class*="captcha"]',
      '[id*="captcha"]',
      '.g-recaptcha',
      '[data-sitekey]',
      'iframe[src*="recaptcha"]',
    ];

    for (const selector of captchaSelectors) {
      const element = await page.$(selector);
      if (element) return true;
    }

    return false;
  }
}
