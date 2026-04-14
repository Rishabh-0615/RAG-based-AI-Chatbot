// backend/scripts/seedKnowledge.js
import mongoose from "mongoose";
import axios from "axios";
import dotenv from "dotenv";
import Knowledge from "./models/knowledgeModel.js";

dotenv.config();

const knowledgeDocs = [
  {
    title: "Loan Eligibility Criteria",
    category: "lending_policies",
    content: `To be eligible for a loan, applicants must meet the following criteria:
    - Minimum age: 21 years
    - Minimum monthly income: ₹15,000 for salaried, ₹20,000 for self-employed
    - Credit score: 650 and above
    - Employment stability: Minimum 1 year at current job
    - Debt-to-income ratio should not exceed 40%
    - Valid KYC documents required: Aadhaar, PAN card`,
  },
  {
    title: "Loan Application Process",
    category: "lending_policies",
    content: `Steps to apply for a loan:
    1. Submit online application with personal and financial details
    2. Upload KYC documents (Aadhaar, PAN, income proof)
    3. Credit assessment is done within 24-48 hours
    4. Upon approval, loan agreement is sent digitally
    5. Disbursement happens within 3-5 business days after agreement signing
    Loan amounts range from ₹10,000 to ₹5,00,000 based on eligibility.`,
  },
  {
    title: "Credit Score and Risk Model",
    category: "risk_model",
    content: `Our alternative credit scoring model evaluates:
    - Traditional credit history (30%)
    - Income stability and employment history (25%)
    - Utility and rent payment history (20%)
    - Digital transaction patterns (15%)
    - Social and behavioral indicators (10%)
    Risk levels: Low (750+), Medium (600-749), High (below 600)
    Workers with no credit history can qualify using alternative data.`,
  },
  {
    title: "Interest Rates and Repayment",
    category: "credit_norms",
    content: `Interest rates based on risk profile:
    - Low risk (score 750+): 12-15% per annum
    - Medium risk (score 600-749): 16-22% per annum  
    - High risk (score below 600): 23-30% per annum
    Repayment tenure: 3 months to 36 months
    EMI auto-debit available. Prepayment allowed after 3 months with 2% fee.
    Late payment penalty: 2% per month on overdue amount.`,
  },
  {
    title: "Tax Guidance for Borrowers",
    category: "tax",
    content: `Tax implications for loan borrowers:
    - Personal loans are not tax deductible unless used for business purposes
    - Business loans: interest paid is tax deductible under Section 37
    - Home improvement loans: deduction up to ₹30,000 under Section 24
    - Education loans: full interest deduction under Section 80E for 8 years
    - GST of 18% applies on processing fees and other charges
    Borrowers should maintain records of loan usage for tax filing.`,
  },
  {
    title: "Insurance Requirements",
    category: "insurance",
    content: `Loan insurance policies:
    - Loans above ₹1,00,000 require mandatory credit life insurance
    - Premium is 0.5-1% of loan amount per annum
    - Insurance covers: death, permanent disability, critical illness
    - Optional job loss cover available for salaried employees
    - Insurance claim settles outstanding loan balance directly
    - Group insurance available for borrowers through employer tie-ups.`,
  },
];

const generateEmbedding = async (text) => {
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
    {
      content: { parts: [{ text }] },
    }
  );
  return response.data.embedding.values;
};

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("Connected to MongoDB");

  await Knowledge.deleteMany({});
  console.log("Cleared existing knowledge docs");

  for (const doc of knowledgeDocs) {
    const embedding = await generateEmbedding(doc.content);
    await Knowledge.create({ ...doc, embedding });
    console.log(`✅ Seeded: ${doc.title}`);
  }

  console.log("🎉 Seeding complete!");
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});