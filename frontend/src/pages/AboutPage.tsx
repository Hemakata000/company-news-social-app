import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          About Company News Social
        </h1>
        
        <div className="prose prose-lg text-gray-700">
          <p className="mb-4">
            Company News Social is a productivity tool designed for professionals who need to stay 
            informed about companies and create engaging social media content quickly and efficiently.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-8">
            Key Features
          </h2>
          
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>Search for the latest news about any company</li>
            <li>Get AI-generated highlights from news articles</li>
            <li>Generate LinkedIn-ready social media captions</li>
            <li>Create platform-specific content for Twitter, Facebook, and Instagram</li>
            <li>One-click copy functionality for easy sharing</li>
            <li>Access to original news sources for verification</li>
          </ul>
          
          <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-8">
            How It Works
          </h2>
          
          <ol className="list-decimal list-inside space-y-2 mb-6">
            <li>Enter a company name in the search field</li>
            <li>Our system fetches the latest news from multiple sources</li>
            <li>AI extracts key highlights from the articles</li>
            <li>Platform-specific social media content is generated</li>
            <li>Copy and share the content across your social networks</li>
          </ol>
          
          <p className="text-sm text-gray-500 mt-8">
            Built with React, TypeScript, and powered by AI content generation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;