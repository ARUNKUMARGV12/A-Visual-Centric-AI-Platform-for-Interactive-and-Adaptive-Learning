import React, { useState } from 'react';
import { useLearningTracker } from '../contexts/LearningTracker';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useAuth } from '../contexts/AuthContext';

const KnowledgeGames = () => {
  const { trackLearningActivity } = useLearningTracker();
  const { updateTopicProgress, markWeakTopic } = useUserProfile();
  const { userProfile } = useAuth();
  const [games, setGames] = useState([
    { 
      id: 'ak01', 
      name: 'Knowledge Quiz Game', 
      description: 'Test your understanding with interactive quiz questions',
      imageUrl: 'http://localhost:8000/static/game-thumbnails/quiz-game.png',
      path: '/launch-ak01-game'
    },
    { 
      id: 'ak02', 
      name: 'Challenge Puzzles', 
      description: 'Solve puzzles related to concepts you\'ve learned',
      imageUrl: 'http://localhost:8000/static/game-thumbnails/puzzle-game.png',
      path: '/games/ak02/'
    },
    { 
      id: 'speed-racer', 
      name: 'Speed Racer Challenge', 
      description: 'Answer questions correctly to speed up your car and win the race!',
      imageUrl: 'http://localhost:8000/static/game-thumbnails/racing-game.png',
      path: '/launch-speed-racer-game'
    },
    {
      id: 'memory-match',
      name: 'Memory Match',
      description: 'Match questions with their answers in this memory-testing game',
      imageUrl: 'http://localhost:8000/static/game-thumbnails/memory-match.png',
      path: '/games/memory-match/'
    }
  ]);

  const [activeGame, setActiveGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showQuizGenerator, setShowQuizGenerator] = useState(false);
  const [quizGameIdToLaunch, setQuizGameIdToLaunch] = useState(null);
  const [quizTopic, setQuizTopic] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState('medium');
  const [quizType, setQuizType] = useState('multiple_choice');
  const [numQuestions, setNumQuestions] = useState(5);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);

  const launchGame = async (gameId) => {
    setLoading(true); // Start loading
    const game = games.find(g => g.id === gameId);
    if (!game) {
      console.error("Game not found:", gameId);
      setLoading(false); // Stop loading
      return;
    }

    // Define quiz parameters - can make this dynamic later
    const quizParams = {
      topic: game.name, // Use game name as topic for now
      difficulty: 'medium', // Default difficulty
      num_questions: 5, // Default number of questions
      question_type: 'multiple_choice', // Default type
    };

    try {
      // First, generate and store the quiz via the backend endpoint
      console.log(`Generating quiz for ${game.name} (${game.id}) with params:`, quizParams);
      const generateQuizResponse = await fetch(`http://localhost:8000/generate-game-quiz/${game.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizParams),
      });

      if (!generateQuizResponse.ok) {
        const errorData = await generateQuizResponse.json();
        throw new Error(`Failed to generate quiz: ${generateQuizResponse.status} ${generateQuizResponse.statusText} - ${errorData.detail || JSON.stringify(errorData)}`);
      }

      const generateQuizResult = await generateQuizResponse.json();
      console.log('Quiz generation successful:', generateQuizResult);

      // Now, decide how to launch based on game type
      if (game.id === 'ak02') {
         // For the HTML game (ak02), append the gameId as a query parameter and open in a new tab
         let gameUrl = `http://localhost:8000${game.path}?gameId=${game.id}`;
         console.log("Opening HTML game URL with query param in new tab:", gameUrl);
         window.open(gameUrl, '_blank');
      } else {
         // For Python games (ak01, speed-racer), call the backend launch endpoint
         // The game will run on the server's display, not in the browser.
         console.log(`Calling backend launch endpoint for Python game: http://localhost:8000${game.path}`);
         // We already made the POST request to generate the quiz above.
         // The backend GET endpoint /launch-game-id simply triggers the subprocess launch.
         // Make a GET request to the launch endpoint to trigger the game on the server.
         const launchResponse = await fetch(`http://localhost:8000${game.path}`);
         if (!launchResponse.ok) {
             const errorData = await launchResponse.json();
             throw new Error(`Failed to launch game on server: ${launchResponse.status} ${launchResponse.statusText} - ${errorData.detail || JSON.stringify(errorData)}`);
         }
         const launchResult = await launchResponse.json();
         console.log('Game launch triggered on server:', launchResult);
         // Optionally show a message to the user that the game launched on the server
         alert(`Launching ${game.name} on the server's display. Check the server console/display.`);
      }

    } catch (error) {
      console.error('Error launching game or generating quiz:', error);
      alert(`Failed to launch game or generate quiz:\n${error.message}`); // Show an alert to the user
    } finally {
      setLoading(false); // Stop loading regardless of success or failure
    }
  };

  const generateQuiz = async (e) => {
    e.preventDefault();
    setQuizLoading(true);
    setQuizError('');
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setShowExplanation(false);
    setQuizScore(0);
    setQuizCompleted(false);
    setUserAnswers([]);

    try {
      const response = await fetch('http://localhost:8000/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: quizTopic,
          difficulty: quizDifficulty,
          num_questions: parseInt(numQuestions),
          question_type: quizType,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.questions && data.questions.length > 0) {
        setQuizQuestions(data.questions);
        // Initialize user answers array with empty values
        setUserAnswers(Array(data.questions.length).fill(''));
        setShowQuizGenerator(false); // Hide the form and show the quiz
      } else {
        setQuizError('No questions were generated. Please try a different topic.');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      setQuizError('Failed to generate quiz. Please try again later.');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    // Save the user's answer
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentQuestionIndex] = selectedAnswer;
    setUserAnswers(updatedAnswers);

    // Check if answer is correct and update score
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    if (isCorrect) {
      setQuizScore(prevScore => prevScore + currentQuestion.points);
    } else {
      // Mark topic as weak if user gets it wrong
      if (updateTopicProgress && markWeakTopic) {
        const topic = quizTopic.toLowerCase();
        markWeakTopic(topic);
      }
    }

    // Track quiz interaction with enhanced metadata
    trackLearningActivity(`quiz_question_answered: ${isCorrect ? 'correct' : 'incorrect'}`, 
      isCorrect ? 0.8 : 0.3, 
      { 
        topic: quizTopic,
        question: currentQuestion.question,
        correctAnswer: currentQuestion.correct_answer,
        userAnswer: selectedAnswer,
        isCorrect,
        difficulty: quizDifficulty,
        concepts: [quizTopic],
        skills: ['problem-solving', 'knowledge-recall']
      }
    );

    // Update topic progress if user profile is available
    if (updateTopicProgress) {
      const score = isCorrect ? 100 : 0;
      updateTopicProgress(quizTopic.toLowerCase(), score);
    }

    // Reset for next question
    setSelectedAnswer('');
    setShowExplanation(false);

    // Move to next question or complete quiz
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizCompleted(true);
      // Track quiz completion with comprehensive data
      const totalCorrect = userAnswers.filter((answer, index) => answer === quizQuestions[index].correct_answer).length;
      const completionScore = (totalCorrect / quizQuestions.length) * 100;
      
      trackLearningActivity('quiz_completed', 0.9, {
        topic: quizTopic,
        totalQuestions: quizQuestions.length,
        correctAnswers: totalCorrect,
        finalScore: quizScore,
        completionScore,
        difficulty: quizDifficulty,
        concepts: [quizTopic],
        skills: ['problem-solving', 'knowledge-retention', 'test-taking']
      });

      // Update overall topic progress
      if (updateTopicProgress) {
        updateTopicProgress(quizTopic.toLowerCase(), completionScore);
      }
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setShowExplanation(false);
    setQuizScore(0);
    setQuizCompleted(false);
    setUserAnswers(Array(quizQuestions.length).fill(''));
  };

  const createNewQuiz = () => {
    setShowQuizGenerator(true);
    setQuizQuestions([]);
    setQuizCompleted(false);
  };

  // Function to handle clicking a game card - shows the quiz config form
  const handleGameCardClick = (gameId) => {
    const game = games.find(g => g.id === gameId);
    if (game) {
      // Track game interaction with enhanced data
      trackLearningActivity(`game_started: ${game.name}`, 0.7, {
        gameId,
        gameName: game.name,
        gameType: 'knowledge-game',
        concepts: [game.name.toLowerCase()],
        skills: ['gaming', 'interactive-learning']
      });
      
      setQuizGameIdToLaunch(gameId); // Set which game is being launched
      setQuizTopic(game.name); // Pre-fill topic with game name
      setShowQuizGenerator(true); // Show the quiz configuration form
      // Reset other quiz states if necessary
      setQuizError('');
      setQuizLoading(false);
    }
  };

  // Function to generate quiz and launch the game
  const generateGameQuizAndLaunch = async (e) => {
    e.preventDefault();
    if (!quizGameIdToLaunch) return; // Should not happen if triggered from form

    setQuizLoading(true); // Indicate loading
    setQuizError('');
    setLoading(true); // Also set main loading state

    const game = games.find(g => g.id === quizGameIdToLaunch);
    if (!game) {
      console.error("Game not found for launch:", quizGameIdToLaunch);
      setQuizLoading(false);
      setLoading(false);
      setQuizGameIdToLaunch(null); // Reset
      setShowQuizGenerator(false); // Hide form
      return;
    }

    const quizParams = {
      topic: quizTopic, // Use topic from the form
      difficulty: quizDifficulty, // Use difficulty from the form
      num_questions: parseInt(numQuestions), // Use num questions from the form
      question_type: quizType, // Use question type from the form
    };

    try {
      // First, generate and store the quiz via the backend endpoint
      console.log(`Generating quiz for ${game.name} (${game.id}) with params:`, quizParams);
      const generateQuizResponse = await fetch(`http://localhost:8000/generate-game-quiz/${game.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizParams),
      });

     if (!generateQuizResponse.ok) {
       const errorData = await generateQuizResponse.json();
       throw new Error(`Failed to generate quiz: ${generateQuizResponse.status} ${generateQuizResponse.statusText} - ${errorData.detail || JSON.stringify(errorData)}`);
     }

     const generateQuizResult = await generateQuizResponse.json();
     console.log('Game Quiz generation successful:', generateQuizResult);

     // Now, decide how to launch based on game type
     if (game.id === 'ak02') {
        // For the HTML game (ak02), append the gameId as a query parameter and open in a new tab
        let gameUrl = `http://localhost:8000${game.path}?gameId=${game.id}`;
        console.log("Opening HTML game URL with query param in new tab:", gameUrl);
        window.open(gameUrl, '_blank');
     } else {
        // For Python games (ak01, speed-racer), call the backend launch endpoint
        // The game will run on the server's display, not in the browser.
        console.log(`Calling backend launch endpoint for Python game: http://localhost:8000${game.path}`);
        // Make a GET request to the launch endpoint to trigger the game on the server.
        const launchResponse = await fetch(`http://localhost:8000${game.path}`);
        if (!launchResponse.ok) {
            const errorData = await launchResponse.json();
            throw new Error(`Failed to launch game on server: ${launchResponse.status} ${launchResponse.statusText} - ${errorData.detail || JSON.stringify(errorData)}`);
        }
        const launchResult = await launchResponse.json();
        console.log('Game launch triggered on server:', launchResult);
        // Optionally show a message to the user that the game launched on the server
        alert(`Launching ${game.name} on the server's display. Check the server console/display.`);
     }

     // Reset game quiz launch state and hide form
     setQuizGameIdToLaunch(null);
     setShowQuizGenerator(false);

   } catch (error) {
     console.error('Error generating game quiz or launching game:', error);
     setQuizError(`Failed to generate quiz or launch game:\n${error.message}`); // Show error in the form
   } finally {
     setQuizLoading(false); // Stop quiz loading
     setLoading(false); // Stop main loading
   }
 };

  return (
    <div className="games-container bg-background min-h-screen text-primary p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Test Your Knowledge</h1>
          <p className="text-secondary">
            Play these interactive games to test your understanding and reinforce what you've learned.
          </p>
        </div>

        {activeGame ? (
          <div className="game-player bg-card rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {games.find(g => g.id === activeGame)?.name || 'Game'}
              </h2>
              <button 
                onClick={() => setActiveGame(null)}
                className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded"
              >
                Back to Games
              </button>
            </div>
            <div className="game-frame-container bg-black rounded-lg overflow-hidden h-[600px] relative">
              {/* This iframe will now load the game from the backend */}
              <iframe 
                src={`http://localhost:8000${games.find(g => g.id === activeGame)?.path}`}
                title={games.find(g => g.id === activeGame)?.name}
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>
          </div>
        ) : quizQuestions.length > 0 ? (
          <div className="quiz-container bg-card rounded-lg p-6 shadow-lg">
            {quizCompleted ? (
              <div className="quiz-results">
                <h2 className="text-2xl font-bold mb-4">Quiz Results</h2>
                <div className="bg-hover rounded-lg p-4 mb-6">
                  <div className="text-center mb-4">
                    <p className="text-3xl font-bold text-brand">{quizScore} points</p>
                    <p className="text-secondary">
                      You answered {userAnswers.filter((answer, index) => answer === quizQuestions[index].correct_answer).length} 
                      out of {quizQuestions.length} questions correctly!
                    </p>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3">Question Summary:</h3>
                  {quizQuestions.map((question, index) => (
                    <div key={index} className={`mb-4 p-3 rounded-md ${
                      userAnswers[index] === question.correct_answer 
                        ? 'bg-green-800/30 border border-green-600' 
                        : 'bg-red-800/30 border border-red-600'
                    }`}>
                      <p className="font-medium">{index + 1}. {question.question}</p>
                      <p className="mt-1">
                        <span className="text-secondary">Your answer: </span>
                        <span className={userAnswers[index] === question.correct_answer ? 'text-green-400' : 'text-red-400'}>
                          {userAnswers[index] || 'No answer'}
                        </span>
                      </p>
                      <p className="mt-1">
                        <span className="text-secondary">Correct answer: </span>
                        <span className="text-green-400">{question.correct_answer}</span>
                      </p>
                      <p className="mt-2 text-gray-300 text-sm italic">{question.explanation}</p>
                    </div>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={restartQuiz} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
                  >
                    Restart Quiz
                  </button>
                  <button 
                    onClick={createNewQuiz} 
                    className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded"
                  >
                    Create New Quiz
                  </button>
                </div>
              </div>
            ) : (
              <div className="quiz-question">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Quiz: {quizTopic}</h2>
                  <div className="text-sm">
                    Question {currentQuestionIndex + 1} of {quizQuestions.length}
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="question-container mb-6">
                  <p className="text-lg mb-4">{quizQuestions[currentQuestionIndex].question}</p>
                  
                  <div className="options-container space-y-3">
                    {quizQuestions[currentQuestionIndex].options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(option)}
                        className={`block w-full text-left p-3 rounded-md border transition-colors ${
                          selectedAnswer === option
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                
                {showExplanation && (
                  <div className="explanation bg-gray-700 p-4 rounded-md mb-4">
                    <h3 className="font-medium mb-1">Explanation:</h3>
                    <p className="text-gray-300">{quizQuestions[currentQuestionIndex].explanation}</p>
                  </div>
                )}
                
                <div className="flex justify-between">
                  {selectedAnswer && !showExplanation && (
                    <button
                      onClick={() => setShowExplanation(true)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                    >
                      Show Explanation
                    </button>
                  )}
                  <div className="ml-auto">
                    <button
                      onClick={handleNextQuestion}
                      disabled={!selectedAnswer}
                      className={`px-6 py-2 rounded ${
                        selectedAnswer 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Complete Quiz'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : showQuizGenerator ? (
          <div className="quiz-generator bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Create Your Own Quiz</h2>
            <p className="text-gray-300 mb-4">
              Generate a personalized quiz on any topic to test your knowledge.
            </p>
            
            {quizError && (
              <div className="bg-red-900/30 border border-red-600 text-red-200 p-3 rounded-md mb-4">
                {quizError}
              </div>
            )}
            
            <form onSubmit={generateGameQuizAndLaunch} className="space-y-4">
              <div>
                <label htmlFor="quizTopic" className="block text-sm font-medium mb-1">
                  Topic or Subject
                </label>
                <input
                  id="quizTopic"
                  type="text"
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  placeholder="e.g. JavaScript Fundamentals, Quantum Physics, Machine Learning"
                  className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="quizDifficulty" className="block text-sm font-medium mb-1">
                    Difficulty
                  </label>
                  <select
                    id="quizDifficulty"
                    value={quizDifficulty}
                    onChange={(e) => setQuizDifficulty(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="quizType" className="block text-sm font-medium mb-1">
                    Question Type
                  </label>
                  <select
                    id="quizType"
                    value={quizType}
                    onChange={(e) => setQuizType(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="numQuestions" className="block text-sm font-medium mb-1">
                    Number of Questions
                  </label>
                  <select
                    id="numQuestions"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="3">3</option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setShowQuizGenerator(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded flex items-center"
                  disabled={quizLoading || !quizTopic.trim()}
                >
                  {quizLoading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {quizLoading ? 'Generating...' : 'Generate Quiz'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Available Games</h2>
              <button
                onClick={() => setShowQuizGenerator(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Create Quiz
              </button>
            </div>
            
            <div className="games-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <div 
                  key={game.id} 
                  className="game-card bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-blue-700/20 transition-all"
                >
                  <div className="game-thumbnail h-48 bg-gray-700 relative overflow-hidden">
                    {game.imageUrl ? (
                      <img 
                        src={game.imageUrl}
                        alt={game.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://via.placeholder.com/400x200/2D3748/FFFFFF?text=${game.name}`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-700">
                        <span className="text-5xl">🎮</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2">{game.name}</h3>
                    <p className="text-gray-300 mb-4 h-16">{game.description}</p>
                    <button
                      onClick={() => handleGameCardClick(game.id)}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full transition-colors"
                    >
                      {loading ? 'Loading...' : 'Play Game'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Why Play Knowledge Games?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="text-blue-400 text-3xl mb-2">🧠</div>
                  <h3 className="text-lg font-medium mb-2">Reinforce Learning</h3>
                  <p className="text-gray-300">Games help solidify your understanding of key concepts through active recall.</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="text-blue-400 text-3xl mb-2">⏱️</div>
                  <h3 className="text-lg font-medium mb-2">Track Progress</h3>
                  <p className="text-gray-300">See how quickly you can solve problems and track improvement over time.</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="text-blue-400 text-3xl mb-2">🏆</div>
                  <h3 className="text-lg font-medium mb-2">Have Fun Learning</h3>
                  <p className="text-gray-300">Learning through games makes education enjoyable and more effective.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeGames;