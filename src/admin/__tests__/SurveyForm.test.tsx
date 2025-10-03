import React from "react";
import {
  render,
  fireEvent,
} from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SurveyForm from "../SurveyForm";

describe("SurveyForm ordering", () => {
  it("submits selected questions in the order they were toggled on", () => {
    const questions = [
      { id: "q1", question: "Q1" },
      { id: "q2", question: "Q2" },
      { id: "q3", question: "Q3" },
    ];
    const onSubmit = vi.fn();
    const { getByLabelText, getByText } = render(
      <SurveyForm
        questions={questions}
        onSubmit={onSubmit}
      />,
    );

    // toggle q2, q1, q3 in this order
    const q2 = getByLabelText(
      "Q2",
    ) as HTMLInputElement;
    const q1 = getByLabelText(
      "Q1",
    ) as HTMLInputElement;
    const q3 = getByLabelText(
      "Q3",
    ) as HTMLInputElement;

    fireEvent.click(q2);
    fireEvent.click(q1);
    fireEvent.click(q3);

    // submit
    fireEvent.click(getByText("Save"));

    expect(onSubmit).toHaveBeenCalled();
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.questions).toEqual([
      "q2",
      "q1",
      "q3",
    ]);
  });

  it("removing and re-adding preserves the new order", () => {
    const questions = [
      { id: "q1", question: "Q1" },
      { id: "q2", question: "Q2" },
      { id: "q3", question: "Q3" },
    ];
    const onSubmit = vi.fn();
    const { getByLabelText, getByText } = render(
      <SurveyForm
        questions={questions}
        onSubmit={onSubmit}
      />,
    );

    const q1 = getByLabelText(
      "Q1",
    ) as HTMLInputElement;
    const q2 = getByLabelText(
      "Q2",
    ) as HTMLInputElement;
    const q3 = getByLabelText(
      "Q3",
    ) as HTMLInputElement;

    // select q1, q2
    fireEvent.click(q1);
    fireEvent.click(q2);
    // remove q1
    fireEvent.click(q1);
    // add q3
    fireEvent.click(q3);

    fireEvent.click(getByText("Save"));

    expect(onSubmit).toHaveBeenCalled();
    const payload = onSubmit.mock.calls[0][0];
    // q1 was removed, so order should be q2, q3
    expect(payload.questions).toEqual([
      "q2",
      "q3",
    ]);
  });
});
