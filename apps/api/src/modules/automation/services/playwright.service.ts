import { Injectable, Logger } from '@nestjs/common';
import { Browser, Page, chromium, firefox, webkit } from 'playwright';
import { AutoApplyJobDto, AutoApplyResult, ApplyStatus } from '../../application/dto/application.dto';

export interface ATSConfig {
  name: string;
  urlPattern: RegExp;
  selectors: {
    applyButton?: string;
    nextButton?: string;
    submitButton?: string;
    formFields?: Record<string, string>;
    fileUpload?: string;
    errorMessage?: string;
    successMessage?: string;
  };
}

@Injectable()
export class PlaywrightService {
  private readonly logger = new Logger(PlaywrightService.name);
  private browser: Browser | null = null;
  
  private atsConfigs: ATSConfig[] = [
    {
      name: 'Greenhouse',
      urlPattern: /greenhouse\.io/,
      selectors: {
        applyButton: 'a[href*="apply"]',
        nextButton: 'input[type="submit"], button[type="submit"]',
        submitButton: 'input[value*="Submit"], button:has-text("Submit Application")',
        formFields: {
          firstName: 'input[name="first_name"], #first_name',
          lastName: 'input[name="last_name"], #last_name',
          email: 'input[name="email"], #email',
          phone: 'input[name="phone"], #phone',
          resume: 'input[type="file"][name="resume"]',
          coverLetter: 'textarea[name="cover_letter"], #cover_letter',
        },
        fileUpload: 'input[type="file"]',
        errorMessage: '.error, .alert-error, [class*="error"]',
        successMessage: '.success, .alert-success, [class*="success"]',
      },
    },
    {
      name: 'Lever',
      urlPattern: /lever\.co/,
      selectors: {
        applyButton: 'a:has-text("Apply"), button:has-text("Apply")',
        nextButton: 'button[type="submit"], input[type="submit"]',
        submitButton: 'button:has-text("Submit"), input[value*="Submit"]',
        formFields: {
          firstName: 'input[name="name"], input[placeholder*="First"]',
          lastName: 'input[placeholder*="Last"]',
          email: 'input[type="email"], input[name="email"]',
          phone: 'input[type="tel"], input[name="phone"]',
          resume: 'input[type="file"][accept*="pdf"]',
          linkedin: 'input[name="linkedin_url"], input[placeholder*="LinkedIn"]',
        },
        fileUpload: 'input[type="file"]',
        errorMessage: '.error-message, [class*="error"]',
        successMessage: '.success-message, [class*="success"]',
      },
    },
    {
      name: 'Workday',
      urlPattern: /myworkdayjobs\.com|wd5\.myworkday\.com/,
      selectors: {
        applyButton: 'button:has-text("Apply Now"), a:has-text("Apply")',
        nextButton: 'button:has-text("Next"), [data-automation-id="bottomNavButtonNext"]',
        submitButton: 'button:has-text("Submit"), [data-automation-id="submitButton"]',
        formFields: {
          firstName: '[data-automation-id="firstName"]',
          lastName: '[data-automation-id="lastName"]',
          email: '[data-automation-id="email"]',
          phone: '[data-automation-id="phone"]',
          resume: '[data-automation-id="fileUpload"]',
        },
        fileUpload: '[data-automation-id="fileUpload"] input[type="file"]',
        errorMessage: '[data-automation-id="error"]',
        successMessage: '[data-automation-id="success"]',
      },
    },
    {
      name: 'iCIMS',
      urlPattern: /icims\.com|job icims\.com/,
      selectors: {
        applyButton: 'a:has-text("Apply"), button:has-text("Apply")',
        nextButton: 'input[value="Next"], button:has-text("Next")',
        submitButton: 'input[value*="Submit"], button:has-text("Submit")',
        formFields: {
          firstName: '#firstname, input[name="firstname"]',
          lastName: '#lastname, input[name="lastname"]',
          email: '#email, input[name="email"]',
          phone: '#phone, input[name="phone"]',
          resume: 'input[type="file"]',
        },
        fileUpload: 'input[type="file"]',
        errorMessage: '.error, .field-error',
        successMessage: '.success, .confirmation',
      },
    },
    {
      name: 'SmartRecruiters',
      urlPattern: /smartrecruiters\.com/,
      selectors: {
        applyButton: 'button:has-text("Apply"), a:has-text("Apply")',
        nextButton: 'button:has-text("Next"), .next-btn',
        submitButton: 'button:has-text("Submit"), .submit-btn',
        formFields: {
          firstName: 'input[name="firstName"]',
          lastName: 'input[name="lastName"]',
          email: 'input[type="email"]',
          phone: 'input[type="tel"]',
          resume: 'input[type="file"]',
        },
        fileUpload: 'input[type="file"]',
        errorMessage: '.error-message',
        successMessage: '.success-message',
      },
    },
  ];

  async initialize(headless = true) {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-dev-shm-usage',
        ],
      });
    }
    return this.browser;
  }

  async createPage(): Promise<Page> {
    if (!this.browser) {
      await this.initialize();
    }
    const page = await this.browser!.newPage();
    
    // Human-like viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Add random user agent
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    ];
    await page.setExtraHTTPHeaders({
      'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
      'Accept-Language': 'en-US,en;q=0.9',
    });

    // Bypass automation detection
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    return page;
  }

  async detectATS(url: string): Promise<ATSConfig | null> {
    for (const config of this.atsConfigs) {
      if (config.urlPattern.test(url)) {
        return config;
      }
    }
    return null;
  }

  async autoApply(dto: AutoApplyJobDto, resumeUrl: string, userData: any): Promise<AutoApplyResult> {
    const page = await this.createPage();
    const screenshots: string[] = [];
    let status: ApplyStatus = 'pending';
    let error: string | null = null;

    try {
      this.logger.log(`Starting auto-apply for ${dto.jobUrl}`);
      
      // Navigate to job URL
      await page.goto(dto.jobUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await this.randomDelay(2000, 4000);
      
      // Take initial screenshot
      const screenshot1 = await page.screenshot({ fullPage: true });
      screenshots.push(screenshot1.toString('base64'));

      // Detect ATS
      const atsConfig = await this.detectATS(dto.jobUrl);
      if (!atsConfig) {
        throw new Error('Unsupported ATS system detected');
      }
      this.logger.log(`Detected ATS: ${atsConfig.name}`);

      // Click apply button
      const applyButton = await page.$(atsConfig.selectors.applyButton || 'button:has-text("Apply")');
      if (!applyButton) {
        throw new Error('Apply button not found');
      }
      await applyButton.click();
      await this.randomDelay(1000, 2000);

      // Fill form fields
      await this.fillForm(page, atsConfig, userData, resumeUrl);

      // Handle captcha detection (simplified)
      const hasCaptcha = await this.detectCaptcha(page);
      if (hasCaptcha) {
        this.logger.warn('Captcha detected - manual intervention required');
        status = 'requires_captcha';
        error = 'Captcha detected';
        const captchaScreenshot = await page.screenshot({ fullPage: true });
        screenshots.push(captchaScreenshot.toString('base64'));
        await page.close();
        return {
          status,
          error,
          screenshots,
          atsName: atsConfig.name,
          completedAt: new Date(),
        };
      }

      // Submit application
      const submitButton = await page.$(atsConfig.selectors.submitButton || atsConfig.selectors.nextButton!);
      if (submitButton) {
        await submitButton.click();
        await this.randomDelay(2000, 3000);
      }

      // Check for success/error
      const successElement = await page.$(atsConfig.selectors.successMessage || '.success');
      const errorElement = await page.$(atsConfig.selectors.errorMessage || '.error');

      if (successElement) {
        status = 'success';
        this.logger.log('Application submitted successfully');
      } else if (errorElement) {
        const errorMsg = await errorElement.textContent();
        status = 'failed';
        error = errorMsg || 'Unknown error during submission';
      } else {
        status = 'success'; // Assume success if no error
      }

      // Final screenshot
      const finalScreenshot = await page.screenshot({ fullPage: true });
      screenshots.push(finalScreenshot.toString('base64'));

      await page.close();

      return {
        status,
        error,
        screenshots,
        atsName: atsConfig.name,
        completedAt: new Date(),
      };
    } catch (err: any) {
      this.logger.error(`Auto-apply failed: ${err.message}`);
      status = 'failed';
      error = err.message;
      
      try {
        const errorScreenshot = await page.screenshot({ fullPage: true });
        screenshots.push(errorScreenshot.toString('base64'));
      } catch {}
      
      await page.close().catch(() => {});
      
      return {
        status,
        error,
        screenshots,
        atsName: 'unknown',
        completedAt: new Date(),
      };
    }
  }

  private async fillForm(page: Page, config: ATSConfig, userData: any, resumeUrl: string) {
    const selectors = config.selectors.formFields || {};
    
    // Fill text fields with human-like typing
    if (selectors.firstName && userData.firstName) {
      await this.typeWithDelay(page, selectors.firstName, userData.firstName);
    }
    if (selectors.lastName && userData.lastName) {
      await this.typeWithDelay(page, selectors.lastName, userData.lastName);
    }
    if (selectors.email && userData.email) {
      await this.typeWithDelay(page, selectors.email, userData.email);
    }
    if (selectors.phone && userData.phone) {
      await this.typeWithDelay(page, selectors.phone, userData.phone);
    }

    // Upload resume
    if (selectors.resume && resumeUrl) {
      const fileInput = await page.$(selectors.resume);
      if (fileInput) {
        // In production, download from S3 and upload
        await fileInput.setInputFiles('/tmp/resume.pdf');
        await this.randomDelay(500, 1000);
      }
    }

    // Upload cover letter if provided
    if (selectors.coverLetter && userData.coverLetter) {
      await this.typeWithDelay(page, selectors.coverLetter, userData.coverLetter);
    }

    // Click next if exists
    if (config.selectors.nextButton) {
      const nextBtn = await page.$(config.selectors.nextButton);
      if (nextBtn) {
        await nextBtn.click();
        await this.randomDelay(1000, 2000);
      }
    }
  }

  private async typeWithDelay(page: Page, selector: string, text: string) {
    const element = await page.$(selector);
    if (element) {
      await element.focus();
      await this.randomDelay(100, 300);
      await element.type(text, { delay: Math.random() * 50 + 50 }); // Human-like typing
    }
  }

  private async detectCaptcha(page: Page): Promise<boolean> {
    const captchaSelectors = [
      'iframe[src*="recaptcha"]',
      '[data-sitekey]',
      '.captcha',
      '#captcha',
      '[class*="captcha"]',
      'img[alt*="captcha"]',
    ];
    
    for (const selector of captchaSelectors) {
      const element = await page.$(selector);
      if (element) return true;
    }
    return false;
  }

  private async randomDelay(min: number, max: number) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
