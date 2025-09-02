// Quiz questions data
export const refreshQuizQuestions = [
  {
    question: "400 words ≈ how many tokens?",
    options: [
      { id: 0, text: "200" },
      { id: 1, text: "400" },
      { id: 2, text: "520", isCorrect: true },
      { id: 3, text: "1,000" }
    ]
  },
  {
    question: "What type of prompt defines model role and behavior?",
    options: [
      { id: 0, text: "System Prompt", isCorrect: true },
      { id: 1, text: "User Prompt" },
      { id: 2, text: "Associated Prompt" },
      { id: 3, text: "None" }
    ]
  },
  {
    question: "A Vector DB is best described as…",
    options: [
      { id: 0, text: "A CSV file" },
      { id: 1, text: "A SQL join" },
      { id: 2, text: "A 3D map of meaning", isCorrect: true },
      { id: 3, text: "A cache" }
    ]
  }
];

export const finalQuizQuestions = [
  {
    question: "Precision: If Precision@10 = 0.7, what does it mean?",
    options: [
      { id: 0, text: "70% of all relevant docs were retrieved" },
      { id: 1, text: "7 out of 10 retrieved docs are relevant", isCorrect: true },
      { id: 2, text: "70 docs in total are relevant" },
      { id: 3, text: "Recall = 0.7" }
    ]
  },
  {
    question: "Recall: If Recall@20 = 0.9, what does that mean?",
    options: [
      { id: 0, text: "90% of retrieved docs are relevant" },
      { id: 1, text: "90% of all relevant docs in the corpus appear in the top 20", isCorrect: true },
      { id: 2, text: "20 docs are always accurate" },
      { id: 3, text: "Recall = precision" }
    ]
  },
  {
    question: "Large-Scale Embedding: You have 1M chunks, each with 400 words.",
    options: [
      { id: 0, text: "52M" },
      { id: 1, text: "520M", isCorrect: true },
      { id: 2, text: "5.2B" },
      { id: 3, text: "520B" }
    ]
  },
  {
    question: "Neural Weights: If input = 2 and weight = 0.5 → contribution = 1. What are neural network weights?",
    options: [
      { id: 0, text: "Switches that adjust signal strength", isCorrect: true },
      { id: 1, text: "Tokens in a prompt" },
      { id: 2, text: "Reports in BI" },
      { id: 3, text: "Indexes in a DB" }
    ]
  },
  {
    question: "Multimodal RAG: What's the benefit of multimodal RAG compared to text-only RAG?",
    options: [
      { id: 0, text: "Faster GPUs" },
      { id: 1, text: "It can retrieve across text, images, audio, and structured data", isCorrect: true },
      { id: 2, text: "Cheaper token usage" },
      { id: 3, text: "Always higher recall" }
    ]
  }
];
