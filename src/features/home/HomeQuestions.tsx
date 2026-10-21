const questions = [
  [
    'Do I need an account?',
    'No. The cube is available without registration. Your current puzzle and move history are saved in this browser.',
  ],
  [
    'Will my progress follow me to another device?',
    'Not yet. Saves are local to this browser, and clearing browser data can remove them. Accounts and cross-device cloud saves are planned. The home-page preview never changes your saved cube.',
  ],
  [
    'Can I play on a phone?',
    'The layout includes touch-sized face and turn controls. Drag to rotate the cube and pinch to zoom. Performance depends on your device, and physical touch-device testing is still in progress.',
  ],
  [
    'What happens when I ask for a hint?',
    'The cube calculates a solution locally and shows only the next turn. It does not perform the turn unless you choose Apply next turn. The first calculation may take a few seconds and can be cancelled.',
  ],
  [
    'Which games can I play now?',
    'The 3×3 cube is playable now. Burr puzzle and sliding tiles have descriptions and planned controls, but their games are still in development.',
  ],
] as const;
export function HomeQuestions() {
  return (
    <section className="home-questions" aria-labelledby="questions-title">
      <div>
        <h2 id="questions-title">Before you start</h2>
        <p>Progress, hints, and what’s available today.</p>
      </div>
      <div className="question-list">
        {questions.map(([question, answer]) => (
          <details key={question}>
            <summary>
              {question}
              <span aria-hidden="true">+</span>
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
