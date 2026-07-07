"use client";
import { useState } from "react";

interface QuizQuestion {
  question: string;
  options: { text: string; correct: boolean }[];
  explanation: string;
}

interface LessonQuizProps {
  questions: QuizQuestion[];
  onComplete: () => void;
}

export function LessonQuiz({ questions, onComplete }: LessonQuizProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const q = questions[currentQ];
  const isCorrect = selected !== null && q.options[selected]?.correct;

  function handleSelect(i: number) {
    if (confirmed) return;
    setSelected(i);
  }

  function handleConfirm() {
    if (selected === null) return;
    setConfirmed(true);
  }

  function handleNext() {
    if (currentQ + 1 >= questions.length) {
      setAllDone(true);
    } else {
      setCurrentQ(c => c + 1);
      setSelected(null);
      setConfirmed(false);
    }
  }

  if (allDone) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 className="text-lg font-bold text-foreground">Lesson Complete!</h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
          You can now explain platform independence in your own words. That means it's yours.
        </p>
        <div className="mt-4 w-full rounded-xl border border-border/40 bg-muted/20 p-4 text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Up Next</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground/50">Episode 3: Inside the JVM</p>
              <p className="text-[11px] text-muted-foreground">What actually happens in those 3 seconds?</p>
            </div>
            <span className="ml-auto text-[10px] font-bold uppercase tracking-widest bg-muted text-muted-foreground px-2 py-1 rounded">Soon</span>
          </div>
        </div>
        <button onClick={onComplete} className="mt-2 w-full py-2.5 bg-primary/10 text-primary border border-primary/30 rounded-lg font-medium text-sm hover:bg-primary/20 transition-colors">
          Replay Lesson
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all ${i < currentQ ? "w-6 bg-green-500" : i === currentQ ? "w-6 bg-primary" : "w-4 bg-border"}`} />
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground ml-1">{currentQ + 1} of {questions.length}</span>
      </div>

      <p className="text-sm font-semibold text-foreground leading-relaxed">{q.question}</p>

      <div className="flex flex-col gap-2">
        {q.options.map((opt, i) => {
          let cls = "border-border/50 text-foreground/80 hover:border-primary/40 hover:bg-primary/5";
          if (confirmed) {
            if (opt.correct) cls = "border-green-500 bg-green-500/10 text-green-600 font-medium";
            else if (i === selected && !opt.correct) cls = "border-muted bg-muted/20 text-muted-foreground opacity-50";
            else cls = "border-border/30 text-muted-foreground/40";
          } else if (i === selected) {
            cls = "border-primary bg-primary/10 text-foreground";
          }
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`text-left text-xs px-3 py-2.5 rounded-lg border transition-all ${cls} ${confirmed ? "cursor-default" : "cursor-pointer"}`}
            >
              <span className="font-bold mr-2 text-[10px] opacity-60">{String.fromCharCode(65 + i)})</span>
              {opt.text}
            </button>
          );
        })}
      </div>

      {confirmed && (
        <div className={`text-xs px-3 py-2.5 rounded-lg ${isCorrect ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-amber-500/10 text-amber-600 border border-amber-500/20"}`}>
          {isCorrect ? "? " : "? "}{q.explanation}
        </div>
      )}

      <div className="flex gap-2">
        {!confirmed ? (
          <button onClick={handleConfirm} disabled={selected === null} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed">
            Check Answer
          </button>
        ) : (
          <button onClick={handleNext} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm transition-colors hover:bg-primary/90">
            {currentQ + 1 >= questions.length ? "See Results" : "Next Question ?"}
          </button>
        )}
      </div>
    </div>
  );
}
