import React from 'react';

// Basic Information Display Component
export const BasicInfoDisplay = ({ profile }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
      <p className="text-white bg-gray-700 p-3 rounded-lg">
        {profile.name || 'Not set'}
      </p>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
      <p className="text-white bg-gray-700 p-3 rounded-lg">
        {profile.email || 'Not set'}
      </p>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">Age</label>
      <p className="text-white bg-gray-700 p-3 rounded-lg">
        {profile.age || 'Not set'}
      </p>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">Preferred Language</label>
      <p className="text-white bg-gray-700 p-3 rounded-lg">
        {profile.preferred_language || 'English'}
      </p>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">Education Level</label>
      <p className="text-white bg-gray-700 p-3 rounded-lg">
        {profile.education_level || 'Not set'}
      </p>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">Occupation</label>
      <p className="text-white bg-gray-700 p-3 rounded-lg">
        {profile.occupation || 'Not set'}
      </p>
    </div>
  </div>
);

// Basic Information Editor Component
export const BasicInfoEditor = ({ data, onChange }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
      <input
        type="text"
        value={data.name || ''}
        onChange={(e) => onChange('name', e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Enter your name"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
      <input
        type="email"
        value={data.email || ''}
        onChange={(e) => onChange('email', e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Enter your email"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
      <input
        type="number"
        value={data.age || ''}
        onChange={(e) => onChange('age', parseInt(e.target.value) || '')}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Enter your age"
        min="1"
        max="120"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Language</label>
      <select
        value={data.preferred_language || 'English'}
        onChange={(e) => onChange('preferred_language', e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="English">English</option>
        <option value="Spanish">Spanish</option>
        <option value="French">French</option>
        <option value="German">German</option>
        <option value="Chinese">Chinese</option>
        <option value="Japanese">Japanese</option>
        <option value="Other">Other</option>
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Education Level</label>
      <select
        value={data.education_level || ''}
        onChange={(e) => onChange('education_level', e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">Select education level</option>
        <option value="high-school">High School</option>
        <option value="undergraduate-1">Undergraduate Year 1</option>
        <option value="undergraduate-2">Undergraduate Year 2</option>
        <option value="undergraduate-3">Undergraduate Year 3</option>
        <option value="undergraduate-4">Undergraduate Year 4</option>
        <option value="graduate">Graduate/Masters</option>
        <option value="phd">PhD</option>
        <option value="professional">Professional</option>
        <option value="self-taught">Self-taught</option>
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Occupation</label>
      <input
        type="text"
        value={data.occupation || ''}
        onChange={(e) => onChange('occupation', e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Enter your occupation"
      />
    </div>
  </div>
);

// Learning Preferences Display Component
export const LearningPrefsDisplay = ({ profile }) => {
  const formatLearningStyle = (styles) => {
    if (Array.isArray(styles)) {
      return styles.join(', ') || 'Not set';
    }
    if (typeof styles === 'string') {
      try {
        const parsed = JSON.parse(styles);
        return Array.isArray(parsed) ? parsed.join(', ') : styles;
      } catch {
        return styles;
      }
    }
    return 'Not set';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Learning Style</label>
        <p className="text-white bg-gray-700 p-3 rounded-lg">
          {formatLearningStyle(profile.learning_style)}
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Preferred Mode</label>
        <p className="text-white bg-gray-700 p-3 rounded-lg capitalize">
          {profile.preferred_mode || 'Not set'}
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Daily Learning Time</label>
        <p className="text-white bg-gray-700 p-3 rounded-lg">
          {profile.daily_time || 'Not set'}
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Difficulty Level</label>
        <p className="text-white bg-gray-700 p-3 rounded-lg capitalize">
          {profile.preferred_difficulty || 'Not set'}
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Text Size</label>
        <p className="text-white bg-gray-700 p-3 rounded-lg capitalize">
          {profile.text_size || 'Medium'}
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Visual Mode</label>
        <p className="text-white bg-gray-700 p-3 rounded-lg capitalize">
          {profile.visual_mode || 'Dark'}
        </p>
      </div>
    </div>
  );
};

// Learning Preferences Editor Component
export const LearningPrefsEditor = ({ data, onChange }) => {
  const handleLearningStyleChange = (style) => {
    const currentStyles = Array.isArray(data.learning_style) ? data.learning_style : [];
    const updatedStyles = currentStyles.includes(style)
      ? currentStyles.filter(s => s !== style)
      : [...currentStyles, style];
    onChange('learning_style', updatedStyles);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Learning Style (Select all that apply)</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {['visual', 'auditory', 'kinesthetic', 'reading'].map(style => (
            <label key={style} className="flex items-center space-x-2 text-white">
              <input
                type="checkbox"
                checked={Array.isArray(data.learning_style) && data.learning_style.includes(style)}
                onChange={() => handleLearningStyleChange(style)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="capitalize">{style}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Mode</label>
          <select
            value={data.preferred_mode || 'both'}
            onChange={(e) => onChange('preferred_mode', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="text">Text Only</option>
            <option value="voice">Voice Only</option>
            <option value="both">Both Text & Voice</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Daily Learning Time</label>
          <select
            value={data.daily_time || '30min'}
            onChange={(e) => onChange('daily_time', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="15min">15 minutes</option>
            <option value="30min">30 minutes</option>
            <option value="45min">45 minutes</option>
            <option value="1hr">1 hour</option>
            <option value="2hr">2+ hours</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty Level</label>
          <select
            value={data.preferred_difficulty || 'medium'}
            onChange={(e) => onChange('preferred_difficulty', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Text Size</label>
          <select
            value={data.text_size || 'medium'}
            onChange={(e) => onChange('text_size', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Visual Mode</label>
          <select
            value={data.visual_mode || 'dark'}
            onChange={(e) => onChange('visual_mode', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="dyslexic">Dyslexic-friendly</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Sound Effects</label>
          <label className="flex items-center space-x-2 text-white">
            <input
              type="checkbox"
              checked={data.enable_sound !== false}
              onChange={(e) => onChange('enable_sound', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span>Enable sound effects</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default {
  BasicInfoDisplay,
  BasicInfoEditor,
  LearningPrefsDisplay,
  LearningPrefsEditor
};
