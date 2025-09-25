import React, { useState } from 'react';

// Interests & Goals Display Component
export const InterestsDisplay = ({ profile }) => {
  const formatTopics = (topics) => {
    if (Array.isArray(topics)) {
      return topics.length > 0 ? topics.join(', ') : 'Not set';
    }
    if (typeof topics === 'string') {
      try {
        const parsed = JSON.parse(topics);
        return Array.isArray(parsed) ? parsed.join(', ') : topics;
      } catch {
        return topics;
      }
    }
    return 'Not set';
  };

  const formatGoals = (goals) => {
    if (Array.isArray(goals)) {
      return goals.length > 0 ? goals.map(goal => typeof goal === 'object' ? goal.text : goal).join(', ') : 'Not set';
    }
    if (typeof goals === 'string') {
      try {
        const parsed = JSON.parse(goals);
        return Array.isArray(parsed) ? parsed.map(goal => typeof goal === 'object' ? goal.text : goal).join(', ') : goals;
      } catch {
        return goals;
      }
    }
    return 'Not set';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Current Goal</label>
        <p className="text-white bg-gray-700 p-3 rounded-lg">
          {profile.current_goal || 'Not set'}
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Primary Reason</label>
        <p className="text-white bg-gray-700 p-3 rounded-lg">
          {profile.primary_reason || 'Not set'}
        </p>
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-300 mb-1">Topics of Interest</label>
        <p className="text-white bg-gray-700 p-3 rounded-lg">
          {formatTopics(profile.topics_of_interest)}
        </p>
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-300 mb-1">Learning Goals</label>
        <p className="text-white bg-gray-700 p-3 rounded-lg">
          {formatGoals(profile.learning_goals)}
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Time Available (per week)</label>
        <p className="text-white bg-gray-700 p-3 rounded-lg">
          {profile.time_available || 'Not set'} hours
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Target Deadline</label>
        <p className="text-white bg-gray-700 p-3 rounded-lg">
          {profile.target_deadline || 'Not set'}
        </p>
      </div>
      {profile.motivation && (
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">Motivation</label>
          <p className="text-white bg-gray-700 p-3 rounded-lg">
            {profile.motivation}
          </p>
        </div>
      )}
    </div>
  );
};

// Interests & Goals Editor Component
export const InterestsEditor = ({ data, onChange }) => {
  const [newTopic, setNewTopic] = useState('');
  const [newGoal, setNewGoal] = useState('');

  const topicOptions = [
    { id: 'dsa', label: 'Data Structures & Algorithms' },
    { id: 'web', label: 'Web Development' },
    { id: 'mobile', label: 'Mobile Development' },
    { id: 'aiml', label: 'AI/Machine Learning' },
    { id: 'db', label: 'Databases' },
    { id: 'networks', label: 'Computer Networks' },
    { id: 'os', label: 'Operating Systems' },
    { id: 'security', label: 'Cybersecurity' },
    { id: 'cloud', label: 'Cloud Computing' },
    { id: 'devops', label: 'DevOps' }
  ];

  const handleTopicChange = (topicId) => {
    const currentTopics = Array.isArray(data.topics_of_interest) ? data.topics_of_interest : [];
    const updatedTopics = currentTopics.includes(topicId)
      ? currentTopics.filter(t => t !== topicId)
      : [...currentTopics, topicId];
    onChange('topics_of_interest', updatedTopics);
  };

  const handleAddCustomTopic = () => {
    if (newTopic.trim()) {
      const currentTopics = Array.isArray(data.topics_of_interest) ? data.topics_of_interest : [];
      onChange('topics_of_interest', [...currentTopics, newTopic.trim()]);
      setNewTopic('');
    }
  };

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      const currentGoals = Array.isArray(data.learning_goals) ? data.learning_goals : [];
      const goalObj = {
        id: Date.now(),
        text: newGoal.trim(),
        created: new Date().toISOString(),
        completed: false,
        progress: 0
      };
      onChange('learning_goals', [...currentGoals, goalObj]);
      setNewGoal('');
    }
  };

  const handleRemoveGoal = (goalId) => {
    const currentGoals = Array.isArray(data.learning_goals) ? data.learning_goals : [];
    const updatedGoals = currentGoals.filter(goal => 
      (typeof goal === 'object' ? goal.id : goal) !== goalId
    );
    onChange('learning_goals', updatedGoals);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Current Main Goal</label>
          <input
            type="text"
            value={data.current_goal || ''}
            onChange={(e) => onChange('current_goal', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="What's your main learning goal?"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Primary Reason for Learning</label>
          <select
            value={data.primary_reason || ''}
            onChange={(e) => onChange('primary_reason', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select reason</option>
            <option value="career">Career advancement</option>
            <option value="placement">Job placement</option>
            <option value="academics">Academic requirements</option>
            <option value="hobby">Personal interest/hobby</option>
            <option value="startup">Starting a business</option>
            <option value="switching">Career change</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Time Available (per week)</label>
          <select
            value={data.time_available || '1-3'}
            onChange={(e) => onChange('time_available', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1-3">1-3 hours</option>
            <option value="4-6">4-6 hours</option>
            <option value="7-10">7-10 hours</option>
            <option value="10+">10+ hours</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Target Deadline</label>
          <input
            type="date"
            value={data.target_deadline || ''}
            onChange={(e) => onChange('target_deadline', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Topics of Interest</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
          {topicOptions.map(topic => (
            <label key={topic.id} className="flex items-center space-x-2 text-white">
              <input
                type="checkbox"
                checked={Array.isArray(data.topics_of_interest) && data.topics_of_interest.includes(topic.id)}
                onChange={() => handleTopicChange(topic.id)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm">{topic.label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add custom topic"
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTopic()}
          />
          <button
            onClick={handleAddCustomTopic}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Learning Goals</label>
        <div className="space-y-2 mb-3">
          {Array.isArray(data.learning_goals) && data.learning_goals.map((goal, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
              <span className="text-white">{typeof goal === 'object' ? goal.text : goal}</span>
              <button
                onClick={() => handleRemoveGoal(typeof goal === 'object' ? goal.id : goal)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add a learning goal"
            onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()}
          />
          <button
            onClick={handleAddGoal}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Add Goal
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Motivation (Optional)</label>
        <textarea
          value={data.motivation || ''}
          onChange={(e) => onChange('motivation', e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="What motivates you to learn?"
          rows="3"
        />
      </div>
    </div>
  );
};

// Skills & Confidence Display Component
export const SkillsDisplay = ({ profile }) => {
  const formatSkills = (skills) => {
    if (Array.isArray(skills)) {
      return skills.length > 0 ? skills.join(', ') : 'Not set';
    }
    if (typeof skills === 'string') {
      try {
        const parsed = JSON.parse(skills);
        return Array.isArray(parsed) ? parsed.join(', ') : skills;
      } catch {
        return skills;
      }
    }
    return 'Not set';
  };

  const formatPlatforms = (platforms) => {
    if (Array.isArray(platforms)) {
      return platforms.length > 0 ? platforms.join(', ') : 'Not set';
    }
    if (typeof platforms === 'string') {
      try {
        const parsed = JSON.parse(platforms);
        return Array.isArray(parsed) ? parsed.join(', ') : platforms;
      } catch {
        return platforms;
      }
    }
    return 'Not set';
  };

  const getConfidenceLevels = () => {
    const levels = profile.confidence_levels;
    if (typeof levels === 'object' && levels !== null) {
      return Object.entries(levels);
    }
    if (typeof levels === 'string') {
      try {
        const parsed = JSON.parse(levels);
        return Object.entries(parsed);
      } catch {
        return [];
      }
    }
    return [];
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Experience Level</label>
          <p className="text-white bg-gray-700 p-3 rounded-lg capitalize">
            {profile.experience_level || 'Not set'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Current Skills</label>
          <p className="text-white bg-gray-700 p-3 rounded-lg">
            {formatSkills(profile.current_skills)}
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Previous Learning Platforms</label>
        <p className="text-white bg-gray-700 p-3 rounded-lg">
          {formatPlatforms(profile.previous_platforms)}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Subject Confidence Levels</label>
        {getConfidenceLevels().length > 0 ? (
          <div className="space-y-2">
            {getConfidenceLevels().map(([subject, level]) => (
              <div key={subject} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
                <span className="text-white font-medium">{subject}</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  level === 'high' ? 'bg-green-600 text-white' :
                  level === 'medium' ? 'bg-yellow-600 text-white' :
                  'bg-red-600 text-white'
                }`}>
                  {level}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white bg-gray-700 p-3 rounded-lg">Not set</p>
        )}
      </div>
    </div>
  );
};

// Skills & Confidence Editor Component
export const SkillsEditor = ({ data, onChange }) => {
  const [newSkill, setNewSkill] = useState('');

  const skillOptions = [
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go',
    'React', 'Vue.js', 'Angular', 'Node.js', 'Express', 'Django', 'Flask',
    'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
    'Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Linux'
  ];

  const platformOptions = [
    'Codecademy', 'Coursera', 'edX', 'Udemy', 'Khan Academy', 
    'freeCodeCamp', 'GeeksforGeeks', 'LeetCode', 'HackerRank',
    'Pluralsight', 'LinkedIn Learning', 'YouTube', 'Books', 'Self-taught'
  ];

  const subjectOptions = [
    'Data Structures & Algorithms', 'Operating Systems', 'Database Management',
    'Computer Networks', 'Object Oriented Programming', 'Software Engineering',
    'Machine Learning', 'Web Development', 'Mobile Development', 'Cybersecurity'
  ];

  const handleSkillChange = (skill) => {
    const currentSkills = Array.isArray(data.current_skills) ? data.current_skills : [];
    const updatedSkills = currentSkills.includes(skill)
      ? currentSkills.filter(s => s !== skill)
      : [...currentSkills, skill];
    onChange('current_skills', updatedSkills);
  };

  const handlePlatformChange = (platform) => {
    const currentPlatforms = Array.isArray(data.previous_platforms) ? data.previous_platforms : [];
    const updatedPlatforms = currentPlatforms.includes(platform)
      ? currentPlatforms.filter(p => p !== platform)
      : [...currentPlatforms, platform];
    onChange('previous_platforms', updatedPlatforms);
  };

  const handleConfidenceChange = (subject, level) => {
    const currentLevels = data.confidence_levels || {};
    onChange('confidence_levels', {
      ...currentLevels,
      [subject]: level
    });
  };

  const handleAddCustomSkill = () => {
    if (newSkill.trim()) {
      const currentSkills = Array.isArray(data.current_skills) ? data.current_skills : [];
      onChange('current_skills', [...currentSkills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Experience Level</label>
        <select
          value={data.experience_level || 'beginner'}
          onChange={(e) => onChange('experience_level', e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Current Skills</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
          {skillOptions.map(skill => (
            <label key={skill} className="flex items-center space-x-2 text-white">
              <input
                type="checkbox"
                checked={Array.isArray(data.current_skills) && data.current_skills.includes(skill)}
                onChange={() => handleSkillChange(skill)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm">{skill}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add custom skill"
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSkill()}
          />
          <button
            onClick={handleAddCustomSkill}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Previous Learning Platforms</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {platformOptions.map(platform => (
            <label key={platform} className="flex items-center space-x-2 text-white">
              <input
                type="checkbox"
                checked={Array.isArray(data.previous_platforms) && data.previous_platforms.includes(platform)}
                onChange={() => handlePlatformChange(platform)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm">{platform}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Subject Confidence Levels</label>
        <div className="space-y-3">
          {subjectOptions.map(subject => (
            <div key={subject} className="flex flex-col md:flex-row md:items-center justify-between bg-gray-700 p-3 rounded-lg gap-2">
              <span className="text-white font-medium">{subject}</span>
              <div className="flex gap-2">
                {['low', 'medium', 'high'].map(level => (
                  <label key={level} className="flex items-center space-x-1">
                    <input
                      type="radio"
                      name={`confidence-${subject}`}
                      value={level}
                      checked={(data.confidence_levels || {})[subject] === level}
                      onChange={() => handleConfidenceChange(subject, level)}
                      className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 focus:ring-blue-500"
                    />
                    <span className={`text-sm capitalize ${
                      level === 'high' ? 'text-green-400' :
                      level === 'medium' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {level}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default {
  InterestsDisplay,
  InterestsEditor,
  SkillsDisplay,
  SkillsEditor
};
