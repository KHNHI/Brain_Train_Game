import { useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';

const steps = [
  {
    title: 'Explore',
    heading: 'Get a clear view of the puzzle.',
    body: 'In the full cube game, drag to look around or flip it upside down. Scroll or pinch to zoom, and use Reset view whenever you want the original angle back.',
    detail: 'Moving the camera does not change the puzzle or count as a turn.',
    visual: '↺',
    caption: 'Free rotation · Bounded zoom · Reset view',
  },
  {
    title: 'Make a move',
    heading: 'Select a face. Turn one layer.',
    body: 'Choose a color on the cube or in the face selector. The amber outline marks your selection. Use the arrows next to the cube to turn that layer by 90°.',
    detail:
      'Clockwise means looking directly at the selected face. Undo and redo let you revisit a decision.',
    visual: 'F → F′',
    caption: 'Color labels · 90° turns · Undo and redo',
  },
  {
    title: 'Get help',
    heading: 'A nudge, or the whole sequence.',
    body: 'Hint: next turn reveals one move without moving the cube. Show solution opens a complete sequence with color-based instructions. Apply next turn animates one step at a time.',
    detail:
      'Take a different move? Request fresh guidance for your new position. These are computed solutions; beginner-method lessons are still planned.',
    visual: 'F′ · U · R',
    caption: 'One-turn hints · Full solution · Guided steps',
  },
] as const;

export function PlayGuide() {
  const [active, setActive] = useState(0);
  const step = steps[active]!;
  function keyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % steps.length;
    else if (event.key === 'ArrowLeft') next = (index + steps.length - 1) % steps.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = steps.length - 1;
    else return;
    event.preventDefault();
    setActive(next);
    document.getElementById(`guide-tab-${next}`)?.focus();
  }
  return (
    <section className="play-guide" aria-labelledby="guide-title">
      <div className="section-heading">
        <div>
          <h2 id="guide-title">How the cube game works</h2>
          <p>Choose a step to see the controls and the help available.</p>
        </div>
      </div>
      <div className="guide-tabs" role="tablist" aria-label="Playing the cube">
        {steps.map((item, i) => (
          <button
            key={item.title}
            role="tab"
            id={`guide-tab-${i}`}
            aria-controls="guide-panel"
            aria-selected={active === i}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(event) => keyboard(event, i)}
          >
            <span>0{i + 1}</span>
            {item.title}
          </button>
        ))}
      </div>
      <div
        className="guide-panel"
        id="guide-panel"
        role="tabpanel"
        aria-labelledby={`guide-tab-${active}`}
        tabIndex={0}
      >
        <div className="guide-copy">
          <h3>{step.heading}</h3>
          <p>{step.body}</p>
          <p className="guide-detail">{step.detail}</p>
          <Link className="text-link" to="/games/cube#instructions">
            Open cube instructions →
          </Link>
        </div>
        <div className="guide-diagram" aria-hidden="true">
          <span>{step.visual}</span>
          <p>{step.caption}</p>
        </div>
      </div>
    </section>
  );
}
