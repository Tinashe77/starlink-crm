# StarConnect CRM Web Application
## Modular Scope of Work (MERN Stack)

---

# 1. Authentication & User Management Module

## Purpose
Handle login, access control, and staff roles.

## Core Features
- User registration (admin-only)
- Login (JWT-based authentication)
- Password reset / change password
- Role-based access control:
  - Admin
  - Agent
  - Technician
  - Collections Officer
  - (Optional) Customer

## Data Models
- User
  - name
  - email
  - phone
  - password (hashed)
  - role
  - status

---

# 2. Customer & Application Module

## Purpose
Digitize the Customer Application Form and manage onboarding.

## Core Features
- Create / edit customer profiles
- Create application linked to customer
- Application status workflow:
  - Draft
  - Submitted
  - Under Review
  - Approved
  - Rejected
- Upload supporting documents (ID, proof of address, etc.)
- On approval:
  - Trigger contract creation
  - Trigger payment plan setup

## Data Models
- Customer
- Application

## Dependencies
- Authentication Module

---

# 3. Contract & Agreement Module

## Purpose
Digitally manage Service Agreements and Repayment Agreements.

## Core Features
- Generate contract from approved application
- Auto-generate contract reference (e.g., UT-SAG-XXXX)
- Store financial details:
  - Total contract value
  - Deposit
  - Weekly installment
  - Duration (8 weeks)
- Contract statuses:
  - Pending Deposit
  - Active
  - In Arrears
  - Default
  - Completed
- Link contract to:
  - Customer
  - Application
  - Package
  - Payment Plan

## Data Models
- Contract

## Dependencies
- Customer & Application Module
- Package & Master Data Module

---

# 4. Package & Master Data Configuration Module

## Purpose
Manage business configuration data.

## Core Features
- Create and manage Packages:
  - Name
  - Description
  - Total cost
  - Deposit %
  - Weekly amount
  - Type (Household / Business / School)
- Configure global settings:
  - Late fee amount
  - Grace period (days)
  - Early settlement discount rules
- Store merchant/payment codes (EcoCash merchant code)

## Data Models
- Package
- Settings (key-value configuration)

## Dependencies
- None (Core system module)

---

# 5. Payment Plan & Tracking Module

## Purpose
Digitize the 8-week payment schedule and tracking system.

## Core Features
- Auto-generate 8-week schedule upon contract activation:
  - Week number
  - Due date
  - Amount due
- Installment status:
  - Pending
  - Paid
  - Late
  - Defaulted
- Live outstanding balance calculation
- Support:
  - Partial payments
  - Early settlement
  - Admin schedule adjustments

## Data Models
- PaymentScheduleItem

## Dependencies
- Contract Module
- Package & Settings Module

---

# 6. Payment Capture & Receipt Module

## Purpose
Record payments and generate official receipts.

## Core Features
- Capture payment details:
  - Contract
  - Installment
  - Amount
  - Payment method
  - EcoCash reference
  - Staff user
  - Payment date
- Generate official receipt (HTML/PDF)
- Update outstanding balance
- Support lump-sum payments

## Data Models
- Payment
- Document (for receipt storage)

## Dependencies
- Payment Plan Module
- Contract Module

---

# 7. Notifications & Reminder Automation Module

## Purpose
Automate communication for onboarding, payments, and defaults.

## Core Features
- Configurable notification templates:
  - Application received
  - Application approved/rejected
  - Deposit reminders
  - Installment reminders (before, on, after due date)
  - Grace period alert
  - Late fee notice
  - Default notices (First / Second / Final)
  - Completion & Certificate issued
- Scheduled background job (daily cron):
  - Checks due dates
  - Applies late fees
  - Sends reminders
- Channels:
  - Email
  - SMS
  - WhatsApp (API integration)
- Notification history logging

## Data Models
- NotificationTemplate
- NotificationLog

## Dependencies
- Payment Plan Module
- Contract Module
- Customer Module
- Settings Module

---

# 8. Installation & Handover Module

## Purpose
Digitize the Equipment Installation & Handover process.

## Core Features
- Create installation job after deposit confirmation
- Assign technician
- Technician job dashboard
- Capture handover details:
  - Equipment serial numbers
  - Installation type & location
  - Speed test results
  - Training checklist
  - Customer signature
- Upload installation photos
- Installation statuses:
  - Planned
  - In Progress
  - Completed

## Data Models
- InstallationJob

## Dependencies
- Contract Module
- Authentication Module

---

# 9. Collections & Default Management Module

## Purpose
Manage arrears and escalation workflow.

## Core Features
- Arrears dashboard:
  - Overdue amount
  - Days overdue
  - Notice level
- Auto-default logic:
  - Mark contract default after configured days
  - Generate default notice
- Escalation:
  - First Notice
  - Second Notice
  - Final Notice
- Record collections notes
- Record new payment arrangements
- Flag for repossession

## Data Models
- (Uses Contract + PaymentScheduleItem)
- Optional: CollectionsCase

## Dependencies
- Payment Plan Module
- Notifications Module

---

# 10. Document & Template Generation Module

## Purpose
Generate and manage official business documents.

## Core Features
- Store templates for:
  - Service Agreement
  - Repayment Agreement
  - EcoCash Mandate
  - Installation & Handover
  - Payment Receipt
  - Default Notices
  - Certificate of Ownership
- Merge dynamic data into templates
- Generate HTML/PDF documents
- List documents per contract

## Data Models
- Document
- Template

## Dependencies
- Contract Module
- Payment Module
- Installation Module

---

# 11. Reporting & Analytics Module

## Purpose
Provide operational and financial insights.

## Core Features
- Dashboard metrics:
  - Active vs Completed vs Defaulted contracts
  - Payments received vs expected
  - Arrears aging buckets
  - Agent performance
  - Technician performance
- Export reports (CSV)

## Dependencies
- Contract
- Payment
- Installation
- Customer

---

# 12. Admin & System Settings Module

## Purpose
Centralized system control.

## Core Features
- Manage:
  - Users
  - Packages
  - Global system settings
  - Notification templates
- Audit logs for key actions
- Enable/disable users

## Dependencies
- Authentication Module
- Master Data Module

---

# Recommended Development Phases

## MVP Phase (Core Business Automation)
1. Authentication & User Management
2. Customer & Application
3. Package & Master Data
4. Contract & Agreement
5. Payment Plan & Tracking
6. Payment Capture & Receipts
7. Basic Notifications & Reminders

## Phase 2 (Operational Expansion)
8. Installation & Handover
9. Collections & Default Management
10. Advanced Document Generation
11. Reporting & Analytics
12. Advanced Admin Controls

---

# Technology Stack

- Frontend: React
- Backend: Node.js + Express
- Database: MongoDB
- Authentication: JWT
- Notifications: SMS API + Email Service + WhatsApp API
- Scheduled Jobs: Node Cron

---

# End of Document