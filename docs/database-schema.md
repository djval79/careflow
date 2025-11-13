# HR & Recruitment Platform - Database Schema

## Overview
Comprehensive PostgreSQL database schema for HR & Recruitment management platform with 6 modules.

## Schema Design Principles
- No foreign key constraints (per Supabase best practices)
- Manual relationship management
- Comprehensive audit logging
- Role-based access control
- Document versioning support

## Tables Structure

### 1. AUTHENTICATION & USER MANAGEMENT

#### users_profiles
Extended user profile information
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID NOT NULL
email VARCHAR(255) NOT NULL
full_name VARCHAR(255)
role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'hr_manager', 'recruiter', 'employee'))
phone VARCHAR(50)
avatar_url TEXT
department VARCHAR(100)
position VARCHAR(100)
is_active BOOLEAN DEFAULT true
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

### 2. HR MODULE TABLES

#### employees
Core employee records
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID
employee_number VARCHAR(50) UNIQUE NOT NULL
first_name VARCHAR(100) NOT NULL
last_name VARCHAR(100) NOT NULL
email VARCHAR(255) NOT NULL
phone VARCHAR(50)
date_of_birth DATE
gender VARCHAR(20)
address TEXT
city VARCHAR(100)
country VARCHAR(100)
postal_code VARCHAR(20)
emergency_contact_name VARCHAR(255)
emergency_contact_phone VARCHAR(50)
date_hired DATE NOT NULL
employment_type VARCHAR(50) CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'temporary'))
department VARCHAR(100)
position VARCHAR(100)
reporting_to UUID
salary_grade VARCHAR(50)
visa_type VARCHAR(100)
visa_expiry_date DATE
right_to_work_verified BOOLEAN DEFAULT false
right_to_work_expiry DATE
status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'suspended', 'terminated'))
termination_date DATE
termination_reason TEXT
created_by UUID NOT NULL
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

#### documents
Employee document management
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
employee_id UUID NOT NULL
document_type VARCHAR(100) NOT NULL
document_name VARCHAR(255) NOT NULL
file_url TEXT NOT NULL
file_size INTEGER
mime_type VARCHAR(100)
expiry_date DATE
is_verified BOOLEAN DEFAULT false
verified_by UUID
verified_at TIMESTAMP
notes TEXT
uploaded_by UUID NOT NULL
uploaded_at TIMESTAMP DEFAULT NOW()
version INTEGER DEFAULT 1
is_current_version BOOLEAN DEFAULT true
replaced_by UUID
created_at TIMESTAMP DEFAULT NOW()
```

#### attendance_records
Employee attendance tracking
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
employee_id UUID NOT NULL
date DATE NOT NULL
clock_in TIMESTAMP
clock_out TIMESTAMP
total_hours DECIMAL(5,2)
status VARCHAR(50) CHECK (status IN ('present', 'absent', 'late', 'half_day', 'on_leave'))
notes TEXT
approved_by UUID
approved_at TIMESTAMP
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

#### leave_requests
Leave and holiday management
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
employee_id UUID NOT NULL
leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('annual', 'sick', 'unpaid', 'maternity', 'paternity', 'compassionate', 'other'))
start_date DATE NOT NULL
end_date DATE NOT NULL
total_days DECIMAL(5,2) NOT NULL
reason TEXT
status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'))
reviewed_by UUID
reviewed_at TIMESTAMP
review_notes TEXT
requested_at TIMESTAMP DEFAULT NOW()
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

#### shifts
Shift scheduling
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
shift_name VARCHAR(100) NOT NULL
start_time TIME NOT NULL
end_time TIME NOT NULL
description TEXT
is_active BOOLEAN DEFAULT true
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

#### shift_assignments
Employee shift assignments
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
employee_id UUID NOT NULL
shift_id UUID NOT NULL
date DATE NOT NULL
notes TEXT
created_by UUID NOT NULL
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

### 3. RECRUITMENT MODULE TABLES

#### job_postings
Job vacancy management
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
job_title VARCHAR(255) NOT NULL
job_code VARCHAR(50) UNIQUE
department VARCHAR(100) NOT NULL
location VARCHAR(255)
employment_type VARCHAR(50) CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'temporary', 'internship'))
salary_range_min DECIMAL(12,2)
salary_range_max DECIMAL(12,2)
salary_currency VARCHAR(10) DEFAULT 'USD'
job_description TEXT NOT NULL
responsibilities TEXT
requirements TEXT
qualifications TEXT
benefits TEXT
application_deadline DATE
status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'cancelled'))
published_at TIMESTAMP
closed_at TIMESTAMP
positions_available INTEGER DEFAULT 1
positions_filled INTEGER DEFAULT 0
created_by UUID NOT NULL
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

#### applications
Applicant tracking
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
job_posting_id UUID NOT NULL
applicant_first_name VARCHAR(100) NOT NULL
applicant_last_name VARCHAR(100) NOT NULL
applicant_email VARCHAR(255) NOT NULL
applicant_phone VARCHAR(50)
cv_url TEXT NOT NULL
cover_letter TEXT
portfolio_url TEXT
linkedin_url TEXT
current_location VARCHAR(255)
desired_salary DECIMAL(12,2)
notice_period VARCHAR(100)
status VARCHAR(50) DEFAULT 'applied' CHECK (status IN ('applied', 'screening', 'shortlisted', 'interview_scheduled', 'interviewed', 'offer_extended', 'offer_accepted', 'offer_rejected', 'hired', 'rejected', 'withdrawn'))
pipeline_stage VARCHAR(100) DEFAULT 'new_application'
score INTEGER CHECK (score >= 0 AND score <= 100)
notes TEXT
source VARCHAR(100)
applied_at TIMESTAMP DEFAULT NOW()
last_updated_by UUID
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

#### interviews
Interview scheduling and management
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
application_id UUID NOT NULL
interview_type VARCHAR(50) CHECK (interview_type IN ('phone_screening', 'video', 'in_person', 'technical', 'final'))
scheduled_date TIMESTAMP NOT NULL
duration INTEGER DEFAULT 60
location TEXT
meeting_link TEXT
interviewer_ids TEXT
status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'))
feedback TEXT
rating INTEGER CHECK (rating >= 1 AND rating <= 5)
recommendation VARCHAR(50) CHECK (recommendation IN ('strong_hire', 'hire', 'maybe', 'no_hire'))
created_by UUID NOT NULL
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

#### evaluation_criteria
Candidate evaluation templates
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
job_posting_id UUID
criteria_name VARCHAR(255) NOT NULL
description TEXT
weight DECIMAL(5,2) DEFAULT 1.0
max_score INTEGER DEFAULT 10
is_required BOOLEAN DEFAULT false
created_at TIMESTAMP DEFAULT NOW()
```

#### candidate_evaluations
Individual candidate scoring
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
application_id UUID NOT NULL
criteria_id UUID NOT NULL
score INTEGER NOT NULL
comments TEXT
evaluated_by UUID NOT NULL
evaluated_at TIMESTAMP DEFAULT NOW()
```

### 4. LETTER MODULE TABLES

#### letter_templates
Document templates
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
template_name VARCHAR(255) NOT NULL
template_type VARCHAR(100) NOT NULL CHECK (template_type IN ('offer_letter', 'employment_contract', 'reference_letter', 'warning_letter', 'termination_letter', 'compliance_letter', 'other'))
subject VARCHAR(500)
content TEXT NOT NULL
merge_fields TEXT
category VARCHAR(100)
is_active BOOLEAN DEFAULT true
version INTEGER DEFAULT 1
created_by UUID NOT NULL
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

#### generated_letters
Document generation tracking
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
template_id UUID NOT NULL
employee_id UUID
application_id UUID
letter_type VARCHAR(100) NOT NULL
subject VARCHAR(500)
content TEXT NOT NULL
pdf_url TEXT
status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'rejected'))
generated_by UUID NOT NULL
generated_at TIMESTAMP DEFAULT NOW()
approved_by UUID
approved_at TIMESTAMP
sent_at TIMESTAMP
recipient_email VARCHAR(255)
metadata TEXT
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

### 5. SYSTEM TABLES

#### company_settings
Company configuration
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
company_name VARCHAR(255) NOT NULL
company_logo_url TEXT
company_address TEXT
company_phone VARCHAR(50)
company_email VARCHAR(255)
company_website VARCHAR(255)
working_hours_start TIME
working_hours_end TIME
timezone VARCHAR(100) DEFAULT 'UTC'
date_format VARCHAR(50) DEFAULT 'YYYY-MM-DD'
currency VARCHAR(10) DEFAULT 'USD'
annual_leave_days INTEGER DEFAULT 20
sick_leave_days INTEGER DEFAULT 10
public_holidays TEXT
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

#### audit_logs
Comprehensive audit trail
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID NOT NULL
action VARCHAR(100) NOT NULL
entity_type VARCHAR(100) NOT NULL
entity_id UUID
old_values TEXT
new_values TEXT
ip_address VARCHAR(50)
user_agent TEXT
timestamp TIMESTAMP DEFAULT NOW()
```

#### notifications
System notifications
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID NOT NULL
notification_type VARCHAR(100) NOT NULL
title VARCHAR(255) NOT NULL
message TEXT NOT NULL
link_url TEXT
is_read BOOLEAN DEFAULT false
read_at TIMESTAMP
priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
created_at TIMESTAMP DEFAULT NOW()
```

### 6. RECRUIT SETTINGS TABLES

#### recruitment_workflows
Customizable recruitment process
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
workflow_name VARCHAR(255) NOT NULL
job_posting_id UUID
stages TEXT NOT NULL
default_stages TEXT
is_active BOOLEAN DEFAULT true
created_by UUID NOT NULL
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

#### application_form_fields
Custom application form builder
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
field_name VARCHAR(255) NOT NULL
field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'textarea', 'email', 'phone', 'date', 'select', 'multiselect', 'checkbox', 'file'))
field_label VARCHAR(255) NOT NULL
field_options TEXT
is_required BOOLEAN DEFAULT false
display_order INTEGER DEFAULT 0
is_active BOOLEAN DEFAULT true
job_posting_id UUID
created_at TIMESTAMP DEFAULT NOW()
```

#### onboarding_checklists
Employee onboarding tasks
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
checklist_name VARCHAR(255) NOT NULL
description TEXT
tasks TEXT NOT NULL
department VARCHAR(100)
position VARCHAR(100)
is_active BOOLEAN DEFAULT true
created_by UUID NOT NULL
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

#### onboarding_progress
Track onboarding completion
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
employee_id UUID NOT NULL
checklist_id UUID NOT NULL
task_id VARCHAR(100) NOT NULL
is_completed BOOLEAN DEFAULT false
completed_by UUID
completed_at TIMESTAMP
notes TEXT
created_at TIMESTAMP DEFAULT NOW()
```

## Row Level Security (RLS) Policies

All tables will have RLS enabled with policies for:
- Admins: Full access
- HR Managers: Full access to HR and recruitment data
- Recruiters: Access to recruitment module
- Employees: Read-only access to their own data

## Indexes

Performance indexes will be created for:
- Frequently queried fields (employee_number, email, status)
- Date fields (created_at, expiry_date)
- Foreign key relationships (employee_id, application_id, job_posting_id)
