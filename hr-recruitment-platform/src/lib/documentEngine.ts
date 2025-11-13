/**
 * Document Automation Engine
 * Auto-generates contracts, offer letters, onboarding packets
 * Saves 10-15 hours per week on document creation
 */

export interface DocumentTemplate {
  id: string;
  name: string;
  type: 'contract' | 'offer_letter' | 'onboarding' | 'policy' | 'compliance';
  template: string;
  variables: string[];
  department?: string;
  position?: string;
}

export interface DocumentData {
  employee?: any;
  job?: any;
  company?: any;
  custom?: Record<string, any>;
}

export class DocumentAutomationEngine {
  private templates: Map<string, DocumentTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates() {
    // Employment Contract Template
    this.addTemplate({
      id: 'employment_contract',
      name: 'Employment Contract',
      type: 'contract',
      variables: ['employee_name', 'position', 'start_date', 'salary', 'department', 'manager', 'company_name'],
      template: `
EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is made between {{company_name}} ("Company") and {{employee_name}} ("Employee").

POSITION AND DUTIES
Employee is hired as {{position}} in the {{department}} department, reporting to {{manager}}.

EMPLOYMENT TERMS
- Start Date: {{start_date}}
- Annual Salary: {{salary}}
- Employment Type: Full-time
- Probation Period: 90 days

BENEFITS
- Health insurance eligibility after 30 days
- Paid time off accrual starts immediately
- Performance review after 90 days

By signing below, both parties agree to the terms of this agreement.

Employee Signature: _________________ Date: _________
Company Representative: _____________ Date: _________
      `
    });

    // Offer Letter Template
    this.addTemplate({
      id: 'offer_letter',
      name: 'Job Offer Letter',
      type: 'offer_letter',
      variables: ['candidate_name', 'position', 'salary', 'start_date', 'hiring_manager', 'company_name'],
      template: `
Dear {{candidate_name}},

We are pleased to offer you the position of {{position}} at {{company_name}}.

OFFER DETAILS:
- Position: {{position}}
- Annual Salary: {{salary}}
- Start Date: {{start_date}}
- Reporting Manager: {{hiring_manager}}

This offer is contingent upon successful completion of background checks and reference verification.

Please confirm your acceptance by responding to this letter within 5 business days.

We look forward to welcoming you to our team!

Sincerely,
{{hiring_manager}}
Hiring Manager
      `
    });

    // Onboarding Checklist Template
    this.addTemplate({
      id: 'onboarding_checklist',
      name: 'Employee Onboarding Checklist',
      type: 'onboarding',
      variables: ['employee_name', 'position', 'department', 'start_date', 'manager', 'buddy'],
      template: `
EMPLOYEE ONBOARDING CHECKLIST
Employee: {{employee_name}}
Position: {{position}}
Department: {{department}}
Start Date: {{start_date}}

WEEK 1 - SETUP & ORIENTATION
□ IT Setup Complete
  - Email account created
  - Computer/equipment assigned
  - Access badges provided
  - Software licenses activated

□ HR Documentation
  - Tax forms (W-4, I-9) completed
  - Emergency contact information
  - Benefits enrollment started
  - Employee handbook received

□ Department Introduction
  - Meet team members
  - Workspace tour
  - Introduction to {{manager}} (Manager)
  - Introduction to {{buddy}} (Buddy)

WEEK 2 - TRAINING & INTEGRATION
□ Role-specific training scheduled
□ Company culture overview session
□ First project assignment
□ 30-60-90 day goals set

ONGOING SUPPORT
- Weekly check-ins with manager
- Buddy system for questions
- Open door policy for concerns
- Performance review at 90 days
      `
    });

    // Privacy Policy Template
    this.addTemplate({
      id: 'privacy_policy',
      name: 'Employee Privacy Policy',
      type: 'policy',
      variables: ['company_name', 'effective_date', 'hr_contact'],
      template: `
EMPLOYEE PRIVACY POLICY

Company: {{company_name}}
Effective Date: {{effective_date}}

PURPOSE
This policy outlines how {{company_name}} collects, uses, and protects employee personal information.

INFORMATION WE COLLECT
- Personal identification information
- Employment history and performance data
- Compensation and benefits information
- Training and development records

DATA PROTECTION
- All employee data is stored securely
- Access limited to authorized personnel only
- Regular security audits conducted
- Data retention according to legal requirements

EMPLOYEE RIGHTS
- Right to access personal data
- Right to correct inaccurate information
- Right to understand how data is used

For questions about this policy, contact: {{hr_contact}}

Employee Acknowledgment:
I have read and understand this privacy policy.

Signature: _________________ Date: _________
      `
    });
  }

  addTemplate(template: DocumentTemplate) {
    this.templates.set(template.id, template);
  }

  generateDocument(templateId: string, data: DocumentData): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    let document = template.template;

    // Replace variables with actual data
    template.variables.forEach(variable => {
      const value = this.getVariableValue(variable, data);
      const placeholder = `{{${variable}}}`;
      document = document.replace(new RegExp(placeholder, 'g'), value || `[${variable}]`);
    });

    return document;
  }

  private getVariableValue(variable: string, data: DocumentData): string {
    // Check custom data first
    if (data.custom && data.custom[variable]) {
      return data.custom[variable];
    }

    // Employee data mapping
    if (data.employee) {
      switch (variable) {
        case 'employee_name':
        case 'candidate_name':
          return `${data.employee.first_name} ${data.employee.last_name}`;
        case 'position':
          return data.employee.position || data.job?.job_title || '';
        case 'salary':
          return data.employee.salary_grade || data.job?.salary_range_min || '';
        case 'department':
          return data.employee.department || data.job?.department || '';
        case 'start_date':
          return data.employee.date_hired || new Date().toLocaleDateString();
        case 'manager':
          return data.employee.manager || 'TBD';
      }
    }

    // Job data mapping
    if (data.job) {
      switch (variable) {
        case 'position':
          return data.job.job_title;
        case 'department':
          return data.job.department;
        case 'salary':
          return data.job.salary_range_min ? `$${data.job.salary_range_min} - $${data.job.salary_range_max}` : '';
        case 'hiring_manager':
          return data.job.hiring_manager || 'Hiring Manager';
      }
    }

    // Company data
    if (data.company) {
      switch (variable) {
        case 'company_name':
          return data.company.name || 'Your Company';
        case 'hr_contact':
          return data.company.hr_email || 'hr@company.com';
      }
    }

    // Default values
    switch (variable) {
      case 'company_name':
        return 'Your Company';
      case 'effective_date':
        return new Date().toLocaleDateString();
      case 'buddy':
        return 'Team Buddy';
      default:
        return '';
    }
  }

  getAvailableTemplates(): DocumentTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplateById(id: string): DocumentTemplate | undefined {
    return this.templates.get(id);
  }

  // Auto-generate documents for new employee
  async generateEmployeePacket(employeeData: any, jobData?: any): Promise<{ [key: string]: string }> {
    const data: DocumentData = {
      employee: employeeData,
      job: jobData,
      company: { name: 'Your Company', hr_email: 'hr@company.com' }
    };

    const documents: { [key: string]: string } = {};

    // Generate all relevant documents
    documents.contract = this.generateDocument('employment_contract', data);
    documents.onboarding = this.generateDocument('onboarding_checklist', data);
    documents.privacy_policy = this.generateDocument('privacy_policy', data);

    return documents;
  }

  // Auto-generate offer letter for candidate
  async generateOfferLetter(candidateData: any, jobData: any): Promise<string> {
    const data: DocumentData = {
      employee: candidateData,
      job: jobData,
      company: { name: 'Your Company' }
    };

    return this.generateDocument('offer_letter', data);
  }
}

// Singleton instance
export const documentEngine = new DocumentAutomationEngine();