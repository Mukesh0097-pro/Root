
Here is Claude's plan:

Plan: Fix Marketing Website Content to Match FedKnowledge Product
Scope
Partial fix — keep "Root" branding, keep page layouts/animations intact, only update text content to reflect the actual product. Use placeholders for team/contact info.

What FedKnowledge Actually Is
Enterprise AI knowledge base for companies
Department-based document management (HR, Engineering, Finance, etc.)
AI-powered chat using Google Gemini + FAISS vector search
Per-department document isolation (each dept has its own knowledge base)
File upload: PDF, DOCX, TXT, XLSX, CSV, MD, PNG, JPG
Admin dashboard: document management, user management, analytics
Role-based access: employee, dept_admin, company_admin
JWT auth + Google Sign-In
Files to Update (19 files)
Page Hero Text (4 files)
d:\RAG\pages\Platform.tsx — Change subtitle from federated vector storage/privacy-preserving LLMs to: AI-powered knowledge base, department document management, intelligent chat
d:\RAG\pages\Solutions.tsx — Change from "federated intelligence for regulated industries" to enterprise knowledge management solutions
d:\RAG\pages\Research.tsx — Change from "federated learning, secure multi-party computation" to enterprise AI, knowledge management, RAG technology
d:\RAG\pages\Company.tsx — Change from "federated AI" to enterprise AI knowledge management
Home Page Components (10 files)
d:\RAG\components\Hero.tsx — Change headline from "Federated Intelligence for the RAG Era" / "Train on distributed private data without moving it" to something about enterprise knowledge management powered by AI
d:\RAG\components\InteractiveDemo.tsx — Rewrite 5 steps to match actual flow: (1) User asks a question in chat, (2) Query is embedded using Gemini AI, (3) Department knowledge base searched via FAISS vectors, (4) Relevant document chunks retrieved with sources, (5) AI generates sourced response
d:\RAG\components\Comparison.tsx — Change from "Traditional RAG vs Federated RAG" to "Traditional Search vs AI-Powered Knowledge Base" comparing manual doc search vs Root's intelligent retrieval
d:\RAG\components\Highlights.tsx — Replace 6 highlights with actual features: Department Isolation, AI-Powered Chat, Multi-Format Upload, Role-Based Access, Admin Dashboard, Source Citations
d:\RAG\components\DevSection.tsx — Replace SDK code samples with actual API usage examples (curl to /api/chat/stream or similar)
d:\RAG\components\Stats.tsx — Replace fictional stats (50K nodes, 10B vectors) with relevant ones (10+ departments, multi-format support, real-time AI chat, role-based security)
d:\RAG\components\CTASection.tsx — Update CTA text from "private AI" / "federated RAG pipelines" to enterprise knowledge management
d:\RAG\components\HomePreview.tsx — Update 4 preview card descriptions to match actual product
d:\RAG\components\ImageCards.tsx — Update capability cards from federated learning/zero-knowledge/compliance to: Document Management, AI Chat, Department Knowledge, Admin Analytics, Role-Based Access, Multi-Format Support
d:\RAG\components\BigType.tsx — Check if it has hardcoded text about federation (update if so)
Solutions Page Components (2 files)
d:\RAG\components\ValueProp.tsx — Change from "data silos with Federated AI" / "secure multi-party computation" to enterprise knowledge management, AI-powered document retrieval
d:\RAG\components\UseCases.tsx — Replace 4 industry-specific use cases (Healthcare/HIPAA, Finance/SOC2, Gov/FedRAMP, Manufacturing/Edge) with department-based use cases: HR (employee policies, onboarding docs), Engineering (technical docs, runbooks), Legal (contracts, compliance docs), Finance (reports, procedures)
Platform Page Components (2 files)
d:\RAG\components\Features.tsx — Replace 3 core features (Federated Vector Store, Privacy-Preserving LLM, Compliance Engine) with: AI Knowledge Base (FAISS + Gemini chat), Document Management (multi-format upload, processing, chunking), Admin & Analytics (user management, usage analytics, audit logs)
d:\RAG\components\TechSpecs.tsx — Replace specs (5ms federated nodes, 50K edge devices, 256-bit encryption) with actual specs: 10+ departments, 8 file formats supported, real-time streaming, role-based access, per-department isolation, full audit logging
Research Page Components (2 files)
d:\RAG\components\Pillars.tsx — Replace 3 pillars (zero-trust, 50K nodes scaling, distributed protocol) with: Intelligent Retrieval (FAISS vector search), Department Isolation (per-dept knowledge), AI-Powered Responses (Gemini with source citations)
d:\RAG\components\Publications.tsx — Replace 4 fictional papers + methodology with placeholder blog posts about RAG, knowledge management, AI in enterprise. Update methodology steps to match actual pipeline
Company Page Components (2 files)
d:\RAG\components\CompanySections.tsx — Replace mission text (federated AI, data sovereignty) with enterprise knowledge management mission. Replace 6 fictional team members with placeholders ("Team Member", "Role TBD", placeholder bio). Replace contact email placeholder
d:\RAG\components\AboutSection.tsx — Update description from "Root partners with startups" to something about empowering enterprises with AI-powered knowledge management
Contact Page (1 file)
d:\RAG\pages\Contact.tsx — Replace contact details (hello@rootsystems.ai, SF address, phone) with placeholders (contact@example.com, "Your City", etc.). Update FAQ answers to match actual product. Update "Why Reach Out" items
Video Component (1 file)
d:\RAG\components\VideoShowcase.tsx — Update description from "latency-free retrieval protocol across distributed nodes" to product demo description
Navbar & Footer (no changes needed)
Navbar — Already says "Root", navigation labels are fine (Solutions, Platform, AI Research, Company)
Footer — Already generic enough, "ROOT SYSTEMS" stays