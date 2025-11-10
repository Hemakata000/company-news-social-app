// Mock data for frontend-only testing
import { NewsArticle, SocialMediaContent } from '../types/index.js';

export interface MockCompany {
  id: number;
  name: string;
  aliases?: string[];
  ticker_symbol?: string;
}

export const MOCK_COMPANIES: MockCompany[] = [
  { id: 1, name: 'Apple Inc', aliases: ['Apple'], ticker_symbol: 'AAPL' },
  { id: 2, name: 'Microsoft Corporation', aliases: ['Microsoft'], ticker_symbol: 'MSFT' },
  { id: 3, name: 'Google', aliases: ['Alphabet Inc'], ticker_symbol: 'GOOGL' },
  { id: 4, name: 'Amazon', aliases: ['Amazon.com Inc'], ticker_symbol: 'AMZN' },
  { id: 5, name: 'Tesla', aliases: ['Tesla Inc'], ticker_symbol: 'TSLA' },
  { id: 6, name: 'Meta', aliases: ['Meta Platforms Inc', 'Facebook'], ticker_symbol: 'META' },
  { id: 7, name: 'Netflix', aliases: ['Netflix Inc'], ticker_symbol: 'NFLX' },
  { id: 8, name: 'Spotify', aliases: ['Spotify Technology SA'], ticker_symbol: 'SPOT' },
  { id: 9, name: 'Uber', aliases: ['Uber Technologies Inc'], ticker_symbol: 'UBER' },
  { id: 10, name: 'Airbnb', aliases: ['Airbnb Inc'], ticker_symbol: 'ABNB' }
];

export const MOCK_NEWS_DATA: Record<string, NewsArticle[]> = {
  'apple': [
    {
      id: 'apple-1',
      title: 'Apple Unveils Revolutionary AI Features in Latest iOS Update',
      highlights: [
        'Apple introduces advanced AI-powered Siri capabilities with natural language processing',
        'New machine learning features enhance photo editing and organization',
        'Privacy-first approach ensures user data remains secure while using AI features'
      ],
      sourceUrl: 'https://example.com/apple-ai-update',
      sourceName: 'Tech News Daily',
      publishedAt: new Date('2024-01-15T10:30:00Z')
    },
    {
      id: 'apple-2',
      title: 'Apple Reports Record Q4 Earnings Driven by iPhone Sales',
      highlights: [
        'iPhone 15 series drives 12% increase in quarterly revenue',
        'Services division continues strong growth with 18% year-over-year increase',
        'Apple announces $90 billion share buyback program'
      ],
      sourceUrl: 'https://example.com/apple-earnings',
      sourceName: 'Financial Times',
      publishedAt: new Date('2024-01-12T14:20:00Z')
    },
    {
      id: 'apple-3',
      title: 'Apple Expands Manufacturing Operations in India',
      highlights: [
        'New manufacturing facility in Chennai will produce iPhone components',
        'Investment of $2 billion creates 10,000 new jobs in the region',
        'Part of Apple\'s strategy to diversify supply chain beyond China'
      ],
      sourceUrl: 'https://example.com/apple-india',
      sourceName: 'Reuters',
      publishedAt: new Date('2024-01-10T09:15:00Z')
    }
  ],
  'microsoft': [
    {
      id: 'microsoft-1',
      title: 'Microsoft Copilot Integration Transforms Office Productivity',
      highlights: [
        'AI-powered Copilot now available across all Microsoft 365 applications',
        'Users report 40% increase in productivity with automated document creation',
        'Enterprise customers show strong adoption with 85% satisfaction rate'
      ],
      sourceUrl: 'https://example.com/microsoft-copilot',
      sourceName: 'Business Insider',
      publishedAt: new Date('2024-01-14T11:45:00Z')
    },
    {
      id: 'microsoft-2',
      title: 'Microsoft Azure Achieves Carbon Negative Status Ahead of Schedule',
      highlights: [
        'Azure data centers now powered by 100% renewable energy',
        'Carbon capture technology removes more CO2 than operations produce',
        'Microsoft invests $1 billion in climate innovation fund'
      ],
      sourceUrl: 'https://example.com/microsoft-carbon',
      sourceName: 'Environmental Tech',
      publishedAt: new Date('2024-01-11T16:30:00Z')
    }
  ],
  'google': [
    {
      id: 'google-1',
      title: 'Google Bard AI Receives Major Update with Multimodal Capabilities',
      highlights: [
        'Bard can now process images, audio, and video alongside text',
        'Integration with Google Workspace enables seamless content creation',
        'New safety features prevent generation of harmful or biased content'
      ],
      sourceUrl: 'https://example.com/google-bard',
      sourceName: 'AI Weekly',
      publishedAt: new Date('2024-01-13T13:20:00Z')
    },
    {
      id: 'google-2',
      title: 'Google Cloud Announces Quantum Computing Breakthrough',
      highlights: [
        'New quantum processor achieves 99.9% fidelity in quantum operations',
        'Partnership with universities accelerates quantum research',
        'Commercial quantum computing services expected by 2025'
      ],
      sourceUrl: 'https://example.com/google-quantum',
      sourceName: 'Science Today',
      publishedAt: new Date('2024-01-09T08:45:00Z')
    }
  ],
  'tesla': [
    {
      id: 'tesla-1',
      title: 'Tesla Cybertruck Deliveries Begin with Strong Customer Response',
      highlights: [
        'First 1,000 Cybertruck units delivered to customers nationwide',
        'Advanced autopilot features receive positive safety ratings',
        'Production ramp-up targets 200,000 units annually by 2025'
      ],
      sourceUrl: 'https://example.com/tesla-cybertruck',
      sourceName: 'Auto News',
      publishedAt: new Date('2024-01-16T12:00:00Z')
    },
    {
      id: 'tesla-2',
      title: 'Tesla Supercharger Network Opens to All Electric Vehicles',
      highlights: [
        'Non-Tesla EVs can now access 15,000 Supercharger stations',
        'Universal charging adapter increases network utilization by 30%',
        'Tesla generates additional revenue stream from charging services'
      ],
      sourceUrl: 'https://example.com/tesla-supercharger',
      sourceName: 'Electric Vehicle Times',
      publishedAt: new Date('2024-01-08T15:30:00Z')
    }
  ],
  'amazon': [
    {
      id: 'amazon-1',
      title: 'Amazon Prime Air Drone Delivery Expands to 50 New Cities',
      highlights: [
        'Autonomous drones deliver packages within 30 minutes',
        'Advanced AI navigation ensures safe delivery in urban environments',
        'Customer satisfaction rate exceeds 95% for drone deliveries'
      ],
      sourceUrl: 'https://example.com/amazon-drones',
      sourceName: 'Logistics Today',
      publishedAt: new Date('2024-01-17T10:15:00Z')
    },
    {
      id: 'amazon-2',
      title: 'Amazon Web Services Launches New AI Development Platform',
      highlights: [
        'SageMaker Studio provides end-to-end machine learning workflow',
        'Pre-trained models reduce AI development time by 60%',
        'Enterprise customers can deploy AI solutions in days, not months'
      ],
      sourceUrl: 'https://example.com/amazon-ai-platform',
      sourceName: 'Cloud Computing News',
      publishedAt: new Date('2024-01-05T14:45:00Z')
    }
  ]
};

export const MOCK_SOCIAL_CONTENT: Record<string, SocialMediaContent> = {
  'apple': {
    linkedin: [
      {
        content: '🚀 Apple continues to lead innovation with groundbreaking AI features in iOS! The new Siri capabilities showcase how privacy-first AI can transform user experience while keeping data secure. Exciting times ahead for mobile technology! #Apple #AI #Innovation #Privacy',
        hashtags: ['#Apple', '#AI', '#Innovation', '#Privacy', '#iOS', '#Technology'],
        characterCount: 267
      },
      {
        content: '📈 Apple\'s Q4 earnings demonstrate the power of ecosystem integration. iPhone 15 success + Services growth = sustainable business model. The $90B buyback shows confidence in long-term value creation. #Apple #Earnings #iPhone #BusinessStrategy',
        hashtags: ['#Apple', '#Earnings', '#iPhone', '#BusinessStrategy', '#Technology'],
        characterCount: 245
      }
    ],
    twitter: [
      {
        content: '🍎 Apple\'s AI-powered iOS update is here! Privacy-first approach meets cutting-edge technology. The future of mobile AI looks bright! #Apple #AI #iOS',
        hashtags: ['#Apple', '#AI', '#iOS', '#Privacy', '#Innovation'],
        characterCount: 147
      },
      {
        content: '📊 Apple Q4: iPhone 15 📱 drives 12% revenue growth, Services up 18% YoY, $90B buyback announced. Strong ecosystem performance! #AAPL #Earnings',
        hashtags: ['#AAPL', '#Earnings', '#iPhone', '#Apple'],
        characterCount: 139
      }
    ],
    facebook: [
      {
        content: 'Apple is revolutionizing mobile AI with their latest iOS update! 🚀\n\nKey highlights:\n✅ Advanced Siri with natural language processing\n✅ AI-powered photo editing\n✅ Privacy-first approach\n\nThis shows how technology companies can innovate while respecting user privacy. What are your thoughts on AI in mobile devices?\n\n#Apple #AI #Innovation #Privacy #Technology',
        hashtags: ['#Apple', '#AI', '#Innovation', '#Privacy', '#Technology'],
        characterCount: 398
      }
    ],
    instagram: [
      {
        content: '🍎✨ Apple\'s new AI features are changing the game! \n\nSwipe to see:\n📱 Enhanced Siri capabilities\n🎨 AI photo editing magic\n🔒 Privacy-first innovation\n\nThe future is here and it\'s incredibly exciting! What Apple feature are you most excited about?\n\n#Apple #AI #Innovation #Technology #iOS #Privacy #Future',
        hashtags: ['#Apple', '#AI', '#Innovation', '#Technology', '#iOS', '#Privacy', '#Future'],
        characterCount: 312
      }
    ]
  },
  'microsoft': [
    {
      linkedin: [
        {
          content: '💼 Microsoft Copilot is transforming workplace productivity! With 40% productivity gains and 85% enterprise satisfaction, AI integration in Office 365 is proving its value. This is how AI should enhance human capabilities, not replace them. #Microsoft #AI #Productivity #Future',
          hashtags: ['#Microsoft', '#AI', '#Productivity', '#Copilot', '#Office365'],
          characterCount: 278
        }
      ],
      twitter: [
        {
          content: '🤖 Microsoft Copilot: 40% productivity boost, 85% satisfaction rate. AI that actually works! #Microsoft #Copilot #AI #Productivity',
          hashtags: ['#Microsoft', '#Copilot', '#AI', '#Productivity'],
          characterCount: 125
        }
      ],
      facebook: [
        {
          content: 'Microsoft is leading the AI productivity revolution! 🚀\n\nCopilot integration across Office 365 is delivering real results:\n📈 40% increase in productivity\n😊 85% customer satisfaction\n⚡ Automated document creation\n\nThis is how AI should work - enhancing human capabilities rather than replacing them. Have you tried Copilot yet?\n\n#Microsoft #AI #Productivity #Office365 #Innovation',
          hashtags: ['#Microsoft', '#AI', '#Productivity', '#Office365', '#Innovation'],
          characterCount: 425
        }
      ],
      instagram: [
        {
          content: '💻✨ Microsoft Copilot is changing how we work!\n\n📊 40% productivity boost\n😍 85% satisfaction rate\n🤖 AI-powered automation\n\nThe future of work is here and it\'s collaborative! How is AI changing your workflow?\n\n#Microsoft #Copilot #AI #Productivity #FutureOfWork #Innovation #Technology',
          hashtags: ['#Microsoft', '#Copilot', '#AI', '#Productivity', '#FutureOfWork', '#Innovation', '#Technology'],
          characterCount: 295
        }
      ]
    }
  ],
  'google': [
    {
      linkedin: [
        {
          content: '🧠 Google Bard\'s multimodal capabilities represent a significant leap in AI technology. Processing images, audio, and video alongside text opens new possibilities for content creation and analysis. The integration with Google Workspace will transform how we work with information. #Google #AI #Bard #Innovation',
          hashtags: ['#Google', '#AI', '#Bard', '#Innovation', '#Multimodal'],
          characterCount: 325
        }
      ],
      twitter: [
        {
          content: '🎯 Google Bard now handles images, audio, video + text! Multimodal AI is here and it\'s impressive. #Google #Bard #AI #Multimodal',
          hashtags: ['#Google', '#Bard', '#AI', '#Multimodal'],
          characterCount: 118
        }
      ],
      facebook: [
        {
          content: 'Google Bard just got a major upgrade! 🚀\n\nNew multimodal capabilities:\n🖼️ Image processing\n🎵 Audio analysis\n🎥 Video understanding\n📝 Text generation\n\nPlus seamless Google Workspace integration and enhanced safety features. This is the future of AI assistants!\n\nWhat would you use multimodal AI for?\n\n#Google #Bard #AI #Innovation #Technology',
          hashtags: ['#Google', '#Bard', '#AI', '#Innovation', '#Technology'],
          characterCount: 378
        }
      ],
      instagram: [
        {
          content: '🌟 Google Bard\'s new superpowers! \n\n✨ Processes images, audio, video\n🔗 Google Workspace integration\n🛡️ Enhanced safety features\n🎨 Creative content generation\n\nAI that understands everything! What creative project would you tackle with multimodal AI?\n\n#Google #Bard #AI #Multimodal #Innovation #Creative #Technology #Future',
          hashtags: ['#Google', '#Bard', '#AI', '#Multimodal', '#Innovation', '#Creative', '#Technology', '#Future'],
          characterCount: 335
        }
      ]
    }
  ],
  'tesla': [
    {
      linkedin: [
        {
          content: '⚡ Tesla Cybertruck deliveries mark a new era in electric vehicles. The combination of innovative design, advanced autopilot, and sustainable manufacturing shows how companies can disrupt traditional industries while building for the future. #Tesla #Cybertruck #Innovation #Sustainability',
          hashtags: ['#Tesla', '#Cybertruck', '#Innovation', '#Sustainability', '#ElectricVehicles'],
          characterCount: 298
        }
      ],
      twitter: [
        {
          content: '🚛⚡ Tesla Cybertruck deliveries begin! 1,000 units delivered, 200K annual target by 2025. The future of trucks is electric! #Tesla #Cybertruck',
          hashtags: ['#Tesla', '#Cybertruck', '#ElectricVehicles'],
          characterCount: 140
        }
      ],
      facebook: [
        {
          content: 'The Tesla Cybertruck is finally here! 🚛⚡\n\nDelivery highlights:\n✅ First 1,000 units delivered\n✅ Advanced autopilot features\n✅ Positive safety ratings\n✅ 200,000 annual production target\n\nThis isn\'t just a truck - it\'s a statement about the future of transportation. The unique design and cutting-edge technology are reshaping what we expect from vehicles.\n\nWould you drive a Cybertruck?\n\n#Tesla #Cybertruck #ElectricVehicles #Innovation #Future',
          hashtags: ['#Tesla', '#Cybertruck', '#ElectricVehicles', '#Innovation', '#Future'],
          characterCount: 485
        }
      ],
      instagram: [
        {
          content: '🚛⚡ Cybertruck era begins!\n\n🎯 1,000 delivered\n🤖 Advanced autopilot\n⭐ Great safety ratings\n📈 200K/year by 2025\n\nThe future of trucks is angular, electric, and absolutely revolutionary! What do you think of the Cybertruck design?\n\n#Tesla #Cybertruck #ElectricVehicles #Future #Innovation #Design #Technology #Sustainable',
          hashtags: ['#Tesla', '#Cybertruck', '#ElectricVehicles', '#Future', '#Innovation', '#Design', '#Technology', '#Sustainable'],
          characterCount: 345
        }
      ]
    }
  ],
  'amazon': [
    {
      linkedin: [
        {
          content: '🚁 Amazon Prime Air\'s expansion to 50 cities demonstrates the maturation of drone delivery technology. 30-minute delivery times and 95% customer satisfaction show how innovation can enhance customer experience while creating operational efficiency. #Amazon #Innovation #Logistics #Drones',
          hashtags: ['#Amazon', '#Innovation', '#Logistics', '#Drones', '#PrimeAir'],
          characterCount: 298
        }
      ],
      twitter: [
        {
          content: '📦🚁 Amazon Prime Air expands to 50 cities! 30-min drone delivery with 95% satisfaction. The future of logistics is airborne! #Amazon #Drones',
          hashtags: ['#Amazon', '#Drones', '#PrimeAir', '#Logistics'],
          characterCount: 135
        }
      ],
      facebook: [
        {
          content: 'Amazon Prime Air is taking flight! 🚁📦\n\nExpansion highlights:\n✈️ Now in 50 cities\n⏰ 30-minute delivery times\n🤖 AI-powered navigation\n😊 95% customer satisfaction\n\nThis technology is transforming how we think about delivery and logistics. Imagine getting your essentials delivered by drone in just 30 minutes!\n\nWould you trust a drone with your packages?\n\n#Amazon #PrimeAir #Drones #Innovation #Logistics #Future',
          hashtags: ['#Amazon', '#PrimeAir', '#Drones', '#Innovation', '#Logistics', '#Future'],
          characterCount: 445
        }
      ],
      instagram: [
        {
          content: '🚁✨ Amazon drones are everywhere!\n\n📍 50 new cities\n⚡ 30-minute delivery\n🎯 95% satisfaction\n🤖 AI navigation\n\nThe sky is literally the limit for delivery innovation! Have you seen a Prime Air drone in your neighborhood?\n\n#Amazon #PrimeAir #Drones #Delivery #Innovation #Technology #Future #Logistics #AI',
          hashtags: ['#Amazon', '#PrimeAir', '#Drones', '#Delivery', '#Innovation', '#Technology', '#Future', '#Logistics', '#AI'],
          characterCount: 315
        }
      ]
    }
  ]
};

// Helper function to search companies
export function searchMockCompanies(query: string): MockCompany[] {
  const lowercaseQuery = query.toLowerCase();
  return MOCK_COMPANIES.filter(company => 
    company.name.toLowerCase().includes(lowercaseQuery) ||
    company.aliases?.some(alias => alias.toLowerCase().includes(lowercaseQuery)) ||
    company.ticker_symbol?.toLowerCase().includes(lowercaseQuery)
  );
}

// Helper function to get company news
export function getMockCompanyNews(companyName: string): NewsArticle[] {
  const normalizedName = companyName.toLowerCase().replace(/\s+/g, '').replace(/inc|corp|corporation|ltd|limited/gi, '');
  
  // Try exact match first
  if (MOCK_NEWS_DATA[normalizedName]) {
    return MOCK_NEWS_DATA[normalizedName];
  }
  
  // Try partial matches
  for (const [key, articles] of Object.entries(MOCK_NEWS_DATA)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return articles;
    }
  }
  
  // Return empty array if no match found
  return [];
}

// Helper function to get social content
export function getMockSocialContent(companyName: string): SocialMediaContent | null {
  const normalizedName = companyName.toLowerCase().replace(/\s+/g, '').replace(/inc|corp|corporation|ltd|limited/gi, '');
  
  // Try exact match first
  if (MOCK_SOCIAL_CONTENT[normalizedName]) {
    return MOCK_SOCIAL_CONTENT[normalizedName];
  }
  
  // Try partial matches
  for (const [key, content] of Object.entries(MOCK_SOCIAL_CONTENT)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return content;
    }
  }
  
  return null;
}

// Simulate API delay for realistic testing
export function simulateApiDelay(min: number = 500, max: number = 1500): Promise<void> {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}