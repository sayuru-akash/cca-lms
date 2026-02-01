"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Flag,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";

interface Question {
  id: string;
  text: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "LONG_ANSWER";
  points: number;
  order: number;
  answers: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    order: number;
  }>;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  timeLimit: number | null;
  passingScore: number;
  maxAttempts: number | null;
  shuffleQuestions: boolean;
  showResults: boolean;
  questions: Question[];
}

interface QuizPlayerProps {
  quizId: string;
  onComplete?: (result: AttemptResult) => void;
  onCancel?: () => void;
}

interface AttemptResult {
  attemptId: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  responses: Array<{
    questionId: string;
    questionText: string;
    userAnswer: string;
    isCorrect: boolean | null;
    points: number | null;
  }>;
}

export function QuizPlayer({ quizId, onComplete, onCancel }: QuizPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const confirm = useConfirm();

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (quiz?.timeLimit && timeRemaining === null) {
      setTimeRemaining(quiz.timeLimit * 60); // Convert to seconds
    }
  }, [quiz]);

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && !showResults) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, showResults]);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/quizzes/${quizId}?includeQuestions=true`,
      );
      if (!response.ok) throw new Error("Failed to fetch quiz");
      const data = await response.json();
      setQuiz(data.quiz);
    } catch (error) {
      toast.error("Failed to load quiz");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const setResponse = (questionId: string, answer: string) => {
    setResponses({ ...responses, [questionId]: answer });
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    // Check if all questions are answered
    const unanswered = quiz.questions.filter((q) => !responses[q.id]);
    if (unanswered.length > 0) {
      const confirmed = await confirm({
        title: "Unanswered Questions",
        description: `You have ${unanswered.length} unanswered question(s). Are you sure you want to submit?`,
        variant: "warning",
        confirmText: "Submit Anyway",
        cancelText: "Continue Quiz",
      });
      if (!confirmed) return;
    }

    setSubmitting(true);
    try {
      // Format responses for API
      const formattedResponses = quiz.questions.map((q) => ({
        questionId: q.id,
        answer: responses[q.id] || "",
        answerId:
          q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE"
            ? responses[q.id]
            : undefined,
      }));

      const response = await fetch("/api/quizzes/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.id,
          responses: formattedResponses,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit quiz");
      }

      const data = await response.json();

      // Format result
      const attemptResult: AttemptResult = {
        attemptId: data.attempt.id,
        score: data.attempt.score || 0,
        maxScore: data.attempt.maxScore || 0,
        percentage: data.attempt.percentage || 0,
        passed: (data.attempt.percentage || 0) >= quiz.passingScore,
        responses: data.responses.map((r: any) => ({
          questionId: r.questionId,
          questionText:
            quiz.questions.find((q) => q.id === r.questionId)?.text || "",
          userAnswer: r.answer || "",
          isCorrect: r.isCorrect,
          points: r.points,
        })),
      };

      setResult(attemptResult);
      setShowResults(true);
      toast.success("Quiz submitted successfully!");
      onComplete?.(attemptResult);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit quiz",
      );
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-terminal-green" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center p-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <p className="text-terminal-text-muted">Quiz not found</p>
      </div>
    );
  }

  if (showResults && result) {
    return (
      <div className="space-y-6">
        {/* Results Summary */}
        <Card className={result.passed ? "border-green-500" : "border-red-500"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.passed ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              {result.passed ? "Quiz Passed!" : "Quiz Not Passed"}
            </CardTitle>
            <CardDescription>
              Your score: {result.score.toFixed(1)} / {result.maxScore} (
              {result.percentage.toFixed(1)}%)
              {!result.passed && ` - Passing score: ${quiz.passingScore}%`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={result.percentage} className="mb-2" />
            <p className="text-sm text-terminal-text-muted">
              {result.responses.filter((r) => r.isCorrect === true).length} of{" "}
              {result.responses.length} questions correct
            </p>
          </CardContent>
        </Card>

        {/* Question Results */}
        {quiz.showResults && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Review Answers</h3>
            {result.responses.map((response, index) => (
              <Card
                key={index}
                className={
                  response.isCorrect === true
                    ? "border-green-500/50"
                    : response.isCorrect === false
                      ? "border-red-500/50"
                      : "border-yellow-500/50"
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-2">
                    {response.isCorrect === true && (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    )}
                    {response.isCorrect === false && (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    )}
                    {response.isCorrect === null && (
                      <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        Question {index + 1}
                      </CardTitle>
                      <p className="text-sm text-terminal-text-muted mt-1">
                        {response.questionText}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">
                        {response.points !== null
                          ? `${response.points} pts`
                          : "Pending"}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-terminal-text-muted">
                        Your Answer:
                      </Label>
                      <p className="text-sm">
                        {response.userAnswer || "(No answer)"}
                      </p>
                    </div>
                    {response.isCorrect === null && (
                      <p className="text-xs text-yellow-600 bg-yellow-500/10 p-2 rounded">
                        This answer requires manual grading
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <Button onClick={onCancel}>Close</Button>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{quiz.title}</CardTitle>
              <CardDescription>
                Question {currentQuestion + 1} of {quiz.questions.length}
              </CardDescription>
            </div>
            {timeRemaining !== null && (
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded ${
                  timeRemaining < 60
                    ? "bg-red-500/20 text-red-500"
                    : "bg-terminal-green/20 text-terminal-green"
                }`}
              >
                <Clock className="h-4 w-4" />
                <span className="font-mono font-semibold">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
      </Card>

      {/* Question */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-sm font-semibold text-terminal-green">
                  Q{currentQuestion + 1}
                </span>
                <span className="text-xs text-terminal-text-muted">
                  ({question.points}{" "}
                  {question.points === 1 ? "point" : "points"})
                </span>
              </div>
              <p className="text-lg">{question.text}</p>
            </div>
            {responses[question.id] && (
              <Flag className="h-5 w-5 text-terminal-green" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {(question.type === "MULTIPLE_CHOICE" ||
            question.type === "TRUE_FALSE") && (
            <RadioGroup
              value={responses[question.id] || ""}
              onValueChange={(value) => setResponse(question.id, value)}
            >
              <div className="space-y-3">
                {question.answers.map((answer) => (
                  <div
                    key={answer.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-terminal-green/20 hover:bg-terminal-green/5 transition-colors"
                  >
                    <RadioGroupItem value={answer.id} id={answer.id} />
                    <Label
                      htmlFor={answer.id}
                      className="flex-1 cursor-pointer"
                    >
                      {answer.text}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {question.type === "SHORT_ANSWER" && (
            <div>
              <Label className="text-sm text-terminal-text-muted mb-2">
                Your Answer
              </Label>
              <Input
                value={responses[question.id] || ""}
                onChange={(e) => setResponse(question.id, e.target.value)}
                placeholder="Type your answer here..."
                className="mt-2"
              />
            </div>
          )}

          {question.type === "LONG_ANSWER" && (
            <div>
              <Label className="text-sm text-terminal-text-muted mb-2">
                Your Answer
              </Label>
              <Textarea
                value={responses[question.id] || ""}
                onChange={(e) => setResponse(question.id, e.target.value)}
                placeholder="Type your detailed answer here..."
                rows={6}
                className="mt-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0 || submitting}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          {currentQuestion < quiz.questions.length - 1 && (
            <Button
              variant="outline"
              onClick={() =>
                setCurrentQuestion((prev) =>
                  Math.min(quiz.questions.length - 1, prev + 1),
                )
              }
              disabled={submitting}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={submitting}>
              Exit Quiz
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Submit Quiz
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Question Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Question Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(index)}
                className={`h-10 w-10 rounded flex items-center justify-center font-mono text-sm transition-all ${
                  index === currentQuestion
                    ? "bg-terminal-green text-terminal-dark ring-2 ring-terminal-green"
                    : responses[q.id]
                      ? "bg-terminal-green/20 text-terminal-green border border-terminal-green/40"
                      : "bg-terminal-darker border border-terminal-green/20 text-terminal-text-muted hover:bg-terminal-green/10"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <p className="text-xs text-terminal-text-muted mt-3">
            {Object.keys(responses).length} of {quiz.questions.length} answered
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
