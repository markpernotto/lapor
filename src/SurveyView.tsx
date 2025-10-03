// React import not required with new JSX transform
import { useState } from "react";
import { jsPDF } from "jspdf";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import type { Survey } from "./api/client";
import { getSurvey } from "./api/client";

type FormValues = {
  fullName: string;
  responseDate: string;
  phone: string;
  answers: Record<string, string>;
};

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getQuestionText(
  q: unknown,
  index: number,
): { id: string; text: string } {
  if (!q) return { id: String(index), text: "" };
  if (typeof q === "string")
    return { id: q, text: q };
  if (typeof q === "object") {
    // try to read common shapes: { id, question } or { question }
    const anyQ = q as Record<string, unknown>;
    const id =
      (typeof anyQ.id === "string" && anyQ.id) ||
      String(index);
    const text =
      (typeof anyQ.question === "string" &&
        anyQ.question) ||
      String(q);
    return { id, text };
  }
  return { id: String(index), text: String(q) };
}

function SurveyRenderer({
  survey,
}: {
  survey: Survey;
}) {
  const questions = survey.questions ?? [];

  // Build default answers keyed by question id so react-hook-form has stable keys
  const defaultAnswers: Record<string, string> =
    {};
  questions.forEach((q, i) => {
    const { id } = getQuestionText(q, i);
    defaultAnswers[id] = "";
  });

  const { register, handleSubmit, getValues } =
    useForm<FormValues>({
      defaultValues: {
        fullName: "",
        responseDate: todayISODate(),
        phone: "",
        answers: defaultAnswers,
      },
    });

  function buildPdfAndFile(values: FormValues): {
    pdf: jsPDF;
    fileName: string;
  } {
    const pdf = new jsPDF({
      unit: "pt",
      format: "a4",
    });
    const marginLeft = 40;
    const marginRight = 40;
    const marginTop = 40;
    const marginBottom = 40;
    const pageWidth =
      pdf.internal.pageSize.getWidth();
    const pageHeight =
      pdf.internal.pageSize.getHeight();
    const usableWidth =
      pageWidth - marginLeft - marginRight;
    const lineHeight = 14;

    let cursorY = marginTop;

    // Title
    pdf.setFontSize(18);
    const title = survey.name || "Survey";
    const titleLines = pdf.splitTextToSize(
      title,
      usableWidth,
    );
    pdf.text(titleLines, marginLeft, cursorY);
    cursorY +=
      titleLines.length * (lineHeight + 2) + 8;

    pdf.setFontSize(12);

    // Fields: full name, date, phone
    const fieldLines = [
      `Full name: ${values.fullName || ""}`,
      `Date: ${values.responseDate || ""}`,
      `Phone: ${values.phone || ""}`,
    ];
    const fieldWrapped = pdf.splitTextToSize(
      fieldLines.join("   "),
      usableWidth,
    );
    pdf.text(fieldWrapped, marginLeft, cursorY);
    cursorY +=
      fieldWrapped.length * lineHeight + 12;

    // Questions and answers
    for (let i = 0; i < questions.length; i++) {
      const { id, text: qText } = getQuestionText(
        questions[i],
        i,
      );
      const numberPrefix = `${i + 1}. `;
      const fullQ = numberPrefix + qText;
      const wrappedQ = pdf.splitTextToSize(
        fullQ,
        usableWidth,
      );

      const answer = values.answers?.[id] || "";
      const wrappedA = answer
        ? pdf.splitTextToSize(answer, usableWidth)
        : [];

      const needed =
        (wrappedQ.length + wrappedA.length) *
          lineHeight +
        12;
      if (
        cursorY + needed >
        pageHeight - marginBottom
      ) {
        pdf.addPage();
        cursorY = marginTop;
      }

      pdf.setFont("helvetica", "bold");
      pdf.text(wrappedQ, marginLeft, cursorY);
      cursorY += wrappedQ.length * lineHeight + 6;

      pdf.setFont("helvetica", "normal");
      if (wrappedA.length > 0) {
        pdf.text(wrappedA, marginLeft, cursorY);
        cursorY +=
          wrappedA.length * lineHeight + 10;
      } else {
        cursorY += 12; // spacer for empty answer
      }
    }

    const safeName = (
      survey.name || "survey"
    ).replace(/\s+/g, "_");
    const fileName = `${safeName}.pdf`;
    return { pdf, fileName };
  }

  function onDownload(values: FormValues) {
    try {
      const { pdf, fileName } =
        buildPdfAndFile(values);
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert(
        "Failed to generate PDF: " + String(err),
      );
    }
  }

  // preview modal state: holds current form values to display
  const [previewValues, setPreviewValues] =
    useState<FormValues | null>(null);

  function onPreview(values: FormValues) {
    setPreviewValues(values);
  }

  // printable HTML helper removed — we generate PDFs directly now

  return (
    <div
      id={`survey-${survey.id}-printable`}
      style={{
        background: "#fff",
        color: "#000",
        padding: "2rem",
        borderRadius: 8,
        maxWidth: 900,
        margin: "2rem auto",
        textAlign: "left",
      }}
    >
      <h2 style={{ fontSize: "1.6rem" }}>
        {survey.name || "(no name)"}
      </h2>

      {survey.description ? (
        <p style={{ marginTop: 8 }}>
          {survey.description}
        </p>
      ) : null}

      {survey.synopsis ? (
        <p
          style={{
            marginTop: 8,
            fontStyle: "italic",
            color: "#444",
          }}
        >
          {survey.synopsis}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit(onDownload)}
        aria-label={`Survey ${
          survey.name || survey.id
        }`}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label
              style={{
                display: "block",
                fontWeight: 600,
              }}
            >
              Full name
            </label>
            <input
              {...register("fullName")}
              type="text"
              placeholder="Your full name"
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontWeight: 600,
              }}
            >
              Date
            </label>
            <input
              {...register("responseDate")}
              type="date"
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontWeight: 600,
              }}
            >
              Phone (optional)
            </label>
            <input
              {...register("phone")}
              type="tel"
              placeholder="(555) 555-5555"
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            />
          </div>

          <hr />

          <div>
            {questions.map((q, i) => {
              const { id, text } =
                getQuestionText(q, i);
              return (
                <div
                  key={id}
                  style={{ marginBottom: 12 }}
                >
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    {i + 1}. {text}
                  </label>
                  <textarea
                    {...register(
                      `answers.${id}` as const,
                    )}
                    rows={4}
                    placeholder="Your answer..."
                    style={{
                      width: "100%",
                      padding: 8,
                      borderRadius: 6,
                      border: "1px solid #ccc",
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div
            style={{ display: "flex", gap: 8 }}
          >
            <button type="submit">
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => {
                // quick preview using current values
                const values = getValues();
                void onPreview(
                  values as FormValues,
                );
              }}
            >
              Download PDF (preview)
            </button>
          </div>
        </div>
      </form>
      {previewValues ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => {
            setPreviewValues(null);
          }}
        >
          <div
            role="document"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "80%",
              maxWidth: 900,
              maxHeight: "80%",
              background: "#fff",
              borderRadius: 8,
              overflow: "auto",
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button
                onClick={() => {
                  if (!previewValues) return;
                  try {
                    const { pdf, fileName } =
                      buildPdfAndFile(
                        previewValues,
                      );
                    pdf.save(fileName);
                  } catch (err) {
                    console.error(
                      "PDF generation failed",
                      err,
                    );
                    alert(
                      "Failed to generate PDF: " +
                        String(err),
                    );
                  }
                }}
              >
                Download
              </button>
              <button
                onClick={() =>
                  setPreviewValues(null)
                }
              >
                Close
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <h3>
                {survey.name || "Survey preview"}
              </h3>
              <div style={{ marginBottom: 8 }}>
                <strong>Full name:</strong>{" "}
                {previewValues.fullName}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Date:</strong>{" "}
                {previewValues.responseDate}
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>Phone:</strong>{" "}
                {previewValues.phone}
              </div>
              <div>
                {questions.map((q, i) => {
                  const { id, text } =
                    getQuestionText(q, i);
                  const ans =
                    previewValues.answers?.[id] ||
                    "";
                  return (
                    <div
                      key={id}
                      style={{ marginBottom: 12 }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                        }}
                      >
                        {i + 1}. {text}
                      </div>
                      <div
                        style={{
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {ans}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function SurveyView() {
  const { surveyId } = useParams<{
    surveyId: string;
  }>();

  const { data, error, isLoading } = useQuery(
    ["survey", surveyId],
    () => {
      if (!surveyId)
        throw new Error("missing survey id");
      return getSurvey(surveyId);
    },
  );

  if (isLoading)
    return <div>Loading survey...</div>;
  if (error)
    return (
      <div>
        Error loading survey:{" "}
        {(error as Error).message}
      </div>
    );
  if (!data) return <div>Survey not found</div>;

  return <SurveyRenderer survey={data} />;
}
