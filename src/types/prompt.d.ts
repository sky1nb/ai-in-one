// Prompt Template Types

export interface PromptTemplate {
  id: string;
  name: string;
  prompt: string;
  description?: string;
  category: string;
  tags: string[];
  variables?: PromptVariable[];
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  isFavorite: boolean;
}

export interface PromptVariable {
  name: string; // e.g., "topic", "language", "context"
  placeholder?: string;
  defaultValue?: string;
  required: boolean;
}

export interface PromptCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const DEFAULT_CATEGORIES: PromptCategory[] = [
  { id: 'coding', name: 'Coding', icon: '💻', color: '#3b82f6' },
  { id: 'writing', name: 'Writing', icon: '✍️', color: '#8b5cf6' },
  { id: 'analysis', name: 'Analysis', icon: '📊', color: '#06b6d4' },
  { id: 'creative', name: 'Creative', icon: '🎨', color: '#ec4899' },
  { id: 'business', name: 'Business', icon: '💼', color: '#10b981' },
  { id: 'education', name: 'Education', icon: '📚', color: '#f59e0b' },
  { id: 'general', name: 'General', icon: '💡', color: '#6b7280' },
];

export const DEFAULT_TEMPLATES: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>[] = [
  {
    name: 'Code Review',
    prompt: 'Review this {{language}} code and provide:\n1. Potential bugs or issues\n2. Performance improvements\n3. Best practices suggestions\n4. Security concerns\n\nCode:\n```{{language}}\n{{code}}\n```',
    description: 'Comprehensive code review with security and performance analysis',
    category: 'coding',
    tags: ['code', 'review', 'debugging'],
    variables: [
      { name: 'language', placeholder: 'e.g., JavaScript, Python', required: true },
      { name: 'code', placeholder: 'Paste your code here', required: true },
    ],
    isFavorite: true,
  },
  {
    name: 'Explain Like I\'m 5',
    prompt: 'Explain {{topic}} in the simplest terms possible, as if you were explaining it to a 5-year-old child. Use analogies and examples.',
    description: 'Simplify complex topics with easy-to-understand explanations',
    category: 'education',
    tags: ['explain', 'simple', 'learning'],
    variables: [
      { name: 'topic', placeholder: 'e.g., Quantum Computing', required: true },
    ],
    isFavorite: true,
  },
  {
    name: 'Blog Post Outline',
    prompt: 'Create a detailed blog post outline for: "{{title}}"\n\nTarget audience: {{audience}}\nTone: {{tone}}\nWord count: {{wordCount}}\n\nInclude:\n- Engaging introduction hook\n- 5-7 main sections with subpoints\n- SEO keywords suggestions\n- Call-to-action ideas',
    description: 'Generate structured blog post outlines with SEO considerations',
    category: 'writing',
    tags: ['blog', 'content', 'seo', 'outline'],
    variables: [
      { name: 'title', placeholder: 'Blog post title', required: true },
      { name: 'audience', placeholder: 'e.g., developers, marketers', defaultValue: 'general audience', required: false },
      { name: 'tone', placeholder: 'e.g., professional, casual', defaultValue: 'professional', required: false },
      { name: 'wordCount', placeholder: 'e.g., 1500', defaultValue: '1000-1500', required: false },
    ],
    isFavorite: false,
  },
  {
    name: 'Data Analysis',
    prompt: 'Analyze this data and provide:\n1. Key insights and patterns\n2. Statistical summary\n3. Visualizations suggestions\n4. Actionable recommendations\n\nData context: {{context}}\n\nData:\n{{data}}',
    description: 'Comprehensive data analysis with insights and recommendations',
    category: 'analysis',
    tags: ['data', 'statistics', 'insights'],
    variables: [
      { name: 'context', placeholder: 'e.g., Sales data Q4 2023', required: true },
      { name: 'data', placeholder: 'Paste your data here', required: true },
    ],
    isFavorite: false,
  },
  {
    name: 'Brainstorm Ideas',
    prompt: 'Generate 10 creative and innovative ideas for: {{topic}}\n\nConstraints: {{constraints}}\nTarget: {{target}}\n\nFor each idea provide:\n- Brief description\n- Potential impact\n- Implementation difficulty (1-5)',
    description: 'Creative brainstorming with structured output',
    category: 'creative',
    tags: ['brainstorm', 'ideas', 'innovation'],
    variables: [
      { name: 'topic', placeholder: 'e.g., Mobile app features', required: true },
      { name: 'constraints', placeholder: 'Budget, time, etc.', required: false },
      { name: 'target', placeholder: 'Target audience', required: false },
    ],
    isFavorite: false,
  },
  {
    name: 'Business Email',
    prompt: 'Write a professional business email:\n\nPurpose: {{purpose}}\nRecipient: {{recipient}}\nTone: {{tone}}\nKey points to include:\n{{keyPoints}}\n\nMake it clear, concise, and actionable.',
    description: 'Professional business email drafting',
    category: 'business',
    tags: ['email', 'communication', 'professional'],
    variables: [
      { name: 'purpose', placeholder: 'e.g., Request meeting, Follow-up', required: true },
      { name: 'recipient', placeholder: 'e.g., Client, Manager', required: true },
      { name: 'tone', placeholder: 'e.g., formal, friendly', defaultValue: 'professional', required: false },
      { name: 'keyPoints', placeholder: 'Bullet points of what to include', required: true },
    ],
    isFavorite: false,
  },
];
